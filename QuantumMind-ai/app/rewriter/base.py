"""Query rewriter abstraction (PLAN.md Phase 1).

WHY THIS EXISTS
---------------
Retrieval embeds the user's raw question. In a conversation that breaks: "What
about weekends?" carries almost no standalone meaning, so its embedding lands
nowhere near the right chunk and the confidence gate declines a question we can
actually answer. That is finding L1 — measured at baseline as multi_turn scoring
0.500 across every metric.

A rewriter sits between the user's input and the retriever, turning a
context-dependent follow-up into a self-contained search query.

WHY IT IS AN INTERFACE, NOT A METHOD ON QueryService
----------------------------------------------------
Rewriting is a *strategy*, and we already know we will want to try more than one
(LLM rewrite, multi-query fan-out, HyDE, a fine-tuned local model). Each of those
is a different implementation of the same contract. Making it an interface means:

  * adding a strategy = new file + one line in the factory
  * `services/query.py` — the core pipeline — never changes again
  * tests inject a fake with no LLM and no network
  * turning the feature off is a config value, not a code edit

This mirrors ``app/llm/`` exactly: ABC + factory + config-driven selection.

THE CONTRACT
------------
``rewrite()`` must **never raise**. Retrieval has to keep working even when the
rewriter is misconfigured, rate-limited, or down. Implementations catch their own
failures and return the original question with ``error`` populated. A rewrite is
an optimisation; losing it degrades quality, it must not cause a 500.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass

from app.schemas import ChatMessage


@dataclass
class RewriteResult:
    """Outcome of a rewrite attempt.

    Carries enough detail for tracing and for the eval harness to assert on the
    behaviour, not just the final answer.
    """

    # The string to hand to the retriever. ALWAYS populated — falls back to the
    # original question when rewriting was skipped or failed.
    search_query: str
    # What the user actually typed. Kept because the LLM prompt must show the
    # user's own words, not our machine-generated paraphrase.
    original: str
    # False when skipped (no history) or when it failed and we fell back.
    was_rewritten: bool = False
    # Which strategy produced this, for traces and debugging.
    strategy: str = "unknown"
    # Cost attribution. Zero for strategies that make no API call.
    tokens_used: int = 0
    prompt_tokens: int = 0
    completion_tokens: int = 0
    model: str | None = None
    # Populated when the attempt failed and we fell back to the original.
    error: str | None = None


class QueryRewriter(ABC):
    """Turns a possibly context-dependent question into a retrievable query."""

    # Stable identifier used in config, logs and trace attributes.
    name: str = "base"

    @abstractmethod
    def rewrite(
        self,
        question: str,
        chat_history: list[ChatMessage] | None = None,
    ) -> RewriteResult:
        """Produce a standalone search query.

        MUST NOT RAISE. On any internal failure, return a ``RewriteResult`` whose
        ``search_query`` is the original ``question`` and whose ``error`` explains
        what went wrong. The caller treats a failed rewrite as a no-op.
        """
        raise NotImplementedError
