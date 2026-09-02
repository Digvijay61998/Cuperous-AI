# Requirements Document

## Introduction

Phase 1 of the QuantumMind AI Service roadmap (PLAN.md §5) fixes findings L1 and L8: chat history reaches the LLM but never reaches retrieval. `app/services/query.py` embeds the user's raw question, so a conversational follow-up such as "What about weekends?" produces an embedding that lands nowhere near the correct chunk, the confidence gate finds nothing above `min_similarity_score`, and the service declines a question it could have answered.

This feature inserts a **Query Rewriter** between the user's input and the retriever. The rewriter turns a context-dependent follow-up into a self-contained search query using the recent chat turns. The rewritten string is used **only** for retrieval; the LLM still receives the user's own words.

The contract already exists in `app/rewriter/base.py`: the `QueryRewriter` ABC (with a `name` class attribute and an abstract `rewrite(question, chat_history) -> RewriteResult`) and the `RewriteResult` dataclass (`search_query`, `original`, `was_rewritten`, `strategy`, `tokens_used`, `prompt_tokens`, `completion_tokens`, `model`, `error`). That file documents the hard rule this whole feature rests on: **`rewrite()` must never raise.** A rewrite is an optimisation. Losing it degrades quality; it must never produce a 500.

The feature is built as a pluggable connector with a factory switch, mirroring `app/llm/` exactly (ABC + factory + config-driven selection). Adding a future strategy must be a new file plus one line in the factory, with no change to `app/services/query.py`. Turning the feature off must be a config value, not a code edit.

Success is measured against the committed Phase 0 baseline (`eval/results/baseline.json`, run `1ff70e1e`, 23 cases):

| Metric (multi_turn slice, n=4) | Baseline | Target |
|---|---|---|
| context recall | 0.500 | 1.000 |
| context precision | 0.208 | >= 0.500 |
| confidence accuracy | 0.500 | 1.000 |

Overall `false_negative_rate` must go 0.105 -> 0.000, and `make eval-compare` must report no regression on any other slice.

**Out of scope** (decision D4 in PLAN.md §8, backed by benchmark evidence that fan-out degraded performance): multi-query fan-out, HyDE, and fine-tuned local rewrite models. This phase delivers a single rewrite, measured before anything else is added.

### Assumptions about session state

The calling NestJS backend owns session state. It supplies the session's chat history to this AI service on every request. This service is stateless with respect to conversation: it holds no session, reconstructs no history, and persists nothing between requests.

Consequently the service treats the chat history it receives as authoritative. It applies no role-based special case, no reconstruction, and no second-guessing of what the caller sent. History persistence, session lifetime, and any windowing applied upstream of the request are the calling backend's concern and are **out of scope** for this phase. The only windowing this service performs is the `rewriter_history_turns` cap on what the rewrite prompt sends to the provider (Requirement 7 criterion 3) and the existing 6-turn cap on what the generation prompt sends (Requirement 4 criterion 3).

## Glossary

- **Query_Rewriter**: The abstract interface defined in `app/rewriter/base.py`. Any component that turns a question plus chat history into a `RewriteResult`.
- **Rewrite_Result**: The dataclass returned by every `Query_Rewriter`. Carries `search_query`, `original`, `was_rewritten`, `strategy`, `tokens_used`, `prompt_tokens`, `completion_tokens`, `model`, and `error`.
- **Search_Query**: The `search_query` field of a `Rewrite_Result`. The single string handed to the retriever. Always populated.
- **Original_Question**: The `original` field of a `Rewrite_Result`. The exact string the end user submitted, unmodified.
- **LLM_Rewriter**: The concrete `Query_Rewriter` strategy that performs one LLM call to produce a standalone `Search_Query`. Registered under the strategy name `llm`.
- **Noop_Rewriter**: The concrete `Query_Rewriter` strategy that performs no work, makes no LLM call, and returns the `Original_Question` as the `Search_Query`. Registered under the strategy name `none`. This is the off-switch and the default in all environments (Requirement 5 criterion 1 and Requirement 9 criterion 7 make `none` the default everywhere, and forbid inspecting test-runner, CI, or `app_env` indicators, which would violate hard rule 8 in CLAUDE.md).
- **Rewriter_Factory**: The module that selects and constructs a `Query_Rewriter` from configuration, mirroring `app/llm/factory.py`.
- **Query_Service**: `app/services/query.py`. The RAG pipeline: rewrite -> retrieve -> confidence gate -> prompt -> generate.
- **Vector_Store**: `app/services/vector_store.py`. The sole owner of Milvus access.
- **Confidence_Gate**: The step in `Query_Service` that keeps only hits whose similarity score is at least `min_similarity_score`, and which runs before any generation call.
- **LLM_Factory**: `app/llm/factory.py`. The only sanctioned place where LLM SDK clients are constructed (hard rule 4 in CLAUDE.md).
- **Settings**: The Pydantic settings object in `app/config.py`. The only sanctioned source of configuration (hard rule 8 in CLAUDE.md).
- **Tracing**: `app/tracing.py`. The stdlib span system that records per-stage latency, tokens, and estimated cost, and which swallows its own errors (hard rule 12 in CLAUDE.md).
- **Rewrite_Span**: The `Tracing` span named `query_rewrite`, emitted once per query for the rewrite stage.
- **Eval_Harness**: `eval/runner.py` plus `eval/golden/dataset.yaml`, invoked through `make eval`, `make eval-multiturn`, `make eval-baseline`, and `make eval-compare`.
- **Literal_Identifier**: A token in the question that must survive rewriting byte-for-byte: SKUs, error codes, part numbers, version strings, order numbers, and email addresses. The normative detection rule is the token-shape test specified in Requirement 8 criterion 6; the examples in this entry are illustrative only.
- **History_Window**: The most recent `rewriter_history_turns` entries of the supplied chat history, which is the only history the `LLM_Rewriter` is permitted to send to its provider.
- **Fake_Rewriter**: A test double implementing `Query_Rewriter` with no network access, used by unit tests.
- **Fake_Provider**: The existing test double implementing `LLMProvider` (see `tests/test_query.py`), used by unit tests with no API key.

