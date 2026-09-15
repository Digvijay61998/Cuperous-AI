# Five test datasets for grading the support assistant

Purpose-built to catch the six defects found on 2026-09-06 (PLAN.md findings
L27–L32) and to keep them caught. These are **hand-graded** suites, separate from
`eval/golden/dataset.yaml`, which is the automated CI regression gate.

Why separate: the golden dataset scores retrieval and generation numerically
against a fixed corpus and must stay stable for `make eval-compare` to mean
anything. These five suites test *conversational behaviour* — tone, refusal
honesty, arithmetic, escalation — which a lexical metric grades badly and a human
grades well in thirty seconds.

## The suites

| # | File | What it catches | Grade it on |
|---|------|-----------------|-------------|
| 1 | `01-conversational.md` | L27 — greetings, thanks, sign-offs, identity | Did it reply like a person, without a knowledge lookup? |
| 2 | `02-cross-document.md` | L29, L31 — multi-part questions whose answers span documents | Is every part answered, and is the arithmetic right? |
| 3 | `03-honest-limits.md` | L28, L32 — questions we genuinely cannot answer | Does it admit the gap without blaming the customer or inventing policy? |
| 4 | `04-adversarial.md` | Hallucination under pressure: false premises, leading questions, injection | Did it correct the premise instead of agreeing? |
| 5 | `05-multi-turn.md` | Follow-ups that depend on earlier turns | Did it resolve the reference, or answer a different question? |

## How to run them

Ask the questions in order, in one session per suite, exactly as written. Order
matters in suite 5 and is irrelevant elsewhere.

```bash
# Every suite through the live service
python probe_datasets.py --suite all --client <CLIENT_ID>

# One suite
python probe_datasets.py --suite 2 --client <CLIENT_ID>
```

## How to grade

Each case lists **must have**, **must not have**, and the **failure it guards**.
Score per case:

| Score | Meaning |
|---|---|
| **2** | Every "must have" present, no "must not have" present |
| **1** | Correct but incomplete — a missing part, or a stiff/robotic tone |
| **0** | Wrong fact, invented policy, or a "must not have" present |

A suite passes at **≥90% of maximum** with **zero** zeros. A single 0 fails the
suite regardless of the total: a wrong number or an invented policy reaching a
customer is not offset by nine good answers.

Record results in `PLAN.md §7` with the date and the commit.

## Ground truth

The corpus these are written against is the five Nimbus documents. Key facts,
so you can grade without re-reading the PDFs:

- **Starter** ₹1,999/mo · 3 seats · 2,000 conversations · overage **₹1.20** · WhatsApp add-on **₹1,499** · KB add-on ₹999
- **Growth** ₹6,999/mo · 10 seats · 10,000 conversations · overage **₹0.80** · WhatsApp **included**
- **Scale** ₹17,999/mo · 30 seats · 50,000 conversations · WhatsApp **included** · contracted overage
- **SLA** P1 30 min / 4 h · P2 2 business hours / 1 business day · P3 8 business hours / 3 business days
- **Hours** Mon–Fri 09:00–18:00 IST; critical incidents 24×7; out-of-hours non-critical queues to next business day
- **Refunds** agent up to **₹5,000**; above that supervisor; request needs order ID, reason, amount, payment method
- **Identity** verify **two** attributes before changing email or phone
- **Escalation** security incidents, suspected account takeover, another customer's data exposure → Security queue immediately; never promise an investigation outcome
- **Retention** resolved 24 months · archived 36 months
- **States** Open (active work expected) · Pending (waiting on customer or external dependency) · Resolved (complete, still searchable) · Archived (storage, excluded from active inbox)
- **Handoff** conversation keeps its history and ID; the agent does **not** get a new empty thread
- **Attachments** PDF, JPG, PNG, DOCX; over 20 MB rejected; metadata stored even on rejection
- **Resolved + customer replies** new event on the existing conversation; it becomes Open again
