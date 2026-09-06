# WhatsApp Web + Omnichannel Inbox — Architecture & Progress

> **Purpose:** single source of truth so work survives session loss. Tick a phase here
> **before** moving on. Re-read this first in any new session.

**Repos**
- `QuantumMind-backend` — NestJS API (Mongo/Mongoose, EventEmitter2, socket.io, Redis propagate).
- `QuantumMind-ui` — Next.js + MUI dashboard (Redux Toolkit).
- `OpenWA` — reference gateway we cherry-pick from (NOT cloned). Reference docs in `docs/OpenWA/`.

---

## 1. Goal

A WhatsApp number linked by QR behaves like a real support channel:
- every message (inbound + outbound) lands in **conversation history**,
- the agent **sees the client's thread** in the Conversations section,
- the agent can **reply from the dashboard**, and the customer receives it,
- a **bot** can be attached to the number and answer automatically, handing over to a human,
- the inbox is **tabbed per channel** (WhatsApp / Instagram / Telegram / Facebook / Widget).

---

## 2. Verified current state (checked against the running system, 2026-09-05)

### Live facts
| Check | Result |
| --- | --- |
| Session linked? | **Yes.** `data/whatsapp-web/jarcube-web/` holds `creds.json` with `me.id = 917558…87:2@s.whatsapp.net`, name `JarCube`, a `@lid`, 87 pre-keys, app-state-sync files |
| Engine live? | **Yes.** `GET /api/whatsapp-web/sessions` → `status: ready`, `engineLoaded: true`, `liveStatus: ready`, `phone: 917558510587` |
| Bot attached? | **Yes.** `jarcubeBot: Jarcube` on the session; Social row `whatsapp_web/jarcube-web` is `published`, `sessionStatus: ready` |
| Messages received into our data model? | **NO. Zero.** `GET /api/visitor` → 0, `GET /api/conversation` → 0, `GET /api/conversation/active-conversations` → 0 |

**Conclusion: the scanner/pairing half is done and working. The message half has never run
end-to-end even once.** Nothing is listed anywhere because nothing was ever persisted.

### What exists in code
- `src/whatsapp-web/engine/baileys-engine.service.ts` — leaf engine. QR, pairing code, reconnect
  backoff, stop/logout/forceKill, `sendText`/`sendImage`. Subscribes **only** `creds.update`,
  `connection.update`, `messages.upsert`.
- `whatsapp-web.service.ts` — session CRUD + Social row + auto-restart on bootstrap.
- `whatsapp-web-inbound.service.ts` — event hub: status → DB; inbound → `initializeChat` +
  `messageHandlerService.handleMessage`; `WA_WEB_SEND_EVENT` → `engine.sendText/sendImage`.
- `whatsapp-web.controller.ts` — `/whatsapp-web/sessions` (+ start/stop/logout/force-kill/qr/pairing-code).
- Platform plumbing: `PlatformEnum.WHATSAPP_WEB`, `SocialPlatformEnum.WHATSAPP_WEB`, `platform`
  stored on `Visitor` and `Conversation`, `RedisPropagatorService` already routes
  `WHATSAPP_WEB → send-whatsapp-web-message`.
- UI: `store/apps/whatsapp-web/`, `WhatsappWebActions/Connect/QrModal`, `returnPlatformIcon`
  already maps `whatsapp_web`.

### Existing message pipeline (what we must plug into)
```
visitor msg ──> JarCubeGateway "events" ──> MessageHandlerService.handleMessage
                                              │
                                              ├─ emit "create.new.chat"  ──> ConversationService.createChat
                                              │     (chatModel.create + pushChatToConversation)
                                              └─ handleNode(...) ──> sendBotMessage
                                                      ├─ emit "create.new.chat" (per bot reply)
                                                      └─ redisPropagator.propagateEvent({platform})
                                                            └─ consumeSendEvent switches on platform
                                                                  └─ "send-whatsapp-web-message" ──> engine.sendText
```
- Agent takeover: `TransferToAgent` → `agentService.assignAgent` →
  `transferConversationToAgent` sets `agent`, `type = REALTIME`, `transferredToAgent = true`;
  socket state gets `handledByAgent: true, assignedAgentId`.