## Requirements

### Requirement 1: Multi-turn follow-up resolution

**User Story:** As an end user of a support chatbot, I want my conversational follow-up questions answered, so that I do not have to restate the full topic in every message.

#### Acceptance Criteria

1. WHEN `Query_Service` receives a question with a non-empty chat history, where non-empty means at least one chat turn remains after the emptiness test defined in Requirement 2 criterion 1, THE Query_Service SHALL make exactly one call to the configured `Query_Rewriter` `rewrite` method for that query and SHALL complete that call before calling `Vector_Store.search`.
2. THE Query_Service SHALL pass the `Search_Query` of the `Rewrite_Result` to `Vector_Store.search` as the query string, for every `Rewrite_Result` including one whose `error` is populated, so that a failed rewrite searches with the `Original_Question` rather than blocking retrieval (see Requirement 3).
3. WHEN the `Original_Question` is a context-dependent follow-up — meaning its whitespace-delimited tokens include, under ASCII case-insensitive comparison, at least one of `it`, `they`, `them`, `that`, `this`, `those`, `these`, `one`, or `there`, or the `Original_Question` contains at most 8 whitespace-delimited tokens and no token naming a subject present in the `History_Window` — and the `History_Window` names that subject, THE LLM_Rewriter SHALL produce a `Search_Query` that contains that subject name and whose length is at most `rewriter_max_query_chars` characters.
4. WHEN the `LLM_Rewriter` returns a `Search_Query` that differs from the `Original_Question`, THE LLM_Rewriter SHALL set `was_rewritten` to `True`.
5. WHEN eval case MT-01 ("What about weekends?" after a support-hours turn) runs through the `Eval_Harness`, THE Query_Service SHALL return a response whose `sources` include a chunk of the `support-hours` source, whose highest-scoring hit scores at or above `min_similarity_score` (`0.15`), whose per-case context recall is 1.000, and whose `confident` value is `true` with a non-`None` `answer`.
6. WHEN eval case MT-04 ("How do I start one?" after a return-policy turn) runs through the `Eval_Harness`, THE Query_Service SHALL return a response whose `sources` include a chunk of the `returns-policy` source, whose highest-scoring hit scores at or above `min_similarity_score` (`0.15`), whose per-case context recall is 1.000, and whose `confident` value is `true` with a non-`None` `answer`.
7. WHEN eval cases MT-02 and MT-03 run through the `Eval_Harness`, THE Query_Service SHALL return, for each case, a response whose `sources` include a chunk of that case's expected source (`shipping-policy` for MT-02 and `product-catalog` for MT-03), whose highest-scoring hit scores at or above `min_similarity_score` (`0.15`), whose per-case context recall is 1.000, and whose `confident` value is `true` with a non-`None` `answer`.
8. THE Query_Service SHALL apply the same tenant scoping to a rewritten search as to an unrewritten one, passing `client_id` to `Vector_Store.search` unchanged so that both the partition key and the explicit `client_id ==` expression filter remain in force, and the returned `sources` SHALL contain zero chunks whose `client_id` differs from the `client_id` passed to `Query_Service`.
9. WHEN the `LLM_Rewriter` returns a `Search_Query` byte-for-byte equal to the `Original_Question`, THE LLM_Rewriter SHALL set `was_rewritten` to `False`.
10. WHEN the `History_Window` contains no antecedent for a context-dependent `Original_Question` as defined in criterion 3, THE LLM_Rewriter SHALL return a `Rewrite_Result` whose `Search_Query` is a non-empty string of at most `rewriter_max_query_chars` characters that `Query_Service` passes to `Vector_Store.search`, and SHALL set that `Search_Query` to the `Original_Question` byte-for-byte rather than to a query naming a subject absent from both the `Original_Question` and the `History_Window`.
11. WHEN `Query_Service` handles a query, THE Query_Service SHALL complete the rewrite stage within `rewriter_timeout_seconds` (default `5.0`, defined in Requirement 7 criterion 11) of wall-clock time as recorded by the `Rewrite_Span` duration, and SHALL proceed to `Vector_Store.search` with the `Original_Question` when that bound is reached.

### Requirement 2: Zero cost on the first turn

**User Story:** As an operator paying per token, I want no rewrite cost on the first turn of a conversation, so that the common single-turn case adds no money and no latency.

#### Acceptance Criteria

