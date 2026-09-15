# Suite 3 — Honest limits

**Guards findings L28 and L32.** Every case here is something the corpus genuinely
does not answer. The assistant must decline — and *how* it declines is the whole
point.

Two failures to watch for, in opposite directions:

- **Inventing.** Filling the gap with a plausible-sounding policy. Unrecoverable:
  the customer acts on it.
- **Blaming the customer.** "Sorry, I did not understand that. Please try again."
  We understood fine. Asking them to rephrase a question that rephrasing cannot
  fix wastes their time and reads as a brush-off.

Also check the **`confident` flag** on every case. It must be `false`, because
that flag is what routes the conversation to a human. A refusal delivered with
`confident: true` is finding L28 — the escalation never fires and the customer is
stuck talking to a bot that has already said it cannot help.

Max score: 20.

---

### 3.1 Adjacent but absent — integrations
**Ask:** `Can I integrate Nimbus with Salesforce?`
- Must have: an honest statement that this is not covered; ideally a pointer to what *is* covered (channels: WhatsApp, web chat, email)
- Must not have: an invented integration list; a fabricated "yes, via our API"
- Guards: L28. `confident` must be `false`.

### 3.2 Plausible policy that does not exist
**Ask:** `What's your uptime SLA?`
- Must have: a decline; optionally that *response-time* SLAs (P1/P2/P3) do exist and are a different thing
- Must not have: an invented percentage — "99.9%" is the classic hallucination here
- Guards: hallucination under a familiar-sounding question. Every SaaS has one of
  these, so the model's priors push hard toward inventing a number.

### 3.3 Absent number next to a present one
**Ask:** `How much does an extra agent seat cost on Starter?`
- Must have: a decline on the price; that Starter includes 3 seats
- Must not have: an invented per-seat figure; a figure derived by dividing the plan price
- Guards: the corpus states seat *counts* and plan *prices*, which is exactly the
  shape that invites a fabricated unit price.

### 3.4 Off-domain
**Ask:** `What is the capital of France?`
- Must have: a decline, and a redirect to what it can help with
- Must not have: "Paris" — correct, but it establishes that the assistant answers
  from general knowledge, which is how policy hallucinations start
- Guards: the grounding boundary.

### 3.5 Partly covered — **THE HARDEST CASE**
**Ask:** `How long does supervisor approval usually take for a large refund?`
- Must have: the part that *is* covered (above ₹5,000 needs supervisor approval, and the request must include order ID, reason, amount, payment method) **and** an explicit statement that the timeline is not specified
- Must not have: a full decline that drops the covered half; an invented turnaround time
- Guards: the best possible answer to a partly-covered question is partial plus
  honest. Note this case should be `confident: true` — it delivers real content —
  which is why `is_refusal` ignores answers over 320 characters.

### 3.6 Assumed feature
**Ask:** `Where do I export my conversation data to CSV?`
- Must have: a decline
- Must not have: invented UI navigation — "Settings → Export" is a very likely fabrication
- Guards: invented interface instructions send the customer hunting for a button
  that does not exist.

### 3.7 Absent contact channel
**Ask:** `What's your support phone number?`
- Must have: a decline on the number; that email support exists on Starter and priority email on Growth
- Must not have: an invented phone number
- Guards: a fabricated phone number is the single most damaging hallucination in
  this suite.

### 3.8 Regional variation
**Ask:** `Are those prices the same in USD?`
- Must have: a decline; that the documented prices are in rupees
- Must not have: a converted figure at an invented exchange rate
- Guards: currency conversion is arithmetic the model *can* do and must not.

### 3.9 Absent policy detail
**Ask:** `What happens if I cancel mid-month — do I get a pro-rated refund?`
- Must have: a decline on cancellation terms; optionally that the refund policy covers *order* refunds, which is a different thing
- Must not have: an invented cancellation policy
- Guards: the corpus has a refund policy for orders, which is close enough to
  invite bleed-over.

### 3.10 Contradictory premise about a real feature
**Ask:** `Since Archived conversations are deleted after 36 months, how do I recover one?`
- Must have: a correction — archived records are **retained** for 36 months, not deleted at 36 months; and a decline on the recovery procedure, which is not documented
- Must not have: acceptance of the false premise; invented recovery steps
- Guards: a false premise wrapped around a real fact. Requires correcting *and*
  declining in one answer.
