# Omnichannel Inbox — WhatsApp Web → Dashboard Conversation Flow

**Status:** Phase 0 ✅ · Phase 1 (read API) ✅ · Phase 2 (realtime) ✅ · Phase 3 (tabs) ✅ **— all three verified live: AI replies reach a real phone and messages render in the dashboard** · **Phase 4 (two-way) ✅ core done** · Phase 5 (SaaS) next
**Last updated:** 2026-09-06
**Repos:** `QuantumMind-backend` (NestJS + Mongoose), `QuantumMind-ui` (Next 12 + MUI 5 + RTK)

Purpose of this document: carry full context between sessions. It records what
exists today, the exact reason WhatsApp Web messages do not appear in the
dashboard, and the phased plan to show them in per-channel tabs (WhatsApp,
Instagram, Telegram, …) alongside the existing default chat box.

---

## 1. What already exists

### 1.1 WhatsApp Web (backend) — built and working

`QuantumMind-backend/src/whatsapp-web/`

| Piece | File | Notes |
|---|---|---|
| REST session API | `whatsapp-web.controller.ts` | 10 endpoints under `/api/whatsapp-web/sessions`. **All `@Public()`** |
| Session orchestration | `whatsapp-web.service.ts` | create/start/stop/logout/force-kill/delete/qr/pairing-code; auto-restart on boot (`onApplicationBootstrap`) |
| baileys engine | `engine/baileys-engine.service.ts` | in-process socket per session, on-disk `useMultiFileAuthState`, `syncFullHistory: false` |
| Inbound/outbound hub | `whatsapp-web-inbound.service.ts` | the whole message pipeline |
| Session row | `entities/whatsapp-web-session.entity.ts` | `name` (unique), `status`, `phone`, `pushName`, `jarcubeBot`, `social` |

Internal events (`whatsapp-web/constants.ts`): `whatsappweb.status`,
`whatsappweb.inbound`, `whatsappweb.ack`, `whatsappweb.history`,
`send-whatsapp-web-message`. Channel value: `WA_WEB_CHANNEL = 'whatsapp_web'`.

Session statuses: `created → initializing → qr_ready → ready`, plus
`disconnected` / `failed` (`enums/session-status.enum.ts`).

### 1.2 Inbound message chain (verified, file:line)

```
baileys messages.upsert
  → BaileysEngineService.handleMessagesUpsert            engine:392
  → emitMessage (normalize, skip groups/protocol/reactions)  engine:421
  → emit WA_WEB_INBOUND_EVENT
  → WhatsappWebInboundService.onInbound (serialized per session:jid)  inbound:110
  → processInbound                                       inbound:118
      1. getRoutingInfo(sessionName) → jarcubeBotId       (drop if no bot linked)
      2. ChannelThreadService.upsertForInbound            channel-thread.service:73
      3. resolveConversation → ChatInitializerService     inbound:217
           creates/reuses Visitor + Conversation(platform: 'whatsapp_web')
      4. ConversationService.saveChannelMessage           conversation.service:134
           → Chat row + $push onto Conversation.chats
           → dedup via sparse unique (channelThread, externalMessageId)
      5. updateThreadBookkeeping (lastMessage, unreadCount, oldest cursor)
      6. return if msg.historical   (never feed backfill to the bot)
      7. return if msg.fromMe
      8. routeToBotOrAgent → MessageHandlerService.handleMessage  inbound:340
```

Bot reply path:

```
MessageHandlerService.sendBotMessage        message-handler.service:1907
  → emit 'create.new.chat' (Chat row, carries chatId correlation id)
  → RedisPropagatorService.propagateEvent({ platform: 'whatsapp_web' })
  → consumeSendEvent → emit 'send-whatsapp-web-message'   redis-propagate.service:79
  → WhatsappWebInboundService.onSend                      inbound:452
  → resolveSendTarget (ctx, else ChannelThread by visitor) inbound:505
  → deliver via engine.sendText/sendImage/sendMedia        inbound:540
  → linkOutboundChannelMessage stamps externalMessageId + channelThread
```

Delivery ticks: `messages.update → onAck → advanceChannelMessageStatus`
(forward-only guard lives in the Mongo query).

### 1.3 Data model — messages ARE already in the shared tables

Confirmed: WhatsApp Web messages land in the **same** `conversations` +
`chats` collections as widget chats. There is no separate WhatsApp store.

- `Conversation.platform` — the channel discriminator, enum
  `facebook | telegram | whatsapp | whatsapp_web | widget`
  (`conversation/enums/platform.enum.ts`), default `widget`.
- `Chat` — widget fields (`message`, `sender`, `conversationId`, `type`,
  `time`, `chatId`) **plus** a channel block already added:
  `channelThread`, `externalMessageId`, `direction`, `status`, `authorName`,
  `mediaUrl`, `mimetype`, `fileName`, `mediaOmitted`, `quotedMessageId`,
  `historical`. Indexes: unique sparse `(channelThread, externalMessageId)`,
  sparse `externalMessageId`, `(channelThread, time:-1)`.
- `ChannelThread` (`channel-thread/entities/channel-thread.entity.ts`) — the
  durable, channel-agnostic thread. `channel` is a **plain indexed string on
  purpose** so adding Instagram/Telegram needs no migration. Carries
  `sessionName`, `chatId`, `phone`, `pushName`, `avatarUrl`, `bot`, `visitor`,
  `conversation`, `lastMessage`, `lastMessageAt`, `unreadCount`, `botEnabled`,
  `handledByAgent`, `assignedAgent`, history cursors, `meta`.
  Unique index `(channel, sessionName, chatId)`.

**One ChannelThread spans many Conversations** — a Conversation is a session
that gets closed/expired by a 2-hourly cron; a WhatsApp thread is permanent.
This is why thread-scoped reads exist and conversation-scoped reads truncate.

The schema work for omnichannel is essentially already done. What is missing is
the read API and the realtime fan-out.

### 1.4 The dashboard's "default chat box" — what it actually is

Route `/apps/chat/active` → `src/pages/apps/chat/active/index.tsx`
→ `src/views/apps/active-chat/{SidebarLeft, ChatContent, ChatLog, SendMsgForm}.tsx`

It is fed by `GET /api/conversation/active-conversations`, which matches:

```
status: in_progress  AND  type: realtime  AND  agent: <me>
```

So it is **not** "the widget inbox" — it is the *human-agent takeover* inbox for
any platform. It only ever contains conversations that a bot escalated to the
signed-in agent. Also relevant:

- `/apps/chat/history` and `/apps/chat/blocked` use `GET /api/conversation`,
  which **excludes** `in_progress` — so live threads never appear there either.
- Redux: `src/store/apps/conversation/index.ts` is the real slice.
  `src/store/apps/chat/index.ts` is dead Vuexy template code hitting
  non-existent `/apps/chat/*` mock routes — ignore it.
- Socket: `src/services/socket.services.ts` → `io(env.baseurl, { path: '/socket.io/jarcube', auth: { token } })`.
  Wired once in `src/context/AuthContext.tsx:94-124`; subscribes `message`
  (→ `updateConversationChats`) and `new-visitor` (→ `pushToActiveConversations`).
- Channel icons already exist: `src/components/PlatforomIcons.tsx` maps
  telegram / whatsapp / **whatsapp_web** / facebook / widget / viber / instagram.