- Agent → visitor: UI `SendMsgForm` emits `chat-message-from-agent` → gateway →
  `emitEventToUser(to, "chat-message-bot", …, platform)` → persists + propagates.
- Inbox query: `ConversationService.getActiveConversations` matches
  `status: IN_PROGRESS, type: REALTIME, agent: <me>`.

---

## 3. Gap analysis (this is the actual work)

### A. Inbound loses messages (engine)
`handleInboundMessages` in `baileys-engine.service.ts`:
- `if (msg.key?.fromMe) continue` → **messages you send from your own phone never appear** in the
  dashboard thread.
- `if (!jid.endsWith('@s.whatsapp.net')) continue` → **drops `@lid` senders**. WhatsApp now
  addresses many chats by LID, so real customer messages can be silently discarded.
- `if (!text) continue` → **drops all media-only messages** (image/doc/audio/sticker with no caption).
- Only `messages.upsert` is subscribed → **no `messages.update`**, so there are no delivery/read
  receipts (no double ticks) at all.
- No `messaging-history.set` → **no history backfill**; old threads will always be empty.

### B. Reply address is ephemeral (critical)
The only thing that knows how to reply is `ctx = { whatsappWeb: { sessionName, jid, recipient } }`,
stored in `SocketStateService`'s **in-memory Map**, which is:
- evicted after `idleTtlMs` (default **2 h**) of inactivity,
- evicted by LRU past `maxEntries` (20 000),
- **lost entirely on restart**.

So after a restart or 2 h of quiet, the agent **cannot reply to a WhatsApp customer at all**. For a
support inbox this is disqualifying. The reply address must be persisted.

### C. No message identity / status model
`Chat` entity has only `message, sender, conversationId, type, time, chatId, secured`. There is:
- no `waMessageId` → no dedup, no ack targeting, no reply-quoting,
- no `direction`, no `status` → no sent/delivered/read ticks,
- no media fields,
- no unique index → engine re-fires would double-insert.

### D. The inbox cannot show these chats
- `getActiveConversations` requires `type: REALTIME` **and** `agent = me`. WhatsApp Web
  conversations are created `type: BOT` with no agent → **invisible**.
- `getAllConversations` excludes `IN_PROGRESS` → active threads **also invisible**.
- Neither query projects `platform`, so the UI has no channel signal.
- No channel tabs / per-row platform icon in `views/apps/active-chat/SidebarLeft.tsx`.

### E. No way to send from the dashboard outside a live bot turn
There is **no outbound REST endpoint** for WhatsApp Web. Sending only works by riding the
socket-state `ctx` inside an active bot/agent turn. Also `JarCubeGateway.handleEvents` passes the
**agent's own** `platform` (from the agent's socket state) into `emitEventToUser`, not the target
visitor's — so an agent reply can be routed to the wrong transport.

### F. No mobile-app channel
No code found. Treated as a future channel.

---

## 4. Approach

**One canonical store, not two.** OpenWA's hardest problem is merging its DB with engine history
(`mergeChatMessages`, delivery-rank merge, media-payload rules). That problem exists because Baileys
gives them a second source. We have exactly **one** source (live baileys events), so we adopt
**persist-then-publish once**, with a unique index as the dedup oracle, and we never merge. This
skips the most expensive part of OpenWA wholesale.

**Extend the existing Conversation/Chat model rather than adding a parallel WhatsApp store.** That
keeps one history, one inbox, one socket path, and lets bot + agent + every channel share it.

**Introduce a durable `ChannelThread`** (the missing concept). It owns the channel identity and
reply address for a conversation, so replying never depends on in-memory state.

