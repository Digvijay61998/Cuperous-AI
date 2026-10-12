# Requirements Document

## Introduction

A bot flow authored in the JarCube flow builder can carry interactive response
blocks — `buttons`, `quick_reply`, and `gallery` cards — and those render as real
tappable controls in the web widget. On the WhatsApp Web channel the same flow
degrades: `buttons` and `quick_reply` collapse into a numbered text list that
loses every button's type and target, and `gallery` is dropped entirely because
`deliver()` has no case for it and a gallery message carries no `value`. On the
official WhatsApp Cloud API channel the button path is wired but broken — the
caller and the SDK helper disagree on argument names, so every attempt throws.

This feature closes that gap. It defines one canonical interactive payload that
every channel adapter consumes, gives each option a stable identity so a
selection routes by id rather than by re-matching free text, adds native
interactive rendering where the channel supports it, and defines an explicit,
declared fallback where it does not. It also extends the AI path so a bot
response can be an AI-generated set of options rather than only AI-generated
prose, on every channel.

### What exists today (verified in code)

**Flow authoring** — `BotResponseEditor.tsx` offers nine response block kinds:
`text`, `random_text`, `image`, `quick_reply`, `buttons`, `maps`, `audio`,
`video`, `gallery`. A button is `{ title, type, value }` where `type` is one of
`text` (send message), `goto` (go to block), `url`, `phone`, `moment`;
`quick_reply` is restricted to `text` and `goto`. Gallery cards cap at 10 with
title ≤ 60 and description ≤ 200 characters and up to 5 buttons each; `buttons`
and `quick_reply` have no option-count cap and no title-length cap.

**Runtime types** — `ChatTypeEnum` = `text, image, video, audio, file, buttons,
quick_reply, goto, random_text, maps, gallery`. `MessageResponseDto` carries
`buttons` and `location` alongside `value`.

**Web widget** — `ChatLog.tsx` renders `buttons` → `ButtonsReply`, `quick_reply`
→ `QuickReply`, `gallery` → `Gallery`, `maps` → `Map`. A `text` button emits
`chat-message-bot` with the button's `value` as if the visitor typed it; a `goto`
button emits the same event with `type: 'goto'` and the target node id.

**Branch selection** — only `goto` routes by identity. Every other option is
re-injected as free text and re-scored by `evaluateUserInput` against the
`keywords` and `utterance` of child `USER_INPUT` nodes (longest matching term
wins). Nothing ties an option to an edge; there is no `buttonId` or `payload`
field on either side, so renaming an option can silently break its branch.

**WhatsApp Web** — the backend runs Baileys in-process
(`BaileysEngineService`, `@whiskeysockets/baileys ^6.7.22`); the separate OpenWA
gateway is not in the runtime path. The engine exposes exactly three send
methods: `sendText`, `sendImage`, `sendMedia`. `deliver()` degrades `buttons` and
`quick_reply` to `"${i+1}. ${title}"` lines appended to the prompt, degrades
`maps` to a Google Maps link, and drops `gallery`. Inbound, the mapper reads the
*display text* of `buttonsResponseMessage`, `templateButtonReplyMessage`,
`listResponseMessage`, and `interactiveResponseMessage`, but never reads their
`selectedButtonId` / `selectedRowId`; `pollUpdateMessage` has no case at all and
is discarded.

**WhatsApp Cloud API** — `WhatsappCloud` already implements `sendSimpleButtons`
(reply buttons, enforcing title ≤ 20 and id ≤ 256), `sendRadioButtons` (list,
enforcing row id ≤ 200, row title ≤ 24, row description ≤ 72, total rows ≤ 10),
and `sendCtaUrl`. `sendRadioButtons` has zero callers. `sendSimpleButtons` has
one caller, `sendWhatsappMessage`, which passes `{ text, buttons: [{type,title,payload}] }`
against a signature of `{ message, listOfButtons: [{title, id}] }` — so
`_mustHaveMessage` throws and no reply button has ever reached a customer.
Inbound, `messageParser` already classifies `button_reply` and `list_reply` and
copies them onto the message, but `handleIncomingMessage` only forwards
`message.text` and `message.image`, so a tapped button produces nothing.

**Provider abstraction** — `MessagingProvider` models
`OutboundMessage.buttons: { title, payload }[]`, `cta`, and `location`, and
`ProviderFeature` includes `buttons`, `cta_url`, `flows`. It is used in exactly
one place (`handleOpenTemplate`). `WidgetNativeProvider` advertises `buttons` but
its listener `onWidgetSend` flattens everything to text. `ChannelEnum` has no
`whatsapp_web` member.

**AI** — `POST /query/ask` returns `{ answer, confident, sources, tokens_used,
provider, model }`. `answer` is a string. There is no structured-output,
tool-call, or option field anywhere in the AI service, and the backend forwards a
confident answer as a single `{ type: 'text' }` message.

### Platform research (external, 2026)

