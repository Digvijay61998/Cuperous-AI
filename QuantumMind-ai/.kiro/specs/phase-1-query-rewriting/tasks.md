# Implementation Plan: Phase 1 — Query Rewriting

## Overview

Language: **Python 3.11** (taken from the design; every code block in design.md is Python — no language question required).

The order below is dependency-driven and is chosen so that `make test` is green after **every** task:

1. `sanitize.py` first — pure functions, zero dependencies, the natural anchor for the property tests.
2. `config.py` next — the factory and both strategies read `Settings`.
3. The `app/llm/factory.py` rework as **one atomic task** that also fixes `tests/test_llm_factory.py`'s construction lines and `eval/runner.py`'s judge path, because the four-argument signature breaks both. Splitting it would leave the suite red.
4. `noop.py` + `app/rewriter/factory.py` (registering `none` only) — the default path exists before the pipeline is touched.
5. `app/services/query.py` integration — the seam is proven **inert** with `strategy=none` (design rollout step 2) before any LLM rewrite exists.
6. `llm_rewriter.py` + one added `_REGISTRY` line — this is the design's "adding a strategy is a new file plus one registry entry" claim executed literally.
7. Eval harness changes and the EMT-01 case, once the pipeline works.
8. The two-consecutive-run acceptance measurement, then the documentation obligations.

`app/rewriter/base.py` is frozen and no task touches it.

## Tasks

