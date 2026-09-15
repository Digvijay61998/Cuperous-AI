# Suite 5 — Multi-turn context

**Order matters.** Run each conversation's turns in sequence in one session. A
follow-up like "what about weekends?" carries almost no standalone meaning, so
what is being tested is whether the earlier turns reach the answer at all.

Known state of the pipeline, so you grade the right thing: chat history reaches
the **LLM** but not the **retriever** (`rewriter_strategy=none`, PLAN.md finding
L1). Follow-ups therefore work when the earlier turns are enough for the LLM to
resolve the reference *and* the raw follow-up still happens to retrieve the right
chunk. When the follow-up shares no vocabulary with the corpus, retrieval misses
and the answer degrades.

That means a **1** on cases 5.4 and 5.7 is the expected pre-Phase-1 result, not a
new bug. Record it as the measurement that justifies finishing Phase 1 (the LLM
query rewriter, spec at `.kiro/specs/phase-1-query-rewriting/`). Re-run this suite
after that lands; those cases should reach 2.

Max score: 16.

---

### 5.1 Pronoun referring to a plan
1. `What does the Growth plan include?`
2. **`Does it include WhatsApp?`**
- Turn 2 must have: **yes**, Growth includes WhatsApp integration
- Must not have: a request to clarify what "it" means; an answer about Starter
- Guards: the simplest referential follow-up.

### 5.2 Cost follow-up after naming an add-on
1. `I need the WhatsApp add-on on Starter.`
2. **`How much would that cost me?`**
- Turn 2 must have: **₹1,499 per month**
- Must not have: the plan price instead of the add-on price; a clarification request
- Guards: "that" resolving to the add-on rather than the plan.

### 5.3 Threshold follow-up
1. `A customer wants a refund of ₹4,000.`
2. **`What if it were ₹7,500 instead?`**
- Turn 2 must have: that ₹7,500 exceeds the ₹5,000 limit and needs **supervisor** approval
- Must not have: a repeat of the turn-1 answer unchanged
- Guards: the follow-up changes which side of a threshold the case falls on.

### 5.4 Vocabulary-poor follow-up — **KNOWN WEAK**
1. `What are your support hours?`
2. **`What about weekends?`**
- Turn 2 must have: that standard hours are Mon–Fri, so weekends are outside them; critical incidents are monitored 24×7; non-critical tickets queue to the next business day
- Must not have: an invented weekend schedule
- Guards: finding L1. "What about weekends?" retrieves badly on its own. Scoring 1
  here is the expected pre-Phase-1 result — the 24×7 and next-business-day details
  are the parts that go missing.

### 5.5 Correction turn
1. `We're on the Growth plan with 12,000 conversations. What's the overage?`
2. **`Sorry, I meant Starter, not Growth.`**
- Turn 2 must have: recalculated on **Starter** — 10,000 excess conversations at **₹1.20** = ₹12,000, plus the ₹1,999 base
- Must not have: the Growth rate of ₹0.80; a mix of both plans
- Guards: a correction must override the earlier turn, not blend with it.

### 5.6 Smalltalk between two real questions
1. `What's the P1 first response target?`
2. `thanks`
3. **`And P3?`**
- Turn 2 must have: an acknowledgement, no knowledge lookup
- Turn 3 must have: **8 business hours** first response, 3 business days resolution
- Must not have: turn 2 answering a question; turn 3 losing the thread
- Guards: the smalltalk route must not clear conversational context that turn 3
  depends on.

### 5.7 Referential chain across two documents — **KNOWN WEAK**
1. `A customer's WhatsApp messages are showing up late.`
2. `The connector says Connected.`
3. **`So what should I not do?`**
- Turn 3 must have: do **not** immediately recreate the WhatsApp session, because reconnecting can interrupt message processing
- Must not have: a generic list of troubleshooting steps with the warning omitted
- Guards: the "do not" is the highest-value sentence in the runbook and the easiest
  to drop. Expect 1 pre-Phase-1.

### 5.8 Resolved-then-reopened, asked as a follow-up
1. `We resolved a customer's conversation yesterday.`
2. **`They just replied. Do I open a new one?`**
- Turn 2 must have: **no** — the reply creates a new event on the **existing**
  conversation, which becomes **Open** again unless an automation rule routes it
  elsewhere
- Must not have: a claim a new conversation is needed
- Guards: an edge case that only makes sense with turn 1 in context.
