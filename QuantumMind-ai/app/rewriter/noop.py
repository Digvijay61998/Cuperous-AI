"""The off switch for query rewriting (PLAN.md Phase 1).

WHY THIS MODULE EXISTS
----------------------
Turning a feature off has to be a config value, not a code edit. `NoOpRewriter`
is what `rewriter_strategy = "none"` resolves to, and `none` is the default in
every environment (Requirement 5 criterion 1, Requirement 9 criterion 7). With
the default in force, `store.search` receives exactly the string it receives
today, which is why the 107 pre-Phase-1 tests stay green with unedited
assertions.

Choosing a null object over a `None` check inside `QueryService` is deliberate:
the pipeline then has one code path, the `query_rewrite` span is emitted for every
strategy including this one (Requirement 6 criterion 1), and there is no
"rewriting disabled" branch that could drift away from the enabled one.

WHY THERE IS NO BRANCH AND NO `try`
-----------------------------------
`chat_history` is accepted and ignored. Because nothing here inspects it, Req 5
c4's "for every input including a chat history of 1 to 100 turns" holds by
*construction* rather than by test coverage — there is no input that could take a
different path.

There is likewise no `try`. The never-raise contract in `app/rewriter/base.py` is
defended with an `except` in the LLM strategy; here it is structural. The body
constructs a dataclass out of two already-bound locals: no I/O, no provider, no
`Settings`, no parsing, nothing that can fail. This is the one rewriter where the
contract is guaranteed rather than merely upheld.

This module must stay import-cheap: no `Settings`, no logger, no provider.

Requirements covered: 5.3, 5.4.
"""
from __future__ import annotations

from app.rewriter.base import QueryRewriter, RewriteResult
from app.schemas import ChatMessage


class NoOpRewriter(QueryRewriter):
    """The off switch. No LLM, no history read, no failure mode."""

    name = "none"

    def rewrite(
        self,
        question: str,
        chat_history: list[ChatMessage] | None = None,
    ) -> RewriteResult:
        """Return the question unchanged, at zero cost.

        `chat_history` is part of the `QueryRewriter` signature and is
        intentionally unused. Every token count is `0` because no provider call
        happens, `model` is `None` because no model was involved, and `error` is
        `None` because nothing can go wrong (Req 5 c4).
        """
        return RewriteResult(
            search_query=question,
            original=question,
            was_rewritten=False,
            strategy=self.name,
            tokens_used=0,
            prompt_tokens=0,
            completion_tokens=0,
            model=None,
            error=None,
        )