1. WHEN the chat history supplied to `rewrite` is an Empty_History — defined for this document as `None`, or a list of zero entries, or a list in which every entry's `content` is the empty string after stripping ASCII whitespace — THE LLM_Rewriter SHALL return a `Rewrite_Result` whose `Search_Query` equals the `Original_Question` byte-for-byte, whose `was_rewritten` is `False`, whose `strategy` equals `llm`, whose `error` is `None`, whose `model` is `None`, and whose `tokens_used`, `prompt_tokens`, and `completion_tokens` are all `0`.
2. WHEN the chat history supplied to `rewrite` is an Empty_History as defined in criterion 1, THE LLM_Rewriter SHALL invoke no `LLMProvider` method and SHALL resolve or construct no `LLMProvider` through `LLM_Factory`, so that a process with no API key configured completes this path successfully.
3. WHEN the chat history supplied to `rewrite` is an Empty_History as defined in criterion 1, THE Rewrite_Span SHALL record the attribute `skipped` with the value `True` and a reason attribute whose value identifies the empty chat history.
4. WHEN the chat history supplied to `rewrite` is an Empty_History as defined in criterion 1, THE Query_Service SHALL add a rewrite-stage latency, measured as the `Rewrite_Span` duration over at least 20 consecutive skip-path invocations in one process, whose 95th percentile is at most 5.0 ms and whose per-invocation value is at most 25.0 ms.
5. IF a `Query_Rewriter` returns a `Rewrite_Result` whose `was_rewritten` is `True` for an Empty_History as defined in criterion 1, THEN THE Query_Service SHALL pass that result's `Search_Query` to `Vector_Store.search` unchanged and SHALL count that result's `tokens_used` toward the reported `tokens_used`, because the skip is the rewriter's responsibility and `Query_Service` performs no second-guessing of a strategy's output.
6. WHEN the chat history supplied to `rewrite` contains at least one entry with role `assistant` and non-whitespace `content` and no entry with role `user`, THE LLM_Rewriter SHALL treat that history as non-empty and SHALL perform a rewrite, because the emptiness test of criterion 1 examines `content` only and the service treats any history the caller supplies as authoritative, applying no role-based special case. This criterion removes a special rule rather than adding one: there is no role-conditional branch in the emptiness test.
7. WHEN the `LLM_Rewriter` builds the `History_Window`, THE LLM_Rewriter SHALL first discard every entry whose `content` is the empty string after stripping ASCII whitespace, and SHALL then apply the `rewriter_history_turns` cap to the remaining entries.
8. IF the `Original_Question` is the empty string or consists only of ASCII whitespace, THEN THE LLM_Rewriter SHALL invoke no `LLMProvider` method and SHALL return a `Rewrite_Result` whose `Search_Query` equals the `Original_Question` byte-for-byte, whose `was_rewritten` is `False`, whose `tokens_used`, `prompt_tokens`, and `completion_tokens` are all `0`, and whose `error` identifies the empty question.

### Requirement 3: Fail open on any rewriter failure

**User Story:** As an operator, I want a rewriter failure to degrade answer quality and nothing more, so that a provider outage, a missing key, or a bad response never turns a working query into an error.

#### Acceptance Criteria

1. THE Query_Rewriter SHALL return a `Rewrite_Result` instance and propagate no exception of any type to its caller for every call to `rewrite`, including a call in which constructing the fallback `Rewrite_Result` itself raises, and including each of these inputs: a question of 1 character, a question of exactly `rewriter_max_query_chars` characters, an empty question, and a chat history of 0, 1, 2, 3, 4, 5, and 6 turns.
2. IF the underlying `LLMProvider` raises any exception during a rewrite, THEN THE LLM_Rewriter SHALL return a `Rewrite_Result` whose `Search_Query` equals the `Original_Question` byte-for-byte, whose `was_rewritten` is `False`, and whose `error` contains the exception class name and the exception message.
3. IF no API key is configured for the resolved provider, THEN THE LLM_Rewriter SHALL return a `Rewrite_Result` whose `Search_Query` equals the `Original_Question` byte-for-byte, whose `was_rewritten` is `False`, and whose `error` identifies the configuration problem by setting name without containing any key value.
4. IF the `LLMProvider` response is the empty string or consists only of ASCII whitespace after the sanitisation required by criterion 11 has been applied, THEN THE LLM_Rewriter SHALL return a `Rewrite_Result` whose `Search_Query` equals the `Original_Question` byte-for-byte, whose `was_rewritten` is `False`, and whose `error` identifies the empty response.
5. IF the `LLMProvider` response exceeds `rewriter_max_query_chars` characters after the sanitisation required by criterion 11 has been applied, THEN THE LLM_Rewriter SHALL discard the response and return a `Rewrite_Result` whose `Search_Query` equals the `Original_Question` byte-for-byte, whose `was_rewritten` is `False`, and whose `error` identifies the length violation and the configured bound.
6. IF a `Rewrite_Result` carries a non-`None` `error`, THEN THE Query_Service SHALL continue the pipeline using the `Search_Query` and SHALL return an HTTP 200 response carrying exactly the six `QueryResponse` fields `answer`, `confident`, `sources`, `tokens_used`, `provider`, and `model`, with no additional field, and with no field carrying the `error` string, the `strategy` name, or any other indication that a rewrite was attempted or failed.
7. IF a `Rewrite_Result` carries a non-`None` `error`, THEN THE Query_Service SHALL emit one WARNING-level log record containing the `strategy` name and that `error` string truncated to at most 500 characters and containing no provider API key value, SHALL record that same truncated string on the `Rewrite_Span`, and SHALL report `tokens_used`, `prompt_tokens`, and `completion_tokens` of that `Rewrite_Result` as `0` when no provider call completed and as the values reported by the completed provider call otherwise.
8. IF the configured rewrite strategy name is not registered in the `Rewriter_Factory`, THEN THE Rewriter_Factory SHALL raise a `ValueError` naming the unknown strategy before resolving or constructing any `LLMProvider`, mirroring `LLM_Factory` behaviour for an unknown provider, so that the failure is observable irrespective of a missing API key or any other concurrent fault.
9. IF the configured `rewriter_strategy` value is outside the registered strategy names, THEN THE Settings SHALL fail validation at application startup with a message naming that value, before the first query is served.
10. IF a rewrite provider call has not returned within `rewriter_timeout_seconds` (Requirement 7 criterion 11), THEN THE LLM_Rewriter SHALL return a `Rewrite_Result` whose `Search_Query` equals the `Original_Question` byte-for-byte, whose `was_rewritten` is `False`, and whose `error` identifies the timeout, and THE Rewrite_Span duration SHALL be at most `rewriter_timeout_seconds` plus 1.0 second.
11. WHEN the `LLM_Rewriter` receives a response from the `LLMProvider`, THE LLM_Rewriter SHALL sanitise that response by stripping leading and trailing ASCII whitespace, then removing a surrounding pair of matching ASCII single or double quote characters, then removing a surrounding markdown code fence and any language tag on its opening line, and SHALL complete this sanitisation before applying the empty test of criterion 4 and the length test of criterion 5.