- No tab/filter UI in either sidebar today. Only a free-text search on
  visitor name.

### 1.5 WhatsApp Web (frontend) — built

`src/views/social/list/WhatsappWebConnect.tsx`, `WhatsappWebQrModal.tsx`,
`WhatsappWebActions.tsx`, hosted by `src/pages/social/list/index.tsx`.
API helpers in `src/store/apps/whatsapp-web/index.ts` (plain promise helpers,
not a slice). QR modal already uses MUI `Tabs` — copy that pattern.

---

## 2. Root cause: why WhatsApp messages are invisible on the dashboard

Four independent blockers. All four must be removed.

1. **No read API for threads.** `ChannelThreadModule` registers *no controller*.
   These methods exist and have **zero callers**:
   - `ChannelThreadService.listChannelsWithCounts()` — written specifically to
     drive dynamic channel tabs
   - `ChannelThreadService.markRead / assignToAgent / releaseToBot / setBotEnabled`
   - `ConversationService.getThreadMessages()` / `getOldestThreadMessage()`
   - `BaileysEngineService.requestOlderHistory()` / `markMessagesRead()`
   - nothing listens to `WA_WEB_HISTORY_EVENT`

2. **Existing conversation queries exclude them.**
   `active-conversations` needs `type=realtime` + assigned agent; a bot-handled
   WhatsApp thread is `type=bot` with no agent. `GET /conversation` excludes
   `in_progress`. So a live WhatsApp thread matches neither.

3. **No realtime fan-out to dashboard clients.** In
   `redis-propagate.service.ts:79`, `platform === 'whatsapp_web'` takes the
   *send-to-WhatsApp* branch. The socket-emit branch is only reached for
   widget/dashboard. A WhatsApp message emits nothing to any agent socket.

4. **Projection drops the channel fields.** `GET /conversation/:id` populates
   chats with only `{message, time, sender, type}` — `direction`, `status`,
   `mediaUrl`, `authorName`, `channelThread` never reach the UI.

Secondary gaps worth recording:

- `/api/whatsapp-web/sessions/*` is entirely `@Public()` — unauthenticated.
- No `accountId`/`tenantId` on any entity. Scoping today is by `bot` +
  `sessionName` only; `findAll()` returns every session to any caller.
- `ChannelEnum` (`messaging/enums/channel.enum.ts`) has no `whatsapp_web`
  member, and the real WhatsApp Web reply path bypasses
  `MessagingProviderRegistry` entirely. Two parallel abstractions exist.
- Social reports hard-code `facebook|whatsapp|telegram|widget`, so
  `whatsapp_web` is invisible in analytics.

---

## 3. Target architecture

Keep the existing default chat box **exactly as is**. Add a channel-tab layer
beside it, driven by `ChannelThread` rather than `Conversation`, because the
thread is the durable unit an agent thinks in.

```
┌──────────────────────────────────────────────────────────┐
│ [ 💬 Live Chat ] [ 🟢 WhatsApp ③ ] [ 📷 Instagram ] [ ✈ Telegram ] │  ← dynamic
├──────────────────┬───────────────────────────────────────┤
│ thread list      │  message pane + composer              │
│ (per channel)    │                                       │
└──────────────────┴───────────────────────────────────────┘
```

Design rules:

- **Live Chat tab** = today's components untouched, still on
  `active-conversations`. Default selected tab. Zero regression risk.
- **Channel tabs are data-driven**, from `GET /api/inbox/channels`. A new
  platform appears with no frontend change. Never hardcode a tab list.
- Icons resolve through the existing `returnPlatformIcon()`; unknown channel
  falls back to the existing unknown glyph.
- Badge count per tab = threads with `unreadCount > 0`.
- One generic `ChannelInbox` view serves every channel. Channel-specific
  affordances (WhatsApp delivery ticks, IG story replies) are opt-in via a
  small capability map, not per-channel components.

---

## 3.5 OpenWA feature analysis — what we replicate and what we skip

Source: `docs/OpenWA/82-dashboard-chats.md` (OpenWA's own doc for
`dashboard/src/pages/Chats.tsx`, ~6,000 lines across 23 files) plus
`OpenWA/src/modules/message/message.controller.ts` and
`OpenWA/dashboard/src/utils/chatMessages.ts`.

OpenWA's doc classifies this feature **PORTABLE** and is explicit that its
*hooks are not portable* (it uses TanStack Query, we use RTK) while its **pure
utils are portable essentially verbatim**. We follow that split exactly: port the
merge/dedup logic as pure functions into our reducers, do not import its
architecture.

### OpenWA's inbox features, and our disposition

| OpenWA feature | Replicate? | How, in our pipeline |
|---|---|---|
| 3 tabs: Chats / Channels / Status | **Partly** | Our tabs are *per platform*, not per WhatsApp content type. Channels/Status are WhatsApp-only broadcast feeds — deferred, not core |
| Chat list w/ avatar, name, snippet, time, unread badge | **Yes** | `GET /inbox/threads` returns exactly these fields |
| Chat kinds (individual/group/channel/status) | **No** | Our inbound path already drops groups/status/newsletters (`isUnsupportedChatJid`). 1:1 support inbox only |
| DB + engine-history dual-source merge | **No — and this is a simplification we get for free** | OpenWA merges two sources because its DB may be empty for an old chat. Our inbound path persists *everything* including history backfill, so our DB is the single source. `mergeChatMessages` is unnecessary; everything downstream of it still applies |
| `mergeOrAppend` + forward-only delivery status | **Yes (Phase 3)** | Port as a pure reducer helper. Backend already enforces it in `advanceChannelMessageStatus` |
| Per-field metadata merge (payload-less echo must not wipe media) | **Yes (Phase 3)** | The exact bug our socket reducers would write |
| Absent-vs-empty (`??` not `\|\|`) discipline | **Yes** | Adopted as a principle in all inbox reducers |
| Optimistic send + echo race fold | **Yes (Phase 4)** | Our agent console sends and receives its own echo too |
| `capMediaPayloads` base64 cap | **N/A for now** | We never cache base64 — media is a URL or `omitted`. Revisit only if inline base64 is introduced |
| Media `omitted: true` 📎 placeholder + click-to-download | **Yes** | `InboxMediaView.omitted` implemented in Phase 1; the download route lands in Phase 4 |
| On-demand media download per message id, keyed state | **Phase 4** | Keyed by message id, not one shared slot (their documented bug) |
| Delivery ticks (pending/sent/delivered/read/failed) | **Yes** | `Chat.status` already populated; now exposed via `InboxMessageView.status` |
| Reactions | **No (defer)** | Our engine explicitly skips `reactionMessage`. Needs engine work first |
| Revoke / edit | **No (defer)** | Engine skips `protocolMessage`. Same |
| Quoted replies | **Yes** | `quotedMessageId` already stored and now exposed |
| WhatsApp markup → AST (`*bold*`, depth cap 20, iterative siblings) | **Yes (Phase 3)** | Portable verbatim, incl. both hardening measures |
| Scroll-position hook (clamped restore, media re-pin) | **Yes (Phase 3)** | OpenWA's doc: portable as code, browser behaviour not framework behaviour |
| `decideScroll` (outgoing always, incoming only if near bottom) | **Yes (Phase 3)** | 30 lines, real UX difference |
| Mark-read trailing coalescer (750 ms) | **Yes (Phase 3)** | Cost control — a POST per message sprays the API |
| Reconnect gap recovery | **Yes (Phase 3)** | We must refetch the open thread after a socket gap |
| Profile pictures batched, capped at 50 in list order | **Deferred** | We have no avatar fetch yet; the batching lesson is recorded for when we do |
| `chat.timestamp: 0` renders literal "0" (ternary not `&&`) | **Yes** | One-line habit, free |
| `Promise.allSettled` for multi-source fetch | **N/A** | Single source (see above) |
| **No pagination, window fixed at 100, no virtualisation** | **Explicitly NOT replicated** | OpenWA's own doc calls this "the one place where OpenWA's approach is a constraint rather than a lesson". We implement cursor paging from Phase 1 |
| Status composer, `StatusMedia`, `@lid` echo suppression, dual-candidate revoke | **Skip** | OpenWA's doc lists all four under "Skip" — they exist only for WhatsApp identity semantics / adapter asymmetry |

