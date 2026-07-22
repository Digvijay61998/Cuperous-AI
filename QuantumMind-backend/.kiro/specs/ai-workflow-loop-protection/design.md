# Design: AI Workflow Loop Protection & Crash Hardening

## Overview

The bot workflow engine (`MessageHandlerService`) can enter an unbounded
recursive loop and then crash the whole Node process. This spec designs a
resilient fix so that:

1. A cyclic bot flow can never run away (bounded traversal per user message).
2. Missing/cleared conversation state can never crash the process
   (defensive guards).
3. Operators get a clear log when a loop is detected and truncated.

This is a reliability/hardening fix in the NestJS backend only. No AI-service or
frontend changes are required.

## Root Cause Analysis

Observed in production logs (2026-07-20):

- The user's flow routes `AI_NODE → (fallback) → … → AI_NODE`, a **cycle**.
- The AI service returns `confident: false` (retrieval scores 0.10–0.14, below
  the 0.15 threshold, because no matching knowledge is ingested).
- `handleAiResponse` (no `FAILURE` child on the node) calls `defaultFallback`,
  which advances to `node.next[0]` and calls `handleNode` again. The chain
  loops back into the AI node → **infinite recursion**.
- The stack trace shows `handleNode → handleNode → …` re-entering repeatedly.
- Eventually `SocketStateService.getUserData(userId)` returns `undefined`
  (conversation ended / socket state evicted mid-loop). `saveUnansweredMessage`
  destructures `const { botId } = getUserData(userId)` **without a guard** →
  `TypeError: Cannot destructure property 'botId' of undefined` → process crash.

Two independent defects:

| # | Defect | Effect |
|---|--------|--------|
| 1 | No bound on node traversal per message | Cyclic flow loops forever; floods AI service + OpenAI (cost) |
| 2 | Unguarded `getUserData()` destructures | A single `undefined` read crashes the entire backend |

## Goals

- Guarantee every inbound user message performs a **bounded** number of node
  hops, regardless of flow topology.
- Ensure the engine **degrades gracefully** (log + stop) instead of crashing
  when conversation state is missing.
- Keep the change **localized** to `MessageHandlerService` (+ a small constant),
  with no behavior change for normal, acyclic flows.

## Non-Goals

- Detecting/validating cycles at flow-design/save time (future work).
- Changing the confidence threshold or AI retrieval behavior.
- Frontend flow-editor changes.

## Design

### 1. Bounded traversal (hop budget)

`handleNode` is the single recursive dispatch point for every node type, so it
is the correct chokepoint to meter traversal.

Approach: a **per-message hop counter** stored on the user's `SocketState`.

- Add `nodeHops?: number` to the `SocketState` interface.
- **Reset** `nodeHops = 0` at the start of `handleMessage` (each inbound user
  message gets a fresh budget) and on `start`/`reset`/`restart`.
- **Increment + check** at the top of `handleNode`: before dispatching, bump the
  counter; if it exceeds `MAX_NODE_HOPS`, **abort** the run (see below) and
  return without recursing further.
- Add a constant `MAX_NODE_HOPS = 50` in `message-handler/constants.ts`. 50 is
  far above any legitimate linear flow depth but stops runaway loops fast.

Why a state counter rather than a threaded parameter: `handleNode` is invoked
from ~20 call sites recursively; threading a `depth` argument through all of
them is invasive and easy to get wrong. A counter reset per message on the
existing `SocketState` map is minimal and central. Concurrent messages for the
same visitor share the budget — acceptable for a safety valve (worst case it
truncates slightly earlier; the loops are the real problem).

#### Abort behavior
When the budget is exceeded:
- Log an ERROR banner `[WORKFLOW LOOP DETECTED]` with `userId`,
  `conversationId`, last `nodeId`/`nodeType`, and the hop count (uses the
  existing `ai-logger` banner helper for consistency).
- Send the visitor one graceful message
  (`botSettings?.fallbackMessage` or a default "Something went wrong, please try
  again.").
- Clear `currentNode` (set to `null`) so the next message starts clean.
- `return` — do not recurse.

```
handleNode(currentNode, message, userId, language):
    userdata = getUserData(userId); if (!userdata) return
    hops = (userdata.nodeHops ?? 0) + 1
    updateUserData(userId, { nodeHops: hops })
    if (hops > MAX_NODE_HOPS):
        banner ERROR "[WORKFLOW LOOP DETECTED]" {...}
        sendBotMessage(fallback)
        updateUserData(userId, { currentNode: null })
        return
    ... existing switch ...
```

### 2. Defensive state guards

Any code that destructures `getUserData(userId)` must tolerate `undefined`
(state can be evicted at any time by disconnect / `end.conversation`).

- `saveUnansweredMessage` (line ~1685): early-return if `getUserData` is
  falsy; otherwise read `botId` safely.
- `defaultFallback` (line ~773): use optional chaining on the
  `getUserData(userId)?.botSettings?.fallbackMessage` read (already partially
  guarded elsewhere; make it consistent).
- Audit and guard the other direct `const { … } = getUserData()` destructures in
  the file (e.g. the `start`/`reset` branch in `handleMessage`) with the same
  `if (!userData) return;` pattern.

### 3. Flow-design guidance (documentation only)

The AI node should have a terminating `FAILURE` child (e.g. a `BOT_RESPONSE`
"I'll connect you to a human" or `TRANSFER_TO_AGENT`) so the not-confident path
ends instead of cycling. This is guidance for the user, enforced defensively by
(1) regardless.

## Affected Files

| File | Change |
|------|--------|
| `src/socket/socket-state.service.ts` | Add `nodeHops?: number` to `SocketState` |
| `src/message-handler/constants.ts` | Add `MAX_NODE_HOPS = 50` |
| `src/message-handler/message-handler.service.ts` | Reset hops in `handleMessage`; increment/check + abort in `handleNode`; guard `saveUnansweredMessage`, `defaultFallback`, and other `getUserData` destructures |

## Error Handling

- Loop truncation: ERROR-level banner + one visitor-facing fallback message; no
  throw.
- Missing state: silent early-return (matches existing `if (!userdata) return`
  convention in `handleNode`); never throw from a state read.

## Testing Strategy

- **Unit (Jest, mocked `SocketStateService`)**:
  - A flow where node A → B → A loops: assert `handleNode` stops after
    `MAX_NODE_HOPS` hops, sends exactly one fallback message, sets
    `currentNode = null`, and does not throw.
  - `saveUnansweredMessage` with `getUserData` returning `undefined`: assert it
    returns without throwing.
  - A normal linear flow (< 50 nodes): assert it completes unchanged (no
    regression, no premature truncation).
- **Build**: `npx nest build` must pass.
- **Manual**: reproduce the reported scenario (AI node with no data + cyclic
  fallback), confirm the loop truncates within one budget and the process stays
  up.

## Rollout / Risk

- Low risk: new logic only triggers past 50 hops (unreachable for normal flows)
  or when state is already missing (previously a crash).
- No API, schema, or migration changes.
- Fully backward compatible; `nodeHops` is optional and defaults to 0.
