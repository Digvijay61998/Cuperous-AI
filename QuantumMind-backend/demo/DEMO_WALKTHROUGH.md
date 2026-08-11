# Bot Workflow — Node Reference & Demo Flow

Companion to `demo-bot-flow.json`. Everything below was read off the running
implementation, not invented:

| Concern | Source |
| --- | --- |
| Node type list | `src/bots/enums/node-type.enum.ts` |
| Execution engine | `src/message-handler/message-handler.service.ts` |
| Node schema / payload shape | `src/bots/entities/bot-flow-node.entity.ts` |
| Graph persistence | `src/bots/bots.service.ts` (`createNodes`, `updateBotFlow`) |
| Session state | `src/socket/socket-state.service.ts` |
| Input validators | `src/message-handler/enums/user-input-validation.enums.ts` |
| Response content types | `src/conversation/enums/chat-type.enum.ts` |
| Builder node catalogue | `QuantumMind-ui/src/views/bots/bot-flow/dropdownList/nodeList.tsx` |

---

## 1. How the engine actually runs

**Two representations of the same graph.** The builder saves
`BotFlow { nodes[], edges[], startNode, customAttributes[] }` — that's the canvas.
`BotsService.createNodes()` then upserts every node into a separate
`BotFlowNode` collection and *flattens the edges into a `next[]` array per node*.
At runtime the engine only ever reads `BotFlowNode.next`. Edges are for drawing.

**One switch, one node per hop.** `handleMessage()` loads the visitor's
`currentNode` from in-memory socket state, then `handleNode()` switches on
`nodeType` and calls the matching handler. Handlers either

- **advance** — call `handleNode(child)` synchronously in the same turn, or
- **park** — leave `currentNode` on themselves and return, waiting for the next
  inbound message.

**Branching is by child node type, not by edge label.** There are no conditional
edges. A node with several children inspects `child.nodeType` and picks
`SUCCESS` / `FAILURE` / `TIMEOUT`. This is why those three exist as node types.

**Loop protection.** `MAX_NODE_HOPS = 30` traversals per inbound message
(`src/message-handler/constants.ts`). Exceeding it sends the fallback message and
resets to the start node. The demo's longest single-turn chain is 14 hops.

**Session state** (`SocketStateService`, an in-memory `Map` keyed by visitor id):

| Key | Purpose |
| --- | --- |
| `currentNode` | where this visitor is parked |
| `startNode` | for `start` / `reset` / `restart` and after `CLOSE_CHAT` |
| `defaultFallback` | resolved at `START_NODE` time as the child of type `FALL_BACK` |
| `attributes` | captured user data; also mirrored onto the conversation |
| `BotNodeState` | `NEW` / `AWAITING_USER_INPUT` / `VISITED` per node — drives menu branching |
| `questionNodeState` | `{ currentQuestion, lifespan }` per `QUESTIONS` node |
| `nodeHops` | hop budget for the current message |
| `handledByAgent` | while true, `jarcube.gateway` relays visitor messages to the agent and the bot stays silent |

**Global shortcuts**, handled before any node runs:

- `start` / `reset` / `restart` → welcome message, wipe `attributes`, `BotNodeState`,
  `questionNodeState`, jump to `startNode`.
- message `type === "goto"` (button payloads) → jump straight to the node id in
  the message body.
- `botSettings.blockedContent` → message dropped.

---

## 2. Node catalogue

21 values in `NodeTypeEnum`. Grouped by what they do.

### Entry & routing

**`START_NODE`** — the single entry point. Splits its children into the
`FALL_BACK` child (cached as `defaultFallback` for the whole session) and the
first non-fallback child, which it immediately traverses. If the incoming
message is more than one word and isn't a greeting, it tries the question bank
first. *Needs at least one non-`FALL_BACK` child or the flow stalls after the
welcome message.*

**`FALL_BACK`** — the catch-all. Tries the question bank; on a hit it answers and
stops. On a miss it logs the message as unanswered and walks to `next[0]` — which
is how you chain an AI node behind the fallback. With no children it emits
`botSettings.fallbackMessage`.

