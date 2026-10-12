# Requirements Document

## Introduction

Phase 4 of the omnichannel inbox turns the read-only channel inbox delivered in
Phases 1–3 into a two-way console, and closes the fidelity gaps the read path
left behind.

Today an agent can see a WhatsApp Web thread but cannot answer it: the message
pane carries a literal "Replying from the dashboard is coming next" notice. The
thread's `botEnabled` / `handledByAgent` flags exist and are honoured by the
inbound router, but no endpoint writes them, so a human can never take a
conversation over. Media messages are recorded with `mediaOmitted: true` and the
bytes are never downloaded, so every attachment renders as a permanent 📎 with no
way to reach the content. WhatsApp markup (`*bold*`, `_italic_`) renders as
literal asterisks. And `whatsapp_web` is missing from the social report platform
lists, so the channel is invisible in analytics.

This phase adds:

1. An agent reply endpoint that reuses the existing outbound pipeline so
   delivery receipts continue to bind.
2. Per-thread bot pause plus agent takeover/release.
3. A media decision — download-on-first-request into the existing storage layer,
   with per-message keyed fetch state.
4. Optimistic send with an echo-race fold that preserves placeholder-only data.
5. WhatsApp markup rendered through a depth-capped AST.
6. Delivery ticks that stay correct across an optimistic send.
7. `whatsapp_web` in the social report platform lists.

Scope boundaries carried forward from earlier phases and treated as fixed here:

- **The architecture does not change.** No new socket, no new gateway, no new
  namespace, no `@socket.io/redis-adapter`. Fan-out continues through
  EventEmitter2 + `RedisPropagatorService` + the per-userId socket registry.
- **The existing "Live Chat" tab is untouched.** Its components remain
  byte-identical.
- **`InboxService.scopeFilter(user)` stays the single scoping seam.** Multi-tenancy
  is Phase 5; every new endpoint here funnels ownership through `requireThread`.
- **OpenWA's pure utils port near-verbatim; its hooks do not.** New frontend state
  lives in the existing RTK slice with `createAsyncThunk` + `src/helper/Axios` +
  `toast.error`, reducers in `extraReducers`.
- **Cost and ban risk govern the media and history paths.** WhatsApp Web is an
  unofficial protocol; every recurring round trip is a liability. Techniques
  already established (per-thread on-demand history, `historyExhausted`, cooldown,
  fetch-once-then-serve-from-DB) are extended, never regressed.

Two decisions are recorded here as requirements rather than left to
implementation: the **media storage strategy** (Requirement 4) and **list
virtualisation** (Requirement 11).

## Glossary

- **Inbox_API**: the `src/inbox` NestJS module — `InboxController`,
  `InboxService`, `InboxMapper`, `InboxEventsService`. All routes JWT-guarded.
- **Channel_Hub**: `WhatsappWebInboundService`, the per-channel bridge holding
  `onSend`, `resolveSendTarget`, `deliver`, `announceToInbox`, `resolveBotId`, and
  the `@OnEvent` handlers for inbox-issued intents.
- **Engine**: `BaileysEngineService` — the in-process baileys socket per session.
  `requireSock` throws when a session is not `ready`.
- **Channel_Thread**: a `ChannelThread` document; the durable, channel-agnostic
  conversation unit. Outlives any single `Conversation`.
- **Chat_Row**: a `Chat` document. `Chat.chatId` is the **correlation id**;
  `Chat.externalMessageId` is the channel-native id.
- **Correlation_Id**: the locally generated `Chat.chatId` value that
  `linkOutboundChannelMessage` matches on to stamp the channel-native id onto an
  already-written outbound row.
- **Delivery_Ladder**: `pending → sent → delivered → read`, plus terminal
  `failed`, ranked by `CHAT_STATUS_RANK` and gated by `allowedPreviousStatuses`.
- **Inbox_Slice**: the frontend RTK slice at `src/store/apps/inbox/index.ts`.
- **Merge_Utils**: the pure helpers at `src/store/apps/inbox/merge.ts` —
  `messageKey`, `mergeOrAppend`, `mergeDeliveryStatus`, `mergePage`,
  `applyStatus`.
- **Composer**: the reply input inside `ThreadContent.tsx`.
- **Optimistic_Message**: a client-only placeholder rendered at submit time,
  carrying a temporary id and `pending` status, before any server response.
- **Echo**: the `inbox:message` socket event describing a message the dashboard
  itself just sent.
- **Markup_Parser**: the pure function converting WhatsApp markup text into an
  AST of formatting nodes.
- **Markup_Renderer**: the React component rendering a Markup_Parser AST.
- **Media_Store**: the existing `UploadService` storage layer (`local` disk mode
  served at `/api/file`, or `s3`), selected by `file.storage` config.
- **Report_Service**: the report aggregations in `ConversationService`
  (`TotalCountPlatform`, `DayWisePlatform`, and peers) plus the report page at
  `src/pages/reports/social/index.tsx`.
- **Agent**: an authenticated dashboard user with role `agent`, `admin`, or
  `superadmin`.

## Requirements

### Requirement 1: Agent reply over an existing channel thread

**User Story:** As an agent, I want to type a reply into a channel thread and
have it delivered to the customer on that channel, so that I can answer a
WhatsApp conversation from the dashboard instead of a phone.

#### Acceptance Criteria