- [x] 1. Sanitisation helpers and the property-test harness
  - [x] 1.1 Create `app/rewriter/__init__.py` and `app/rewriter/sanitize.py`
    - Creates: `app/rewriter/__init__.py` (currently missing, so `app.rewriter` is not an importable package), `app/rewriter/sanitize.py`
    - `CONTEXT_DEPENDENT_TOKENS` as a single `frozenset` of the nine tokens, `SELF_CONTAINED_MIN_TOKENS = 8`
    - `tokens_of`, `has_context_dependent_token`, `is_self_contained` (defined as `not has_context_dependent_token(q) and len(tokens_of(q)) > SELF_CONTAINED_MIN_TOKENS`, so Req 1.3's list and Req 11.3's negation cannot drift)
    - `sanitise_response`: strip → remove one matching ASCII quote pair → remove one markdown fence plus its language tag, applied repeatedly until the string stops changing, bounded at 4 iterations
    - `literal_identifiers`: strip non-`[A-Za-z0-9\-_.@]` from both ends, 2–64 chars, clauses (a)/(b)/(c); returns first-appearance order and never lowercases its output
    - `validate_literal_identifiers(original, candidate) -> (ok, reason)` and `restore_history_identifier_case(candidate, history_text)`
    - Pure functions only: no `Settings`, no logger, no provider, no `os.environ`
    - _Requirements: 1.3, 3.11, 8.6, 8.7, 8.8, 11.3, 5.10_

  - [x] 1.2 Add the Hypothesis dev dependency and wire it into the test target
    - Modifies: `requirements-dev.txt` (add `hypothesis==6.122.3`, pinned per the existing `pytest`/`pyyaml` convention), `Makefile` (add `hypothesis` to the `test` target's quiet pip install)
    - Nothing under `app/` may import `hypothesis`
    - _Requirements: 9.6_

  - [ ]* 1.3 Create `tests/strategies.py` with the shared Hypothesis generators
    - Creates: `tests/strategies.py`
    - `chat_histories()` (lengths 0–20, `user`/`assistant` roles, mixing blank, whitespace-only and unicode content), `literal_identifier_tokens()` (one generator per clause, plus `3.2` and `$249.99` emitted explicitly as **negative** examples), `provider_faults()` (the six named faults), `four_tuples()` (provider config combinations), plus secret-shaped strings for the leakage assertions
    - _Requirements: 9.4, 9.8_

  - [ ]* 1.4 Write unit tests for the sanitisation helpers
    - Creates: `tests/test_rewriter_sanitize.py`
    - Cover each clause of the classifier, the confirmed exclusions `3.2` and `$249.99`, the `9am-5pm` over-fire (deviation 7 — specified behaviour, not a bug), the normative sanitisation ordering, and the pronoun list
    - _Requirements: 3.11, 8.6, 8.7, 8.8, 11.3_

  - [ ]* 1.5 Write property test for the sanitisation pipeline
    - Creates: `tests/test_rewriter_properties.py`
    - `# Feature: phase-1-query-rewriting, Property 7: The sanitisation pipeline is idempotent, and decoration is invisible`
    - **Validates: Requirements 3.11, 3.4**

  - [ ]* 1.6 Write property test for identifier classification
    - Modifies: `tests/test_rewriter_properties.py`
    - `# Feature: phase-1-query-rewriting, Property 8: Literal_Identifier classification is idempotent, case-preserving, and clause-faithful`
    - Includes the independently written reference predicate over the three clauses
    - **Validates: Requirements 8.6**

  - [ ]* 1.7 Write property test for identifier validation
    - Modifies: `tests/test_rewriter_properties.py`
    - `# Feature: phase-1-query-rewriting, Property 9: Identifier validation accepts exactly the responses that preserve question identifiers`
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.7, 8.8**

- [x] 2. Configuration
  - [x] 2.1 Add the nine `rewriter_*` fields to `app/config.py`
    - Modifies: `app/config.py`
    - `rewriter_strategy: Literal["none","llm"] = "none"`, `rewriter_provider: Literal[...] | None = None`, and `Field`-bounded `rewriter_model` (1–100), `rewriter_temperature` (0.0–1.0, default 0.0), `rewriter_max_tokens` (16–256, default 64), `rewriter_history_turns` (1–20, default 6), `rewriter_max_query_chars` (20–1000, default 500), `rewriter_timeout_seconds` (0.5–30.0, default 5.0), `rewriter_skip_self_contained: bool = False`
    - `@model_validator(mode="after")` fills the `rewriter_provider` `None` sentinel from `llm_provider` via `object.__setattr__`
    - Default `none` in every environment: no `app_env`, CI or test-runner inspection
    - _Requirements: 3.9, 5.1, 5.10, 5.11, 7.1, 7.2, 7.4, 7.5, 7.6, 7.10, 7.11, 9.7, 11.1_

  - [x] 2.2 Add the nine `REWRITER_*` entries to `.env.example`
    - Modifies: `.env.example`
    - `REWRITER_STRATEGY=none` with the comment that this is the off switch, `REWRITER_PROVIDER=` blank with the "defaults to LLM_PROVIDER" note, and the remaining seven at their defaults
    - `.env` itself is not touched
    - _Requirements: 5.1, 5.10, 5.11, 9.7, 11.1_

  - [ ]* 2.3 Write unit tests for the new settings
    - Creates: `tests/test_rewriter_config.py` (an addition to the design's module table — config-validation examples have no home in the six listed modules)
    - Assert each bound rejects out-of-range values with a `ValidationError` naming the field, `rewriter_strategy` defaults to `none`, and `rewriter_provider` resolves to the configured `llm_provider` when unset and to its own value when set
    - _Requirements: 3.9, 5.1, 5.11, 7.1, 7.2, 7.4, 7.5, 7.6, 7.10, 7.11, 9.7, 11.1_

- [x] 3. `app/llm/factory.py` rework — one atomic task, suite never red
  - [x] 3.1 Rework the factory and fix both broken call sites together
    - Modifies: `app/llm/factory.py`, `tests/test_llm_factory.py`, `eval/runner.py`
    - `build_provider(provider, model, temperature, max_tokens, settings=None, timeout=None)`: the four config values are explicit arguments; `api_key` and `base_url` still come from `Settings` and must **not** enter any cache key
    - `timeout` is forwarded to the SDK client constructors (flagged deviation 2), optional with a `None` default so the generation path is byte-identical to today
    - `@lru_cache(maxsize=32) get_provider(provider, model, temperature, max_tokens)` — keyed on those four scalars alone, no process-global or tenant-implicit component
    - `get_llm_provider()` becomes a back-compat shim reading the process defaults
    - `eval/runner.py`: replace the `model_copy` judge dance with `build_provider(s.llm_provider, s.eval_judge_model, 0.0, s.llm_max_tokens)`
    - `tests/test_llm_factory.py`: update **only** the five construction lines to the four-argument form. Every assertion (`isinstance`, `.name`, `.model`, `._client.base_url`, `pytest.raises(ValueError)`) stays verbatim — this is flagged deviation 4 and the file must be re-read to confirm no assertion moved
    - `make test` must be green at the end of this single task
    - _Requirements: 5.8, 5.9, 5.13, 5.14, 3.10, 7.12, 9.10_

  - [ ]* 3.2 Write cache-identity and explicit-argument unit tests
    - Modifies: `tests/test_llm_factory.py`
    - Equal four-tuples return the identical object; unequal tuples return distinct objects; the returned provider's `model`/`temperature`/`max_tokens` equal the arguments rather than the `Settings` values; a rewriter configuration matching the generation configuration returns the already-constructed generation instance
    - _Requirements: 5.13, 5.14, 5.9_

- [x] 4. NoOp strategy and the rewriter factory
  - [x] 4.1 Create `app/rewriter/noop.py`
    - Creates: `app/rewriter/noop.py`
    - `NoOpRewriter`, `name = "none"`, `chat_history` accepted and ignored, no branch and no `try` — it constructs the dataclass from two already-bound locals
    - Returns `search_query == original`, `was_rewritten=False`, `strategy="none"`, `error=None`, `model=None`, all three token counts `0`
    - _Requirements: 5.3, 5.4_

  - [ ]* 4.2 Write unit tests for `NoOpRewriter`
    - Creates: `tests/test_rewriter_noop.py`
    - The exact field tuple from the design's per-path table, over histories of 1 to 100 turns, asserting no `LLMProvider` method is invoked
    - _Requirements: 5.4, 9.9_

  - [x] 4.3 Create `app/rewriter/factory.py` with the `none` entry only
    - Creates: `app/rewriter/factory.py`
    - `_REGISTRY: dict[str, Callable[[Settings], QueryRewriter]]` keyed off the classes' own `name` attributes, starting with `NoOpRewriter.name: lambda _s: NoOpRewriter()`
    - `available_strategies()`, `build_rewriter(settings)` raising `ValueError` naming the unknown strategy and listing the registered names, `@lru_cache get_rewriter()`
    - The `llm` entry is deliberately deferred to task 8.2 so this task cannot import a module that does not exist yet; `rewriter_strategy=llm` raises the factory's own `ValueError` until then, and the default `none` path is fully working
    - No `LLMProvider` is resolved or constructed anywhere in this module
    - _Requirements: 3.8, 5.2, 5.3, 5.7_

  - [ ]* 4.4 Write unit tests for the rewriter factory
    - Creates: `tests/test_rewriter_factory.py`
    - `build_rewriter` returns a rewriter whose `name` equals the requested `none`; an unregistered name raises `ValueError` naming it; no provider is constructed (use a spy on `app.llm.factory`); `get_rewriter()` is cached
    - The `set(available_strategies()) == set(get_args(...))` agreement assertion is deferred to task 8.2, when the registry and the `Literal` are back in step
    - _Requirements: 3.8, 5.2, 5.3, 5.5, 5.7, 9.5_

- [x] 5. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
  - `make test` green. Nothing in `app/services/` has been touched yet, so the 107 existing tests must pass untouched apart from `tests/test_llm_factory.py`'s construction lines from task 3.1.

- [x] 6. Pipeline integration — prove the seam is inert
  - [x] 6.1 Wire the rewriter into `app/services/query.py`
    - Modifies: `app/services/query.py`
    - `rewriter: QueryRewriter | None = None` as the **third** constructor parameter (after `store` and `provider`), so every existing positional call is unaffected, plus a lazy `rewriter` property mirroring `provider`
    - New `query_rewrite` span placed immediately before the existing `retrieval` span: records `strategy`, `was_rewritten`, `original[:200]`, `search_query[:200]`, a token block via `record_tokens` only when at least one count is non-zero, and `rewrite_error[:500]` when set
    - One WARNING log when `error` is populated; one DEBUG log per query gated on `debug_logs_enabled` carrying strategy, original and search query each truncated to 200 chars
    - `sp.set(search_query=search_query[:200])` on the `retrieval` span, and `store.search(client_id, search_query, top_k=...)` with `client_id` passed through untouched
    - `tokens_used` summation on **both** return paths: `rewrite_tokens` on the `confident=false` fallback, `result.tokens_used + rewrite_tokens` on the `confident=true` path
    - Must reference only `QueryRewriter`, `RewriteResult` and `get_rewriter` — no occurrence of `NoOpRewriter`, `LLMQueryRewriter`, `noop` or `llm_rewriter`
    - _Requirements: 1.1, 1.2, 1.8, 3.6, 3.7, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 5.5, 5.6, 5.12, 6.1, 6.2, 6.3, 6.4, 6.5, 6.10, 7.9_

  - [ ]* 6.2 Add the `FakeRewriter`, the additive `FakeProvider` extensions and the factory spy
    - Modifies: `tests/test_query.py` (additive only — `FakeStore.search` keeps recording `(client_id, query, top_k)` in `last_query` and `FakeProvider.last_messages` keeps its current behaviour, so no existing assertion changes). Creates: `tests/conftest.py` if absent
    - `FakeRewriter`: returns a caller-supplied `RewriteResult`, records `last_question`, `last_history` and a `calls` counter, no network, constructs no provider
    - `FakeProvider` gains a `calls` counter and optional `raises` / `responses` hooks for the fault matrix
    - `SpyLLMFactory` fixture counting provider resolutions; a fixture blanking every provider API key
    - _Requirements: 9.1, 9.4, 9.6_

  - [ ]* 6.3 Write pipeline integration tests
    - Creates: `tests/test_query_rewrite.py`
    - `FakeStore.last_query` receives the `search_query` byte-for-byte and not the raw follow-up; the same `client_id`; the final `user` message equals the original question byte-for-byte and no message contains the `search_query`; token sums on both paths; span order `query_rewrite → retrieval → confidence_gate → prompt_build → generation`; `none`-strategy equivalence with a non-empty history
    - _Requirements: 1.1, 1.2, 1.8, 4.1, 4.2, 4.3, 4.5, 4.6, 6.1, 9.2, 9.3, 9.9_

  - [ ]* 6.4 Write property test for the store call
    - Creates: `tests/test_query_properties.py` (the pipeline-level property module; splitting the design's single `test_rewriter_properties.py` in two keeps same-file property tasks out of the same dependency wave and lets rewriter and pipeline properties run in parallel)
    - `# Feature: phase-1-query-rewriting, Property 10: The store receives exactly the client id and the search query it was given`
    - **Validates: Requirements 1.1, 1.2, 1.8, 2.5, 9.2**

  - [ ]* 6.5 Write property test for the generation message list
    - Modifies: `tests/test_query_properties.py`
    - `# Feature: phase-1-query-rewriting, Property 11: The LLM sees the user's words and never the rewrite`
    - **Validates: Requirements 4.1, 4.2, 4.3, 9.3**

  - [ ]* 6.6 Write property test for token summation
    - Modifies: `tests/test_query_properties.py`
    - `# Feature: phase-1-query-rewriting, Property 12: Reported tokens_used is the sum and dominates each addend`
    - **Validates: Requirements 4.5, 4.6, 4.7**

  - [ ]* 6.7 Write property test for the response shape
    - Modifies: `tests/test_query_properties.py`
    - `# Feature: phase-1-query-rewriting, Property 13: The response shape is unchanged and leaks nothing about the rewrite`
    - **Validates: Requirements 3.6, 4.4**

  - [ ]* 6.8 Write property test for observability neutrality
    - Modifies: `tests/test_query_properties.py`
    - `# Feature: phase-1-query-rewriting, Property 14: Observability changes no answer, and failing observability changes no answer`
    - Includes the sabotaged `Span.set` / `Span.record_tokens` case and the 200-character truncation half
    - **Validates: Requirements 6.2, 6.3, 6.4, 6.6, 6.8, 6.9**

  - [ ]* 6.9 Write property test for provider identity and lazy resolution
    - Modifies: `tests/test_query_properties.py`
    - `# Feature: phase-1-query-rewriting, Property 15: Provider identity is the four configuration values and nothing else`
    - Both halves: `get_provider` object identity over four-tuples, and the laziness claim (explicit rewriter → zero factory calls; no explicit rewriter → exactly one, reused over 1 to 10 queries; no provider resolved until a rewrite needs generation)
    - **Validates: Requirements 5.6, 5.7, 5.9, 5.12, 5.13, 5.14**

  - [ ]* 6.10 Write property test for the `none` strategy equivalence
    - Modifies: `tests/test_query_properties.py`
    - `# Feature: phase-1-query-rewriting, Property 16: With rewriter_strategy of none, behaviour is byte-for-byte pre-Phase-1`
    - Histories of 1 to 100 turns
    - **Validates: Requirements 5.4, 9.7, 9.9, 9.10**

- [x] 7. Checkpoint — the 107 existing tests, assertions unedited
  - Ensure all tests pass, ask the user if questions arise.
  - Run `make test` and confirm the count: all 107 pre-existing tests pass. Then `git diff` the pre-existing test files and confirm the only edit anywhere is `tests/test_llm_factory.py`'s construction lines from task 3.1 — no assertion in any pre-existing test may have changed.
  - Also run `make eval-compare` with the default `REWRITER_STRATEGY=none` and confirm exit 0 with no metric moved. This is design rollout steps 1 and 2: the seam is wired and costing nothing.
  - _Requirements: 9.10, 10.6_

- [ ] 8. The LLM rewrite strategy
  - [~] 8.1 Create `app/rewriter/llm_rewriter.py`
    - Creates: `app/rewriter/llm_rewriter.py`
    - `LLMQueryRewriter`, `name = "llm"`, `__init__` stores `Settings` and resolves nothing; `_provider` resolved on first rewrite that needs generation
    - `rewrite` is the never-raise outer wrapper: normalise `question` to `str` on the first line, delegate to `_rewrite_inner`, and on any exception build the fallback `RewriteResult` from locals bound before any work, with `detail` computed in its own nested `try`
    - The eight-step control flow in order: empty question → empty history → self-contained skip → history window (drop blanks **first**, then cap at `rewriter_history_turns`) → resolve provider via `app.llm.factory` with `timeout=rewriter_timeout_seconds` → exactly one `generate` call, no retry, bounded by the SDK timeout plus an outer `ThreadPoolExecutor` guard at `bound + 0.5 s` → sanitise, empty check, length check, identifier validation in that order → accept with `was_rewritten = (candidate != question)`
    - `error` strings name settings, never values; span reasons `empty_history` and `self_contained`; logger namespaced `ai.rewriter`; the exact per-path field tuples from the design's `RewriteResult` table, including provider-reported tokens on step-7 rejections and `0` on step-1-to-6 failures
    - Builds the rewrite prompt from the history window at `rewriter_temperature` and `rewriter_max_tokens`; reads configuration only from `Settings`
    - _Requirements: 1.3, 1.4, 1.9, 1.10, 1.11, 2.1, 2.2, 2.3, 2.6, 2.7, 2.8, 3.1, 3.2, 3.3, 3.4, 3.5, 3.7, 3.10, 3.11, 5.8, 5.9, 5.10, 6.7, 7.3, 7.7, 7.12, 8.1, 8.2, 8.3, 8.7, 8.8, 11.2, 11.3, 11.4_

  - [~] 8.2 Register `llm` in `app/rewriter/factory.py`
    - Modifies: `app/rewriter/factory.py`, `tests/test_rewriter_factory.py`
    - One added `_REGISTRY` entry: `LLMQueryRewriter.name: LLMQueryRewriter`. This is the whole "add a strategy" cost the design claims, and no other file changes
    - Add the deferred agreement assertion `set(available_strategies()) == set(get_args(...))` and the per-name round trip for `llm`, still asserting no `LLMProvider` is constructed during `build_rewriter`
    - _Requirements: 5.1, 5.2, 5.7, 3.8, 9.5_

  - [ ]* 8.3 Write example tests for `LLMQueryRewriter`
    - Creates: `tests/test_rewriter_llm.py`
    - The three skip paths, the full fault matrix (raising provider, empty response, whitespace-only response, response exceeding `rewriter_max_query_chars` by at least 1, dropped identifier, re-cased identifier, empty API key, unknown provider), the normative sanitisation ordering, the one-call/no-retry assertion, and the timeout examples using a deliberately slow fake with a 0.5 s bound
    - Also the Req 2.4 timing check: 20+ consecutive skip invocations, p95 ≤ 5.0 ms, per-invocation ≤ 25.0 ms
    - Must run with every provider key blank, open no outbound connection, and complete within 5 s of wall clock
    - _Requirements: 2.4, 2.8, 3.2, 3.3, 3.4, 3.5, 3.10, 3.11, 7.7, 7.12, 8.2, 8.3, 9.4, 9.6_

  - [ ]* 8.4 Write property test for the never-raise contract
    - Modifies: `tests/test_rewriter_properties.py`
    - `# Feature: phase-1-query-rewriting, Property 1: rewrite() never raises`
    - `@settings(max_examples=200, deadline=None)` — the headline invariant and the cheapest to run
    - **Validates: Requirements 3.1, 9.8**

  - [ ]* 8.5 Write property test for fallback fidelity
    - Modifies: `tests/test_rewriter_properties.py`
    - `# Feature: phase-1-query-rewriting, Property 2: Fallback fidelity — a rejected or failed rewrite returns the original byte-for-byte`
    - The generator includes secret-shaped strings and asserts their absence from `error` and from every span attribute
    - **Validates: Requirements 2.8, 3.2, 3.3, 3.4, 3.5, 8.2, 8.3, 9.4**

  - [ ]* 8.6 Write property test for the `was_rewritten` flag
    - Modifies: `tests/test_rewriter_properties.py`
    - `# Feature: phase-1-query-rewriting, Property 3: was_rewritten is exactly the inequality of the two strings`
    - **Validates: Requirements 1.4, 1.9**

  - [ ]* 8.7 Write property test for the accepted query bound
    - Modifies: `tests/test_rewriter_properties.py`
    - `# Feature: phase-1-query-rewriting, Property 4: An accepted search_query is non-empty and within the configured bound`
    - Over `rewriter_max_query_chars` in 20 to 1000, for accepted, rejected and skipped results
    - **Validates: Requirements 1.3, 1.10, 3.5**

  - [ ]* 8.8 Write property test for the skip path
    - Modifies: `tests/test_rewriter_properties.py`
    - `# Feature: phase-1-query-rewriting, Property 5: The skip path spends nothing and touches no provider`
    - Includes the converse half: any history with one non-whitespace `content`, including an assistant-only history, takes the rewrite path with exactly one provider call
    - **Validates: Requirements 2.1, 2.2, 2.5, 2.6, 11.2**

  - [ ]* 8.9 Write property test for history window construction
    - Modifies: `tests/test_rewriter_properties.py`
    - `# Feature: phase-1-query-rewriting, Property 6: The history window discards blanks before it caps`
    - **Validates: Requirements 2.7, 7.3**

  - [ ]* 8.10 Write property test for the self-contained skip predicate
    - Modifies: `tests/test_rewriter_properties.py`
    - `# Feature: phase-1-query-rewriting, Property 18: The self-contained skip decision is exactly the shared-list predicate`
    - Both flag states, both halves reading the same `CONTEXT_DEPENDENT_TOKENS`
    - **Validates: Requirements 1.3, 11.2, 11.3**

  - [ ]* 8.11 Write the structural source-text assertions
    - Creates: `tests/test_structure.py`
    - `app/services/query.py` contains no occurrence of `NoOpRewriter`, `LLMQueryRewriter`, `noop` or `llm_rewriter`; no module under `app/rewriter/` reads `os.environ`; `llm_rewriter.py` imports no LLM SDK; every rewriter logger name starts with `ai.rewriter`. Same technique `tests/test_eval_isolation.py` already uses
    - _Requirements: 5.5, 5.8, 5.10, 6.7, 9.7_

- [~] 9. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
  - `make test` green with both strategies present. Confirm the rewrite test modules still run with every provider key blank and no Milvus connection.

- [ ] 10. Eval harness changes
  - [~] 10.1 Record the cost-attribution note in the run report
    - Modifies: `eval/runner.py`
    - Leave the `estimate_cost_usd(response.model, response.tokens_used, 0)` formula unchanged; add `cost_note` to the report's `config` block explaining that `response.tokens_used` now mixes rewrite completion tokens into a figure attributed wholly as prompt tokens, bounded by `rewriter_max_tokens` per query; print the note under the cost line whenever `rewriter_strategy != "none"`
    - This is Req 4.8's second option, taken deliberately (flagged deviation 5) because splitting the rates needs either a new response field — forbidden by Req 4.4 — or the harness reaching into span internals
    - _Requirements: 4.8, 4.4_

  - [~] 10.2 Add the `--baseline-subset` flag with intersection reporting
    - Modifies: `eval/runner.py`
    - Read the case ids present in `baseline.json`, compute and report the comparison over exactly the intersection, emit an `added_cases` block for current-minus-baseline ids with their own outcomes excluded from every comparison aggregate, and print both "vs baseline (N shared cases)" and "added cases (M): …"
    - Full-dataset numbers stay computed and stored; only the comparison is restricted. The existing "no baseline — run with `--baseline` first" path stays, since exit 0 without a baseline is not evidence
    - _Requirements: 10.11, 10.6_

  - [~] 10.3 Pass `--baseline-subset` from the Makefile
    - Modifies: `Makefile`
    - `eval-compare` gains `--baseline-subset` so the CI gate compares like with like. No other target changes
    - _Requirements: 10.6, 10.11_

  - [~] 10.4 Add the EMT-01 case to the golden dataset
    - Modifies: `eval/golden/dataset.yaml`
    - `id: EMT-01`, question `Is the QM-4471-B compatible with it?`, two history turns, `expect_confident: true`, `expected_sources: [product-catalog]`, `tags: [exact_match, multi_turn, p1_target]`
    - Exercises both features at once: `it` makes it context-dependent, `QM-4471-B` must survive byte-for-byte, and the history's `QM-ADAPT-1` is deliberately not required in the response
    - Takes the dataset from 23 to 24 cases, which is why task 10.2 exists
    - _Requirements: 8.5, 8.1, 8.7, 10.11_

  - [ ]* 10.5 Write property test for the baseline comparison set
    - Creates: `tests/test_eval_properties.py`
    - `# Feature: phase-1-query-rewriting, Property 17: The baseline comparison set is the intersection of case ids`
    - **Validates: Requirements 10.11**

- [ ] 11. Acceptance measurement
  - [~] 11.1 Run the full suite and record the result
    - Run `make test`. Every test must pass, including the property modules. Record the total count.
    - _Requirements: 9.6, 9.10_

  - [~] 11.2 Verify no regression with the default strategy
    - Run `make eval-compare` with `REWRITER_STRATEGY=none`. Must exit 0 against the committed baseline at `eval/results/baseline.json` with no metric moved, confirming the seam is inert.
    - _Requirements: 10.6_

  - [~] 11.3 Run the two consecutive deterministic acceptance runs with `rewriter_strategy=llm`
    - Run `make eval-multiturn` first with `REWRITER_STRATEGY=llm` as the cheapest signal, then run `make eval-compare` twice consecutively against an unchanged corpus and unchanged configuration, `rewriter_skip_self_contained=false`
    - Both runs must report identical values for context recall, context precision, confidence accuracy, `false_negative_rate` and `false_positive_rate` at every slice named in Req 10.1–10.5; generator metrics may drift up to 0.02 and are excluded from the identity check
    - Targets: `multi_turn` recall 1.000, `multi_turn` precision ≥ 0.500 reported alongside the corpus document count and `retrieval_top_k`, `multi_turn` confidence accuracy 1.000, overall `false_negative_rate` 0.000, and recall 1.000 / confidence accuracy 1.000 on the `baseline`, `single_turn`, `paraphrase`, `multi_hop` and `exact_match` slices — all computed over the 23 baseline case ids, with EMT-01 reported separately
    - Record per case for MT-01, MT-02, MT-03 and MT-04 in both runs: expected sources, retrieved sources, per-case context recall, returned `confident`, pass or fail. MT-02 and MT-03 pass at baseline through vocabulary overlap, so a rewrite could plausibly move them down
    - Record p50, p95 and estimated cost per run next to the baseline values 1910 ms, 2636 ms and $0.00086 with signed deltas, all from the same stored run report
    - If any Req 10.1–10.6 value is unmet in either run, record Phase 1 as **not accepted** with each unmet criterion's measured and target values
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.10, 10.11, 10.12, 11.2, 11.5, 11.6_

- [ ] 12. Documentation obligations
  - [~] 12.1 Update `PLAN.md`
    - Modifies: `PLAN.md`
    - §5: Phase 1 task statuses. §7: a metrics row carrying both run ids from task 11.3, the case count evaluated, and the harness mode. §8: the `LLM_Factory` rework recorded as an architectural decision, together with the timeout mechanism (SDK timeout plus outer guard) and the `--baseline-subset` mechanism. §3: any new finding, with severity and phase
    - If any measurement contradicted a prediction, state it rather than hide it — the `exact_match` precedent applies
    - Also record `rewriter_skip_self_contained=true` as a follow-up measurement excluded from Phase 1 acceptance
    - _Requirements: 10.7, 10.8, 10.9, 10.12, 11.5, 11.6_

  - [~] 12.2 Update `CLAUDE.md` only if a hard rule is now needed
    - Modifies: `CLAUDE.md`
    - Candidates: the `search_query` / `original` split never crossing over, and the `get_provider` cache key being exactly the four config values with no credential in it. Add the repository map entries for `app/rewriter/` and strike the "chat history never reaches retrieval" trap if the measurement shows it fixed. If no rule is warranted, make no change and say so
    - _Requirements: 5.5, 5.13, 4.1, 4.2_

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP. Every core implementation task and every measurement task is non-optional.
- `app/rewriter/base.py` is frozen. No task edits it.
- Each task names the files it creates or modifies, and no task leaves `make test` red. Task 3.1 is deliberately large because the four-argument `build_provider` breaks `tests/test_llm_factory.py` and `eval/runner.py` simultaneously; the three edits must land together.
- All 18 design properties are covered: 7, 8, 9 in task 1; 10 through 16 in task 6; 1 through 6 and 18 in task 8; 17 in task 10.
- Two deviations from the design's testing module table, both mechanical: `tests/test_rewriter_config.py` gives the settings-validation examples a home, and the property tests are split across `tests/test_rewriter_properties.py`, `tests/test_query_properties.py` and `tests/test_eval_properties.py` so that same-file property tasks do not all collapse into a single serial chain.
- Task 4.3 registers only `none`, and task 8.2 adds the `llm` entry. That keeps every intermediate state importable and demonstrates the design's "one added registry entry" claim literally.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "2.1"] },
    { "id": 1, "tasks": ["1.3", "1.4", "2.2", "2.3", "3.1"] },
    { "id": 2, "tasks": ["1.5", "3.2", "4.1"] },
    { "id": 3, "tasks": ["1.6", "4.2", "4.3"] },
    { "id": 4, "tasks": ["1.7", "4.4", "6.1"] },
    { "id": 5, "tasks": ["6.2", "8.1"] },
    { "id": 6, "tasks": ["6.3", "8.2", "8.3", "8.11", "10.1"] },
    { "id": 7, "tasks": ["6.4", "8.4", "10.2", "10.3", "10.4"] },
    { "id": 8, "tasks": ["6.5", "8.5", "10.5"] },
    { "id": 9, "tasks": ["6.6", "8.6"] },
    { "id": 10, "tasks": ["6.7", "8.7"] },
    { "id": 11, "tasks": ["6.8", "8.8"] },
    { "id": 12, "tasks": ["6.9", "8.9"] },
    { "id": 13, "tasks": ["6.10", "8.10"] },
    { "id": 14, "tasks": ["11.1"] },
    { "id": 15, "tasks": ["11.2"] },
    { "id": 16, "tasks": ["11.3"] },
    { "id": 17, "tasks": ["12.1", "12.2"] }
  ]
}
```