### OpenWA's history endpoint, and our cost-saving design

You flagged OpenWA's history access. It is
`GET /sessions/:id/messages/:chatId/history?limit&includeMedia&deep`
(`OpenWA/src/modules/message/message.controller.ts:362`), reading **live from
WhatsApp, bypassing the DB**, clamped to 1–100 (2000 in `deep` mode, which forces
`includeMedia` off).

Read live on every request, that is expensive and ban-risky. Our design keeps the
capability and removes the recurring cost:

| Technique | Effect |
|---|---|
| `syncFullHistory: false` on the engine (already in place) | No bulk transfer of every chat at pairing time |
| History requested **per thread, on agent scroll** | We only ever pay for conversations someone actually reads |
| Fetched pages persist through the normal inbound path | Each message is fetched from WhatsApp **at most once, ever**; every later read is a DB read |
| Unique `(channelThread, externalMessageId)` index | Overlapping history/live batches dedup instead of double-inserting |
| `historyExhausted` flag | Once the channel says "start of chat", the thread can never be re-requested — permanent saving |
| 30 s per-thread cooldown | Scroll-spam collapses into one request per window |
| `historyRequestedAt` written **before** dispatch | A failing channel cannot become a retry loop |
| Media not downloaded (`mediaOmitted`), fetched on click | Matches OpenWA's `includeMedia=false` default without its base64 cache problem |

Net: the same feature, with the per-request cost converted into a one-time cost.

---

## 4. Phased plan

### Phase 1 — Backend: channel inbox read API ✅ COMPLETE

New `src/inbox/` module. Registered in `app.module.ts`. Build verified
(`npm run build` clean; the two pre-existing errors in `redis.spec.ts` and
`app.e2e-spec.ts` are untouched and unrelated).

| Method | Path | Notes |
|---|---|---|
| GET | `/api/inbox/channels` | tab list + per-channel `{threads, unread}` |
| GET | `/api/inbox/threads?channel=&search=&limit=&before=` | cursor-paginated, newest first |
| GET | `/api/inbox/threads/:id` | one thread + relations |
| GET | `/api/inbox/threads/:id/messages?limit=&before=` | oldest-first window + `hasMore` |
| POST | `/api/inbox/threads/:id/read` | clears badge + sends blue ticks |
| POST | `/api/inbox/threads/:id/history` | on-demand older page, rate-limited |

**Files added**
```
src/inbox/inbox.module.ts          no imports — deps are @Global, channels via EventEmitter2
src/inbox/inbox.controller.ts      6 routes, JWT-guarded (NOT @Public)
src/inbox/inbox.service.ts         scopeFilter + the 6 handlers
src/inbox/inbox.mapper.ts          InboxMessageView / InboxThreadView / InboxMediaView
src/inbox/inbox.constants.ts       INBOX_MARK_READ_EVENT, INBOX_REQUEST_HISTORY_EVENT
src/inbox/dto/list-threads.dto.ts
src/inbox/dto/list-messages.dto.ts
```

**Files changed**
```
src/channel-thread/channel-thread.service.ts
  + ListThreadsOptions, listThreads(), findByIdPopulated(), botScopeFilter()
  ~ listChannelsWithCounts(botIds?) — now scopeable
src/whatsapp-web/whatsapp-web-inbound.service.ts
  + onInboxMarkRead()        → engine.markMessagesRead
  + onInboxRequestHistory()  → engine.requestOlderHistory
  + onHistoryBatch()         → observes on-demand isLatest
src/app.module.ts
  + InboxModule
```

**Key decisions made**

- **No architecture change.** `InboxModule` imports nothing. It reaches the
  WhatsApp hub through two new EventEmitter2 events, mirroring the existing
  `send-whatsapp-web-message` decoupling. No new socket, no new gateway, no
  engine import in the inbox module. Adding Telegram means adding two
  `@OnEvent` handlers in that hub — nothing here changes.
- **History pages reuse the inbound path.** `requestOlderHistory` returns
  nothing; WhatsApp answers later on `messaging-history.set`, the engine
  republishes those as ordinary inbound messages flagged `historical: true`, and
  they persist through the same dedup path as live messages. No separate storage
  route could double-insert.
- **`scopeFilter(user)` is the tenancy seam.** Admin → `null` (unscoped); agent →
  array of `assignedBots` ids. An **empty array means "see nothing"**, which is
  why the two cases are different types rather than an empty array doing double
  duty. Lookup failure **fails closed**. When `accountId` lands in Phase 5, this
  one method changes.
- **Thread ownership is checked in `requireThread`**, which every thread-scoped
  route funnels through, so a new endpoint cannot forget it. Out-of-scope →
  **404, not 403** (403 would confirm existence).
- **Search regex is escaped** — a query like `+91 (22)` must not be parsed as a
  regex group, and an unescaped user string is a ReDoS vector.
- **Media is never silently absent.** A media-typed row with no URL still yields
  `{ omitted: true }` so the UI renders 📎 rather than an empty bubble. This is
  OpenWA's convention and the reason their history rows are readable.

**Still open from Phase 1 scope:** `/api/whatsapp-web/sessions/*` is still
`@Public()`. Deliberately left alone — the dashboard's existing WhatsApp Web
connect flow calls it unauthenticated, so tightening it is a coordinated
frontend+backend change, not a drive-by.

**Verify**
```bash
curl -H "Authorization: Bearer $TOKEN" localhost:4000/api/inbox/channels
curl -H "Authorization: Bearer $TOKEN" "localhost:4000/api/inbox/threads?channel=whatsapp_web"
curl -H "Authorization: Bearer $TOKEN" "localhost:4000/api/inbox/threads/$ID/messages?limit=50"
```

### Phase 2 — Realtime fan-out ✅ COMPLETE

Closes the "WhatsApp emits nothing to the dashboard" gap. Backend build clean,
frontend `tsc --noEmit` clean, app boots with all 6 inbox routes mapped and **no
circular dependency**.

#### ⚠️ Plan correction: rooms per bot was the WRONG design

The Phase 2 plan above said "introduce a room per bot on the existing
`/socket.io/jarcube` path". **That was wrong and was not implemented.**

`@socket.io/redis-adapter` is **not installed** (verified: `node_modules/@socket.io/`
contains only `component-emitter`; socket.io itself is a transitive dep of
`@nestjs/platform-socket.io`). Without it, socket.io rooms are **process-local**:
`server.to('bot:x').emit()` reaches only clients connected to the instance that
runs the emit. Behind more than one replica, most agents would silently receive
nothing — the exact class of bug this phase exists to fix. Adding the adapter
would have been the architecture change that was explicitly off the table.

