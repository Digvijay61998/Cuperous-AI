"""RAG query engine: retrieve tenant context, then generate a grounded answer."""
import logging
import time

from app.config import get_settings
from app.llm.base import LLMProvider
from app.llm.factory import get_llm_provider
from app.logging_utils import banner
from app.schemas import ChatMessage, QueryResponse, SourceChunk
from app.services.vector_store import VectorStoreService, get_vector_store

logger = logging.getLogger("ai.query")

_SYSTEM_TEMPLATE = """You are a helpful customer support assistant for {company}.
Answer the user's question using ONLY the context provided below. The context \
comes from {company}'s own website and knowledge base.

Rules:
- Be concise, friendly, and accurate.
- If the context does not contain the answer, say you don't have that information \
and offer to connect them with a human. Do not invent details.
- Never mention "the context" or "the documents" in your reply; just answer naturally.

Context:
{context}
"""


class QueryService:
    def __init__(
        self,
        store: VectorStoreService | None = None,
        provider: LLMProvider | None = None,
    ) -> None:
        self.settings = get_settings()
        self.store = store or get_vector_store()
        # Provider is resolved lazily so the confidence-gated fallback path
        # (no relevant context -> no generation) works even when no LLM API key
        # is configured. Only calls that actually generate need a valid key.
        self._provider = provider

    @property
    def provider(self) -> LLMProvider:
        if self._provider is None:
            self._provider = get_llm_provider()
        return self._provider

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

        # 1. Retrieve tenant-scoped context.
        t_ret = time.perf_counter()
        hits = self.store.search(client_id, question, top_k=self.settings.retrieval_top_k)
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

        # 2. Keep only sufficiently similar chunks (confidence gate).
        relevant = [h for h in hits if h["score"] >= self.settings.min_similarity_score]

        if not relevant:
            # No grounded context -> report low confidence so the bot can fall back.
            logger.warning(
                "[AI SERVICE] No confident context for client=%s (best score=%s < %.2f) -> confident=false",
                client_id,
                round(hits[0]["score"], 3) if hits else "n/a",
                self.settings.min_similarity_score,
            )
            return QueryResponse(
                answer=None,
                confident=False,
                sources=[],
                tokens_used=0,
                # Report configured provider/model without building the client
                # (no API key needed for the fallback path).
                provider=self.settings.llm_provider,
                model=self.settings.llm_model,
            )

        # 3. Build the prompt.
        context_text = "\n\n---\n\n".join(h["text"] for h in relevant)
        system_prompt = _SYSTEM_TEMPLATE.format(company=company, context=context_text)

        messages: list[dict] = [{"role": "system", "content": system_prompt}]
        for turn in chat_history[-6:]:  # cap history to keep prompts small/cheap
            messages.append({"role": turn.role, "content": turn.content})
        messages.append({"role": "user", "content": question})

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

        # 4. Generate.
        t_llm = time.perf_counter()
        try:
            result = self.provider.generate(messages)
        except Exception:
            logger.exception(
                "[MODEL RESPONSE] LLM call FAILED (provider=%s model=%s)",
                self.provider.name,
                self.provider.model,
            )
            raise
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

        sources = [
            SourceChunk(text=h["text"], source_url=h.get("source_url") or None, score=h["score"])
            for h in relevant
        ]

        total_ms = (time.perf_counter() - t0) * 1000
        logger.info(
            "[AI SERVICE] Query complete: confident=true tokens=%d | retrieval=%.0fms llm=%.0fms total=%.0fms",
            result.tokens_used,
            retrieval_ms,
            llm_ms,
            total_ms,
        )

        return QueryResponse(
            answer=result.text,
            confident=True,
            sources=sources,
            tokens_used=result.tokens_used,
            provider=result.provider,
            model=result.model,
        )