**`GO_TO_STEP`** — unconditional jump to `payload.blockId`. Clears `BotNodeState`
and `questionNodeState` on the way, so the target menu re-prompts cleanly.
Its own `next[]` is ignored. This is the "loop back to menu" primitive.

**`SUCCESS` / `FAILURE` / `TIMEOUT`** — routing markers, not logic. Their parent
picks one of them by `nodeType`; the marker then forwards to its own `next[0]`.
`TIMEOUT` is only ever selected by `OPEN_TEMPLATE`. A `SUCCESS` node with no
child stalls the conversation — always give it one.

### Talking & listening

**`BOT_RESPONSE`** — sends `responses[]`. Behaviour depends on child count:

- **1 child** → send, then auto-advance. *Exception:* if the child is
  `USER_INPUT` or `FILE_ATTACHMENT` it stops and waits (so a question and its
  capture are one turn, not two).
- **more than 1 child** → this is the **menu / branch point**. First visit:
  send `responses[]`, mark `AWAITING_USER_INPUT`, return. Next message: test it
  against each `USER_INPUT` child via `checkIfUserInputMatching`; first match
  wins, gets marked `VISITED`, and is traversed. No match → question bank →
  `defaultFallback`.
- **0 children** → send and set `currentNode = null`.

`responses[]` items use `ChatTypeEnum`: `text`, `image`, `video`, `audio`,
`file`, `buttons`, `quick_reply`, `goto`, `random_text`, `maps`, `gallery`.
Item shape: `{ type, value, values[], buttons[{title,value}], location{latitude,longitude}, info }`.
`random_text` picks one of `values[]` at send time. Messages within a turn are
staggered by `delay.message`, and nodes by `delay.node`.

**`USER_INPUT`** — captures and/or gates on the visitor's reply.
Payload: `alias` (attribute name to store into), `entity` (validator),
`secure` (emits `mask.chat` so the stored transcript is masked).
Matching is scored by `evaluateUserInput`, strongest wins:

1. `entity` set and not `engage.any` → run the validator; pass scores highest,
   fail means no match.
2. `keywords[]` and `utterance[]` → whole-word / whole-phrase containment, in
   either direction. Score rises with the length of the matched term, so a
   specific keyword beats a generic one.
3. `alias` present with nothing else matched → matches as a bare capture, but
   **only** when the node is evaluated on its own. Menu candidates are evaluated
   with this disabled so an aliased child cannot absorb every reply.

Capture is a separate step (`captureUserInput`) that runs only for the node that
won, so testing candidates no longer writes attributes or fires `mask.chat`.

Validators (`payload.entity`): `engage.email`, `engage.phone_number`,
`engage.number`, `engage.date`, `engage.alphanumeric`, `engage.any`,
`engage.country`, `engage.text`, `engage.yes_no`, `engage.yes`, `engage.no`.

**`QUESTIONS`** — a scripted multi-field form in one node. Each
`payload.elements[]` entry is `{ prompt, entity, alias, lifespan, actionOnFailure, secure }`.
Asks prompts in order, validates each answer, stores it under `alias`.
On a bad answer it re-asks up to `lifespan` times, then applies
`actionOnFailure`: `continue` (skip the field, move on) or `fallback` (route to
the `FAILURE` child). All fields valid → `SUCCESS` child.

**`FILE_ATTACHMENT`** — parks and stores the next inbound message under
`payload.alias`, then advances. Note it does **not** verify that a file was
actually sent; any message is accepted as the attachment.

### Data & side effects

**`SET_ATTRIBUTES`** — copies attributes: `payload.attributes = [{ set, to }]`
means `attributes[to] = attributes[set]`. Rename/normalise before a webhook or
ticket. No-op if the visitor has no attributes yet.

**`WEBHOOK`** — calls a registered webhook by `payload.webhookId`, posting
`{ attributes, event: payload.eventField, metadata }`. If the response body is an
array it is sent to the visitor as bot messages; `response.metadata` is merged
into session metadata. Then routes `SUCCESS` / `FAILURE`. A missing `webhookId`
routes to `FAILURE` (or the default fallback).