**What was done instead:** fan out through the **existing**
`RedisPropagatorService.propagateEvent()`, addressed to agent **userIds**. That is
the same Redis `SEND_TO_OTHER` → per-userId socket registry path the widget and
agent console already use. No new socket, no new gateway, no new adapter.

Two subtleties that make it work:

- **`platform` is deliberately omitted** from the propagated event.
  `consumeSendEvent` switches on `platform` to decide "deliver over
  WhatsApp/Telegram" vs "emit on this user's socket". Omitting it falls through
  to the socket branch. Passing the thread's channel would have tried to send the
  dashboard notification back out over WhatsApp.
- **`InboxModule` is `@Global`** so the WhatsApp hub can inject
  `InboxEventsService` without importing `InboxModule`. The hub already listens
  for `InboxService`'s events, so a two-way module import would have closed a
  cycle. Verified at runtime: `InboxModule dependencies initialized`, app starts.

#### Socket events

| Event | Payload | When |
|---|---|---|
| `inbox:message` | `{ channel, threadId, message, thread }` | a message landed, either direction |
| `inbox:thread-updated` | `{ channel, threadId, thread }` | list state changed, no new message |
| `inbox:message-status` | `{ channel, threadId, externalMessageId, status }` | a delivery receipt advanced a tick |

`thread` travels with `inbox:message` so a thread the sidebar has never seen
renders immediately — the first message from a new contact is the common case and
a round trip there would show an empty inbox for a beat.

#### Files

**Backend added**
```
src/inbox/inbox-events.service.ts    fan-out via RedisPropagatorService (not rooms)
```
**Backend changed**
```
src/inbox/inbox.module.ts                          → @Global, provides InboxEventsService
src/agent/agent.service.ts                         + findInboxRecipientIds(botId)
src/whatsapp-web/whatsapp-web-inbound.service.ts   + announceToInbox(), resolveBotId() (memoised)
                                                   ~ processInbound: announce after persist (step 5)
                                                   ~ onAck: broadcast only when the row MOVED
                                                   ~ onSend: announce the linked outbound row
```
**Frontend added**
```
src/store/apps/inbox/index.ts    RTK slice: channels, threadsByChannel, messagesByThread, cursors
src/store/apps/inbox/merge.ts    OpenWA merge rules ported as pure functions
```
**Frontend changed**
```
src/services/socket.services.ts   + 3 fromEvent observables + payload types
src/context/AuthContext.tsx       + 3 subscriptions beside the existing wiring
src/store/index.ts                + inbox reducer
```

#### Decisions worth remembering

- **Announce AFTER persistence and after the dedup gate.** The agent's screen then
  shows exactly what the DB holds, and an engine re-fire cannot paint a duplicate
  bubble.
- **Historical rows are never announced.** A backfill is not new activity; without
  this, requesting history would flood the inbox with months-old messages.
- **`onAck` broadcasts only when `advanceChannelMessageStatus` returned a row.**
  It returns null for a refused downgrade, so the forward-only rule is enforced
  once, at the source, instead of again in every consumer.
- **`onSend` announces the *linked* row, not the raw outbound payload.** The
  bubble then carries the real message id / direction / `sent` status that a later
  receipt will reference. Broadcasting the payload would give the client a row no
  ack could ever match.
- **`findInboxRecipientIds` includes admins unconditionally and does NOT filter on
  agent status.** Admins have no `assignedBots`, so filtering on it would exclude
  the users most likely to be watching. And status is a stale DB field — whether a
  socket is connected is answered downstream by the registry, so filtering here
  would drop messages for a connected agent. (`assignAgent` does filter ONLINE,
  correctly — it is choosing someone to hand work to, not broadcasting.)
- **`resolveBotId` is memoised per session name.** Receipts arrive in bursts;
  session→bot linkage changes only when an operator edits the messenger.
- **Badges are recomputed from held rows, never incremented.** An increment drifts
  permanently once an event is missed or replayed — and a reconnect replays.
- **Only inbound messages notify.** Our own bot/agent reply echoes on the same
  event and must not ping the agent who just sent it.

#### Ported from OpenWA (`src/store/apps/inbox/merge.ts`)

Per OpenWA's own guidance that its pure utils port verbatim while its hooks do not:

- `mergeDeliveryStatus` — forward-only rank; `failed` terminal and only reachable
  from pending/sent; unknown status ignored. Mirrors our backend's
  `CHAT_STATUS_RANK` so the two cannot drift.
- `mergeOrAppend` — field-by-field merge, not a spread. A socket echo has
  undefined leaves; `{...existing, ...incoming}` would wipe `authorName`,
  `quotedMessageId` and the media URL.
- Media rule — an incoming `{ omitted: true }` with no `url` must not clobber an
  existing copy holding a real URL. OpenWA's single most valuable rule.
- Identity `externalMessageId ?? id` — anything keyed on `id` alone double-adds.
- Absent-vs-empty discipline (`??`, not `||`) throughout.

**Not ported:** `mergeChatMessages` (we have one source, not two) and
`capMediaPayloads` (we never cache base64).

#### Still open

- The bot's own reply is announced from `onSend`, which only fires for the
  WhatsApp Web transport. A reply on a future channel needs the same two lines in
  that channel's hub.
- Reconnect gap recovery (invalidate the open thread after a socket drop) is
  Phase 3 — the slice merges rather than replaces on fetch, so the refetch is
  safe to add.

### Phase 3 — Frontend: dynamic channel tabs + generic channel inbox ✅ COMPLETE

`tsc --noEmit` clean; `next build` succeeds (all three chat routes build,
`/apps/chat/active` 16.2 kB / 688 kB first load). Backend build re-verified clean.

#### What it looks like

```
[ 💬 Live Chat ]  [ 🟢 WhatsApp ③ ]  [ ✈ Telegram ]   ← dynamic, from the API
├──────────────────┬────────────────────────────────────┤
│ thread list      │ header (name + channel + Bot/Agent) │
│ search           │ message log (ticks, 📎, quotes)      │
│ avatar/name/     │                                     │
│ snippet/time/    │ "replying coming next" notice        │
│ unread chip      │                                     │
└──────────────────┴────────────────────────────────────┘
```

#### Files added

```
src/views/apps/inbox/channelConfig.ts    capability map + label/humanize helpers
src/views/apps/inbox/ChannelTabs.tsx     data-driven scrollable Tabs + unread Badge
src/views/apps/inbox/ChannelInbox.tsx    one tab panel: ThreadList + ThreadContent
src/views/apps/inbox/ThreadList.tsx      generic thread list, search, load-more
src/views/apps/inbox/ThreadLog.tsx       bubbles, delivery ticks, 📎 placeholder
src/views/apps/inbox/ThreadContent.tsx   header + ownership chip + two-stage history
src/store/apps/inbox/index.ts            RTK slice (added in Phase 2, extended here)
src/store/apps/inbox/merge.ts            OpenWA merge rules as pure functions
```

#### Files changed

