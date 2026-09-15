"""RAG query engine: route, rewrite, retrieve tenant context, then answer.

Stage order, and why each stage sits where it does:

  0. **Smalltalk routing** — before anything else, because a greeting has no
     answer in a knowledge base and searching for one produces a refusal. Costs
     no embedding, no search, no LLM call.
  1. **Rewrite** — retrieval-only. The `search_query` it produces goes to the
     embedder; the user's own question is what reaches the LLM. Which strategy
     runs is a config value (`rewriter_strategy`), resolved through the rewriter
     factory — no concrete strategy class is named here.
  2. **Retrieval** — tenant-scoped, `top_k` chunks.
  3. **Confidence gate** — absolute floor, then a *relative* floor that drops
     noise riding along behind a strong match.
  4. **Generation** — the LLM sees the original question, never the rewrite.
  5. **Refusal check** — a "don't know" is reported as `confident=false` so the
     caller can escalate rather than delivering the refusal as an answer.
"""
import logging
import time

from app.config import get_settings
from app.llm.base import LLMProvider
from app.llm.factory import get_llm_provider
from app.logging_utils import banner
from app.rewriter.base import QueryRewriter, RewriteResult
from app.rewriter.factory import get_rewriter
from app.schemas import ChatMessage, QueryResponse, SourceChunk
from app.services.answer_policy import (
    NO_CONTEXT_REPLY,
    build_system_prompt,
    is_refusal,
    repair_text,
)
from app.services.conversation import classify_smalltalk, smalltalk_reply
from app.services.vector_store import VectorStoreService, get_vector_store
from app.tracing import current_trace, span

logger = logging.getLogger("ai.query")


