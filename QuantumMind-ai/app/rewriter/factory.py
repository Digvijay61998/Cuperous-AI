"""Rewriter strategy selection (PLAN.md Phase 1).

WHY A REGISTRY
--------------
Selecting a rewrite strategy has to be a config value, not a code edit, and
adding a strategy has to be a new file plus one registry entry — never a change
to `app/services/query.py`. A single name-to-constructor mapping is what makes
that literally true (Req 5 c2): the pipeline imports `get_rewriter` and the
`QueryRewriter` interface, and nothing else in the tree knows which concrete
class is live.

Registry keys come from the classes' own `name` attributes rather than from
hand-written string literals. A class whose `name` disagrees with the key it is
registered under is therefore impossible, so `build_rewriter` can promise that
the returned rewriter's `name` equals the configured `rewriter_strategy`.

WHY THE CONSTRUCTORS SHARE ONE SIGNATURE
----------------------------------------
Every registry value is a `Callable[[Settings], QueryRewriter]`. `NoOpRewriter`
takes no arguments, so it is wrapped in `lambda _s: NoOpRewriter()`. A
constructor that ignores its argument is cheaper than two call shapes at the
call site — `build_rewriter` stays a dict lookup and one call, with no
per-strategy special case to keep in sync.

WHY NO PROVIDER IS TOUCHED HERE
-------------------------------
Nothing in this module resolves or constructs an `LLMProvider` (Req 5 c7). The
unknown-strategy `ValueError` is raised *before* any provider resolution could
happen (Req 3 c8), which is what makes the failure observable irrespective of a
missing API key. Strategies that need generation resolve their provider lazily,
on the first rewrite that actually requires one — so a process with no API key
configured still starts and still serves queries.

INTERMEDIATE STATE — READ BEFORE FILING A BUG
---------------------------------------------
Only `none` is registered right now. `app/config.py` already accepts `llm` as a
valid `rewriter_strategy` value, so setting `rewriter_strategy=llm` passes
settings validation and then hits this module's own `ValueError` naming `llm` as
unregistered. That gap is deliberate and temporary: the `llm` entry lands with
`LLMQueryRewriter` itself, in one added line (see the commented placeholder
below). Registering a strategy before its module exists would make this file
unimportable, so the order is registry-follows-implementation. The default
`none` path is fully working.

Mirrors `app/llm/factory.py`: registry/dispatch + a `lru_cache`'d process-default
accessor.

Requirements covered: 3.8, 5.2, 5.3, 5.7.
"""
from __future__ import annotations

import logging
from functools import lru_cache
from typing import Callable

from app.config import Settings, get_settings
from app.rewriter.base import QueryRewriter
from app.rewriter.noop import NoOpRewriter

logger = logging.getLogger("ai.rewriter.factory")

# Keys are the classes' own `name` attributes, so key and class can never drift.
# Values share one `Callable[[Settings], QueryRewriter]` shape; `NoOpRewriter`
# needs no settings and gets a wrapper that discards them.
_REGISTRY: dict[str, Callable[[Settings], QueryRewriter]] = {
    NoOpRewriter.name: lambda _s: NoOpRewriter(),
    # LLMQueryRewriter.name: LLMQueryRewriter,   <- one line, added with the
    # module itself. Until then `rewriter_strategy=llm` raises below.
}


def available_strategies() -> tuple[str, ...]:
    """The registered strategy names, in registration order."""
    return tuple(_REGISTRY)


def build_rewriter(settings: Settings) -> QueryRewriter:
    """Construct the rewriter named by `settings.rewriter_strategy`.

    Raises `ValueError` naming the unknown strategy and listing the registered
    ones, before any provider could be resolved (Req 3 c8). Mirrors
    `LLM_Factory`'s behaviour for an unknown provider.
    """
    name = settings.rewriter_strategy.strip().lower()
    ctor = _REGISTRY.get(name)
    if ctor is None:
        raise ValueError(
            f"Unknown rewriter strategy: {name!r}. "
            f"Registered: {', '.join(sorted(_REGISTRY))}"
        )
    logger.info("Initializing query rewriter: %s", name)
    return ctor(settings)


@lru_cache
def get_rewriter() -> QueryRewriter:
    """The process-default rewriter, built once.

    Cached to match the `get_llm_provider` / `get_settings` / `get_embeddings`
    convention: `QueryService` resolves it on first use and reuses it for every
    later query (Req 5 c12).
    """
    return build_rewriter(get_settings())