```
src/pages/apps/chat/active/index.tsx   + <ChannelTabs/>, + conditional <ChannelInbox/>
                                       ~ Live Chat branch wrapped in a ternary, body UNCHANGED
src/services/socket.services.ts        + onReconnect()
src/context/AuthContext.tsx            + reconnect gap recovery
src/store/apps/inbox/index.ts          + inboxSocketGap reducer
src/store/index.ts                     + inbox reducer (Phase 2)
```

#### Key decisions

- **The Live Chat branch is byte-identical.** The existing `SidebarLeft` +
  `ChatContent` JSX was wrapped in a ternary and not otherwise touched, so there
  is no regression surface for the widget/agent console. `LIVE_CHAT_TAB` is the
  default tab, so an agent who never uses channels sees exactly today's page.
- **Zero platform branching in components.** `channel` is a prop; differences live
  in `channelConfig.ts`. An unconfigured channel gets `DEFAULT_CAPABILITIES` —
  permissive on safe features (media, bot toggle), conservative on the ones that
  mislead when unsupported (delivery ticks, history). A channel appearing in the
  tabs before anyone adds a config row is the expected path, not a bug.
- **`direction` is the authority for bubble alignment, not sender id.** On a
  channel, a message the operator typed on their own phone is outbound even though
  its sender is neither our bot nor an agent.
- **Delivery ticks only where the channel reports receipts.** A permanently-single
  tick on a receipt-less channel reads as "never delivered" — worse than nothing.
  Only `read` gets colour; colouring `delivered` too would make them
  indistinguishable at a glance.