**`ADD_TO_SEGMENT`** / **`REMOVE_FROM_SEGMENT`** — add/remove the visitor from
`payload.segmentId`, then continue to `next[0]`. No branching.

**`TICKET`** — creates a service request with `payload.ticketSubject`, linked to
visitor + bot + conversation, then sends a **hardcoded** confirmation
(`"Service Request Raised Successfully. Please note down the ticket : #<id>..."`)
and continues. The editor exposes a priority list but the handler doesn't read it.

### Intelligence

**`AI_NODE`** / **`AI_RESPONSE`** — the same handler; two names for the same
thing. Sends the message plus the last 6 conversation turns to the JarCube AI
(RAG) service and answers grounded in ingested knowledge.
Payload: `clientId` (knowledge-base tenant — several bots can share one),
`companyName`. Routing: confident answer → `SUCCESS` child, else the first
non-marker child, else stop; not confident or service error → `FAILURE` child,
else one terminal fallback message and a reset to `startNode`.
With **no** `SUCCESS`/other child it stays parked on itself, so it keeps
answering every following message — that's the "open Q&A mode" configuration.

**`FAQ`** — **no case in the executor's switch.** It falls through to `default`,
which is `defaultFallback()`. Net effect: answer from the question bank if there's
a hit, otherwise log the message as unanswered and continue to `next[0]`. Usable,
but it is not a distinct feature — treat it as a question-bank lookup step.

### Handoff & exit

**`TRANSFER_TO_AGENT`** — asks `AgentService.assignAgent(botId)`.
No agent → tells the visitor and routes `FAILURE`. Agent found → transfers the
conversation, sets `handledByAgent` + `assignedAgentId`, greets as the agent, and
parks `currentNode` on the `SUCCESS` node. The bot goes quiet; the gateway relays
messages to the agent. When the agent closes, `endConversationByAgent` resumes
the flow from `SUCCESS.next[0]` — so **give the `SUCCESS` node a child** or the
visitor is stranded.

**`OPEN_TEMPLATE`** — launches a hosted mini-app (form, payment, KYC) instead of
collecting it in chat. Creates a correlation session, resolves
`variableMappings[{templateKey, source:'attribute'|'static', value}]` into
pre-fill values, and sends a CTA button through whichever provider owns the
channel (`cta_url` when supported, otherwise a plain link). Then it **pauses** —
resumption is event-driven, not message-driven:

| Event | Meaning | Route |
| --- | --- | --- |
| `template.submitted` | completed; submitted data merged into `attributes` | `SUCCESS` |
| `template.abandoned` | opened, never finished | `TIMEOUT` |
| `template.expired` | link never opened | `FAILURE` |

Payload also carries `buttonText`, `buttonIcon`, `callbackEvent`,
`timeoutMinutes`, `sessionExpiryMinutes`, `analyticsEnabled`. It can rehydrate
socket state after a restart, so the resume survives a redeploy.

**`CLOSE_CHAT`** — wipes `attributes` / `BotNodeState` / `questionNodeState`,
points `currentNode` back at `startNode`, optionally fires the feedback prompt
(`botSettings.askForFeedback`), sends `botSettings.thankyoumsg` plus
`To start again type "start"`, and emits `end.conversation` — which **deletes the
socket state entry**. Terminal.

---

## 3. The demo flow

`demo-bot-flow.json` — 55 nodes, 61 edges, all 21 node types, validated for:
edge resolution, unique ids, reachability from `START_NODE`, required
`SUCCESS`/`FAILURE`/`TIMEOUT` children, valid entity + response types, resolvable
`GO_TO_STEP` targets, and a worst-case 14-hop turn (limit 30).