### What we copy from OpenWA (and what we skip)
| Take | Why |
| --- | --- |
| Persist-then-publish + unique `(session, waMessageId)` dedup | Engine re-fires are real |
| Forward-only status ladder, `failed` terminal | Out-of-order acks must not downgrade a tick |
| Baileys status ints `0=failed 1=pending 2=sent 3=delivered 4/5=read`, unknown → drop | Ambiguous upstream stays ambiguous |
| Per-item try/catch in event handlers | One bad message must not kill the event bridge |
| Timestamp-vs-`connectedAt` gate (not the `append` tag) for live-vs-history | Their documented "first message after reconnect is dropped" bug |
| Mark-as-read coalescing (trailing, ~750 ms) | Avoids a POST per message |
| `readMessages(keys)` needs stored message keys | Blue ticks need the real key, not a synthesized one |
| Skip | Dual-source merge, media base64 caching, virtualisation debate, engine-capability gating, LID-vs-`@c.us` dialect machinery beyond basic normalisation |

---

## 5. Phased plan

### Phase 0 — Audit & doc ✅
- [x] Trace engine → inbound → bot → outbound; confirm session live; confirm zero messages stored.
- [x] Read OpenWA's chat/ack/event model.
- [x] Write this document.

### Phase 1 — Foundation: durable threads + real message rows  ← NEXT
Goal: an inbound WhatsApp message is stored correctly and can always be replied to.
- [ ] **Fix inbound loss** in `baileys-engine.service.ts`: accept `@lid` (normalise to phone when
      known), stop dropping media-only messages (carry type + media), and emit `fromMe` messages as
      outgoing instead of dropping them.
- [ ] **New `ChannelThread`** (Mongoose): `{ channel, sessionName, chatId(jid), phone, pushName,
      bot, conversation, visitor, lastMessageAt, unreadCount }`, unique on `(channel, sessionName,
      chatId)`. This is the durable reply address.
- [ ] **Extend `Chat`**: `waMessageId`, `direction` (`inbound`/`outbound`), `status`
      (`pending|sent|delivered|read|failed`), `mediaUrl`, `mimetype`, `quotedMessageId`.
      Unique sparse index on `(conversationId, waMessageId)`.
- [ ] Rewrite `whatsapp-web-inbound.service.ts` to upsert the thread, persist the message, **then**
      hand off to the bot — persist-then-publish, per-message try/catch.
- [ ] **Verify with a real message** end-to-end (this has never happened). Send a WhatsApp message to
      917558510587 and confirm a `ChannelThread`, `Conversation`, `Visitor` and `Chat` row appear.

### Phase 2 — See the chats: unified inbox + channel tabs
- [ ] New `GET /conversation/inbox?channel=&scope=` returning threads for **bot-handled and
      agent-handled** conversations, projecting `platform`, last message, unread count.
      (Do not break the existing `active-conversations` consumers.)
- [ ] UI: channel tab strip above the chat list in `active-chat/SidebarLeft.tsx` — All + one per
      channel present, `returnPlatformIcon`, unread badge per tab; filter the list on the tab.
- [ ] UI: platform icon on each chat row.
- [ ] Thread view loads full history from `Chat` (paged, newest-first).

### Phase 3 — Chat from the dashboard + bot/agent handover
- [ ] `POST /whatsapp-web/sessions/:id/messages` (text + media) that resolves the recipient from the
      **ChannelThread**, not socket state. Persists `pending` → sends → records `waMessageId` + `sent`.
- [ ] Route agent replies through the thread: fix `JarCubeGateway` passing the agent's `platform`;
      resolve the target visitor's channel from the thread instead.
- [ ] Bot pause/resume: taking a thread over sets `handledByAgent` (bot stops answering); releasing
      it resumes the bot. Make this explicit and durable, not socket-state-only.