### Requirement 4: The user's own words reach the LLM

**User Story:** As an end user, I want the assistant to answer the question I actually asked, so that a machine-generated paraphrase never changes the meaning of my request.

#### Acceptance Criteria

1. THE Query_Service SHALL append the `Original_Question` as the final `user` message in the message list passed to `LLMProvider.generate`, with that message's `content` equal to the `Original_Question` byte-for-byte so that no normalised, stripped, or re-cased copy satisfies this criterion, and SHALL do so for every `Rewrite_Result` including one whose `was_rewritten` is `True` and one whose `error` is populated.
2. THE Query_Service SHALL exclude the `Search_Query` from the text it inserts itself into the message list passed to `LLMProvider.generate` when the `Search_Query` differs from the `Original_Question`, specifically from the `system` message it builds from `_SYSTEM_TEMPLATE` and from the final `user` message, and this exclusion SHALL NOT apply to retrieved context chunk text or to chat history turn content, which are caller- or corpus-supplied and may legitimately share text with the `Search_Query`.
3. THE Query_Service SHALL insert the chat history turns into the message list passed to `LLMProvider.generate` after the `system` message and before the final `user` message, preserving each turn's `role` and `content` byte-for-byte and preserving the original relative order of the turns, capped at the last 6 turns, and SHALL produce the same message list for every value of `rewriter_history_turns` from 0 through its permitted maximum of 20.
4. THE Query_Service SHALL return a `QueryResponse` carrying exactly the fields `answer`, `confident`, `sources`, `tokens_used`, `provider`, and `model`, with each field's name, type, and nullability unchanged from the pre-Phase-1 schema, with `confident` continuing to mean that at least one retrieved hit scored at or above `min_similarity_score`, and with no field added.
5. THE Query_Service SHALL report `tokens_used` in the `QueryResponse` as the arithmetic sum of the generation `tokens_used` and the `Rewrite_Result` `tokens_used`, as a non-negative integer that is greater than or equal to each of those two addends.
6. WHEN the `Confidence_Gate` passes zero hits and `Query_Service` returns the fallback response with `confident` set to `False`, THE Query_Service SHALL report `tokens_used` equal to the `tokens_used` of the `Rewrite_Result` for that query, so that a rewrite which already spent tokens is not reported as `0` and so that the cost estimated by `eval/runner.py` from `response.tokens_used` reflects the spend.
7. WHEN a `Rewrite_Result` carries a non-`None` `error` together with a `tokens_used` greater than `0`, THE Query_Service SHALL include that `tokens_used` in the reported `QueryResponse` `tokens_used` on the `confident=true` path per criterion 5 and on the `confident=false` fallback path per criterion 6.
8. THE Eval_Harness SHALL account for the changed meaning of `tokens_used` in its cost estimate, either by attributing the rewrite portion and the generation portion separately to their respective per-token rates, or by recording in the run report that the estimate is conservative together with the reason that `response.tokens_used` now mixes rewrite completion tokens into a figure `eval/runner.py` attributes wholly as prompt tokens.

### Requirement 5: Pluggable strategy selection

**User Story:** As a developer, I want the rewrite strategy chosen by configuration, so that I can add or disable a strategy without touching the query pipeline.

#### Acceptance Criteria

1. THE Settings SHALL expose a `rewriter_strategy` value constrained to the registered strategy names, with exactly `none` and `llm` registered in this phase, defaulting to `none`, and SHALL reject any value outside that set at application startup before the first query is served.
2. THE Rewriter_Factory SHALL construct a `Query_Rewriter` whose `name` equals the configured `rewriter_strategy` value, by resolving that value through a single name-to-constructor registry, so that registering one additional strategy requires exactly one added registry entry and no edit to `Query_Service`.
3. WHERE `rewriter_strategy` is `none`, THE Rewriter_Factory SHALL return the `Noop_Rewriter` and SHALL resolve no `LLMProvider` while doing so.
4. WHERE `rewriter_strategy` is `none`, THE Noop_Rewriter SHALL return a `Rewrite_Result` whose `Search_Query` equals the `Original_Question`, whose `was_rewritten` is `False`, whose `strategy` is `none`, whose `error` is `None`, and whose `tokens_used`, `prompt_tokens`, and `completion_tokens` are all `0`, and SHALL invoke no `LLMProvider` method, for every input including a chat history of 1 to 100 turns.
5. THE Query_Service SHALL reference only the `Query_Rewriter` interface, the `Rewrite_Result` type, and the `Rewriter_Factory` entry point, and SHALL contain no import of and no textual reference to `LLM_Rewriter`, `Noop_Rewriter`, or any other concrete strategy class.
6. WHEN a `Query_Service` instance is constructed with an explicit `Query_Rewriter` argument, THE Query_Service SHALL use that instance for every subsequent query on that instance and SHALL make no call to the `Rewriter_Factory`.
7. THE Rewriter_Factory SHALL construct no `LLMProvider` during application startup or during `Query_Service` construction, and SHALL resolve the `LLMProvider` on the first rewrite that requires generation, so that a process with no API key configured starts, serves queries, and returns `confident=false` on the fallback path.
8. THE LLM_Rewriter SHALL obtain its `LLMProvider` exclusively through `LLM_Factory` and SHALL construct no SDK client, HTTP client, or connection session of its own.
9. WHERE `rewriter_provider`, `rewriter_model`, `rewriter_temperature`, or `rewriter_max_tokens` differs from its generation counterpart, THE LLM_Rewriter SHALL use a separate `LLMProvider` instance built by `LLM_Factory` and bound to the rewriter values, and SHALL leave the generation provider instance bound to `llm_provider`, `llm_model`, `llm_temperature`, and `llm_max_tokens` unmodified.
10. THE Settings SHALL supply every rewriter configuration value, and THE rewriter modules SHALL read no environment variable directly and SHALL take configuration from no source other than the `Settings` object.
11. THE Settings SHALL expose a `rewriter_provider` value constrained to the same provider names as `llm_provider` and defaulting to the configured `llm_provider` value, so that the rewrite stage can be pointed at a different backend without changing the generation backend.
12. WHEN a `Query_Service` instance constructed without an explicit `Query_Rewriter` handles its first query, THE Query_Service SHALL resolve the `Query_Rewriter` through the `Rewriter_Factory` exactly once and SHALL reuse that instance for every subsequent query on that instance.
13. THE LLM_Factory SHALL construct at most one `LLMProvider` instance per distinct combination of provider name, model, temperature, and max-tokens value per process, SHALL return the already-constructed generation provider instance when the rewriter configuration matches the generation configuration in all four values, SHALL key that cache on those four values alone and on no process-global or tenant-implicit component, and THE LLM_Rewriter SHALL reuse the returned instance for every subsequent rewrite in that process.
14. THE LLM_Factory SHALL accept the provider name, model, temperature, and max-tokens value as explicit arguments to its provider-construction entry point, and SHALL derive none of those four values from a single ambient `Settings` object, so that a caller can request a provider configuration that is not the process default without editing `LLM_Factory`.

