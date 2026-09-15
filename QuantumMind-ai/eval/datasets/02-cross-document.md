# Suite 2 — Cross-document reasoning and arithmetic

**Guards findings L29 and L31.** Every case needs facts from two or more
documents, and most need arithmetic. This is the suite that caught the wrong bill:
asked for a Starter bill at 10,650 conversations, the assistant answered **₹4,278**
— it had subtracted Growth's 10,000 allowance instead of Starter's 2,000. The
correct figure is **₹13,878**.

Grade the arithmetic strictly. A confidently-stated wrong number is worse than a
decline, because the customer has no way to know it is wrong.

Max score: 20.

---

### 2.1 Starter over allowance, with add-on — **THE REGRESSION CASE**
**Ask:** `I'm on the Starter plan and I have 10,650 conversations this month. I also need WhatsApp. How much should I expect to pay before taxes, and does my plan include WhatsApp automatically?`
- Must have: **₹13,878**; the ₹1,999 base; **8,650** excess conversations (not 8,650's cousin 650); ₹1.20 each = ₹10,380; ₹1,499 add-on; and an explicit **no**, Starter does not include WhatsApp
- Must not have: ₹4,278 or any total derived from subtracting 10,000; the Growth overage rate of ₹0.80; a total stated before the components
- Guards: L29 exactly. Needs three documents: plan price and allowance, overage rate, add-on price.

### 2.2 The documented billing example
**Ask:** `I have a Starter subscription, 2,400 conversations, and WhatsApp enabled. Calculate my monthly bill before taxes and explain every component of the calculation.`
- Must have: **₹3,978**; ₹1,999 + (400 × ₹1.20 = ₹480) + ₹1,499, each named
- Must not have: a wrong total; unexplained components
- Guards: the arithmetic floor. This exact sum is written in the corpus, so getting
  it wrong means the assistant cannot even copy a worked example.

### 2.3 Plan comparison requiring a switch recommendation
**Ask:** `I'm on Starter and running about 9,000 conversations a month with WhatsApp. Would Growth be cheaper?`
- Must have: Starter total ≈ ₹1,999 + (7,000 × ₹1.20 = ₹8,400) + ₹1,499 = **₹11,898**; Growth at **₹6,999** with WhatsApp included and 10,000 conversations covered; the conclusion that **Growth is cheaper**
- Must not have: a recommendation with no numbers behind it; a claim Growth needs the add-on
- Guards: L31 — four facts from two documents in one answer. At top_k=5 this
  routinely lost a chunk and answered half the question.

### 2.4 Refund crossing the approval threshold, plus escalation
**Ask:** `A customer requests a ₹7,500 refund. What information must be included in the request, who can approve it, and what happens if the case also involves suspected account takeover?`
- Must have: order ID, reason, amount, payment method; that ₹7,500 exceeds the ₹5,000 agent limit so a **supervisor** must approve; immediate escalation to the **Security queue**
- Must not have: a claim an agent can approve it; a promised investigation outcome
- Guards: three-part question spanning two policy sections. Partial answers here
  were the norm before the prompt change.

### 2.5 Weekend P2 with handoff
**Ask:** `A customer sends a WhatsApp message on Saturday about a P2 issue. The bot handles it first and transfers it to an agent. Does the agent get a new conversation, when should the first response be provided, and can the agent see the bot's previous messages?`
- Must have: **no** new conversation — same conversation and ID; P2 first response is **2 business hours**, and because Saturday is outside hours the clock starts the **next business day**; **yes**, the agent sees the bot's messages
- Must not have: a claim handoff creates a fresh thread or erases history; a first-response time counted in calendar hours from Saturday
- Guards: three documents — product manual, SLA policy, FAQ.

### 2.6 Full synthesis
**Ask:** `We have a P2 issue that arrives Saturday afternoon through WhatsApp. The bot handles it and later hands it to an agent. The customer wants a ₹7,500 refund. Explain the complete handling process, including conversation history, SLA, refund approval, identity verification, and security escalation if account takeover is suspected.`
- Must have: all five named elements — history preserved on the same conversation; P2 SLA starting next business day; supervisor approval for ₹7,500; **two** identity attributes verified; immediate Security queue escalation
- Must not have: a missing element; an invented step; a promised outcome
- Guards: the hardest case in the set. Four documents.

### 2.7 Retention across states
**Ask:** `How long do you keep a conversation after it's resolved, and does that change if we archive it?`
- Must have: resolved **24 months**; archived **36 months**
- Must not have: one figure presented as covering both
- Guards: two facts from one section that were previously collapsed into one.

### 2.8 Threshold applied to the customer's own case
**Ask:** `We're on Starter with 3 agents and we just hired 2 more. What happens?`
- Must have: Starter includes **3 seats**, so 5 agents exceeds it; and an honest statement that the corpus does not specify the cost of extra seats
- Must not have: an invented per-seat price
- Guards: the boundary between reasoning (allowed) and inventing (forbidden). The
  right answer is a *partial* answer plus an honest gap.

### 2.9 Attachment limit with a stated size
**Ask:** `A customer tried to send us a 25 MB PDF and it failed. What happened and do we still have any record of it?`
- Must have: files over **20 MB** are rejected; PDF is a supported type; the **metadata is still stored**, including filename and rejection reason
- Must not have: a claim the file is recoverable; a claim nothing was recorded
- Guards: applying a numeric threshold to a specific value, plus a second fact
  most answers dropped.

### 2.10 Search precedence
**Ask:** `If I search a conversation ID and some message text matches other conversations better, what comes first?`
- Must have: an **exact conversation ID match takes priority** over text relevance
- Must not have: a claim results are purely relevance-ranked
- Guards: a precedence rule, not a fact lookup.