**Baileys cannot send native interactive messages.** The installed 6.x
`AnyRegularMessageContent` union admits `text`, media, `poll`, `contacts`,
`location`, `react`, `buttonReply`, `listReply`, `groupInvite`, `pin`, `product`,
and phone-number requests — and no `buttons`, `templateButtons`, `sections`, or
`interactiveMessage` variant. `buttonReply` and `listReply` are for *answering*
someone else's interactive message, not for sending one. The official Baileys
documentation for
[sending messages](https://whiskeysockets-baileys.mintlify.app/messaging/sending-messages)
lists text, media, location, contact, poll, reaction, and forward as the
supported content formats, with no interactive or button format. A long-running
upstream request for
[interactive buttons and list messages](https://github.com/WhiskeySockets/Baileys/issues/2239)
remains open, and
[issue #1137](https://github.com/WhiskeySockets/Baileys/issues/1137) records
buttons that were delivered but not displayed after a WhatsApp client update.

**Workarounds exist but are unreliable and unofficial.** Community packages
report that the reason plain Baileys cannot send interactive messages is the
absent `biz` / `interactive` / `native_flow` binary node wrappers WhatsApp
expects, and ship patched wrappers to supply them
([gifted-btns](https://classic.yarnpkg.com/en/package/gifted-btns)). Forks such as
[atexovi-baileys](https://github.com/atex-ovi/atexovi-baileys),
[vreden/baileys](https://github.com/vreden/baileys), and
[itsliaaa/baileys](https://github.com/itsliaaa/baileys) advertise button, list,
and template message support. A widely-referenced
[native-flow reference](https://gist.github.com/Iucasmaia/7e9b39235e77dfaeb15f65d95b224090)
states that these messages render on the WhatsApp mobile app and through the
official Business API, while WhatsApp Web and Desktop may show them as plain text
or as an unsupported message. Content was rephrased for compliance with licensing
restrictions.

Consequence for this feature: **native interactive rendering on the WhatsApp Web
channel is best-effort and must never be the only way a customer can answer.**
Recipient-side rendering depends on the customer's client and is not observable
from the sender, so a text fallback that stands on its own is mandatory, not
optional.

**Ban risk.** Automating a consumer WhatsApp account through a reverse-engineered
client is outside WhatsApp's terms and carries a non-deterministic risk of the
number being blocked; the official Cloud API is the only route without that
exposure ([overview](https://whatsapp.checkleaked.cc/blog/avoid-whatsapp-ban)).
The codebase already reflects this — `WhatsappOpenWaProvider.productionSafe` is
`false` and a per-session send rate limiter guards the wire. Sending unusual
message shapes through an unofficial client raises that exposure, which is why
native interactive sending on this channel is required to be flag-gated and
individually disableable.

**WhatsApp Cloud API interactive limits.** Reply buttons support up to three
buttons with a button id of at most 256 characters
([Meta: interactive reply buttons](https://developers.facebook.com/docs/whatsapp/cloud-api/messages/interactive-reply-buttons-messages/));
button labels are limited to 20 characters
([Tata Communications](https://www.tatacommunications.com/knowledge-base/cpaas/whatsapp-buttons-to-enhance-business-communication)).
List messages support up to 10 sections with up to 10 rows per section
([Meta: interactive list messages](https://developers.facebook.com/docs/whatsapp/cloud-api/messages/interactive-list-messages)),
while the practical per-message bound is 10 rows summed across all sections
([Bird E15055](https://bird.com/nl-nl/documentatie/api/errors/E15055)) — which is
what `sendRadioButtons` already enforces. Row titles are limited to 24 characters
([Messaggio](https://messaggio.com/blog/whatsapp-interactive-messages-and-how-to-use-them/)),
and the existing helper additionally enforces row description ≤ 72 and row id
≤ 200. Interactive messages themselves need no template approval
([Octopods](https://docs.octopods.io/en/articles/14823467-sending-whatsapp-interactive-messages)),
but they are free-form messages and therefore only valid inside the 24-hour
customer service window; outside it a business must open the conversation with a
pre-approved template, and the window restarts each time the customer writes
([360dialog](https://docs.360dialog.com/docs/messaging/overview),
[SuprSend](https://www.suprsend.com/post/whatsapp-business-api-templates)).
Content was rephrased for compliance with licensing restrictions.

### Scope

In scope: a canonical interactive payload with stable option ids; a channel
capability declaration; rendering and fallback for `buttons`, `quick_reply`,
`gallery`, `maps`, and CTA/URL/phone options on the WhatsApp Web channel and the
WhatsApp Cloud API channel; id-based and text-based inbound selection resolution;
persistence of interactive payloads so the inbox and transcripts keep them;
AI-generated interactive payloads; and a declared parity matrix.

Out of scope: authoring new node types in the flow builder beyond what is needed
to give existing options a stable id; WhatsApp Flows (`interactive.type = flow`);
product and catalog messages; Instagram and Facebook parity beyond keeping their
existing behaviour working; and multi-tenancy changes.

## Capability and parity matrix

`Web_Widget` is the reference implementation. Each cell states the required
behaviour after this feature, not today's behaviour.

| Canonical payload | Web_Widget | WhatsApp_Web (Baileys, unofficial) | WhatsApp_Cloud (official API) |
|---|---|---|---|
| `text` | text bubble | `sendText` | `sendText` |
| `random_text` | resolved to `text` upstream | resolved to `text` upstream | resolved to `text` upstream |
| `image` / `video` / `audio` / `file` | inline media | `sendImage` / `sendMedia` | `sendImage` / `sendVideo` / `sendAudio` / `sendDocument` |
| `maps` | map component | native `location` content (Baileys supports it), maps link on failure | `sendLocation` |
| `quick_reply`, ≤ 3 options | chip row | native reply buttons where enabled, else numbered text | reply buttons (`sendSimpleButtons`) |
| `quick_reply`, 4–10 options | chip row | numbered text; native list where enabled | list message (`sendRadioButtons`) |
| `quick_reply`, > 10 options | chip row | paginated numbered text | paginated list |
| `buttons`, reply-type options | vertical button group | same rules as `quick_reply` | same rules as `quick_reply` |
| `buttons`, `url` option | anchor | labelled URL line in text | CTA URL (`sendCtaUrl`) when it is the only option, else labelled URL line |
| `buttons`, `phone` option | `tel:` anchor | labelled `tel:`/`wa.me` line in text | labelled line in text |
| `buttons`, `goto` option | id round-trip over socket | reply-token round-trip | reply-token round-trip |
| `buttons`, `webview` / `moment` option | in-widget modal | labelled URL line in text | CTA URL or labelled URL line |
| `gallery` (carousel) | slideshow of cards | one media message per card plus that card's options, in card order | one media message per card plus that card's options, in card order |
| Poll as an option set | not applicable | optional, flag-gated, `poll` content is natively supported by Baileys | not applicable |
| Selection by native id | not applicable | when the client sends one | `button_reply.id` / `list_reply.id` |
| Selection by ordinal | not applicable | required | required |
| Selection by exact label | required | required | required |

## Glossary

- **Flow_Engine**: `MessageHandlerService` in QuantumMind-backend — node
  dispatch, `handleBotResponse`, `evaluateUserInput`, `sendBotMessage`.
- **Interactive_Payload**: the canonical, channel-independent description of one
  outbound bot message that offers the customer a set of choices. Comprises a
  `kind`, a prompt body, and an ordered list of Options.
- **Option**: one choice inside an Interactive_Payload. Carries an
  `optionId`, a `label`, an `action`, and an action-specific `target`.
- **Option_Id**: the stable, flow-scoped identifier of an Option. Generated and
  persisted at authoring time, never derived from the Option's label.
- **Option_Action**: one of `reply`, `goto`, `url`, `phone`, `webview`.
- **Reply_Token**: the short, opaque string a channel adapter sends to the
  customer's device or embeds in fallback text so that the customer's answer can
  be resolved back to a specific Option_Id.
- **Selection_Resolver**: the Flow_Engine component that maps an inbound customer
  message onto an Option of the Interactive_Payload most recently sent on that
  thread.
- **Channel_Adapter**: the code that turns an Interactive_Payload into one or
  more channel-native messages. Today: the widget socket path,
  `WhatsappWebInboundService.deliver`, and `sendWhatsappMessage`.
- **Channel_Capability**: the declared set of Interactive_Payload features one
  Channel_Adapter can render natively.
- **Web_Widget**: the `widget` platform — `QuantumMind-widget` and the
  `QuantumMind-ui` bot preview.
- **WhatsApp_Web**: the `whatsapp_web` platform — the in-process Baileys engine
  driving a self-linked personal number. Unofficial protocol.
- **WhatsApp_Cloud**: the `whatsapp` platform — the official WhatsApp Cloud API
  via `WhatsappCloud`.
- **Native_Interactive**: a channel-native tappable control — WhatsApp reply
  buttons, WhatsApp list rows, or a WhatsApp CTA URL button.
- **Text_Fallback**: the plain-text rendering of an Interactive_Payload, in which
  each Option appears as a numbered line the customer can answer by number or by
  label.
- **Service_Window**: the 24-hour period following a customer's most recent
  inbound message on WhatsApp_Cloud, during which free-form and interactive
  messages may be sent.
- **AI_Service**: QuantumMind-ai, reached at `POST /query/ask`.
- **AI_Interactive_Response**: an AI_Service response that carries Options in
  addition to, or instead of, prose.
- **Interactive_Serializer**: the pure function pair that converts an
  Interactive_Payload to a channel-native payload and back.
- **Chat_Row**: a `Chat` document in MongoDB.
- **Inbox_View**: the dashboard channel inbox (`src/inbox` plus
  `src/views/apps/inbox`).

## Requirements

### Requirement 1: Canonical interactive payload with stable option identity

**User Story:** As a flow designer, I want each clickable option to have an
identity independent of its visible label, so that renaming an option does not
break the branch it leads to and every channel can route a selection the same
way.

#### Acceptance Criteria

1. THE Flow_Engine SHALL represent every outbound message that offers choices as
   an Interactive_Payload carrying a `kind` of `buttons`, `quick_reply`, or
   `gallery`, a prompt body, and an ordered list of Options.
2. THE Flow_Engine SHALL represent every Option as an `optionId`, a `label`, an
   `Option_Action`, and a `target`, where `label` is 1 to 200 characters after
   trimming and `optionId` is 1 to 64 characters drawn from lowercase letters,
   digits, hyphen, and underscore.
3. THE Flow_Engine SHALL treat each `optionId` as unique within the
   Interactive_Payload that contains it.
4. WHEN a flow is saved, THE flow builder SHALL assign an `optionId` to every
   Option that has none, and SHALL preserve the existing `optionId` of every
   Option that has one.
5. WHEN an Option's `label` is edited, THE flow builder SHALL leave that Option's
   `optionId` unchanged.
6. WHEN an Option's `Option_Action` is `goto`, THE Flow_Engine SHALL treat that
   Option's `target` as the id of the node to advance to.
7. WHEN an Option's `Option_Action` is `reply`, THE Flow_Engine SHALL treat that
   Option's `target` as the text to attribute to the customer when that Option is
   selected, defaulting to the Option's `label` when `target` is empty.
8. WHEN an Option's `Option_Action` is `url`, `webview`, or `phone`, THE
   Flow_Engine SHALL treat that Option's `target` as the destination to present
   and SHALL advance no node on selection.
9. WHERE an existing flow contains an option authored before this feature with
   only `{ title, type, value }`, THE Flow_Engine SHALL derive an
   Interactive_Payload Option from it by mapping `title` to `label`, `type` to
   `Option_Action`, and `value` to `target`, and SHALL derive a deterministic
   `optionId` from the option's node id and its zero-based position, so that a
   flow authored before this feature runs without being re-authored.
10. THE Flow_Engine SHALL map the flow builder's `moment` option type to the
    `webview` Option_Action, so that an option a designer can author is an option
    a customer can act on.

### Requirement 2: Declared channel capabilities

**User Story:** As a developer adding a channel, I want each adapter to declare
what it can render, so that the engine degrades a payload by rule instead of each
adapter inventing its own behaviour.

#### Acceptance Criteria

1. THE Flow_Engine SHALL resolve a Channel_Capability for every outbound
   Interactive_Payload before selecting a rendering.
2. THE Channel_Capability SHALL state, for one channel, whether Native_Interactive
   reply buttons are available, whether Native_Interactive list rows are
   available, whether a Native_Interactive CTA URL button is available, the
   maximum number of reply buttons per message, the maximum number of list rows
   per message, the maximum Option label length the channel accepts, and the
   maximum Reply_Token length the channel accepts.
3. WHERE a channel declares no Channel_Capability, THE Flow_Engine SHALL apply a
   default capability in which no Native_Interactive feature is available, so
   that an unconfigured channel produces Text_Fallback rather than a failed send.
4. THE Channel_Capability for Web_Widget SHALL declare unlimited Options and no
   label truncation, so that the reference channel is never degraded.
5. THE Channel_Capability for WhatsApp_Cloud SHALL declare at most 3 reply
   buttons per message, at most 10 list rows per message, an Option label limit of
   20 characters for reply buttons and 24 characters for list rows, and a
   Reply_Token limit of 200 characters.
6. THE Channel_Capability for WhatsApp_Web SHALL declare Native_Interactive
   availability as disabled by default.
7. THE messaging channel enumeration SHALL include a member for WhatsApp_Web, so
   that the two channel abstractions name the same set of channels.
8. WHEN a Channel_Adapter renders an Interactive_Payload, THE Channel_Adapter
   SHALL read its limits from the Channel_Capability rather than from a literal
   embedded in the adapter.

### Requirement 3: WhatsApp Web renders interactive options the customer can act on

**User Story:** As a customer on WhatsApp, I want to see and choose the options
the bot offers, so that I can answer by tapping or by replying with a number
instead of guessing what to type.

#### Acceptance Criteria

1. WHEN the Flow_Engine sends an Interactive_Payload on WhatsApp_Web, THE
   Channel_Adapter SHALL deliver a message from which every Option is
   selectable, either as Native_Interactive controls or as Text_Fallback.
2. WHERE the WhatsApp_Web Channel_Capability declares Native_Interactive reply
   buttons available, WHEN an Interactive_Payload carries 1 to 3 Options whose
   Option_Action is `reply` or `goto`, THE Channel_Adapter SHALL attempt to
   deliver Native_Interactive reply buttons carrying each Option's Reply_Token.
3. IF a Native_Interactive send on WhatsApp_Web is rejected by the channel, THEN
   THE Channel_Adapter SHALL deliver the Text_Fallback for that same
   Interactive_Payload within 5 seconds of the rejection, and SHALL record one
   warning naming the payload and the rejection cause.
4. WHERE the WhatsApp_Web Channel_Capability declares Native_Interactive
   unavailable, THE Channel_Adapter SHALL deliver the Text_Fallback and SHALL
   make no Native_Interactive send attempt.
5. THE Channel_Adapter SHALL deliver exactly one rendering of each
   Interactive_Payload to the customer, so that a customer never receives both a
   Native_Interactive copy and a Text_Fallback copy of the same payload.
6. WHEN the Flow_Engine sends an Interactive_Payload of kind `gallery` on
   WhatsApp_Web, THE Channel_Adapter SHALL deliver one message per card in card
   order, each carrying that card's image, that card's title and description as
   its body, and that card's Options rendered under the rules of this
   requirement.
7. WHEN a `gallery` card has no image, THE Channel_Adapter SHALL deliver that
   card as a text message carrying its title, description, and Options, so that
   an image-less card is not dropped.
8. WHEN the Flow_Engine sends a `maps` message on WhatsApp_Web, THE
   Channel_Adapter SHALL send native location content carrying the latitude,
   longitude, and any name and address.
9. IF a native location send on WhatsApp_Web is rejected, THEN THE
   Channel_Adapter SHALL send a text message carrying a map link for those
   coordinates.
10. THE Channel_Adapter SHALL deliver the messages of one Interactive_Payload in
    the payload's own order, and SHALL deliver each of them through the existing
    single outbound choke point so the per-session send rate limit applies to
    every one.
11. IF the per-session send rate limit refuses any message of an
    Interactive_Payload, THEN THE Channel_Adapter SHALL abandon the remaining
    messages of that payload, SHALL mark the payload's Chat_Row `failed`, and
    SHALL record one warning naming the payload.
12. WHERE the WhatsApp_Web Channel_Capability declares Native_Interactive
    available, THE Channel_Adapter SHALL cap Option labels at the declared
    length by truncating on a character boundary and appending a single ellipsis
    character, and SHALL carry the untruncated label in the payload persisted
    per Requirement 8.

### Requirement 4: Text fallback is self-sufficient

**User Story:** As a customer whose WhatsApp client shows the bot's buttons as
plain text, I want the message itself to tell me how to choose, so that I am
never left with an unanswerable prompt.

#### Acceptance Criteria

1. THE Text_Fallback of an Interactive_Payload SHALL carry the payload's prompt
   body, then one line per Option, each line beginning with the Option's
   one-based ordinal, a separator, and the Option's `label`.
2. WHERE an Option's Option_Action is `url` or `webview`, THE Text_Fallback SHALL
   carry that Option's `target` on the same line as its `label`.
3. WHERE an Option's Option_Action is `phone`, THE Text_Fallback SHALL carry that
   Option's `target` as a dialable number on the same line as its `label`.
4. THE Text_Fallback SHALL carry one instruction line stating that the customer
   may answer with an option number, and SHALL render that instruction in the
   conversation's language.
5. WHERE an Interactive_Payload carries more than 10 Options, THE Text_Fallback
   SHALL present the Options in pages of at most 10, SHALL number the Options
   continuously across pages, and SHALL carry on every page but the last a line
   stating how to request the next page.
6. THE Text_Fallback SHALL be at most 4096 characters per message, and WHEN the
   rendering of one page would exceed that, THE Channel_Adapter SHALL split it at
   an Option boundary rather than mid-Option.
7. THE Text_Fallback SHALL omit an Option whose `label` is empty after trimming,
   and SHALL omit no other Option.
8. WHEN an Interactive_Payload carries no Option with a non-empty `label`, THE
   Channel_Adapter SHALL deliver the prompt body alone as a text message.

### Requirement 5: Selection resolution

**User Story:** As a customer, I want my answer to be understood whether I tapped
a button, typed the option number, or typed the option's name, so that the
conversation continues either way.

#### Acceptance Criteria

1. WHEN an inbound message arrives on a thread whose most recent outbound message
   was an Interactive_Payload, THE Selection_Resolver SHALL attempt to resolve it
   to one Option of that payload before the Flow_Engine applies keyword scoring.
2. WHEN an inbound message carries a native selection identifier that matches a
   Reply_Token issued for that payload, THE Selection_Resolver SHALL resolve it to
   that Reply_Token's Option.
3. WHEN an inbound message's trimmed text is exactly the one-based ordinal of an
   Option in that payload, THE Selection_Resolver SHALL resolve it to that
   Option.
4. WHEN an inbound message's trimmed text equals an Option's `label` ignoring
   letter case and surrounding whitespace, THE Selection_Resolver SHALL resolve it
   to that Option.
5. WHEN more than one resolution rule matches one inbound message, THE
   Selection_Resolver SHALL apply the rules in the order native identifier, then
   ordinal, then label, and SHALL resolve to the first match.
6. WHEN two Options of one payload share a `label` ignoring letter case, THE
   Selection_Resolver SHALL resolve a label match to the Option with the lower
   ordinal.
7. WHEN a selection resolves to an Option whose Option_Action is `goto`, THE
   Flow_Engine SHALL advance to the node named by that Option's `target`.
8. WHEN a selection resolves to an Option whose Option_Action is `reply`, THE
   Flow_Engine SHALL continue as though the customer had sent that Option's
   `target` text, so that keyword-matched branches authored before this feature
   continue to work.
9. WHEN a selection resolves to an Option whose Option_Action is `url`,
   `webview`, or `phone`, THE Flow_Engine SHALL advance no node and SHALL send no
   reply for that selection alone.
10. IF an inbound message resolves to no Option, THEN THE Flow_Engine SHALL
    process it as an ordinary free-text message through the existing keyword
    scoring, question bank, and fallback path.
11. WHEN a Reply_Token is issued, THE Flow_Engine SHALL scope it to the thread
    and the Interactive_Payload it was issued for, and SHALL treat it as
    resolvable for at least 24 hours after issue.
12. IF an inbound message carries a native selection identifier that is not
    resolvable, THEN THE Selection_Resolver SHALL fall through to the ordinal and
    label rules using the message's display text, so that a stale tap is treated
    as free text rather than discarded.
13. WHEN the Flow_Engine records a resolved selection, THE Flow_Engine SHALL
    record the resolved `optionId`, the resolution rule that matched, and the
    Interactive_Payload's identifier.
14. WHEN a customer selects an Option of a `gallery` payload, THE
    Selection_Resolver SHALL resolve it against the Options of every card of that
    payload, so that a selection made on the second card is understood.

### Requirement 6: WhatsApp Cloud API interactive parity

**User Story:** As a customer on a business WhatsApp number, I want the bot's
options as real WhatsApp buttons and lists, so that I get the experience the
official platform supports.

#### Acceptance Criteria

1. WHEN the Flow_Engine sends an Interactive_Payload of 1 to 3 Options whose
   Option_Action is `reply` or `goto` on WhatsApp_Cloud, THE Channel_Adapter SHALL
   send an interactive reply-buttons message whose every button carries that
   Option's Reply_Token as its button identifier.
2. WHEN the Flow_Engine sends an Interactive_Payload of 4 to 10 such Options on
   WhatsApp_Cloud, THE Channel_Adapter SHALL send an interactive list message
   whose every row carries that Option's Reply_Token as its row identifier.
3. WHERE an Interactive_Payload carries more than 10 such Options, THE
   Channel_Adapter SHALL page them into successive list messages of at most 10
   rows each under the pagination rule of Requirement 4.
4. THE Channel_Adapter SHALL supply every field the official interactive request
   requires, including a row description for each list row, deriving a description
   from the Option when the flow supplies none.
5. WHEN an Interactive_Payload carries exactly one Option whose Option_Action is
   `url` or `webview` and no Option of any other action, THE Channel_Adapter
   SHALL send a CTA URL message carrying that Option's `label` as the button text
   and its `target` as the URL.
6. WHEN an Interactive_Payload mixes Options whose Option_Action is `reply` or
   `goto` with Options whose Option_Action is `url`, `webview`, or `phone`, THE
   Channel_Adapter SHALL send the reply-capable Options as Native_Interactive
   controls and SHALL carry each remaining Option as a labelled line in the
   message body.
7. THE Channel_Adapter SHALL truncate an Option `label` that exceeds the
   Channel_Capability limit on a character boundary before sending, and SHALL
   carry the untruncated label in the payload persisted per Requirement 8.
8. IF an interactive send on WhatsApp_Cloud is rejected, THEN THE Channel_Adapter
   SHALL send the Text_Fallback for that Interactive_Payload within 5 seconds and
   SHALL record one error naming the payload and the rejection cause.
9. WHEN an inbound WhatsApp_Cloud message carries a button reply or a list reply,
   THE Channel_Adapter SHALL forward that reply's identifier and its display text
   to the Flow_Engine, so that the Selection_Resolver can apply Requirement 5.
10. WHEN an inbound WhatsApp_Cloud message carries a media attachment, a
    location, or a contact card, THE Channel_Adapter SHALL forward it to the
    Flow_Engine, so that a customer who answers with something other than text is
    not ignored.
11. WHILE the Service_Window for a WhatsApp_Cloud contact is open, THE
    Channel_Adapter SHALL send Interactive_Payloads as free-form interactive
    messages without a pre-approved template.
12. IF the Service_Window for a WhatsApp_Cloud contact is closed when an
    Interactive_Payload is due, THEN THE Channel_Adapter SHALL send no free-form
    message, SHALL mark the payload's Chat_Row `failed` with a machine-readable
    reason of `service_window_closed`, and SHALL record one warning naming the
    contact and the payload.
13. THE Channel_Adapter SHALL track each WhatsApp_Cloud contact's Service_Window
    from that contact's most recent inbound message timestamp, and SHALL treat the
    window as 24 hours from that timestamp.
14. THE Channel_Adapter SHALL call each official send helper with the argument
    names and option shape that helper declares, so that an interactive send is
    never rejected by the helper's own validation.

### Requirement 7: AI-generated interactive responses

**User Story:** As a bot operator, I want the AI to answer with tappable options
and not only prose, so that an AI-handled conversation offers the same
interaction as an authored flow on every channel.

#### Acceptance Criteria

1. THE AI_Service SHALL return, alongside its answer, an optional ordered list of
   Options, each carrying an `optionId`, a `label`, and an Option_Action.
2. THE AI_Service SHALL restrict the Option_Action of every Option it returns to
   `reply` or `url`, so that AI output cannot address a flow node directly.
3. THE AI_Service SHALL return at most 10 Options for one answer.
4. WHEN the AI_Service returns Options, THE Flow_Engine SHALL send them as one
   Interactive_Payload of kind `quick_reply` whose prompt body is the AI answer.
5. WHEN the AI_Service returns no Options, THE Flow_Engine SHALL send the answer
   as a single text message, preserving today's behaviour.
6. WHEN the Flow_Engine requests an AI answer, THE Flow_Engine SHALL include in
   that request the resolved Channel_Capability limits for the channel the answer
   will be delivered on, so that the AI_Service can shape its Options to the
   channel.
7. IF the AI_Service returns an Option whose `label` is empty after trimming or
   exceeds 200 characters, THEN THE Flow_Engine SHALL discard that Option and
   SHALL send the remaining Options.
8. IF the AI_Service returns Options that all fail validation, THEN THE
   Flow_Engine SHALL send the answer as a single text message.
9. IF the AI_Service returns Options with duplicate `optionId` values, THEN THE
   Flow_Engine SHALL keep the first Option for each `optionId` and discard the
   rest.
10. WHEN a customer selects an AI-generated Option, THE Flow_Engine SHALL
    continue as though the customer had sent that Option's `label`, and SHALL
    remain on the AI node rather than advancing on the graph.
11. THE AI_Service SHALL return `confident` and `answer` with the meaning they
    carry today, so that an existing caller that ignores Options behaves exactly
    as before.
12. WHEN the AI_Service is asked for an answer for a channel whose
    Channel_Capability declares no Native_Interactive feature, THE AI_Service
    SHALL still be permitted to return Options, and THE Flow_Engine SHALL render
    them as Text_Fallback.
13. IF the AI_Service response cannot be parsed into the declared shape, THEN THE
    Flow_Engine SHALL treat the response as carrying no Options and SHALL record
    one warning naming the request identifier.

### Requirement 8: Interactive payloads survive persistence

**User Story:** As an agent reading a WhatsApp thread in the dashboard, I want to
see which options the bot offered and which one the customer chose, so that I can
understand the conversation I am taking over.

#### Acceptance Criteria

1. WHEN the Flow_Engine sends an Interactive_Payload, THE Flow_Engine SHALL
   persist that payload's kind, prompt body, and Options on the message's
   Chat_Row.
2. THE persisted Options SHALL carry each Option's `optionId`, untruncated
   `label`, Option_Action, and `target`.
3. WHEN a customer's selection resolves to an Option, THE Flow_Engine SHALL
   persist the resolved `optionId` on the inbound message's Chat_Row.
4. THE Chat_Row schema SHALL accept an interactive payload for every message
   type that can carry Options, so that a payload is not silently discarded on
   write.
5. WHEN the Inbox_View reads a message carrying a persisted interactive payload,
   THE Inbox_API SHALL include that payload in the message view.
6. WHEN the Inbox_View renders a message carrying a persisted interactive
   payload, THE Inbox_View SHALL render the prompt body and each Option's label
   as non-actionable text, so that an agent sees the offered choices without
   being able to answer on the customer's behalf.
7. WHEN the Inbox_View renders an inbound message carrying a resolved
   `optionId`, THE Inbox_View SHALL render the label of the Option that was
   chosen.
8. WHERE a Chat_Row carries no interactive payload, THE Inbox_View SHALL render
   it exactly as it renders such a message today.
9. WHEN a conversation transcript is produced, THE transcript SHALL carry the
   Text_Fallback rendering of every Interactive_Payload it contains, so that a
   transcript records the choices offered.

### Requirement 9: Interactive payload serialization round-trip

**User Story:** As a developer, I want the conversion between the canonical
payload and each channel's native payload to be reversible, so that a mapping
bug is caught by a test rather than by a customer receiving a broken menu.

#### Acceptance Criteria

1. THE Interactive_Serializer SHALL convert an Interactive_Payload into a
   channel-native payload for each of Web_Widget, WhatsApp_Web, and
   WhatsApp_Cloud.
2. THE Interactive_Serializer SHALL convert a channel-native payload it produced
   back into an Interactive_Payload.
3. FOR ALL Interactive_Payloads whose Options number at most the target channel's
   declared maximum and whose labels are at most the target channel's declared
   maximum length, converting to that channel's native payload and back SHALL
   produce an Interactive_Payload with the same kind, the same prompt body, and
   the same ordered list of Options, comparing `optionId`, `label`,
   Option_Action, and `target`.
4. THE Interactive_Serializer SHALL render an Interactive_Payload as
   Text_Fallback.
5. FOR ALL Interactive_Payloads, parsing an ordinal answer against that payload's
   Text_Fallback SHALL resolve to the Option that ordinal labels.
6. FOR ALL Interactive_Payloads whose Option labels are unique ignoring letter
   case, parsing a label answer against that payload's Text_Fallback SHALL
   resolve to the Option carrying that label.
7. THE Interactive_Serializer SHALL be a pure function of its inputs, performing
   no network call and no database read.
8. IF the Interactive_Serializer is given an Interactive_Payload that violates
   Requirement 1, THEN it SHALL raise a validation error naming the violated
   constraint and SHALL produce no channel-native payload.

### Requirement 10: Native interactive sending on WhatsApp Web is controlled

**User Story:** As an operator of a self-linked WhatsApp number, I want native
interactive sending to be something I switch on deliberately and can switch off
instantly, so that an unofficial protocol experiment cannot put my number at risk
without my consent.

#### Acceptance Criteria

1. THE WhatsApp_Web Channel_Adapter SHALL read whether to attempt
   Native_Interactive sending from configuration, and SHALL treat the absence of
   that configuration as disabled.
2. WHILE Native_Interactive sending is disabled for WhatsApp_Web, THE
   Channel_Adapter SHALL deliver Text_Fallback for every Interactive_Payload and
   SHALL make no Native_Interactive send attempt.
3. WHEN Native_Interactive sending for WhatsApp_Web is switched off, THE
   Channel_Adapter SHALL apply the change to the next outbound
   Interactive_Payload without a process restart.
4. THE Channel_Adapter SHALL apply the Native_Interactive setting per WhatsApp_Web
   session, so that one number can be enabled while another stays on
   Text_Fallback.
5. WHEN a Native_Interactive send attempt on WhatsApp_Web is rejected, THE
   Channel_Adapter SHALL count that rejection for the session, and WHEN the count
   reaches a configured threshold within a configured window, THE Channel_Adapter
   SHALL disable Native_Interactive sending for that session and SHALL record one
   error naming the session.
6. THE configured rejection threshold SHALL default to 3 rejections within 300
   seconds.
7. WHEN Native_Interactive sending is automatically disabled for a session, THE
   Channel_Adapter SHALL keep it disabled until an operator re-enables it.
8. THE Channel_Adapter SHALL record, for each Interactive_Payload sent on
   WhatsApp_Web, whether it was delivered as Native_Interactive or as
   Text_Fallback.
9. THE dashboard SHALL present the Native_Interactive setting for a WhatsApp_Web
   session together with a statement that native interactive rendering on this
   channel is unofficial, depends on the recipient's WhatsApp client, and
   increases the risk of the number being restricted.

### Requirement 11: Poll-based option sets on WhatsApp Web

**User Story:** As a bot operator, I want the option to present a multi-choice
prompt on WhatsApp Web as a native WhatsApp poll, so that customers get a
tappable control on a channel where buttons are unreliable.

#### Acceptance Criteria

1. WHERE poll rendering is enabled for a WhatsApp_Web session, WHEN the
   Flow_Engine sends an Interactive_Payload of kind `quick_reply` whose every
   Option has Option_Action `reply` or `goto` and whose Option count is between 2
   and 12, THE Channel_Adapter SHALL send a native poll whose question is the
   payload's prompt body and whose values are the Options' labels in order.
2. THE Channel_Adapter SHALL send a poll that accepts exactly one selection.
3. WHEN a poll vote arrives on WhatsApp_Web, THE Channel_Adapter SHALL resolve
   which poll value was chosen and SHALL forward that value's text to the
   Flow_Engine as the customer's answer.
4. IF a poll vote cannot be resolved to a poll value, THEN THE Channel_Adapter
   SHALL record one warning naming the message and SHALL forward nothing to the
   Flow_Engine.
5. THE Channel_Adapter SHALL treat poll rendering as disabled unless
   configuration enables it for that session.
6. IF a poll send is rejected, THEN THE Channel_Adapter SHALL deliver the
   Text_Fallback for that Interactive_Payload within 5 seconds.
7. WHERE an Interactive_Payload contains any Option whose Option_Action is `url`,
   `webview`, or `phone`, THE Channel_Adapter SHALL NOT render that payload as a
   poll.

### Requirement 12: Web widget remains the reference and gains no regression

**User Story:** As a visitor using the web chat, I want the widget to keep
working exactly as it does now, so that a WhatsApp feature does not break the
channel that already worked.

#### Acceptance Criteria

1. WHEN the Flow_Engine sends an Interactive_Payload on Web_Widget, THE
   Channel_Adapter SHALL render every Option as a control of the same kind the
   widget renders today for that Option_Action.
2. WHEN a visitor selects an Option whose Option_Action is `goto` in the web
   widget, THE widget SHALL send that Option's identity to the Flow_Engine and
   THE Flow_Engine SHALL advance to that Option's target node.
3. WHEN a visitor selects an Option whose Option_Action is `webview` in the web
   widget, THE widget SHALL present that Option's target inside the widget.
4. THE web widget SHALL render an Option whose Option_Action is `webview`
   identically whether the flow authored it as `webview` or as `moment`.
5. THE Flow_Engine SHALL continue to accept an inbound widget message that
   carries only free text, so that a visitor who types instead of tapping is
   handled as today.
6. WHEN an Interactive_Payload is routed through the messaging provider
   abstraction for a channel whose Channel_Capability declares reply buttons
   available, THE provider SHALL deliver the payload's Options and SHALL NOT
   flatten them to text.

### Requirement 13: Option selection is observable

**User Story:** As a bot operator, I want to see which options customers choose
on each channel, so that I can tell whether the WhatsApp rendering is actually
working.

#### Acceptance Criteria

1. WHEN an Interactive_Payload is delivered, THE Flow_Engine SHALL record the
   channel, the payload identifier, the Option count, and the rendering used.
2. WHEN a selection resolves to an Option, THE Flow_Engine SHALL record the
   channel, the payload identifier, the resolved `optionId`, and the resolution
   rule that matched.
3. WHEN an inbound message on a thread whose most recent outbound message was an
   Interactive_Payload resolves to no Option, THE Flow_Engine SHALL record that
   outcome with the channel and the payload identifier.
4. THE social channel report platform lists SHALL include WhatsApp_Web, so that
   the channel appears in analytics.
5. THE Flow_Engine SHALL record no Option `label` or `target` value in analytics
   records, so that a customer-facing string is not duplicated into the analytics
   store.

### Requirement 14: Failures are visible rather than silent

**User Story:** As an operator, I want a menu that could not be delivered to show
up as a failure, so that I do not discover it from a customer who never got a
reply.

#### Acceptance Criteria

1. WHEN a Channel_Adapter degrades an Interactive_Payload from
   Native_Interactive to Text_Fallback, THE Channel_Adapter SHALL record one
   informational entry naming the channel, the payload identifier, and the reason.
2. IF a Channel_Adapter receives an Interactive_Payload of a kind it does not
   handle, THEN THE Channel_Adapter SHALL deliver the payload's Text_Fallback and
   SHALL record one warning naming the kind, so that an unhandled kind is never
   dropped without a trace.
3. IF an Interactive_Payload cannot be delivered in any form, THEN THE
   Channel_Adapter SHALL mark its Chat_Row `failed` with a machine-readable
   reason and SHALL publish that status to the Inbox_View.
4. THE machine-readable failure reason SHALL be one of
   `native_interactive_rejected`, `service_window_closed`, `rate_limited`,
   `session_not_connected`, `unsupported_payload`, or `channel_send_failed`.
5. WHEN a Channel_Adapter truncates an Option `label` to fit a
   Channel_Capability limit, THE Channel_Adapter SHALL record one informational
   entry naming the payload identifier and the Option's `optionId`.

### Requirement 15: Rollout is reversible

**User Story:** As an operator, I want to turn this feature on one channel at a
time and turn it back off, so that a regression on WhatsApp does not force a
rollback of the whole release.

#### Acceptance Criteria

1. THE Flow_Engine SHALL read whether Interactive_Payload handling is enabled
   from configuration, per channel.
2. WHILE Interactive_Payload handling is disabled for a channel, THE
   Channel_Adapter for that channel SHALL deliver messages exactly as it does
   before this feature.
3. THE Flow_Engine SHALL run flows authored before this feature without requiring
   a flow edit, on every channel, whether Interactive_Payload handling is enabled
   or disabled.
4. WHEN Interactive_Payload handling is enabled for a channel and then disabled,
   THE Flow_Engine SHALL leave every persisted `optionId` in place, so that
   re-enabling the feature does not renumber options or invalidate stored
   selections.
5. THE Flow_Engine SHALL treat the absence of the configuration as
   Interactive_Payload handling enabled for Web_Widget and WhatsApp_Cloud and
   enabled for WhatsApp_Web with Native_Interactive sending disabled.