**Forward-looking note on criteria 9, 13, and 14 (Phase 2+ intent, not Phase 1 scope).** The product will offer several model families — GPT, Claude, DeepSeek and others — selectable from the UI per customer subscription. Only GPT-4-class models are configured today. A single process-wide provider singleton cannot serve a different model per tenant, so criteria 13 and 14 are written to make the cache contract and the construction signature admit per-request resolution later: the cache key is the four configuration values and nothing else, and the four values arrive as arguments. Per-tenant or per-request model selection itself is **out of scope for Phase 1**; these criteria require only that the seam exists, so that adding tenant-scoped selection later needs no second rework of `LLM_Factory`.

### Requirement 6: Observability of the rewrite stage

**User Story:** As an operator debugging a bad answer, I want the rewrite visible in the trace, so that I can tell whether retrieval failed because of the rewrite or in spite of it.

#### Acceptance Criteria

1. WHEN `Query_Service` handles a query, THE Query_Service SHALL emit exactly one `Rewrite_Span` named `query_rewrite` per query, for every configured strategy including `none` and for every `Rewrite_Result` including one whose `error` is populated, and SHALL place it as the span immediately preceding the `retrieval` span in the trace span sequence, leaving the existing order of the `retrieval`, `confidence_gate`, `prompt_build`, and `generation` spans unchanged.
2. THE Rewrite_Span SHALL record the attribute `strategy` set to the `Query_Rewriter` `name`, the attribute `was_rewritten` set to a boolean, the `Original_Question` truncated to its first 200 characters, and the `Search_Query` truncated to its first 200 characters, matching the existing 200-character trace truncation convention, and SHALL carry a span duration in milliseconds greater than or equal to 0.
3. WHEN a `Rewrite_Result` reports `tokens_used` greater than 0, THE Rewrite_Span SHALL record that result's prompt tokens, completion tokens, total tokens, and model name through the existing `Span.record_tokens` interface, so that the estimated cost of the rewrite appears in the span and in the trace-level cost total.
4. THE Query_Service SHALL record the `Search_Query`, truncated to its first 200 characters, as an attribute of the `retrieval` span for every query, including queries whose `Search_Query` equals the `Original_Question`, so that the string actually embedded is recoverable from the trace.
5. WHILE `debug_logs_enabled` is true, THE Query_Service SHALL emit exactly one DEBUG-level log record per query containing the `strategy` name, the `Original_Question`, and the `Search_Query`, each string truncated to its first 200 characters.
6. IF an error occurs while creating the `Rewrite_Span` or while recording any of its attributes or token values, THEN THE Query_Service SHALL contain the failure within the `Tracing` layer, SHALL propagate no exception to the caller, SHALL continue the pipeline with the same `Search_Query`, and SHALL return the same HTTP 200 response field values it would have returned had the span recording succeeded, treating the loss as an observability gap rather than a request failure.
7. THE rewriter modules SHALL emit every log record through a logger namespaced `ai.rewriter` under the existing convention, and SHALL exclude the value of any provider API key or other credential from every log record and every span attribute, referring to such configuration by name only.
8. IF a `Rewrite_Result` reports `tokens_used`, `prompt_tokens`, and `completion_tokens` all equal to 0, THEN THE Rewrite_Span SHALL record no token attributes and SHALL contribute 0.0 to the trace-level estimated cost.
9. WHILE `tracing_enabled` is false, THE Query_Service SHALL pass the same `Search_Query` to `Vector_Store.search` and SHALL return the same `QueryResponse` field values as when `tracing_enabled` is true, so that observability configuration changes no answer.
10. WHILE `debug_logs_enabled` is false, THE Query_Service SHALL emit no log record containing the `Original_Question` or the `Search_Query` at DEBUG level.

### Requirement 7: Cost containment and reproducibility

**User Story:** As an operator, I want the rewrite bounded in tokens and deterministic in output, so that it stays cheap and so that eval runs are reproducible.

#### Acceptance Criteria