1. THE Inbox_API SHALL expose `POST /api/inbox/threads/:id/messages` accepting a
   body of `{ message?: string, type?: string, mediaUrl?: string, mimetype?: string, fileName?: string, quotedMessageId?: string }`,
   where `message` is 1–4096 characters after trimming, `type` is one of `text`,
   `image`, `video`, `audio`, or `file` and defaults to `text`, and
   `quotedMessageId` is at most 256 characters.
2. WHEN `POST /api/inbox/threads/:id/messages` is called, THE Inbox_API SHALL
   resolve the target thread through `requireThread` before any other work.
3. IF the target thread is outside the caller's `scopeFilter` result, THEN THE
   Inbox_API SHALL respond `404`.
4. IF the request body carries neither a non-empty trimmed `message` nor a
   `mediaUrl`, THEN THE Inbox_API SHALL respond `400` and write no Chat_Row.
5. WHEN a reply is accepted, THE Inbox_API SHALL write exactly one Chat_Row
   before dispatching to the Channel_Hub, with `direction: outbound`,
   `status: pending`, `channelThread` set to the thread id, `sender` set to the
   acting Agent's id, `conversationId` set per criterion 13, and `chatId` set to a
   freshly generated Correlation_Id unique across all Chat_Rows.
6. WHEN a reply's Chat_Row has been written, THE Inbox_API SHALL request delivery
   by publishing one channel-agnostic delivery intent whose handler returns a
   delivery outcome, SHALL await that outcome for at most 30 seconds, and SHALL
   NOT import or reference the Engine.
7. WHEN the channel accepts a reply, THE Channel_Hub SHALL stamp the
   channel-native id onto the Chat_Row exactly once through
   `linkOutboundChannelMessage`, matched on the Correlation_Id.
8. WHEN a reply's channel-native id has been stamped, THE Channel_Hub SHALL
   advance that Chat_Row from `pending` to `sent`, honouring
   `allowedPreviousStatuses('sent')`.
9. WHEN a reply is delivered, THE Channel_Hub SHALL refresh the thread's
   `lastMessage` and `lastMessageAt` with the reply's content and the channel's
   reported timestamp, falling back to the send completion time when the channel
   reports none, and SHALL NOT raise the thread's `unreadCount`.
10. WHEN a reply has been persisted and stamped, THE Channel_Hub SHALL publish it
    exactly once on `inbox:message` through `InboxEventsService`, using the linked
    Chat_Row and not the raw outbound payload, and SHALL omit `platform` from the
    propagated event.
11. THE Inbox_API SHALL respond to a successful reply with the reply's
    Correlation_Id, its Chat_Row id, its channel-native id, and its status.
12. THE Inbox_API SHALL route replies for every channel through the same endpoint
    and the same single delivery intent, and each Channel_Hub SHALL act only on
    intents naming its own channel, so that adding a channel requires only a
    handler in that channel's Channel_Hub.
13. WHEN a reply is accepted, THE Inbox_API SHALL attach the Chat_Row to the
    thread's current conversation while that conversation's status is
    `in_progress`, and SHALL otherwise attach a fresh conversation to the
    thread's existing visitor and record it on the thread before writing the
    Chat_Row, so that a conversation expired by the 2-hourly cron cannot leave a
    reply unpersisted.
14. IF `linkOutboundChannelMessage` returns no row after the channel accepted a
    reply, THEN THE Inbox_API SHALL respond `5xx` with a machine-readable reason
    of `link_failed`, SHALL leave the Chat_Row at `status: pending`, and SHALL
    publish no `inbox:message` for that reply.
15. WHEN a reply is sent, THE Inbox_API SHALL leave the thread's `botEnabled`,
    `handledByAgent`, and `assignedAgent` values unchanged, so that ownership
    changes only through the bot-control endpoint.

### Requirement 2: A reply is never silently lost

**User Story:** As an agent, I want a reply that cannot be delivered to fail
visibly, so that I never believe a customer received an answer that was never
sent.

#### Acceptance Criteria

1. IF, at the moment a reply is submitted, the Engine reports the session backing
   the target thread in any status other than `ready`, THEN THE Inbox_API SHALL
   respond `409` with a machine-readable reason of `session_not_connected`, SHALL
   write no Chat_Row, and SHALL make no send attempt. This pre-check is a
   fast-fail optimisation only and is NOT the guarantee that a reply was
   delivered; the authoritative outcome is the accept-or-reject result in
   criterion 11.
2. IF `resolveSendTarget` returns no reply address for the target thread, THEN
   THE Inbox_API SHALL respond `409` with a machine-readable reason of
   `no_reply_target`, and SHALL write no Chat_Row.
3. IF the Engine rejects a reply, THEN THE Inbox_API SHALL choose the response
   class by the cause: a rejection attributable to the submitted request — an
   unroutable or malformed recipient address, or a message type the channel does
   not accept — SHALL be answered `422` with a machine-readable reason of
   `invalid_send_request`; a rejection attributable to the session or transport —
   socket closed, credential store unusable, or any error the request content
   cannot change — SHALL be answered `5xx` with a machine-readable reason of
   `channel_send_failed`. Every response SHALL carry exactly one machine-readable
   reason drawn from `session_not_connected`, `no_reply_target`,
   `invalid_send_request`, `channel_send_failed`, `channel_send_timeout`,
   `link_failed`, `rate_limited`, and SHALL NOT require human-readable text to be
   classified.