```
START ─┬─ Main Menu (BOT_RESPONSE, 6 USER_INPUT children)
       │    ├─ "sales"    → QUESTIONS ─SUCCESS→ ADD_TO_SEGMENT → WEBHOOK ─SUCCESS→ BOT_RESPONSE → CLOSE_CHAT
       │    │                    │                                  └FAILURE→ BOT_RESPONSE → GO_TO_STEP(menu)
       │    │                    └FAILURE→ BOT_RESPONSE → GO_TO_STEP(menu)
       │    ├─ "support"  → BOT_RESPONSE → USER_INPUT → BOT_RESPONSE → FILE_ATTACHMENT
       │    │                → SET_ATTRIBUTES → TICKET → BOT_RESPONSE → TRANSFER_TO_AGENT
       │    │                     ├─SUCCESS→ BOT_RESPONSE → CLOSE_CHAT   (after agent ends)
       │    │                     └─FAILURE→ BOT_RESPONSE → CLOSE_CHAT
       │    ├─ "billing"  → OPEN_TEMPLATE ─SUCCESS→ BOT_RESPONSE → REMOVE_FROM_SEGMENT → CLOSE_CHAT
       │    │                             ├─TIMEOUT→ BOT_RESPONSE → GO_TO_STEP(menu)
       │    │                             └─FAILURE→ BOT_RESPONSE → GO_TO_STEP(menu)
       │    ├─ "faq"      → FAQ → BOT_RESPONSE → GO_TO_STEP(menu)
       │    ├─ "ask ai"   → AI_NODE ─SUCCESS→ BOT_RESPONSE → GO_TO_STEP(menu)
       │    │                       └FAILURE→ BOT_RESPONSE → TRANSFER_TO_AGENT (reused)
       │    └─ "exit"     → CLOSE_CHAT
       └─ FALL_BACK → AI_RESPONSE (parks, open Q&A) ─FAILURE→ BOT_RESPONSE → GO_TO_STEP(menu)
```

### Loading it

```bash
curl -X PATCH "$API/bots/$BOT_ID/flow" \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  --data-binary @demo/demo-bot-flow.json
```

Before loading:

- Replace every `REPLACE_ME_*` placeholder (segment ids, webhook id, template id,
  AI `clientId`). Left as-is, those nodes take their failure route — which still
  demos the failure branches, just not the happy paths.
- `BotFlowNode.id` is **globally unique across all bots**, and the demo uses fixed
  `demo_*` ids. Load it into **one** bot only.
- `updateBotFlow` doesn't stamp `botId` onto nodes it creates, so the node editor
  will show an empty custom-attribute list for them. Traversal is unaffected.
- `_README` and `_*` keys are ignored by Mongo; strip them if your client is strict.

---

## 4. Demo dialogue

Five scenes. `CLOSE_CHAT` ends the session, so each scene is a fresh conversation.
Node paths are annotated so you can follow along in the builder.

### Scene 1 — Sales lead: `QUESTIONS` → `ADD_TO_SEGMENT` → `WEBHOOK` → `CLOSE_CHAT`

Shows: validation retries, `lifespan`, `secure` masking, attribute capture,
segment tagging, webhook side effect, multiple response content types.

> On connect the gateway auto-sends `start`, so `START_NODE` → menu runs before
> the visitor types anything.

| | |
| --- | --- |
| **Bot** | Welcome to JarCube! *(`botSettings.welcomeMessages`)* |
| **Bot** | Hi! I'm Nova, the JarCube demo assistant. |
| **Bot** | What would you like to do today? *(`random_text` — one of three)* |
| **Bot** | 1. Sales / new plan … 6. Exit *(`buttons`)* |

`demo_start` → `demo_menu` parks as `AWAITING_USER_INPUT`.

| | |
| --- | --- |
| **User** | sales |
| **Bot** | Great — let's get you a quote. What's your full name? |

Menu matched `demo_in_sales` (keyword `sales`) → `demo_q_lead` asks element 0.

| | |
| --- | --- |
| **User** | Digvijay Sharma |
| **Bot** | Thanks! What's the best email to send the quote to? |

`engage.text` passes, `lead_name` stored, `currentQuestion → 1`.

| | |
| --- | --- |
| **User** | digvijay@example |
| **Bot** | Thanks! What's the best email to send the quote to? |