1. THE Settings SHALL expose `rewriter_max_tokens` as an integer constrained to the inclusive range 16 to 256, bounding the completion length of a single rewrite request, with a default of 64.
2. THE Settings SHALL expose `rewriter_history_turns` as an integer constrained to the inclusive range 1 to 20, bounding the number of most-recent chat turns supplied to the rewrite prompt, with a default of 6.
3. WHEN the `LLM_Rewriter` builds a rewrite prompt from a chat history of N turns, THE LLM_Rewriter SHALL include exactly the lesser of N and `rewriter_history_turns` turns, selected as the most recent turns in their original order, and SHALL include no other chat turn.
4. THE Settings SHALL expose `rewriter_temperature` as a float constrained to the inclusive range 0.0 to 1.0, with a default of `0.0`.
5. THE Settings SHALL expose `rewriter_model` as a non-empty string of at most 100 characters, with a default equal to the `llm_model` default value `gpt-4o-mini`.
6. THE Settings SHALL expose `rewriter_max_query_chars` as an integer constrained to the inclusive range 20 to 1000, bounding the accepted character length of a rewritten query, with a default of 500.
7. WHEN a rewrite is performed, THE LLM_Rewriter SHALL make exactly one call to `LLMProvider.generate`, requesting at most `rewriter_max_tokens` completion tokens at `rewriter_temperature`, SHALL issue no retry and no second call for that rewrite irrespective of its outcome, and this bound SHALL apply to the rewrite stage alone, leaving the generation stage free to make its own provider call.
8. WHEN the `Eval_Harness` runs twice against an unchanged corpus and unchanged configuration, THE Query_Service SHALL produce byte-identical `Search_Query` values for every case in which no rewrite provider call is made (`rewriter_strategy` of `none`, or an empty chat history), and SHALL send a byte-identical rewrite prompt for every case in which a rewrite provider call is made, so that reproducibility is asserted on inputs the service controls rather than on hosted-model output stability at `rewriter_temperature` `0.0`.
9. THE Query_Service SHALL evaluate the `Confidence_Gate` after `Vector_Store.search` returns and before any call to `LLMProvider.generate`, for every `Rewrite_Result` including one whose `error` is populated, so that no rewrite outcome causes an ungated generation call.
10. THE Settings SHALL expose `rewriter_provider` constrained to the same provider names as `llm_provider` (`openai`, `moonshot`, `anthropic`), with a default equal to the configured `llm_provider` value.
11. THE Settings SHALL expose `rewriter_timeout_seconds` as a float constrained to the inclusive range 0.5 to 30.0, bounding the wall-clock duration of a single rewrite provider call, with a default of `5.0`.
12. IF a rewrite provider call has not returned within `rewriter_timeout_seconds`, THEN THE LLM_Rewriter SHALL abandon that call, SHALL issue no retry, and SHALL return a `Rewrite_Result` whose `Search_Query` equals the `Original_Question`, whose `was_rewritten` is `False`, and whose `error` identifies the timeout and the configured bound.

### Requirement 8: Literal identifier preservation

**User Story:** As an end user asking about a specific part number, I want the identifier preserved exactly, so that the rewrite does not destroy the one token that identifies my product.

#### Acceptance Criteria

1. WHEN the `Original_Question` contains one or more `Literal_Identifier` tokens and the `LLM_Rewriter` performs a rewrite, THE LLM_Rewriter SHALL emit a `Search_Query` that contains every such `Literal_Identifier` byte-for-byte.
2. IF the rewrite response does not contain a `Literal_Identifier` of the `Original_Question` under ASCII case-insensitive comparison, THEN THE LLM_Rewriter SHALL discard the response and return a `Rewrite_Result` whose `Search_Query` equals the `Original_Question`, whose `was_rewritten` is `False`, and whose `error` identifies the dropped identifier.
3. IF the rewrite response contains a `Literal_Identifier` of the `Original_Question` under ASCII case-insensitive comparison but not byte-for-byte, THEN THE LLM_Rewriter SHALL discard the response and return a `Rewrite_Result` whose `Search_Query` equals the `Original_Question`, whose `was_rewritten` is `False`, and whose `error` identifies the case-altered identifier.
4. WHEN the `Eval_Harness` runs cases EM-01, EM-02, EM-03, and EM-04 with `rewriter_strategy` set to `llm`, THE Eval_Harness SHALL report context recall of 1.000 for the `exact_match` slice, equal to the committed baseline value.
5. THE Eval_Harness SHALL include at least one case tagged both `exact_match` and `multi_turn` whose question contains at least one `Literal_Identifier`, whose `chat_history` contains at least 2 turns, and whose `expected_sources` names at least one source.
6. THE LLM_Rewriter SHALL classify a whitespace-delimited token — after stripping leading and trailing characters other than ASCII letters, ASCII digits, `-`, `_`, `.`, and `@` — as a `Literal_Identifier` if and only if the stripped token is 2 to 64 characters long and satisfies at least one of: (a) every character is an ASCII letter, ASCII digit, `-`, or `_`, and the token contains at least one ASCII letter and at least one ASCII digit; (b) the token contains exactly one `@`, with at least one permitted character before it and at least two `.`-separated groups after it; (c) the token begins with `v` or `V` followed by at least two `.`-separated groups of ASCII digits.
7. IF a `Literal_Identifier` appears in the `History_Window` but not in the `Original_Question`, THEN THE LLM_Rewriter SHALL accept the rewrite response irrespective of whether that identifier appears in the response.
8. IF a `Literal_Identifier` of the `History_Window` appears in the rewrite response under ASCII case-insensitive comparison but not byte-for-byte, THEN THE LLM_Rewriter SHALL emit a `Search_Query` in which that occurrence carries the `History_Window` spelling byte-for-byte, and SHALL leave `was_rewritten` as `True`.

**Note on the criterion 6 token shape (confirmed decision, not an oversight).** Clause (c) requires a leading `v` or `V` on a version string. Version strings written without that prefix — a bare `3.2`, or a currency amount such as `$249.99` — are therefore **not** `Literal_Identifier` tokens and are not protected from rewriting. This exclusion was reviewed and confirmed: covering bare numeric tokens would make the classifier fire on prices, quantities, and dates, which is a worse failure than losing protection on a `v`-less version. Do not "fix" clause (c) by dropping the prefix requirement without re-deciding that trade-off.