4. WHEN a reply's delivery attempt fails for any reason after its Chat_Row was
   written, THE Inbox_API SHALL set that reply's Chat_Row `status` to `failed`
   only while that row's current status is `pending` or `sent`, matching
   `allowedPreviousStatuses('failed')`.
5. IF a `failed` write is refused because the reply's Chat_Row has already
   advanced to `delivered` or `read`, THEN THE Inbox_API SHALL leave that row's
   status unchanged, SHALL publish no `failed` status, and SHALL respond `2xx`,
   because a row at `delivered` or `read` is evidence the channel took the
   message.
6. WHEN a reply's Chat_Row is set to `failed`, THE Channel_Hub SHALL publish the
   `failed` status on `inbox:message-status`, identifying the reply by its
   channel-native id when one was stamped and by its Correlation_Id when none
   was, so that a reply that failed before acceptance is still addressable.
7. WHEN a reply request returns a non-2xx response, THE Composer SHALL keep the
   Agent's typed text in the input unchanged character for character, and SHALL
   keep any staged attachment and selected quote.
8. WHEN a reply request returns a non-2xx response, THE Composer SHALL mark that
   Optimistic_Message `failed` and SHALL surface the failure through exactly one
   `toast.error` per failed submission, naming the machine-readable reason
   returned.
9. WHILE a reply is marked `failed`, THE Composer SHALL offer a retry action for
   that reply for as long as it is rendered in the open thread, SHALL place no
   upper limit on manual retries, and SHALL NOT retry automatically.
10. WHEN an Agent retries a failed reply, THE Composer SHALL submit it under a
    freshly generated Correlation_Id producing a new Chat_Row, and THE Inbox_API
    SHALL leave the superseded row in place with `status: failed` and no
    channel-native id, neither deleting it nor reusing its Correlation_Id, so that
    `linkOutboundChannelMessage` cannot bind the retry's channel-native id onto
    the failed row.
11. THE Inbox_API SHALL respond to a reply request only after the Engine has
    either accepted or rejected the message, so that a `2xx` response means the
    channel took the message.
12. IF the session transitions out of `ready` after the pre-check in criterion 1
    and before the Engine accepts the message, THEN THE Inbox_API SHALL treat the
    resulting error as an Engine rejection under criterion 3 and SHALL apply the
    `failed` transition in criterion 4, so that the time-of-check to time-of-use
    window can lose no reply.
13. IF the Engine neither accepts nor rejects a submitted reply within 30 seconds,
    THEN THE Inbox_API SHALL abandon the attempt, respond `5xx` with a
    machine-readable reason of `channel_send_timeout`, and apply the `failed`
    transition in criterion 4.
14. WHILE the Engine reports the session backing the open thread in any status
    other than `ready`, THE Composer SHALL disable its submit control and SHALL
    retain any typed text, so that a disconnected session is visible before
    submission rather than only after a failed one.

### Requirement 3: Per-thread bot control and agent takeover

**User Story:** As an agent, I want to pause the bot on one thread and take it
over myself, so that I can handle a conversation the bot is mishandling without
disabling the bot for everyone.

#### Acceptance Criteria

1. THE Inbox_API SHALL expose `PATCH /api/inbox/threads/:id/bot` accepting a body
   of `{ botEnabled?: boolean, action?: 'takeover' | 'release' }`, and SHALL
   reject a body whose `botEnabled` is not a boolean or whose `action` is not
   exactly `takeover` or `release` with `400` and a machine-readable reason of
   `invalid_bot_control`, writing no change.
2. WHEN `PATCH /api/inbox/threads/:id/bot` is called, THE Inbox_API SHALL resolve
   the thread through `requireThread` before applying any change, and SHALL
   respond `404` when the thread is outside the caller's `scopeFilter` result.
3. WHEN the request carries `botEnabled`, THE Inbox_API SHALL apply exactly that
   value through `ChannelThreadService.setBotEnabled` and SHALL leave the
   thread's `handledByAgent` and `assignedAgent` values unchanged.
4. WHEN the request carries `action: 'takeover'`, THE Inbox_API SHALL apply
   `ChannelThreadService.assignToAgent` with the acting Agent's id, and SHALL
   respond `200` with the unchanged thread when that thread's `assignedAgent`
   already is the acting Agent, so that a repeated takeover is idempotent.
5. WHEN the request carries `action: 'release'`, THE Inbox_API SHALL apply
   `ChannelThreadService.releaseToBot`, leaving the thread with
   `handledByAgent: false`, `botEnabled: true`, and no `assignedAgent`.
6. IF the request carries both `botEnabled` and `action`, THEN THE Inbox_API SHALL
   respond `400` with a machine-readable reason of `ambiguous_bot_control` and
   SHALL write no change, because `assignToAgent` and `releaseToBot` each already
   write `botEnabled` and two authorities over one field would produce an
   ambiguous result.
7. IF the request carries neither `botEnabled` nor `action`, THEN THE Inbox_API
   SHALL respond `400` with a machine-readable reason of `no_bot_control_field`,
   SHALL write no change, and SHALL publish no event.
8. WHEN a bot-control change has been committed to the Channel_Thread, THE
   Inbox_API SHALL publish the updated thread on `inbox:thread-updated` within 2
   seconds of the commit, and SHALL publish nothing when the write did not commit,
   so every watching dashboard converges without a refetch.