`engage.email` fails. `lifespan: 2` so it re-asks instead of giving up
(attempt 1 of 2). A second failure would hit `actionOnFailure: "fallback"` →
`demo_q_fail` (`FAILURE`) → apology → `GO_TO_STEP` back to the menu.

| | |
| --- | --- |
| **User** | digvijay@example.com |
| **Bot** | Almost done — your 10-digit mobile number? |
| **User** | 9876543210 |
| **Bot** | Which city should we serve you from? |

That element has `secure: true`, so `mask.chat` fires and the number is masked in
the stored transcript.

| | |
| --- | --- |
| **User** | Pune |
| **Bot** | Reference #QM-2026-0142 logged with the sales desk. *(returned by the webhook)* |
| **Bot** | You're all set. A plan specialist will call you within 30 minutes. |
| **Bot** | *(image: plan comparison sheet)* |
| **Bot** | Here's the plan sheet in the meantime. |
| **Bot** | Thank you for contacting us. *(`botSettings.thankyoumsg`)* |
| **Bot** | To start again type "start" |

Last field validated, so one turn traverses 7 nodes:
`QUESTIONS` → `SUCCESS` → `ADD_TO_SEGMENT` (visitor tagged *Sales Leads*) →
`WEBHOOK` (posts all four attributes to the CRM; its array response body became
that first message) → `SUCCESS` → `BOT_RESPONSE` → `CLOSE_CHAT`.
If the CRM were down: `FAILURE` → "I couldn't file that just now…" →
`GO_TO_STEP` → menu, with the lead still tagged in the segment.

### Scene 2 — Support: `USER_INPUT` → `FILE_ATTACHMENT` → `SET_ATTRIBUTES` → `TICKET` → `TRANSFER_TO_AGENT`

| | |
| --- | --- |
| **User** | my internet is not working |
| **Bot** | Sorry about that. Describe the issue in a line or two and I'll log it. |

Keyword `not working` matched `demo_in_support`. `demo_r_support_ask` has exactly
one child and it's a `USER_INPUT`, so the bot sends and waits in the same turn.

| | |
| --- | --- |
| **User** | no signal since morning on my 5g router |
| **Bot** | Got it. Attach a photo or screenshot if you have one — or type 'skip'. |

`demo_in_issue` has `entity: engage.any` + `alias`, so it accepts anything and
stores `issue_description`. Next child is `FILE_ATTACHMENT` → park.

| | |
| --- | --- |
| **User** | *(uploads router-leds.jpg)* |
| **Bot** | Service Request Raised Successfully. Please note down the ticket : #SR-4417 for future reference. |
| **Bot** | I've logged that. Connecting you to a human engineer now. |
| **Bot** | Welcome to JarCube Demo Bot. I am Priya, How may I assist you? |

Five nodes in one turn: `FILE_ATTACHMENT` (stores `issue_attachment`) →
`SET_ATTRIBUTES` (copies to `ticket_summary` / `ticket_evidence`) → `TICKET`
(hardcoded confirmation) → `BOT_RESPONSE` → `TRANSFER_TO_AGENT`.

| | |
| --- | --- |
| **User** | thanks, when will someone come? |
| **Agent** | I've booked a technician for tomorrow 10am. |

`handledByAgent` is true — the gateway relays to Priya, the bot never sees these.

| | |
| --- | --- |
| **Bot** | Thanks for chatting with our engineer. Anything else I can note before we wrap up? |
| **Bot** | Thank you for contacting us. / To start again type "start" |

Priya closes the chat → `endConversationByAgent` resumes from the parked
`SUCCESS` node's child → `BOT_RESPONSE` → `CLOSE_CHAT`.

**No-agent variant:** "No agent is available at the moment…" → `FAILURE` →
"All engineers are busy, but your service request is already in the queue." →
`CLOSE_CHAT`. The ticket still exists.

### Scene 3 — Billing: `OPEN_TEMPLATE` with all three outcomes