### Requirement 9: Testability without Milvus or an API key

**User Story:** As a developer, I want to unit test the rewrite path with no Milvus and no API key, so that the suite stays fast and runnable in CI without secrets.

#### Acceptance Criteria

1. THE test suite SHALL provide a `Fake_Rewriter` implementing `Query_Rewriter` that returns the caller-supplied `Rewrite_Result` unchanged, that records the question string, the chat history list, and the number of `rewrite` calls it received, and that performs no network call and constructs no `LLMProvider`.
2. WHEN a query is answered through a `Query_Service` configured with a `Fake_Rewriter` whose `Rewrite_Result` carries a `Search_Query` differing from the raw follow-up question, THE test suite SHALL assert that the query string recorded by the existing `FakeStore` equals that `Search_Query` byte-for-byte and does not equal the raw follow-up question (PLAN.md task 1.5), and that the `client_id` recorded by `FakeStore` equals the `client_id` passed to `Query_Service`.
3. THE test suite SHALL assert that the content of the final `user` message recorded by `Fake_Provider` equals the `Original_Question` byte-for-byte, and that no message in that recorded list contains the `Search_Query` when the `Search_Query` differs from the `Original_Question`.
4. THE test suite SHALL cover the `LLM_Rewriter` against a `Fake_Provider` that raises an exception, a `Fake_Provider` that returns an empty string, a `Fake_Provider` that returns a whitespace-only string, and a `Fake_Provider` that returns a string exceeding `rewriter_max_query_chars` by at least 1 character, asserting in each case that the returned `Search_Query` equals the `Original_Question` byte-for-byte, that `was_rewritten` is `False`, and that `error` is non-`None`.
5. THE test suite SHALL cover the `Rewriter_Factory` for each registered strategy name (`none` and `llm`), asserting that the constructed rewriter's `name` equals the requested name, and for at least one unregistered strategy name, asserting that a `ValueError` naming that unknown strategy is raised.
6. THE rewrite unit tests SHALL run to completion with every provider API key setting resolved to an empty string and with no Milvus connection established, opening no outbound network connection, and SHALL complete within 5 seconds of wall-clock time for the rewrite test module.
7. THE Settings SHALL resolve `rewriter_strategy` to `none` by default in every environment, deriving the value solely from configuration and performing no inspection of test-runner, CI, or `app_env` indicators, so that any test which does not explicitly set `rewriter_strategy` exercises the `Noop_Rewriter`.
8. THE test suite SHALL assert that `rewrite` returns a `Rewrite_Result` instance and propagates no exception to the caller for each of at least six injected faults: a provider raising an exception, an empty response, a whitespace-only response, a response exceeding `rewriter_max_query_chars`, a response that drops a `Literal_Identifier`, and an empty API key, so that the never-raise contract is covered by assertion rather than assumed.
9. WHERE `rewriter_strategy` is `none`, THE test suite SHALL assert that the query string recorded by `FakeStore` equals the submitted question byte-for-byte and that the message list recorded by `Fake_Provider` is identical in role sequence and content to the pre-Phase-1 expectation, including for a non-empty chat history.
10. THE test suite SHALL keep all 107 pre-existing tests passing with their assertions unedited after the rewriter is introduced, so that the default `none` strategy is demonstrated to preserve existing behaviour.

### Requirement 10: Measured acceptance against the eval harness

**User Story:** As a maintainer, I want the phase accepted on measured numbers, so that "it works" means the committed baseline moved and nothing else regressed.

#### Acceptance Criteria

1. WHEN the `Eval_Harness` runs the `multi_turn` slice (cases MT-01, MT-02, MT-03, MT-04) in deterministic mode with `rewriter_strategy` set to `llm`, THE Eval_Harness SHALL report context recall of exactly 1.000 for that slice.
2. WHEN the `Eval_Harness` runs the `multi_turn` slice in deterministic mode with `rewriter_strategy` set to `llm`, THE Eval_Harness SHALL report context precision of at least 0.500 for that slice and SHALL report, alongside that value, the golden corpus document count and the configured `retrieval_top_k`, because with a 5-document corpus and `retrieval_top_k` of 5 the achievable precision is capped and the threshold alone is weak evidence (finding L23).
3. WHEN the `Eval_Harness` runs the `multi_turn` slice in deterministic mode with `rewriter_strategy` set to `llm`, THE Eval_Harness SHALL report confidence accuracy of exactly 1.000 for that slice, meaning all 4 cases return the expected `confident` value.
4. WHEN the `Eval_Harness` runs the full 23-case dataset in deterministic mode with `rewriter_strategy` set to `llm`, THE Eval_Harness SHALL report an overall `false_negative_rate` of exactly 0.000, meaning every case whose expected outcome is an answer returns `confident=true`, with no case permitted to fail.
5. WHEN the `Eval_Harness` runs the full dataset in deterministic mode with `rewriter_strategy` set to `llm`, THE Eval_Harness SHALL report context recall of exactly 1.000 and confidence accuracy of exactly 1.000 for each of the `baseline`, `single_turn`, `paraphrase`, `multi_hop`, and `exact_match` slices.
6. WHILE the committed 23-case baseline run `1ff70e1e` is present at `eval/results/baseline.json`, WHEN `make eval-compare` runs after the change in deterministic mode with `rewriter_strategy` set to `llm`, THE Eval_Harness SHALL report no metric as a regression and exit with status 0, where a regression is a drop of more than 0.02 on a higher-is-better metric or a rise of more than 0.02 on `false_negative_rate` or `false_positive_rate`, and where an exit status of 0 obtained without that baseline file present SHALL NOT count as evidence, because the comparison exit code reports regression only.
7. THE acceptance record SHALL report, for each of MT-01, MT-02, MT-03, and MT-04 individually and for both runs required by criterion 10, the expected sources, the retrieved sources, the per-case context recall, the returned `confident` value, and the resulting pass or fail, because MT-02 and MT-03 pass at baseline through vocabulary overlap rather than correct retrieval and a rewrite could plausibly move them down.
8. THE acceptance record SHALL report the measured p50 latency in milliseconds, the measured p95 latency in milliseconds, and the estimated total cost per run in USD for the accepted run, each shown next to the baseline values of 1910 ms, 2636 ms, and $0.00086 and with the signed delta from that baseline value, all taken from the same stored run report, so that the added rewrite cost is visible.
9. THE acceptance record SHALL add a row to PLAN.md §7 carrying the run ids of both runs required by criterion 10, the case count evaluated, and the harness mode, and SHALL update the Phase 1 task statuses in PLAN.md §5.
10. WHEN acceptance is measured, THE Eval_Harness SHALL be run twice consecutively in deterministic mode with `rewriter_strategy` set to `llm` against an unchanged corpus and unchanged configuration, and SHALL report identical values across both runs for context recall, context precision, confidence accuracy, `false_negative_rate`, and `false_positive_rate` at every slice named in criteria 1 through 5, because retriever and gate metrics are stable at identical values while generator metrics drift by up to 0.02 between runs, so a single run cannot distinguish a real move from wording noise.
11. IF the dataset case count differs from the 23 cases in the committed baseline, for example once the follow-up case required by Requirement 8 criterion 5 is added, THEN THE acceptance record SHALL report the criterion 4 and criterion 5 values computed over only the case ids present in the committed baseline, and SHALL report each added case id with its outcome as a separate entry excluded from that comparison, because a whole-dataset comparison across differing case counts is not a like-for-like comparison against run `1ff70e1e`.
12. IF any value required by criteria 1 through 6 is not met in either of the two runs required by criterion 10, THEN THE acceptance record SHALL record Phase 1 as not accepted and SHALL list each unmet criterion with its measured value and its target value.