9. THE Inbox_API SHALL respond to a bot-control change with the updated thread in
   the same `InboxThreadView` shape the read endpoints return, carrying the
   post-change `botEnabled`, `handledByAgent`, and `assignedAgent` values.
10. WHILE a thread has `botEnabled: false` and no assigned agent, THE Channel_Hub
    SHALL persist inbound messages on that thread, SHALL send no bot reply, and
    SHALL forward the message to no agent, for an unbounded duration that ends
    only at the next explicit bot-control change, with no auto-resume timer and
    with the paused state surviving a process restart.
11. WHILE a thread has `handledByAgent: true` and an assigned agent, THE
    Channel_Hub SHALL forward each inbound message to that agent exactly once,
    SHALL send no bot reply, and SHALL treat the thread's stored flags as the sole
    authority even when the in-memory socket state names a different owner or no
    owner.
12. WHEN a thread's ownership changes, THE Inbox_Slice SHALL update that thread
    row in place, SHALL preserve the existing order of the thread list, and SHALL
    issue no refetch, so that a row does not move under the Agent's cursor.
13. THE ThreadContent header SHALL render the thread's current owner by this
    precedence: named agent when `handledByAgent` is true and `assignedAgent` is
    set, paused when `botEnabled` is false and `assignedAgent` is absent, and bot
    when `botEnabled` is true and `handledByAgent` is false.
14. WHERE a channel's capability map sets `botToggle: false`, THE ThreadContent
    header SHALL render the ownership state as text with its control disabled and
    SHALL issue no bot-control request for that thread.
15. WHERE the acting Agent's role is `agent`, IF the request carries
    `action: 'takeover'` or `action: 'release'` for a thread whose
    `assignedAgent` is a different Agent, THEN THE Inbox_API SHALL respond `409`
    with a machine-readable reason of `thread_owned_by_other_agent` and SHALL
    leave `botEnabled`, `handledByAgent`, and `assignedAgent` unchanged.
16. WHERE the acting Agent's role is `admin` or `superadmin`, WHEN the request
    carries `action: 'takeover'` or `action: 'release'` for a thread whose
    `assignedAgent` is a different Agent, THE Inbox_API SHALL apply the change and
    SHALL overwrite `assignedAgent` with the result of that action, so that a
    thread held by an unavailable agent can be reclaimed.
17. WHEN a bot-control change has been committed to the Channel_Thread, THE
    Inbox_API SHALL overwrite the in-memory socket state for that thread's visitor
    so its owner fields equal the thread's committed `handledByAgent` and
    `assignedAgent` values, clearing the assigned agent on release.

### Requirement 4: Media download, storage, and retrieval

**User Story:** As an agent, I want to open an attachment a customer sent, so
that I can see the photo or document the conversation is about.

**Decision recorded:** media bytes are **downloaded on first request** and
persisted to the Media_Store; they are neither eagerly downloaded at receive time
nor proxied fresh on every view. Eager download would pay bandwidth and ban-risk
budget for every attachment in every thread including ones nobody opens.
Proxy-on-demand would repeat that cost on every view and every page reload.
Download-once-then-serve converts a recurring cost into a one-time cost, matching
the technique already used for history paging. `Chat.mediaUrl`, `mimetype`,
`fileName`, and `mediaOmitted` already exist to hold the result.

#### Acceptance Criteria

1. WHEN a media message is received, THE Channel_Hub SHALL persist the Chat_Row
   with `mediaOmitted: true` and no `mediaUrl`, so that receiving a message costs
   no media bandwidth.
2. THE Inbox_API SHALL expose `POST /api/inbox/threads/:id/messages/:messageId/media`
   returning a JSON body of `{ url, mimetype, fileName, sizeBytes }`, and SHALL
   NOT return the media bytes themselves.
3. WHEN the media route is called, THE Inbox_API SHALL resolve the thread through
   `requireThread` and SHALL confirm the requested message belongs to that thread
   before contacting the channel.
4. IF the requested message does not belong to the resolved thread, THEN THE
   Inbox_API SHALL respond `404`.
5. IF the requested message's Chat_Row already holds a `mediaUrl`, THEN THE
   Inbox_API SHALL return that URL without contacting the channel, for as long as
   the stored object is retained; retention SHALL be configurable between 1 and
   3650 days and SHALL default to indefinite.
6. WHEN media bytes are retrieved from the channel, THE Inbox_API SHALL store them
   through the existing Media_Store, SHALL write the resulting URL to the
   Chat_Row's `mediaUrl` together with `mimetype` and `fileName`, and SHALL make
   the stored object retrievable only by an authenticated caller, so that a
   customer's attachment does not become a publicly readable URL.
7. WHEN a Chat_Row's `mediaUrl` is written, THE Inbox_API SHALL set that row's
   `mediaOmitted` to `false`.
8. WHEN a message's media has been stored, THE Inbox_API SHALL publish the
   updated message on `inbox:message` so every watching dashboard resolves the
   placeholder without a refetch.
9. WHILE a media download for one message is already in flight, THE Inbox_API
   SHALL return the in-flight result for a second request for that same message
   rather than starting a second download, keyed on session and message id, and
   SHALL abandon a single attempt after 60 seconds.
10. IF the channel reports the requested message's media as unretrievable or
    expired, THEN THE Inbox_API SHALL respond `410` with a machine-readable reason
    of `media_expired`, and SHALL leave `mediaOmitted: true` on the Chat_Row.