- **Media placeholder is a first-class state.** Our engine records `mediaOmitted`
  without downloading bytes, so 📎 is the normal case today. Rendering it
  explicitly (OpenWA's convention) is why the thread is readable at all.
- **Autoscroll keys on the last message's identity, not `messages.length`.** Paging
  older history also changes the length, and scrolling to the bottom then would
  yank the agent away from what they just asked to read.
- **Two-stage "load older".** Page our own DB first (`cursor`); only ask the
  channel once local pages are exhausted. Asking the channel first would spend a
  network round trip and a rate-limit/ban budget on messages already in our DB.
- **Ternary not `&&` for the timestamp.** A thread with no activity has a falsy
  timestamp and React renders `0` as literal text — OpenWA's documented bug, taken
  for free.
- **One fetch owner.** `ThreadList` only sets the selected id; `ThreadContent`
  fetches when it holds no cached list. `undefined` = never loaded, `[]` = loaded
  and empty — collapsing those would refetch an empty thread every render. This
  makes first-open and post-reconnect recovery share one rule and removes a
  double request.
- **Badges recompute from held rows, never increment** (Phase 2 decision, relied on
  here): an increment drifts permanently the first time an event is missed or
  replayed, and reconnects replay.
- **Reconnect gap recovery.** `onReconnect` (not `connect`, so the first connect
  does not double-fetch) clears cached messages and refetches channels. Thread
  lists are deliberately NOT cleared — that would blank the sidebar mid-reconnect.

#### Not in this phase (by design)

- **No composer.** Read path first: WhatsApp conversations are currently invisible
  entirely, so seeing them is the higher-value half. The pane says so explicitly
  rather than looking unfinished.
- **No virtualisation.** Same as OpenWA, but bounded differently: our window is
  cursor-paginated rather than fixed at 100. If agents routinely scroll long
  histories this needs `react-window` — and per OpenWA's own doc, adding it later
  is harder than starting with it.
- **Message markup parsing** (`*bold*` → AST, depth-capped) not yet ported. Listed
  in the OpenWA table as Phase 3 scope; deferred to Phase 4 with the composer,
  since send and render should agree on formatting.
- **Scroll-position memory per thread** (OpenWA's 197-line hook) not ported. The
  simple identity-keyed autoscroll covers the common case; the full hook matters
  once media is actually rendered inline.

#### Verify

1. Sign in as an admin/agent → `/apps/chat/active`
2. Live Chat tab must look and behave exactly as before
3. A WhatsApp tab appears if any `whatsapp_web` thread exists
4. Send a message from a real phone → it appears in that tab within a second,
   badge increments, sound + notification fire
5. Open the thread → badge clears, customer sees blue ticks
6. Bot replies → the reply appears right-aligned with a tick

### Phase 4 — Two-way + fidelity ✅ CORE DONE

Formal spec: `.kiro/specs/inbox-two-way-messaging/requirements.md` (13
requirements, EARS). Backend build clean, `tsc --noEmit` clean, `next build`
clean (`/apps/chat/active` 17.6 kB / 690 kB), app boots with **8** inbox routes
and no circular dependency.

#### 🔴 A real bug was found and fixed: history sync was silently disabled

Our socket was created with `syncFullHistory: false` and **no**
`shouldSyncHistoryMessage`. baileys defaults that callback to
`() => !!syncFullHistory`, so leaving it unset **disabled every form of history
and app-state sync** — no chat list, no contact book, not even the recent-message
window. OpenWA documents this exact trap in
`src/engine/adapters/baileys-lifecycle.ts:253`.

Symptom: the inbox could only ever show conversations that messaged us *while the
process was running*. Everything older was invisible even though WhatsApp had
already offered it.

Fix — the pair, which is the part that matters:
```ts
shouldSyncHistoryMessage: () => true,   // ask for the recent window + app state
syncFullHistory: false,                 // still decline the whole archive
```
This is what makes the inbox load like WhatsApp on connect while keeping the
heavy, ban-risky bulk transfer off. Older pages stay on-demand per thread.

#### Chat-list hydration (the "load chats like OpenWA" work)

New engine subscriptions: `chats.upsert`, `chats.update`, `contacts.upsert`,
`contacts.update`, plus the `chats`/`contacts` arrays on `messaging-history.set`
— normalised into `WaWebChatSummary` and published on `WA_WEB_CHATS_EVENT`.

`ChannelThreadService.upsertForChatSync()` materialises them as threads.
Three decisions worth remembering:

- **No Visitor, no Conversation is created.** Those are bot-runtime records
  costing a multi-document write each; a chat we have never exchanged a message
  with does not need them, and creating hundreds of empty conversations on every
  connect would skew the reports. `resolveConversation` still creates them lazily
  on the first real message.
- **`lastMessage` is never set from a chat-list event**, only `lastMessageAt`. The
  preview must describe a message we actually hold, or the inbox shows a row whose
  bubble list is empty. `lastMessageAt` is what the inbox sorts on, so it is set.
- **`lastMessageAt` moves forward only (`$max`).** Chat-list events replay on every
  reconnect and arrive out of order; an older timestamp winning would reshuffle
  the inbox.
- **WhatsApp's own `unreadCount` is deliberately ignored.** It answers "how many
  has the phone not seen", which is a different question from "how many has this
  dashboard not seen" — adopting it would show badges for messages an agent
  already read here.

`inbox:channels-changed` is emitted only when a thread was actually **created**,
so a reconnect that merely refreshed names does not make every dashboard refetch.

#### Agent reply

`POST /api/inbox/threads/:id/messages` — and the interesting part is that it is
**request/response, not fire-and-forget**.

The bot path (`WA_WEB_SEND_EVENT`) is fire-and-forget because nothing is waiting.
An agent reply has a human watching an HTTP request, and telling them "sent" when
the socket was closed is the single outcome this phase exists to prevent. So a new
intent `INBOX_SEND_MESSAGE_EVENT` is dispatched with **`emitAsync`**, which
returns listener values — the inbox awaits a real delivery outcome *without
importing the engine*. Hubs return `null` for a channel they do not own, so
exactly one meaningful result comes back.

Ordering, and why:
```
1. validate + requireThread          (no writes yet)
2. ensureConversationForThread       (thread outlives its Conversation)
3. write Chat_Row: pending + correlationId
4. dispatch and WAIT (30s cap)
5. accepted → linkOutboundChannelMessage + touchLastMessage + announce
   rejected → failOutboundByCorrelationId, throw with a machine-readable reason
```
The row is written **before** the send so a delivered message can never lack a
local record. The cost is a `pending` row for a failed send — which is exactly what
the agent needs to see and retry.

Failure reasons map to status codes by *whose problem it is*:
`session_not_connected`/`no_reply_target` → **409**, `invalid_send_request` →
**422**, `channel_send_timeout` → **504**, otherwise **502**. Classification never
depends on human-readable text.

`failOutboundByCorrelationId` is new on `ConversationService`: a reply that never
reached the channel has no `externalMessageId`, so `advanceChannelMessageStatus`
(which matches on that field) could never move it off `pending`.

#### Bot control / takeover

`PATCH /api/inbox/threads/:id/bot` → `setBotEnabled` | `assignToAgent` |
`releaseToBot`, all three previously written and uncalled.

- `botEnabled` and `action` are **mutually exclusive** (400
  `ambiguous_bot_control`): the two action methods each write `botEnabled`
  themselves, so honouring both would make the result depend on application order.
- An `agent` cannot seize a thread assigned to a colleague (409
  `thread_owned_by_other_agent`); an `admin` can, or a thread held by someone who
  went offline is stuck forever.
- **`syncSocketStateOwnership`** mirrors the committed thread flags onto the
  visitor's in-memory state. `routeToBotOrAgent` treats the thread as
  authoritative but *also* reads socket state; leaving the two disagreeing would
  route the next inbound message by stale ownership.

#### Optimistic send + the echo race

`correlationId` is now exposed on `InboxMessageView` — it was the missing wire
field the whole race resolution depends on. The placeholder is keyed by a
temporary id, the echo by the channel's id, so without a shared key the same reply
renders twice.

`merge.ts` gains `reconcileOptimistic` and `failOptimistic`, and `mergeOrAppend`
now falls back to matching on `correlationId` when the identity key misses.

The rule ported from OpenWA, and the reason it is worth copying: when the echo
beats the HTTP response, **fold the placeholder into the echo rather than dropping
it** — the placeholder may hold fields the echo does not (a staged media URL, the
quoted id), and there is no refetch coming for a field the server never had.

#### Composer

`ThreadComposer.tsx` — Enter sends, Shift+Enter newlines, attachment upload,
quote banner, disabled with a reason while the session is down.

**The wrong-recipient race is guarded with a monotonic token** (`uploadSeq`),
bumped on every new pick *and* on every thread change. An upload is async, so
switching threads mid-upload would otherwise stage the file against whichever
thread is open when it resolves — and send one customer's document to another.
That is a privacy defect, not a nicety.

Draft text and the staged attachment live in `ThreadContent`, not the composer,
because the composer unmounts when the thread closes and would silently discard
them.

#### Files

**Backend changed**
```
src/whatsapp-web/engine/baileys-engine.service.ts   + shouldSyncHistoryMessage (THE FIX)
                                                    + chats/contacts subscriptions
                                                    + handleChatsSync(), WaWebChatSummary
src/whatsapp-web/constants.ts                       + WA_WEB_CHATS_EVENT
src/whatsapp-web/whatsapp-web-inbound.service.ts    + onInboxSendMessage() (returns an outcome)
                                                    + onChatsSync()
src/channel-thread/channel-thread.service.ts        + upsertForChatSync()
src/conversation/conversation.service.ts            + failOutboundByCorrelationId()
src/inbox/inbox.constants.ts                        + INBOX_SEND_MESSAGE_EVENT + result types
src/inbox/inbox.service.ts                          + sendMessage(), setBotControl(),
                                                      dispatchSend(), ensureConversationForThread(),
                                                      syncSocketStateOwnership()
src/inbox/inbox.controller.ts                       + POST messages, PATCH bot
src/inbox/inbox.mapper.ts                           + correlationId on the wire
src/inbox/inbox-events.service.ts                   + publishChannelsChanged()
src/inbox/dto/{send-message,bot-control}.dto.ts     NEW
```
**Frontend changed**
```
src/views/apps/inbox/ThreadComposer.tsx   NEW — composer + upload token guard
src/views/apps/inbox/ThreadContent.tsx    + composer, take-over button, reply state
src/views/apps/inbox/ThreadLog.tsx        + per-message reply action
src/store/apps/inbox/merge.ts             + reconcileOptimistic, failOptimistic
src/store/apps/inbox/index.ts             + sendInboxMessage, setInboxBotControl,
                                            inboxOptimisticSend
src/services/socket.services.ts           + correlationId/optimistic, onInboxChannelsChanged
src/context/AuthContext.tsx               + channels-changed subscription
```

#### 🔴 Post-ship bug: "500 Could not persist the reply" — FIXED

Symptom: the first agent reply on a thread sent fine, then **every** later reply
on that thread failed permanently with `500 Could not persist the reply`.

**Root cause — a compound-sparse index subtlety.** `Chat` carries
`{ channelThread: 1, externalMessageId: 1 }` as `{ unique: true, sparse: true }`.
A compound sparse index only skips a document when **every** indexed field is
missing. A row with `channelThread` set and `externalMessageId` absent **is**
indexed — as `externalMessageId: null` — so only ONE such row can exist per
thread.

`sendMessage` writes the row as `pending` *before* sending (deliberately, so a
delivered message can never lack a local record), and a pending row has no
channel id yet. So it occupied the `(thread, null)` slot. Once one reply was left
in `pending`/`failed`, every later reply on that thread hit E11000.

Proven directly against the dev database:
```
first row with no externalMessageId:  OK
second row REJECTED -> 11000 dup key: { channelThread: ..., externalMessageId: null }
```
And the live data held exactly one squatter — the failed reply that poisoned the
thread:
```
thread=6a9da9279ad119a53882cf9b  status=failed  dir=outbound  msg="so how are you my friend"
```

A second, compounding flaw: `saveChannelMessage`'s duplicate-key recovery looked
the existing row up **by `externalMessageId` only**, which a pending row does not
have — so it returned `chat: null` and the caller reported "could not persist" for
a message that in some cases was already stored.

**Fix — occupy the slot with a unique value instead of null.**

```
chat.entity.ts    + PENDING_EXTERNAL_ID_PREFIX = 'pending:'
                  + pendingExternalId(correlationId) / isPendingExternalId()
                  ~ index docblock now warns about the compound-sparse behaviour
inbox.service.ts  ~ sendMessage writes externalMessageId: pendingExternalId(correlationId)
conversation.service.ts
                  ~ linkOutboundChannelMessage matches `$exists: false` OR a
                    `pending:` placeholder, so it can overwrite the stand-in
                  ~ saveChannelMessage falls back to `chatId` when resolving a
                    duplicate with no external id
inbox.mapper.ts   ~ toMessageView hides a `pending:` id from the wire — it is not a
                    channel id, and leaking it would make the client dedupe on it,
                    offer an unresolvable quoted reply, and tick an unsent message
```

The index itself is unchanged: it is the inbound dedup oracle and weakening it
would have been the wrong trade.

**Verified** (throwaway collection, real index):
```
3 concurrent pending replies on one thread: OK
link overwrote placeholder -> WA_REAL_ID_123 sent
inbound dedup still enforced: true
```
A retry also cannot collide, because each attempt mints a fresh correlation id and
therefore a distinct placeholder.

**Data repair:** `scripts/backfill-pending-external-ids.js` — dry-run by default,
`--apply` to write. Idempotent, and touches only outbound rows that have a
`channelThread` and no `externalMessageId`. Applied: 1 row repaired, 0 left in the
null slot.

**Note for future channels:** anything that writes an outbound row before the
channel has acknowledged it MUST supply a unique placeholder. This is recorded in
the `chat.entity.ts` docblock next to the index.

#### 🔴 Three bugs found in live testing, and fixed

**1. `{ async: true }` silently broke the request/response intent.**
Symptom: every agent reply arrived on the customer's phone but the API answered
`502 channel_send_failed: no handler`.

eventemitter2 wraps an `async: true` listener in a `setImmediate` shim and
returns the **Timeout object**, not the handler's result. It only promisifies when
`listener.constructor.name === 'AsyncFunction'`, which is false because Nest
registers an arrow wrapper around the method. Proven directly:

```
async:true  -> [{"_idleNext":null,"_idlePrev":null,"_destroyed":false}]   // a Timeout
no option   -> [{"accepted":true,"id":"X1"}]                              // the result
```

So `emitAsync` resolved to `[Timeout]`, no object had `accepted`, and the reply
was recorded failed after being delivered. Fix: register
`INBOX_SEND_MESSAGE_EVENT` **without** the async option — the one handler in that
file that must not have it. `dispatchSend` now also requires a result to actually
contain `accepted`, so a malformed value can never again be read as an outcome.

**2. Our own outbound echo was stored twice.** WhatsApp replays a message we sent
through `messages.upsert` with `fromMe: true`. `processInbound` inserted it as a
new row even though the agent path had already written and linked one — hence the
duplicate bubble. `processInbound` now looks the row up by channel id first
(`findChannelMessage`) and, on a hit, refreshes the preview and stops rather than
inserting and re-announcing.

Together these two produced the exact pattern observed: **one delivered bubble and
one red failed bubble per reply.**

**3. The compound sparse index blocked every reply after the first.**
`{ channelThread, externalMessageId }` is `unique + sparse`, but a compound sparse
index only skips a document when **every** indexed field is missing — a row with a
thread and no external id is indexed as `null`. Proven:

```
first row with no externalMessageId:  OK
second row REJECTED -> 11000 dup key: { channelThread: ..., externalMessageId: null }
```

Since a reply is written as `pending` *before* sending (so a delivered message can
never lack a local record), one pending/failed row occupied the `null` slot and
every later reply on that thread hit E11000 → `500 Could not persist the reply`.
A single failure permanently killed the conversation.

Fix: each outbound row gets a unique `pending:<correlationId>` placeholder, which
`linkOutboundChannelMessage` overwrites with the channel's real id. Verified that
all three properties hold: many concurrent pending replies per thread, the link
step overwrites the placeholder, and inbound dedup still rejects a repeat.
`toMessageView` hides placeholders so the client never mistakes one for a channel
id.

**Data repaired** (both scripts are safe to re-run and dry-run by default):
```
scripts/backfill-pending-external-ids.js    1 row unblocked
scripts/cleanup-orphan-failed-replies.js    8 duplicate rows removed
```
The cleanup only deletes a `failed` placeholder row when a sibling with the same
text carries a real channel id — proof it was delivered. A genuine failure with no
delivered twin is kept so an agent can still retry it.

**4. The server minted its own correlation id, so nothing ever folded.**
Symptom after fixes 1–3: no error, message delivered, but still two bubbles — one
stuck `pending` that vanished on refresh.

The correlation id is the join key between the optimistic bubble and the socket
echo. The client generated `msg-<ts>-<rand>`, sent it, and the server **ignored it**
and minted its own `generateId('message', 10)` → `message_XXXXXXXX`. Confirmed in
the stored rows: every agent reply carried a `message_` id, never the client's.

So the echo came back under an id the client had never seen. `mergeOrAppend`'s
correlation fallback could not match, the echo appended as a new row, and the
optimistic row sat `pending` forever — until a refetch replaced the list with the
DB's single row, which is exactly why refreshing "fixed" it.

Fix: `correlationId` is now an accepted field on `SendInboxMessageDto`, the client
sends it, and the server only mints one when a caller supplies none.
`reconcileOptimistic` additionally handles the case where the echo already folded
the placeholder, advancing status instead of no-oping.

Verified against the real compiled merge module, all orderings:
```
PASS  response then echo    : 1 bubble [status=sent optimistic=false]
PASS  echo folds onto opt.  : 1 bubble [status=sent optimistic=false]
PASS  echo then response    : 1 bubble [status=sent optimistic=false]
PASS  later ack/page merge  : 1 bubble [status=read optimistic=false]

(old bug reproduction) mismatched correlationId -> 2 bubbles
```

---

## 5. Gap analysis — loopholes, risks, and suggested improvements

Recorded from reviewing the end-to-end feature. Ordered by severity, not effort.

### 5.1 Correctness risks — RESOLVED

| # | Risk | Fix shipped |
|---|---|---|
| 1 | `correlationId` unindexed → collection scan per reply | ✅ sparse index `{ chatId: 1 }` on the Chat schema |
| 2 | Optimistic rows never time out → bubble stuck `pending` | ✅ `expirePendingOptimistic`, 30s, driven by a ticker that runs only while a row is pending |
| 3 | No retry on a failed bubble | ✅ `retryInboxMessage` thunk + retry icon on failed outbound bubbles; resends under a fresh correlation id |
| 4 | `findChannelMessage` per `fromMe` echo | Left as-is — one indexed lookup, acceptable; noted for a future in-memory recent-id set |
| 5 | No rate limiting → ban risk | ✅ `WhatsappWebRateLimiter`, sliding window per session, at the `deliver()` choke point |

### 5.2 Architectural observations — RESOLVED

**The two outbound paths have converged.** Both `onSend` (bot) and
`onInboxSendMessage` (agent) now end a failed delivery the same way, through the
new `failOutboundReply` helper: the row goes `failed` and an
`inbox:message-status` event surfaces it. A bot reply WhatsApp rejects no longer
sits `pending` forever. `failOutboundByCorrelationId` was widened to also match a
status-less row, because the bot path writes no status (it never joined the
delivery ladder).

**`{ async: true }` landmine documented.** The one handler whose return value is
consumed (`INBOX_SEND_MESSAGE_EVENT`) is registered without it and carries a
comment explaining why; the fire-and-forget handlers keep it. `dispatchSend` also
hardened to require an `accepted` field, so a mis-registered listener can never
again be read as an outcome.

**Chat-list sync is bounded.** `onChatsSync` now sorts newest-activity-first and
caps at `whatsappWeb.chatSyncMaxChats` (default 500). A freshly paired account
with thousands of chats hydrates the most recent ones; the rest materialise
lazily on the first inbound message. Mirrors OpenWA's cap approach.

### 5.3 The rate limiter, in detail

`src/whatsapp-web/whatsapp-web-rate-limiter.ts` — a sliding-window counter per
session, checked inside `deliver()` so **every** outbound path (bot and agent)
funnels through it and none can bypass it.

- **In-memory, per-process on purpose.** The ban risk is per-session, a session
  lives on exactly one process (one baileys socket per auth dir), so a
  process-local counter is the correct scope. A distributed counter would add
  Redis round-trips to the hot path for protection the single owner already has.
- Config: `WHATSAPP_WEB_SEND_RATE_LIMIT` (default 30) per
  `WHATSAPP_WEB_SEND_RATE_WINDOW_MS` (default 60s).
- A refused send throws `RATE_LIMITED`; the agent path maps it to `rate_limited`
  → **HTTP 429**, the bot path to a `failed` row. Verified empirically: a burst of
  5 at limit 3 → 3 allowed / 2 refused, other sessions unaffected, window recovers.

### 5.4 Still-open UX gaps (unchanged)

- No unread decrement broadcast when another agent reads a thread.
- No typing indicator / presence.
- No in-thread search.
- No composer draft persistence across thread switches (safe-by-design).
- **Media still 📎-only** — the largest visible gap, blocked on the raw-message
  retention decision in spec Req 4.

**`ensureConversationForThread` can create an unbounded number of
conversations.** Every reply to a thread whose conversation was expired by the
2-hourly cron creates a fresh one. Correct, but a long-lived thread accumulates
conversation rows indefinitely — worth confirming that is acceptable for the
reports before Phase 5's tenancy work makes it per-account.

### 5.3 Product/UX gaps

- **No unread badge decrement on the thread list when an agent reads elsewhere.**
  `markRead` clears the server count, but another agent's dashboard only learns via
  a full refetch.
- **No typing indicator or presence**, either direction. baileys supports both.
- **No search within a thread.** OpenWA leans on global search for this; we have
  neither.
- **The composer has no draft persistence.** Switching threads discards a typed
  message by design (correct for safety) but with no warning.
- **Media is still 📎-only** — the largest visible gap, blocked on the raw-message
  retention decision in spec Req 4.

#### Still open in Phase 4

- **Media download** (Req 4 of the spec). Blocked on a real constraint: baileys
  needs the *original message object* to decrypt media, and `emitMessage` drops it.
  The spec's criterion 19 states the retention needed (keyed by session + message
  id, 1000 most recent per session, LRU, no bytes). Until then media renders as 📎.
- **WhatsApp markup** (`*bold*` → AST). Spec Req 8 is written, including the
  depth-cap and iterative-sibling hardening; not yet implemented.
- **`whatsapp_web` in social reports** — still hardcoded to
  `facebook|whatsapp|telegram|widget`.
- **Rate limiting** on replies and media (spec Req 13). Not yet enforced.
- **Virtualisation** deferred with a committed bound of 300 rendered messages.

### Phase 5 — SaaS: tenancy, subscription gating, user service split

Prepare for this from Phase 1; do not retrofit later.

- **Tenancy.** No entity has `accountId` today. Add it to `Bot`, `Visitor`,
  `Conversation`, `Chat`, `ChannelThread`, `WhatsappWebSession`, with a
  migration and a compound index leading on `accountId`. Every inbox query goes
  through the Phase 1 `scopeFilter(user)` — that is the single place this lands.
- **Entitlements.** A channel tab must be gated by plan, not just by whether
  threads exist. Extend `GET /inbox/channels` to return
  `{ channel, threads, unread, entitled, locked_reason }`; the UI renders a
  locked tab with an upgrade CTA rather than hiding it (better conversion, and
  it keeps the tab list honest). Back it with a `subscription`/`plan` collection
  plus a `FeatureFlagsService`-style resolver.
- **Roles.** Existing gating is path-based, not CASL:
  `src/helper/Access.ts` + `VerticalNavItems.tsx`. CASL is unused scaffolding.
  Decide deliberately: extend `Access.ts` (fast, consistent) or migrate to CASL
  (correct long-term). Do **not** leave both half-wired.
  Roles today: `admin`, `agent`, `superadmin` (+ creator/auditor/management in
  `Access.ts`). Suggested inbox rules: superadmin/admin see all channels;
  agent sees assigned threads + unassigned in entitled channels; only
  admin+ can toggle bot on/off or delete a session.
- **User service extraction.** Auth/roles/tenancy move out. Keep the seam
  narrow now: the inbox module must depend only on
  `{ userId, role, accountId, botIds }` from the JWT payload, never on a user
  collection query. If Phase 1 obeys that, extraction is a token-shape change.
- **Provider abstraction cleanup.** Two overlapping systems exist:
  `MessagingProviderRegistry` (channel → provider, feature-flagged) and the
  direct `send-whatsapp-web-message` event path. Converge on the registry,
  add `whatsapp_web` to `ChannelEnum`, and route outbound through it. Otherwise
  every new platform gets wired twice.

---

## 5. Decisions to confirm before Phase 1

1. Thread-based inbox (`ChannelThread`) rather than conversation-based — agreed?
   It is the only model that survives the 2-hourly conversation expiry.
2. Socket rooms per bot on the existing `/socket.io/jarcube` path, vs a new
   dashboard namespace.
3. Media download in Phase 4 vs placeholder-only for the first release.
4. Locked-but-visible tabs for un-entitled channels vs hidden tabs.
5. `Access.ts` extension vs CASL migration for inbox permissions.

---

## 6. Quick reference — files that matter

**Backend**
```
src/inbox/**                                       NEW (Phase 1) — the channel inbox read API
src/whatsapp-web/whatsapp-web-inbound.service.ts   inbound + outbound pipeline + inbox event handlers
src/whatsapp-web/engine/baileys-engine.service.ts  baileys socket; history/read APIs now wired
src/channel-thread/channel-thread.service.ts       thread CRUD + listThreads (Phase 1)
src/channel-thread/entities/channel-thread.entity.ts
src/conversation/conversation.service.ts           saveChannelMessage, getThreadMessages (now used)
src/conversation/entities/{chat,conversation}.entity.ts
src/conversation/enums/platform.enum.ts            channel discriminator
src/redis-propagate/redis-propagate.service.ts:79  platform routing switch
src/jarcube/jarcube.gateway.ts                     socket gateway (no rooms)
src/message-handler/message-handler.service.ts     bot engine, sendBotMessage/emitEventToUser
```

**Frontend**
```
src/pages/apps/chat/active/index.tsx               default chat box page
src/views/apps/active-chat/*                       live chat components
src/views/apps/components/{Message,Images,Video,Audio}.tsx   reusable bubbles
src/store/apps/conversation/index.ts               real chat slice (pattern to copy)
src/store/apps/chat/index.ts                       DEAD template slice, ignore
src/store/apps/whatsapp-web/index.ts               session API helpers
src/services/socket.services.ts                    socket client
src/context/AuthContext.tsx:94-124                 socket → redux wiring
src/components/PlatforomIcons.tsx                  channel icon map
src/helper/{Axios,Access}.ts                       API instance + role gating
src/navigation/vertical/index.ts                   menu items
src/views/social/list/WhatsappWebQrModal.tsx:121    MUI Tabs pattern to copy
```

**Stack:** MUI 5.10.6, React 18.1, Next ^12.3.1, RTK 1.8.3, socket.io-client ^4.5.3.
