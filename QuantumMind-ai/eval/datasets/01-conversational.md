# Suite 1 — Conversational turns

**Guards finding L27.** Every case here is something a human types into a support
chat that is *not* a knowledge-base question. Before the smalltalk route existed,
`hello` retrieved four policy chunks, cleared the similarity gate, and produced
"I don't have that information right now." The other three retrieved nothing and
hit the caller's fallback, "Sorry, I did not understand that."

Two things to check on every case: the reply reads like a person, and the trace
shows **0 tokens and 0 searches**. A warm reply that still burned an LLM call has
only fixed half the defect.

Max score: 30.

---

### 1.1 Bare greeting
**Ask:** `hello`
- Must have: a greeting, and an invitation to say what they need
- Must not have: "I don't have that information", "I did not understand", any policy text
- Guards: L27. Trace must show 0 searches, 0 tokens.

### 1.2 Casual greeting
**Ask:** `hi there`
- Must have: same as 1.1
- Must not have: a fallback message of any kind
- Guards: L27 — this one previously retrieved nothing and hit the caller's fallback.

### 1.3 Typo'd greeting
**Ask:** `hii`
- Must have: a greeting
- Must not have: a request to rephrase
- Guards: real customers type this constantly.

### 1.4 Time-of-day greeting
**Ask:** `good morning`
- Must have: a greeting
- Must not have: business-hours policy text — they said hello, they did not ask when you open
- Guards: the multi-word phrase path. "good" alone must not be what matches.

### 1.5 Thanks mid-conversation
**Ask:** `thanks, that helps`
- Must have: an acknowledgement, and an offer to help further
- Must not have: a fallback, a repeat of the previous answer
- Guards: L27, and the phrase-cover matcher — `thanks` + `that helps` are two phrases.

### 1.6 Terse acknowledgement
**Ask:** `got it`
- Must have: a brief acknowledgement
- Must not have: a knowledge lookup
- Guards: single-word acknowledgements are the most common turn in a real chat.

### 1.7 Identity
**Ask:** `who are you?`
- Must have: that it is the company's support assistant, and what it can help with
- Must not have: a claim to be human, a fabricated name or job title
- Guards: L27. Honesty about being an assistant is a trust requirement, not a nicety.

### 1.8 Bot suspicion
**Ask:** `are you a bot`
- Must have: a straight answer
- Must not have: evasion, or a claim to be a person
- Guards: customers ask this when frustrated. Dodging it makes things worse.

### 1.9 Sign-off
**Ask:** `bye`
- Must have: a warm close, and that they can come back
- Must not have: a new question, a survey prompt
- Guards: L27.

### 1.10 Greeting attached to a real question — **THE CRITICAL CASE**
**Ask:** `hi, how much is the Growth plan?`
- Must have: **₹6,999 per month**
- Must not have: a greeting-only reply, "Glad that helped", any smalltalk reply
- Guards: the false-positive direction, which is the dangerous one. Misrouting this
  means answering "Hi there! What can I help you with?" to someone who just asked
  a pricing question. If this case scores 0, the smalltalk matcher is too greedy
  and **the suite fails regardless of the other nine.**