- [ ] UI: composer enabled for WhatsApp threads; optimistic bubble reconciled by `waMessageId`
      (fold the placeholder into the echo, don't drop it).

### Phase 4 — Double ticks: delivery + read receipts
- [ ] Subscribe `messages.update` in the engine → map status ints → emit an ack event.
- [ ] Forward-only `Chat.status` update (guarded by allowed prior states), one-shot retry ~750 ms
      for the ack-beats-insert race.
- [ ] Push ack to the dashboard over socket; render ✓ / ✓✓ / blue ✓✓ / failed in `ChatLog`.
- [ ] Mark-as-read outbound: opening a thread calls `sock.readMessages(keys)` (coalesced) so the
      customer sees blue ticks. Requires storing message keys.
- [ ] Persist stored baileys keys (small collection) to survive restart, as OpenWA does.

### Phase 5 — History backfill + media
- [ ] Subscribe `messaging-history.set` → persist backfill only (**never** re-dispatch to the bot,
      or old messages would trigger bot replies).
- [ ] Inbound media: download with size cap + timeout, store (S3/local via existing `/file`), keep
      an `omitted` marker when over cap.
- [ ] Outbound media/document/audio send.
- [ ] Contacts / profile pictures (batched, cached) — optional.

### Phase 6 — Other channels + mobile
- [ ] Telegram / Facebook / Instagram onto the same `ChannelThread` + tabs.
- [ ] Mobile-app channel as a new `PlatformEnum` + inbound hub mirroring this pattern.

---

## 6. Risks / decisions needed
1. **Bot vs agent visibility.** Should the WhatsApp tab show bot-only threads too? (Assumed **yes** —
   that is the point of an inbox.) This drives the Phase 2 query.
2. **Conversation lifecycle vs permanent thread.** A `Conversation` expires (2 h cron →
   `EXPIRED`); a WhatsApp thread is permanent. `ChannelThread` is long-lived and may span several
   conversations — the inbox lists **threads**, history is stitched from their conversations.
3. **Ban risk.** Baileys is an unofficial client; aggressive history sync / bulk sends raise risk.
   Keep `syncFullHistory` off by default.
4. **Auth.** `/whatsapp-web/*` and the social controllers are `@Public()`. A send endpoint must NOT
   ship public — it can send messages as the linked business number. Tighten in Phase 3.
5. **Security finding (act on this):** `QuantumMind-backend/.env` contains a commented-out line with
   a **live-looking MongoDB Atlas username/password**. `MONGO_URI` is not otherwise set, so the app
   falls back to `mongodb://localhost:27017/engage`. Rotate that credential and remove the line.

## 7. File index
- Engine: `src/whatsapp-web/engine/baileys-engine.service.ts`
- Inbound hub: `src/whatsapp-web/whatsapp-web-inbound.service.ts`
- Session svc/controller: `src/whatsapp-web/whatsapp-web.{service,controller}.ts`
- Bot runtime: `src/message-handler/message-handler.service.ts` (`handleMessage`, `sendBotMessage`,
  `TransferToAgent`, `emitEventToUser`, `sendMessageToAgent`)
- Persistence: `src/conversation/conversation.service.ts` (`createChat` @OnEvent `create.new.chat`,
  `pushChatToConversation`, `getActiveConversations`, `getAllConversations`,
  `transferConversationToAgent`)
- Entities: `src/conversation/entities/{chat,conversation}.entity.ts`, `src/visitor/entities/visitor.entity.ts`
- Transport: `src/jarcube/jarcube.gateway.ts`, `src/redis-propagate/redis-propagate.service.ts`,
  `src/socket/socket-state.service.ts`
- UI inbox: `QuantumMind-ui/src/views/apps/active-chat/{SidebarLeft,ChatLog,SendMsgForm}.tsx`
- UI store: `QuantumMind-ui/src/store/apps/conversation/index.ts`, `.../whatsapp-web/`
- UI socket: `QuantumMind-ui/src/services/socket.services.ts`, `src/context/AuthContext.tsx`

---

_Last updated: 2026-09-05 — Phase 0 complete. Phase 1 awaiting approval._