11. IF the media's reported or retrieved size exceeds the configured maximum media
    size, THEN THE Inbox_API SHALL discard the bytes, respond `413` with a
    machine-readable reason of `media_too_large`, and leave `mediaOmitted: true`
    on the Chat_Row; that maximum SHALL default to 25 MiB.
12. THE Inbox_API SHALL enforce a per-session rate limit on media downloads,
    defaulting to 20 channel-contacting downloads per session per 60 seconds, and
    SHALL NOT count requests satisfied from stored media against that limit.
13. IF a media download is refused by the rate limit, THEN THE Inbox_API SHALL
    respond `429` with a machine-readable reason of `rate_limited`.
14. THE ThreadLog SHALL track media fetch state in a map keyed by message id whose
    values are exactly one of `idle`, `loading`, `done`, or `failed`, and each
    fetch SHALL write only its own message's entry, so that a second placeholder
    clicked while the first is in flight cannot overwrite the first's state.
15. WHILE a message's media fetch state is `loading`, THE ThreadLog SHALL render
    that message's placeholder as busy and SHALL reject further clicks on it.
16. IF a media fetch fails, THEN THE ThreadLog SHALL set that message's state to
    `failed` and SHALL allow the Agent to click it again.
17. WHEN a Chat_Row carries a `mediaUrl`, THE ThreadLog SHALL render the media
    inline where its `mimetype` begins with `image/` or `video/`, and as a
    download link otherwise.
18. WHEN an incoming message copy carries `omitted: true` and no `url`, THE
    Merge_Utils SHALL keep an existing copy's `url`, `mimetype`, and `fileName`.
19. WHEN a media message is received, THE Channel_Hub SHALL retain whatever the
    channel requires to download that message's bytes later, keyed by session and
    channel-native message id, bounded to the 1000 most recent media messages per
    session with least-recently-used eviction, and SHALL retain no media bytes.
20. IF the session backing the target thread is in any status other than `ready`
    when a media download is requested, THEN THE Inbox_API SHALL respond `409`
    with a machine-readable reason of `session_not_connected` and SHALL leave
    `mediaOmitted: true`.
21. IF a media download fails for a transient reason rather than a channel report
    of expiry, THEN THE Inbox_API SHALL respond `502` with a machine-readable
    reason of `media_fetch_failed`, SHALL leave `mediaOmitted: true`, and SHALL
    permit a later retry for that message.
22. IF the retained download material for a message has been evicted, THEN THE
    Inbox_API SHALL respond `410` with a machine-readable reason of
    `media_expired`, so that an un-downloadable placeholder is stated rather than
    retried indefinitely.

### Requirement 5: Outbound media from the composer

**User Story:** As an agent, I want to attach a file to my reply, so that I can
send a customer a document or an image.

#### Acceptance Criteria

1. WHERE the target channel's capability map sets `media: true`, THE Composer
   SHALL offer an attachment control, and WHERE it sets `media: false` THE
   Composer SHALL offer none.
2. WHEN an Agent stages an attachment, THE Composer SHALL upload it through the
   existing upload endpoint within a 60-second timeout and SHALL submit the
   resulting URL with the reply.
3. WHEN a reply carries a media URL, THE Inbox_API SHALL write the Chat_Row with
   `type` set to `image`, `video`, `audio`, or `file` according to the attachment's
   mime type, together with `mediaUrl`, `mimetype`, and `fileName`.
4. WHEN a reply carries a media URL, THE Channel_Hub SHALL deliver it through the
   existing `deliver` method's media branches rather than a new send path, and the
   submitted URL SHALL be absolute, including scheme and host, and fetchable by
   the Channel_Hub without an Agent credential, because the channel fetches that
   URL server-side.
5. IF a staged attachment's mime type is not one the target channel accepts, THEN
   THE Composer SHALL reject it before upload and SHALL name the rejected type.
6. WHEN a reply carrying an attachment is submitted, THE Composer SHALL clear the
   staged attachment only after the reply has been dispatched, and SHALL retain it
   when the reply fails.
7. WHEN a reply carrying a media URL is received, THE Inbox_API SHALL revalidate
   the attachment's type and size regardless of any client-side check, and IF
   either is unacceptable THEN it SHALL respond `422` with a machine-readable
   reason of `unsupported_media` and SHALL write no Chat_Row.
8. IF the Channel_Hub cannot fetch a submitted media URL, THEN THE Inbox_API SHALL
   apply the `failed` transition of Requirement 2 criterion 4, SHALL publish that
   status on `inbox:message-status`, and SHALL NOT retry the fetch automatically.
9. WHEN the Agent opens a different thread, THE Composer SHALL discard any staged
   attachment and SHALL discard the result of any upload still in flight, so that
   an attachment staged against one contact can never be sent to another.
10. WHEN a reply carrying both an attachment and a selected quote is submitted,
    THE Composer SHALL include the media URL and the `quotedMessageId` in the same
    request, so that replying with an attachment does not drop the quote.
11. THE Composer SHALL reject a staged video larger than 4 MB and any other staged
    attachment larger than 2 MB before upload, matching the limits the existing
    agent console applies.

### Requirement 6: Optimistic send and echo-race fold

**User Story:** As an agent, I want my reply to appear in the thread the instant
I press send, so that the console feels responsive and I can see what I have
already said.