| | |
| --- | --- |
| **User** | i want to pay my bill |
| **Bot** | Payments happen on a secure page, not in chat. Tap below — it's pre-filled with your details. |
| **Bot** | **[ Open billing form ]** → `https://…/t/tsess_9f2a…` |

`demo_tpl_kyc` created a template session, mapped `lead_name` / `lead_email` from
attributes plus a static `product`, sent a `cta_url` (or a plain link on channels
without CTA support), and **paused**. The next chat message will not advance it.

**(a) submitted** — `template.submitted` merges the form data into `attributes`
and resumes at `SUCCESS`:

| | |
| --- | --- |
| **Bot** | Payment received. The receipt is on its way to your email. |
| **Bot** | *(file: receipt-sample.pdf)* |
| **Bot** | Thank you for contacting us. |

`SUCCESS` → `BOT_RESPONSE` → `REMOVE_FROM_SEGMENT` (drops *Pending Dues*) → `CLOSE_CHAT`.

**(b) opened, abandoned** — `template.abandoned` → `TIMEOUT`:

| | |
| --- | --- |
| **Bot** | Looks like the form is still half-filled. The link stays live for 30 minutes if you want to finish. |
| **Bot** | *(menu re-printed)* |

**(c) never opened** — `template.expired` → `FAILURE`:

| | |
| --- | --- |
| **Bot** | That payment link expired. I can generate a fresh one whenever you're ready. |
| **Bot** | *(menu re-printed)* |

### Scene 4 — FAQ and Ask-AI: `FAQ`, `AI_NODE`, `GO_TO_STEP`

| | |
| --- | --- |
| **User** | faq |
| **Bot** | Top questions: • Installation takes 48 hours • Billing cycle starts on activation day • You can pause service for up to 60 days |
| **Bot** | *(map card: Nearest experience centre — Baner, Pune)* |
| **Bot** | *(menu re-printed)* |

`demo_faq` has no executor case, so it runs the default fallback: question bank
miss → logged as unanswered → continue to `next[0]`. Then `GO_TO_STEP` clears
node state and re-enters the menu, all in one turn.

| | |
| --- | --- |
| **User** | ask ai |
| **Bot** | *(AI answer grounded in the ingested knowledge base)* |
| **Bot** | Hope that helped. |
| **Bot** | *(menu re-printed)* |

Wait — `demo_in_ai` routes straight into `AI_NODE`, and the message that reaches
it is `"ask ai"`. In practice pair this with a `BOT_RESPONSE` + `USER_INPUT` if
you want to prompt for the actual question first; as wired, the AI answers the
routing phrase and then returns to the menu, which is the shortest way to show
the `SUCCESS` path.

**Not confident:** `FAILURE` → "That one is outside what I've been trained on.
Let me get a human." → reuses the same `TRANSFER_TO_AGENT` node as Scene 2.

### Scene 5 — Free text: `FALL_BACK` → `AI_RESPONSE` open Q&A

| | |
| --- | --- |
| **User** | do you support esim on the 5g plan? |
| **Bot** | Yes — eSIM is supported on all 5G plans. You can activate it from the app under *Manage SIM*; activation takes about 10 minutes. |

No menu keyword matched → question bank miss → `defaultFallback` (cached at
`START_NODE`) → `FALL_BACK` → question bank miss again → `AI_RESPONSE`.

| | |
| --- | --- |
| **User** | and can i keep my old number? |
| **Bot** | Yes, port-in is free and usually completes in 3 working days. |

`demo_ai_fallback` has no `SUCCESS` or plain child, so it stays parked on itself
and keeps answering — open Q&A mode without any extra nodes.

| | |
| --- | --- |
| **User** | what's the wifi password at your Bangkok office |
| **Bot** | I couldn't find that in our knowledge base. Here's what I can definitely help with: |
| **Bot** | *(menu re-printed)* |

Not confident → `FAILURE` → apology → `GO_TO_STEP` → menu.

| | |
| --- | --- |
| **User** | exit |
| **Bot** | Thank you for contacting us. / To start again type "start" |