### Requirement 11: Optional self-contained-question skip

**User Story:** As an operator, I want the option to skip the rewrite when the question is already self-contained, so that I can trade token cost against recall once the measured baseline target has been met.

#### Acceptance Criteria

1. THE Settings SHALL expose `rewriter_skip_self_contained` as a boolean with a default of `false`.
2. WHERE `rewriter_skip_self_contained` is `false`, THE LLM_Rewriter SHALL attempt a rewrite for every non-empty chat history irrespective of the shape of the `Original_Question`, so that the Requirement 10 acceptance targets are measured with this heuristic inactive.
3. WHERE `rewriter_skip_self_contained` is `true`, AND the `Original_Question` contains no token from the pronoun and demonstrative list of Requirement 1 criterion 3 under ASCII case-insensitive comparison, AND the `Original_Question` contains more than 8 whitespace-delimited tokens, THE LLM_Rewriter SHALL take the skip path defined in Requirement 2 criterion 1, invoking no `LLMProvider` method and reporting `tokens_used`, `prompt_tokens`, and `completion_tokens` all equal to `0`.
4. WHERE `rewriter_skip_self_contained` is `true`, WHEN the skip path of criterion 3 is taken, THE Rewrite_Span SHALL record the attribute `skipped` with the value `True` together with a reason attribute whose value identifies the self-contained determination and whose value differs from the empty-chat-history reason value required by Requirement 2 criterion 3.
5. THE acceptance record SHALL report the Requirement 10 criteria 1 through 5 values measured with `rewriter_skip_self_contained` set to `false`, and SHALL report any measurement taken with `rewriter_skip_self_contained` set to `true` as a separate entry, because the heuristic of criterion 3 can skip a context-dependent question that happens to contain no listed pronoun and exceed 8 tokens.
6. THE acceptance record SHALL record enabling `rewriter_skip_self_contained` as a follow-up measurement excluded from Phase 1 acceptance, so that the Phase 1 result is not attributed to a configuration the acceptance run did not use.

## Resolved decisions

Each item below was raised during requirement refinement as an open question and has since been answered. The record is kept so that the history of what was asked and what was decided survives.

1. **`rewriter_timeout_seconds` default of `5.0` s** (Requirement 7 criterion 11) — confirmed as written: float, inclusive range 0.5 to 30.0, default `5.0`. Confirmed also that the timeout covers the rewrite stage only, not the generation stage (Requirement 1 criterion 11, Requirement 3 criterion 10).
2. **The `Literal_Identifier` token-shape rule** (Requirement 8 criterion 6) — confirmed as written. Bare version and numeric tokens such as `3.2` and `$249.99` stay excluded; covering them is not needed. Recorded as a deliberate trade-off in the note under Requirement 8 so it is not later mistaken for an oversight.
3. **Assistant-only chat history counts as non-empty** (Requirement 2 criterion 6) — confirmed, with the rationale restated. The calling backend owns session state and supplies the history on every request; this service treats the supplied history as authoritative and applies no role-based special case. Recorded in the Assumptions note in the Introduction. The agreed cost lever is the opt-in skip of Requirement 11, defaulted off.
4. **`QueryResponse.tokens_used` now includes rewrite tokens** (Requirement 4 criteria 5, 6, and 7) — confirmed, and adjusting the `eval/runner.py` cost estimate is in scope for this phase (Requirement 4 criterion 8).
5. **`LLM_Factory` rework** (Requirement 5 criteria 9, 13, and 14) — confirmed in scope, with per-model caching approved. Strengthened so the cache key carries no process-global or tenant-implicit component and so the four configuration values arrive as explicit arguments, which keeps future per-tenant model selection from requiring a second rework. That selection itself remains out of scope for Phase 1; see the forward-looking note under Requirement 5.