#### Acceptance Criteria

1. WHEN an Agent submits a reply, THE Inbox_Slice SHALL append an
   Optimistic_Message to the open thread's loaded message list before the reply's
   HTTP request is dispatched and within 100 milliseconds of submit, carrying a
   temporary id unique among all rows held for that thread, the reply's
   Correlation_Id, `direction: outbound`, `status: pending`, the submitted text,
   any staged media reference, any `quotedMessageId`, and a client-clock
   timestamp.
2. WHEN an Optimistic_Message is appended, THE Composer SHALL clear the input text
   within the same render commit and SHALL retain a copy of the submitted text,
   staged media reference, and `quotedMessageId` until that reply reaches `sent`
   or `failed`, so that the retry path required by Requirement 2 has the original
   content to resubmit.
3. WHEN a reply request resolves successfully and no Echo for that reply has yet
   been folded into the thread, THE Inbox_Slice SHALL reconcile the
   Optimistic_Message in place by replacing its temporary id with the returned
   Chat_Row id and setting its channel-native id from the response, SHALL advance
   its status through `mergeDeliveryStatus` rather than by assignment, SHALL keep
   its position in the list unchanged, and SHALL leave exactly one row for that
   reply.
4. IF the Echo for a reply has already been folded into the thread when that
   reply's HTTP response arrives, THEN THE Inbox_Slice SHALL fold the
   Optimistic_Message's fields into the existing Echo row through `mergeOrAppend`,
   SHALL remove the temporary-id row in the same state update, and SHALL leave
   exactly one row for that reply.
5. WHEN an Optimistic_Message is folded into an Echo, THE Merge_Utils SHALL retain
   the Optimistic_Message's value for every field whose incoming Echo value is
   `undefined`, covering at minimum the staged media reference and its file name
   and mime type, `quotedMessageId`, `authorName`, and the message text, and SHALL
   take the Echo's value for every field the Echo defines, including its
   server-supplied timestamp.
6. THE Inbox_Slice SHALL render exactly one message row for any set of copies of
   the same reply — Optimistic_Message, HTTP response identity, and Echo — for
   each of the arrival orderings response-then-Echo, Echo-then-response, and
   Echo-only-with-no-response-yet, and SHALL render exactly one row for an Echo
   for which no Optimistic_Message exists; a second row for the same reply at any
   point in any ordering SHALL be a failure of this criterion.
7. THE Merge_Utils SHALL merge each field of an incoming message against the held
   copy individually and SHALL NOT let a wholesale object spread decide any
   field's value, such that an incoming field of `undefined` never replaces a
   defined held value for `authorName`, `quotedMessageId`, `direction`, message
   text, Correlation_Id, or any media field, and such that `status` is resolved
   only through `mergeDeliveryStatus`.
8. WHILE an Optimistic_Message holds no channel-native id, THE Merge_Utils SHALL
   treat its temporary id as its identity for `messageKey` purposes, and WHEN an
   Echo carrying a channel-native id is matched to that Optimistic_Message, THE
   Merge_Utils SHALL fold the two into the row already held rather than appending
   a row under the differing key.
9. WHEN an incoming Echo is folded into a thread, THE Merge_Utils SHALL attempt
   identity matching in the order Correlation_Id, then channel-native id, then
   Chat_Row id, and SHALL stop at the first match; IF the Echo carries no
   Correlation_Id and no held row matches on either id, THEN THE Inbox_Slice SHALL
   hold that Echo unrendered while any Optimistic_Message in that thread is
   `pending`, and SHALL release it into the list — folding it if a matching
   identity has since become known and appending it otherwise — as soon as the
   reply response resolves or 30 seconds elapse, whichever comes first.
10. WHEN an Optimistic_Message is appended, THE ThreadLog SHALL scroll to the
    bottom of the thread within one animation frame of the append, regardless of
    the Agent's prior scroll position.
11. WHEN an incoming message arrives, THE ThreadLog SHALL scroll to the bottom
    only if the distance from the Agent's scroll position to the bottom of the
    scroll container, measured before the new message is committed to the DOM, is
    100 pixels or less; IF that measured distance exceeds 100 pixels, THEN THE
    ThreadLog SHALL leave the scroll position unchanged.
12. THE Inbox_API SHALL include an outbound message's Correlation_Id both in the
    reply response and in every `inbox:message` payload it publishes for that
    message, so that the client has the key criterion 9 matches on; an Echo for an
    outbound message published without its Correlation_Id SHALL be a failure of
    this criterion.
13. IF an Optimistic_Message has remained `pending` for 30 consecutive seconds
    without its reply response resolving and without an Echo folding into it,
    THEN THE Inbox_Slice SHALL set that row's status to `failed`, SHALL keep the
    row rendered, and SHALL retain its text, staged media reference, and
    `quotedMessageId` so the Requirement 2 retry action can resubmit it.
14. THE Inbox_Slice SHALL hold Optimistic_Messages in memory only and SHALL
    discard every row still carrying a temporary id whenever a thread's cached
    message list is cleared or reloaded, so that no temporary-id row survives a
    page reload or a socket-gap cache clear.

### Requirement 7: Delivery ticks stay correct across an optimistic send

**User Story:** As an agent, I want the tick under my reply to only ever move
forward, so that I can trust it as a statement about delivery.

#### Acceptance Criteria