class QueryService:
    def __init__(
        self,
        store: VectorStoreService | None = None,
        provider: LLMProvider | None = None,
        rewriter: QueryRewriter | None = None,
    ) -> None:
        self.settings = get_settings()
        self.store = store or get_vector_store()
        # Provider is resolved lazily so the confidence-gated fallback path
        # (no relevant context -> no generation) works even when no LLM API key
        # is configured. Only calls that actually generate need a valid key.
        self._provider = provider
        # `rewriter` is the third parameter so every existing positional call
        # keeps working unchanged.
        self._rewriter = rewriter

    @property
    def provider(self) -> LLMProvider:
        if self._provider is None:
            self._provider = get_llm_provider()
        return self._provider

    @property
    def rewriter(self) -> QueryRewriter:
        # Lazy for the same reason `provider` is lazy: resolving a rewriter must
        # not require an API key, and construction must not touch the network.
        # An explicitly injected instance is used as-is and the factory is never
        # consulted; otherwise the factory resolves once and is reused.
        if self._rewriter is None:
            self._rewriter = get_rewriter()
        return self._rewriter

    def answer_question(
        self,
        client_id: str,
        question: str,
        chat_history: list[ChatMessage] | None = None,
        company_name: str | None = None,
    ) -> QueryResponse:
        chat_history = chat_history or []
        company = company_name or "our company"
        debug = self.settings.debug_logs_enabled
        t0 = time.perf_counter()

        banner(
            logger,
            "[AI SERVICE] Incoming Query",
            {
                "Client ID": client_id,
                "Company": company,
                "Question": question,
                "History turns": len(chat_history),
            },
        )

        trace = current_trace()
        if trace is not None:
            trace.set(
                client_id=client_id,
                question=question[:200],
                history_turns=len(chat_history),
            )

        # 0. Smalltalk: answer conversational turns without retrieval.
        #
        # First, because a greeting has no answer in a knowledge base. Searching
        # for one returns the least-dissimilar policy chunk, clears the
        # similarity gate, and the LLM then correctly reports that no chunk
        # answers "hello" — delivering a refusal to a customer who said hi.
        # `confident=True` because this IS the right answer, so the caller
        # delivers it rather than routing to its own fallback text.
        with span("smalltalk_route", enabled=self.settings.smalltalk_enabled) as sp:
            match = (
                classify_smalltalk(question)
                if self.settings.smalltalk_enabled
                else None
            )
            sp.set(kind=match.kind if match else None, matched=bool(match))

        if match is not None:
            reply = smalltalk_reply(match, company)
            logger.info(
                "[AI SERVICE] smalltalk kind=%s -> answered without retrieval "
                "(0 tokens, 0 searches)",
                match.kind,
            )
            return QueryResponse(
                answer=reply,
                confident=True,
                sources=[],
                tokens_used=0,
                provider=self.settings.llm_provider,
                model=self.settings.llm_model,
            )

        # 1. Rewrite the question into a self-contained search query.
        #
        # Retrieval-only: `search_query` goes to the embedder, the user's own
        # `question` still goes to the LLM. With the default strategy the
        # rewriter returns the question unchanged, so this stage is inert.
        with span("query_rewrite", strategy_config=self.settings.rewriter_strategy) as sp:
            rw: RewriteResult = self.rewriter.rewrite(question, chat_history)
            sp.set(
                strategy=rw.strategy,
                was_rewritten=rw.was_rewritten,
                original=question[:200],
                search_query=rw.search_query[:200],
            )
            # No token attributes at all when nothing was spent, so a no-op
            # rewrite contributes 0.0 to the trace cost total.
            if rw.tokens_used or rw.prompt_tokens or rw.completion_tokens:
                sp.record_tokens(
                    prompt=rw.prompt_tokens,
                    completion=rw.completion_tokens,
                    total=rw.tokens_used,
                    model=rw.model,
                )
            if rw.error:
                sp.set(rewrite_error=rw.error[:500])

        if rw.error:
            # Fail open: the pipeline continues with whatever `search_query` the
            # rewriter fell back to. The response carries no hint of this.
            logger.warning(
                "[AI SERVICE] rewrite failed (strategy=%s): %s",
                rw.strategy,
                rw.error[:500],
            )
        if debug:
            logger.debug(
                "[AI SERVICE] rewrite strategy=%s original=%r search_query=%r",
                rw.strategy,
                question[:200],
                rw.search_query[:200],
            )

        search_query = rw.search_query
        rewrite_tokens = rw.tokens_used

        # 2. Retrieve tenant-scoped context.
        t_ret = time.perf_counter()
        with span(
            "retrieval",
            top_k=self.settings.retrieval_top_k,
            threshold=self.settings.min_similarity_score,
        ) as sp:
            # Record the string actually embedded, so the trace explains the hits.
            sp.set(search_query=search_query[:200])
            # `client_id` passes through untouched: partition key + explicit
            # `client_id ==` expression filter stay in force.
            hits = self.store.search(
                client_id, search_query, top_k=self.settings.retrieval_top_k
            )
            sp.set(
                hit_count=len(hits),
                top_score=round(hits[0]["score"], 4) if hits else None,
                scores=[round(h["score"], 4) for h in hits],
            )
        retrieval_ms = (time.perf_counter() - t_ret) * 1000

        logger.info(
            "[AI SERVICE] Retrieval: %d hit(s) in %.0fms | threshold=%.2f | scores=%s",
            len(hits),
            retrieval_ms,
            self.settings.min_similarity_score,
            [round(h["score"], 3) for h in hits],
        )
        if debug:
            for i, h in enumerate(hits):
                logger.debug(
                    "  hit[%d] score=%.3f source=%s text=%r",
                    i,
                    h["score"],
                    h.get("source_url") or "-",
                    (h["text"] or "")[:160],
                )

        # 3. Keep only sufficiently similar chunks (confidence gate).
        # Stays after retrieval and before generation for every rewrite outcome.
        #
        # Two floors, applied in order:
        #   absolute — score >= min_similarity_score. Decides whether we know
        #              anything at all, and is what drives `confident`.
        #   relative — score >= floor * best_score. Decides how much of what we
        #              found is worth putting in the prompt. An absolute
        #              threshold cannot distinguish "0.21 is the best match we
        #              have" from "0.21 sitting behind a 0.74"; the first is a
        #              weak answer, the second is noise diluting a strong one.
        #              The top chunk is kept unconditionally, so this can never
        #              empty a non-empty set and never changes `confident`.
        with span("confidence_gate", threshold=self.settings.min_similarity_score) as sp:
            passed = [
                h for h in hits if h["score"] >= self.settings.min_similarity_score
            ]
            floor = self.settings.relative_score_floor
            if passed and floor > 0.0:
                cutoff = passed[0]["score"] * floor
                relevant = [passed[0]] + [h for h in passed[1:] if h["score"] >= cutoff]
            else:
                relevant = passed
            sp.set(
                candidates=len(hits),
                passed=len(passed),
                kept=len(relevant),
                relative_floor=floor,
                confident=bool(relevant),
            )
            if len(relevant) < len(passed):
                logger.info(
                    "[AI SERVICE] relative floor dropped %d weak chunk(s) "
                    "(best=%.3f cutoff=%.3f)",
                    len(passed) - len(relevant),
                    passed[0]["score"],
                    passed[0]["score"] * floor,
                )

        if not relevant:
            # No grounded context -> report low confidence so the bot can fall back.
            #
            # `answer` carries suggested wording even though `confident` is
            # false. Returning a bare null forced every caller to invent its own
            # copy, and the default they invented was "Sorry, I did not
            # understand that. Please try again." — which blames the customer for
            # our missing content and asks them to rephrase a question that
            # rephrasing cannot fix. A caller with better copy still ignores
            # this; one without it now has something human to say.
            logger.warning(
                "[AI SERVICE] No confident context for client=%s (best score=%s < %.2f) -> confident=false",
                client_id,
                round(hits[0]["score"], 3) if hits else "n/a",
                self.settings.min_similarity_score,
            )
            return QueryResponse(
                answer=NO_CONTEXT_REPLY,
                confident=False,
                sources=[],
                # A rewrite that already spent tokens must not be reported as 0.
                tokens_used=rewrite_tokens,
                # Report configured provider/model without building the client
                # (no API key needed for the fallback path).
                provider=self.settings.llm_provider,
                model=self.settings.llm_model,
            )

        # 4. Build the prompt. The LLM sees the ORIGINAL question, never
        # `search_query` — the rewrite is for retrieval only.
        with span("prompt_build") as sp:
            # Repair extraction artefacts BEFORE the model sees them, so it
            # cannot quote a replacement glyph back at the customer as if it
            # were a currency symbol. See answer_policy.repair_text.
            context_text = "\n\n---\n\n".join(repair_text(h["text"]) for h in relevant)
            system_prompt = build_system_prompt(
                company=company,
                context=context_text,
                allow_handoff_offer=self.settings.allow_human_handoff_offer,
            )

            messages: list[dict] = [{"role": "system", "content": system_prompt}]
            for turn in chat_history[-6:]:  # cap history to keep prompts small/cheap
                messages.append({"role": turn.role, "content": turn.content})
            messages.append({"role": "user", "content": question})
            sp.set(
                context_chunks=len(relevant),
                context_chars=len(context_text),
                messages=len(messages),
            )

        banner(
            logger,
            "[AI SERVICE -> MODEL]",
            {
                "Provider": self.provider.name,
                "Model": self.provider.model,
                "Temperature": self.provider.temperature,
                "Max Tokens": self.provider.max_tokens,
                "Context chunks": len(relevant),
                "Messages": len(messages),
            },
        )
        if debug:
            logger.debug("[AI SERVICE -> MODEL] System prompt:\n%s", system_prompt)
            logger.debug("[AI SERVICE -> MODEL] Messages: %s", messages)

        # 5. Generate.
        t_llm = time.perf_counter()
        with span(
            "generation",
            provider=self.provider.name,
            temperature=self.provider.temperature,
            max_tokens=self.provider.max_tokens,
        ) as sp:
            try:
                result = self.provider.generate(messages)
            except Exception:
                logger.exception(
                    "[MODEL RESPONSE] LLM call FAILED (provider=%s model=%s)",
                    self.provider.name,
                    self.provider.model,
                )
                raise
            sp.record_tokens(
                prompt=result.prompt_tokens,
                completion=result.completion_tokens,
                total=result.tokens_used,
                model=result.model,
            )
            if result.finish_reason:
                sp.set(finish_reason=result.finish_reason)
                # A "length" stop means we hit llm_max_tokens and the answer was
                # cut off mid-sentence. Worth surfacing loudly.
                if result.finish_reason in ("length", "max_tokens"):
                    logger.warning(
                        "[MODEL RESPONSE] answer truncated by max_tokens=%d "
                        "(finish_reason=%s) — consider raising LLM_MAX_TOKENS",
                        self.provider.max_tokens,
                        result.finish_reason,
                    )
        llm_ms = (time.perf_counter() - t_llm) * 1000

        banner(
            logger,
            "[MODEL RESPONSE]",
            {
                "Model": result.model,
                "Provider": result.provider,
                "Total Tokens": result.tokens_used,
                "LLM Time": f"{llm_ms:.0f}ms",
                "Answer": (result.text or "")[:300] + ("..." if len(result.text or "") > 300 else ""),
            },
            level=logging.INFO,
        )
        if debug:
            logger.debug("[MODEL RESPONSE] Full answer:\n%s", result.text)

        answer_text = repair_text(result.text)

        # 6. Refusal check: cosine similarity said the chunks looked related, the
        # model says they do not contain the answer. The model is the better
        # judge — it read them. Reporting `confident=false` is what lets the
        # caller route to a human instead of delivering "I don't have that
        # information right now" as though it were an answer. The text still
        # travels in `answer` so the caller can show something human.
        with span("refusal_check", enabled=self.settings.refusal_downgrades_confidence) as sp:
            refused = self.settings.refusal_downgrades_confidence and is_refusal(
                answer_text
            )
            sp.set(refused=refused, answer_chars=len(answer_text))

        if refused:
            logger.warning(
                "[AI SERVICE] model declined to answer despite %d chunk(s) "
                "passing the gate (best score=%.3f) -> confident=false so the "
                "caller can escalate",
                len(relevant),
                relevant[0]["score"],
            )

        sources = [
            SourceChunk(text=h["text"], source_url=h.get("source_url") or None, score=h["score"])
            for h in relevant
        ]

        total_ms = (time.perf_counter() - t0) * 1000
        logger.info(
            "[AI SERVICE] Query complete: confident=%s tokens=%d | retrieval=%.0fms llm=%.0fms total=%.0fms",
            not refused,
            result.tokens_used,
            retrieval_ms,
            llm_ms,
            total_ms,
        )

        return QueryResponse(
            answer=answer_text,
            confident=not refused,
            # A refusal is not grounded in anything, so citing chunks for it
            # would be misleading.
            sources=[] if refused else sources,
            tokens_used=result.tokens_used + rewrite_tokens,
            provider=result.provider,
            model=result.model,
        )