`demo_in_bye` also carries `utterance: ["that is all thanks", …]`, so
"that is all" matches as a fragment of the example, and "ok that is all thanks
for now" matches because it contains the example. Reordered wording does not
match — utterances are phrase examples, not a bag of words.

---

## 5. Things worth knowing before you build on this

Behaviours in the current implementation that will bite flow designers:

1. ~~**`QUESTIONS` overwrites `attributes` instead of merging.**~~ **Fixed.**
   `handleQuestion` called `updateUserData(userId, { attributes: { [alias]: message } })`
   with no spread, and `updateUserData` is only a shallow top-level merge, so each
   answer wiped the previous ones — Scene 1 reached the CRM webhook with one field
   instead of four. It now spreads the existing attributes first, matching every
   other handler.
2. ~~**`alias` on a branch child swallows the whole menu.**~~ **Fixed.** Matching
   and capture are now separate, and menu candidates are evaluated with the
   bare-alias match disabled. Keeping aliases on single-child capture nodes is
   still the clearer design, but it is no longer load-bearing.
3. ~~**Inbound messages are lowercased before capture.**~~ **Fixed.** The working
   copy is still lowercased so matching stays case-insensitive, but the original
   is kept on session state and used for attribute capture, so `lead_name` stores
   `Digvijay Sharma`.
4. ~~**Short numeric keywords match by substring.**~~ **Fixed.** Matching now
   requires whole-word boundaries, and the branch with the longest matched term
   wins instead of the first edge. Keyword `"1"` no longer matches `"100mbps"`,
   and `"bill"` beats `"1"` on "i have 1 question about my bill".
5. ~~**The first `QUESTIONS` field skipped its retries.**~~ **Fixed.** The state
   written when the first prompt went out omitted `lifespan`, so the retry test
   `lifespan + 1 < attempt` evaluated `undefined + 1` → `NaN` → always false. The
   first field applied `actionOnFailure` on the very first invalid answer while
   every later field honoured `lifespan`. Also, a field with no retry budget used
   to re-ask *and* immediately move on in the same turn; it now just re-asks.
6. **Validators actually reject things now** — worth re-testing existing flows.
   `engage.text` was `isString`, true for everything including `""`.
   `engage.phone_number` was `!isNaN`, which rejected `+91 98765 43210` and
   accepted `5` and `""`. `engage.date` accepted a bare `1` (year 2001) and
   rejected day-first `15/01/2026`. `engage.country` had no case at all and
   accepted anything. `engage.yes_no` was an exact `["yes","no"]` match, so
   `y`, `yeah` and `nope` all failed. All tightened, and yes/no now accepts the
   common spellings.
7. **No `{{variable}}` interpolation anywhere.** Nothing in the backend
   substitutes attributes into response text. Captured values only reach the
   outside world through webhook payloads and template `variableMappings`. Any
   personalised sentence has to come back from a webhook response or the AI node.
8. **`FAQ` isn't wired.** No switch case; it behaves as a question-bank lookup via
   the default fallback. `TIMEOUT` is only reachable from `OPEN_TEMPLATE`.
9. **A `SUCCESS` node without a child stalls the visitor** —
   `getBotNode(undefined)` returns undefined and the turn dies. Especially
   important for `TRANSFER_TO_AGENT`, whose `SUCCESS` child is the resume point
   after the agent hangs up.
10. **Node ids are globally unique**, not scoped per bot. Two bots cannot share a
    node id, so fixed-id flow exports like this one aren't reusable as templates
    without an id-rewrite pass.
11. **`TICKET` and the transfer greeting emit hardcoded English strings** that
    aren't part of `responses[]`, so they bypass bot settings and localisation.
12. **Session state is in-process memory.** A restart loses `currentNode` and
    `attributes` for every live conversation. `OPEN_TEMPLATE` is the only node
    that rehydrates (`rehydrateForResume`); everything else silently drops.

Typo tolerance is deliberately **not** addressed. `suport` still won't match
`support`; it falls through to the fallback branch, which in the demo is the AI
node. That needs fuzzy or semantic matching, which is a feature, not a bug fix.