1. THE ThreadLog SHALL render an outbound message's Delivery_Ladder position from
   that message's `status` field.
2. WHERE the target channel's capability map sets `deliveryTicks: false`, THE
   ThreadLog SHALL render no tick.
3. WHEN a status event arrives for a message already at an equal or higher
   Delivery_Ladder rank, THE Merge_Utils SHALL keep the existing status.
4. WHEN a `failed` status arrives for a message already `delivered` or `read`,
   THE Merge_Utils SHALL keep the existing status.
5. WHEN a status arrives that is not a member of the Delivery_Ladder, THE
   Merge_Utils SHALL keep the existing status.
6. WHILE a reply has no channel-native id, THE ThreadLog SHALL render it at the
   `pending` position.
7. WHEN a status event names a channel-native id that no held message carries,
   THE Inbox_Slice SHALL leave the thread's message list unchanged, because
   receipts also arrive for messages sent from the operator's own phone.
8. THE Merge_Utils Delivery_Ladder ranks SHALL match the backend's
   `CHAT_STATUS_RANK` values, so that client and server cannot disagree about
   which transitions advance.

### Requirement 8: WhatsApp markup rendering

**User Story:** As an agent, I want `*bold*` and `_italic_` to render as
formatting, so that a thread reads the way it does on the customer's phone.

#### Acceptance Criteria

1. WHEN the Markup_Parser encounters a marker pair, THE Markup_Parser SHALL
   convert `*text*` into a bold node, `_text_` into an italic node, `~text~` into
   a strikethrough node, and text fenced by triple backticks into a monospace
   node, and SHALL treat a marker as an opener only where the character before it
   is a string start or a boundary character and the character immediately after
   it is not whitespace, and as a closer only where the mirror holds — so that
   `a*b*c` and `* b *` produce literal text while `*b*` produces a bold node.
2. THE Markup_Parser SHALL return an AST of nodes and SHALL NOT return an HTML
   string, so that no message content reaches the DOM as markup.
3. THE Markup_Parser SHALL support nesting of formatting nodes up to a depth of
   20 and SHALL emit no AST deeper than 20 levels.
4. WHEN input nesting exceeds depth 20, THE Markup_Parser SHALL emit the
   remaining input as a single literal text node including its markers.
5. THE Markup_Parser SHALL emit sibling nodes iteratively rather than
   recursively, so that input producing 10,000 sibling segments does not exhaust
   the call stack.
6. THE Markup_Parser SHALL append child nodes without applying a spread of an
   array into a variadic call, so that appending 100,000 nodes cannot exceed the
   engine's argument limit.
7. IF a marker is unmatched or violates the boundary conditions in criterion 1,
   THEN THE Markup_Parser SHALL emit that marker as literal text.
8. FOR ALL input strings up to 65,536 characters, the concatenation of the text
   content of every node the Markup_Parser emits SHALL equal the input string, so
   that no character of a customer's message is lost or duplicated by formatting.
9. THE Markup_Renderer SHALL render every node type the Markup_Parser can emit as
   React elements or text nodes, SHALL render an unrecognised node type as its
   literal text content, and SHALL NOT use `dangerouslySetInnerHTML` or assign
   `innerHTML` for any part of a message.
10. THE Markup_Renderer SHALL render both inbound and outbound bubbles, so that
    an Agent sees their own formatting the way the customer will.
11. THE Markup_Parser SHALL be a pure function taking a string and returning an
    AST, with no React and no store dependency, and SHALL return an identical AST
    for identical input on every call.
12. WHEN the Markup_Parser processes input, THE Markup_Parser SHALL resolve
    monospace segments before any other marker, taking triple-backtick fences
    before single backticks, and SHALL leave every bold, italic, and
    strikethrough marker inside a monospace segment as literal text.
13. FOR ALL input strings up to 65,536 characters, including deeply nested,
    highly repetitive, and unmatched-marker input, THE Markup_Parser SHALL return
    an AST without throwing and SHALL complete within 50 milliseconds.
14. THE Markup_Renderer SHALL be a component the ThreadLog consumes, and the
    message bubble component shared with the Live Chat tab SHALL continue to
    render its text as a plain string, so that markup rendering reaches the
    channel tabs without altering the Live Chat tab's behaviour.

### Requirement 9: Composer behaviour and quoted replies

**User Story:** As an agent, I want to reply to a specific message in a long
thread, so that the customer knows what I am answering.

#### Acceptance Criteria

1. THE Composer SHALL submit on Enter and SHALL insert a newline on Shift+Enter.
2. WHILE the Composer's text is empty and no attachment is staged, THE Composer
   SHALL disable its submit control.
3. WHERE the target channel's capability map sets `quotedReply: true`, THE
   ThreadLog SHALL offer a reply action on each message.
4. WHEN an Agent selects a message to reply to, THE Composer SHALL display a
   quote banner naming that message.
5. WHEN a reply is submitted with a quote selected, THE Composer SHALL include
   that message's channel-native id as `quotedMessageId`.
6. IF the quoted message has no channel-native id, THEN THE Composer SHALL submit
   the reply without a `quotedMessageId`.
7. WHEN a reply is dispatched, THE Composer SHALL clear the quote banner.
8. WHEN a thread is opened, THE Composer SHALL clear any draft text and quote
   belonging to the previously open thread.
9. WHILE the target thread's channel session is not connected, THE Composer SHALL
   display that the channel is disconnected.

### Requirement 10: `whatsapp_web` in social reports

**User Story:** As an admin, I want WhatsApp Web conversations counted in the
social reports, so that the channel's volume is visible in analytics.

#### Acceptance Criteria

1. THE Report_Service SHALL include `whatsapp_web` in every platform breakdown
   that already includes `facebook`, `whatsapp`, `telegram`, and `widget`.
2. THE Report_Service SHALL derive its platform list from `PlatformEnum` rather
   than from a literal list, so that a future channel appears without another
   edit.
3. WHEN a platform has no conversations in the requested range, THE Report_Service
   SHALL report a count of zero for that platform rather than omitting it.
4. THE social report page SHALL label the `whatsapp_web` series distinctly from
   the `whatsapp` series.
5. THE Report_Service SHALL leave the counts reported for existing platforms
   unchanged, so that adding a platform does not move historical numbers.

### Requirement 11: List rendering under long threads

**User Story:** As an agent, I want a long thread to stay responsive as I scroll
back through it, so that reading history does not lock up the console.

**Decision recorded:** Phase 4 **defers** DOM virtualisation and instead bounds
the rendered list. OpenWA's own doc warns that adding windowing later is harder
than starting with it, and that warning is accepted rather than dismissed —
however, our window is already cursor-paginated rather than fixed at 100, and the
composer and media work in this phase both change the bubble's render shape.
Introducing `react-window` on top of a bubble whose height is about to change
twice would mean measuring the same component three times. The bound below is the
commitment made instead, and it is expressed so that the decision can be revisited
against a number rather than a feeling.

#### Acceptance Criteria

1. THE ThreadLog SHALL render at most 300 messages at a time.
2. WHEN a thread holds more than 300 loaded messages, THE ThreadLog SHALL render
   the 300 most recent and SHALL keep the older ones reachable through the
   existing load-older affordance.
3. THE ThreadLog SHALL preserve the Agent's scroll position when an older page is
   merged into the thread.
4. THE ThreadLog SHALL key its autoscroll decision on the last message's
   identity rather than on the message count, so that loading an older page does
   not scroll the Agent to the bottom.
5. WHEN a media element finishes decoding while the Agent is pinned to the
   bottom, THE ThreadLog SHALL re-pin to the bottom.
6. WHEN the Agent scrolls away from the bottom, THE ThreadLog SHALL cancel any
   pending re-pin.

### Requirement 12: Preservation of existing behaviour

**User Story:** As an agent who uses the widget console, I want the Live Chat tab
to keep working exactly as it does today, so that this phase carries no
regression for me.

#### Acceptance Criteria

1. THE dashboard SHALL leave the Live Chat tab's components unmodified.
2. THE dashboard SHALL keep `LIVE_CHAT_TAB` as the default selected tab.
3. THE Inbox_API SHALL add no socket, no gateway, and no socket namespace, and
   SHALL continue to fan out through `RedisPropagatorService` addressed to agent
   user ids.
4. THE Inbox_API SHALL omit `platform` from every propagated dashboard event, so
   that `consumeSendEvent` takes the socket branch rather than attempting a
   channel send.
5. THE Inbox_API SHALL reach the Channel_Hub through EventEmitter2 events and
   SHALL NOT import the Engine.
6. THE Inbox_API SHALL resolve every thread-scoped route's ownership through
   `requireThread`, so that a new endpoint cannot omit the check.
7. THE Inbox_API SHALL perform all scoping through `scopeFilter(user)`, so that
   Phase 5 tenancy changes one method.
8. WHEN a scope lookup fails, THE Inbox_API SHALL fail closed by resolving to an
   empty scope.
9. THE Channel_Hub SHALL announce no message flagged `historical`, so that a
   history backfill does not flood the inbox.
10. THE Channel_Hub SHALL continue to gate its outbound announce on a
    successfully linked Chat_Row, so that the client never holds a row no receipt
    can match.
11. THE Inbox_Slice SHALL recompute channel unread badges from held thread rows
    rather than incrementing a counter.
12. WHEN the socket reconnects, THE Inbox_Slice SHALL clear cached messages and
    SHALL leave cached thread lists in place.

### Requirement 13: Cost and ban-risk controls

**User Story:** As an operator, I want the two-way features to add no recurring
per-view cost against the WhatsApp session, so that the account's ban risk does
not grow with dashboard usage.

#### Acceptance Criteria

1. THE Inbox_API SHALL fetch any given message's media from the channel at most
   once, and SHALL serve every later request for that media from the Media_Store.
2. THE Inbox_API SHALL request media only in response to an explicit Agent
   action.
3. THE Inbox_API SHALL preserve the existing on-demand history behaviour,
   including the `historyExhausted` short-circuit, the per-thread cooldown, and
   writing `historyRequestedAt` before dispatch.
4. THE Inbox_API SHALL keep the Engine's `syncFullHistory` disabled.
5. THE Inbox_API SHALL rate-limit agent replies per session, expressed as a
   maximum number of outbound messages per session per minute.
6. IF a reply is refused by the send rate limit, THEN THE Inbox_API SHALL respond
   `429` with a machine-readable reason of `rate_limited` and SHALL write no
   Chat_Row.
7. THE Composer SHALL coalesce nothing that changes message content, so that rate
   limiting never merges two distinct replies into one.
