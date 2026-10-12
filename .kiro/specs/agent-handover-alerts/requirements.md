# Requirements Document

## Introduction

Right now the Dashboard plays the alert sound for almost every message in a widget conversation, including bot and AI replies. This feature changes that. The audible alert fires only when a human is actually needed: a flow transfer, a visitor asking for a human, an AI escalation, or an emergency. Visitor messages in a conversation already assigned to the signed-in agent get a softer notification.

Dependency: this spec builds on `.kiro/specs/agent-handover-inbox` and reuses its terms Handover_Request, Agent_Intent, Handover_Queue, Ownership_State, Agent_Owned, Sender_Role and Inbox_Bridge. That spec covers when a Handover_Request is raised (Req 8), inbox gating (Req 7), ownership (Req 4) and the no-agent-online flow behaviour (Req 12). This spec covers only how agents are alerted.

### How it works today (code analysis)

Sound sources in QuantumMind-ui. Both are in `src/context/AuthContext.tsx`, and both play `/sound.mpeg` when `enSound.current` is set:

- **S1, `onVisitorMessage()`** (socket `message`). The backend emits this only from `MessageHandlerService.sendMessageToAgent`, which forwards a visitor message while the in-memory `SocketState` marks the conversation handled by an agent. It plays the sound on every such message.
- **S2, `onInboxMessage()`** (socket `inbox:message`). It plays the sound when `event.message.direction !== 'outbound'`.
- The `Layout.tsx` and `UserLayout.tsx` copies are commented out. `onNewVisitor()` (`new-visitor`, emitted by `TransferToAgent`) plays no sound. The mute flag `conversations.enableSound` lives only in Redux, so it resets to "on" after every reload.

Root cause:

- `WidgetInboxBridgeService.onChatPersisted` publishes `inbox:message` for every persisted widget Chat row: visitor, bot, AI and agent.
- Rows written through `create.new.chat` never set `direction`, and `toMessageView` passes it through as `undefined`.
- `undefined !== 'outbound'` is true, so S2 treats every bot and AI reply as incoming and plays the sound. The bridge's own `isInbound` check (`sender !== bot`) is applied to the unread count only. It is never sent to the client.

Other defects:

- **D1, double sound.** In an agent-handled conversation, one visitor message triggers both S1 and S2.
- **D2, no deduplication.** Every open tab plays the sound.
- **D3, unhandled autoplay rejection.** `snd.play()` returns a promise that can be rejected by the browser autoplay policy, and the code never handles it.
- **D4, no alert on handover.** A handover itself raises no audible alert. `new-visitor` is silent and reaches only the single assigned agent.
- **D5, missed requests when no agent is online.** When `assignAgent` finds no ONLINE agent, `TransferToAgent` sends a text message and takes FAILURE without notifying anyone. A queued request is never surfaced.
- **D6, nothing persists.** Alerts are not stored, so after a reload an unattended request shows no indicator.

Handover signal sources:

- **Flow.** `TRANSFER_TO_AGENT` (`TransferToAgent`) is the only deterministic flow signal. In `kone-mykone-assistant-flow.json`, the emergency text "I'm alerting a KONE specialist now" (BOT_RESPONSE) leads to `kone_ticket_emergency`, then to `kone_agent_emg` (TRANSFER_TO_AGENT). That makes the emergency path a real transfer.
- **Visitor buttons and keywords.** "Talk to KONE" and the related keywords reach `kone_human_start`, which runs contact collection, then `kone_r_handover`, then `kone_agent` (TRANSFER_TO_AGENT). Agent_Intent free text is defined by the dependency spec.
- **AI.** `handleAiResponse` and the AI service `QueryResponse` return only `answer`, `confident`, `sources`, `tokens_used`, `provider` and `model`. There is no structured escalation signal. A non-confident answer goes to the AI node's FAILURE child, which a designer can wire to TRANSFER_TO_AGENT.

### Recommended approach

1. **One explicit trigger.** The backend emits a dedicated `inbox:handover-requested` event exactly once per Handover_Request. The event carries a reason (`flow_transfer`, `visitor_intent`, `ai_escalation` or `emergency`) and a priority. The Dashboard plays the alert sound only for this event. It never plays a sound for a generic `inbox:message`.
2. **Emergency is explicit.** Emergency comes from a flag on the TRANSFER_TO_AGENT node. It is never inferred from message text.
3. **AI escalation in priority order:**
   - (a) Preferred: a structured `handover` flag plus `handover_reason` on the AI service `QueryResponse`, set when the visitor asks for a human or the model judges escalation is needed. This requires a QuantumMind-ai change to the schema, prompt and eval cases.
   - (b) Supported already: a non-confident answer routed by flow design through FAILURE to TRANSFER_TO_AGENT. This raises a `flow_transfer` alert.
   - (c) Rejected: keyword matching on AI answer text. It is fragile across languages and phrasings, and it produces false positives such as "I can't connect you to an agent" or answers that only mention agents in passing.
4. **Softer notification.** Visitor messages in a conversation that is Agent_Owned by the signed-in agent produce a softer, separately mutable notification. This uses Sender_Role from the dependency spec instead of `direction`.

## Glossary

- **Dashboard**: The admin/agent web application (QuantumMind-ui).
- **Alert_Service**: The backend component that creates, persists, sends out and clears Handover_Alerts.
- **Alert_Client**: The Dashboard component that receives Handover_Alerts and plays the sound and shows the visual notification.
- **Handover_Alert**: A persisted record of one Handover_Request. It holds the conversation id, thread id, bot id, visitor display name, Alert_Reason, Alert_Priority, creation time, recipients and acknowledgement state. It is sent to the Dashboard as the `inbox:handover-requested` event.
- **Alert_Reason**: Why a Handover_Alert was raised. One of `flow_transfer`, `visitor_intent`, `ai_escalation` or `emergency`.
- **Alert_Priority**: `high` for Alert_Reason `emergency`, `normal` for every other Alert_Reason.
- **Alert_Recipients**: The users who receive a Handover_Alert. These are the assigned agent and the bot's org admins when an agent is assigned. While the Conversation is in the Handover_Queue, they are every agent assigned to the bot and the bot's org admins. Each user is counted once.
- **Handover_Sound**: The audible alert played for a Handover_Alert.
- **Message_Notification**: The softer notification (sound and visual) for a visitor message in a Conversation that is Agent_Owned by the signed-in agent.
- **Emergency_Flag**: A boolean setting on a TRANSFER_TO_AGENT node. It marks transfers from that node as emergencies.
- **AI_Handover_Signal**: A structured field in the AI service answer (`handover: true` plus an optional `handover_reason`). It means the visitor needs a human.
- **Sound_Preference**: The per-user mute setting for the Handover_Sound and the Message_Notification. It is stored so that it survives a page reload.
- **Message_Handler**: The backend service (MessageHandlerService) that runs flow nodes for widget conversations.
- **Acknowledged**: The state of a Handover_Alert after an Alert_Recipient opens the thread, takes over the Conversation, or the Conversation ends.

## Requirements

### Requirement 1: Dedicated handover alert event

**User Story:** As an agent, I want a single, explicit signal when a visitor needs a human, so that I am alerted for handovers and not for ordinary bot traffic.

#### Acceptance Criteria

1. WHEN a Handover_Request is raised for a Conversation whose Widget is not running in preview mode, THE Alert_Service SHALL persist exactly one Handover_Alert in the unacknowledged state and emit exactly one `inbox:handover-requested` event to each Alert_Recipient connected to the Dashboard, within 2 seconds of the Handover_Request being raised.
2. THE Alert_Service SHALL include in every `inbox:handover-requested` event the alert id, conversation id, thread id, bot id, visitor display name, Alert_Reason, Alert_Priority, creation time and a boolean that is true when an agent is assigned and false otherwise. IF the visitor has no display name, THEN THE Alert_Service SHALL send a non-empty fallback display name that identifies the visitor as anonymous.
3. WHILE a Conversation has an open Handover_Request, THE Alert_Service SHALL create zero additional Handover_Alerts for that Conversation and SHALL keep the Alert_Reason of the existing Handover_Alert unchanged. This holds when the flow reaches another TRANSFER_TO_AGENT node, when another Agent_Intent message arrives, and when another AI_Handover_Signal arrives. The only permitted change to the existing Handover_Alert is the Alert_Priority upgrade defined in Requirement 2, criterion 4.
4. WHEN a Handover_Request is raised for a Conversation whose previous Handover_Request was closed (released to bot or ended), THE Alert_Service SHALL create a new Handover_Alert with a new alert id, and SHALL leave the previous Handover_Alert and its acknowledgement state unchanged.
5. FOR ALL sequences of handover triggers within one open Handover_Request, including two or more triggers that arrive for the same Conversation within the same second, THE Alert_Service SHALL persist exactly one Handover_Alert and emit exactly one `inbox:handover-requested` event per Alert_Recipient (once-per-request property), apart from the single updated event allowed by Requirement 2, criterion 4.
6. IF emitting the `inbox:handover-requested` event to one or more Alert_Recipients fails or an Alert_Recipient is not connected, THEN THE Alert_Service SHALL keep the persisted Handover_Alert unacknowledged and unchanged, SHALL still deliver the event to every other connected Alert_Recipient, and the Alert_Client SHALL show the alert on its next load or socket reconnect per Requirement 7, criterion 1.
7. IF persisting the Handover_Alert fails, THEN THE Alert_Service SHALL emit zero `inbox:handover-requested` events for that Handover_Request, SHALL leave the Handover_Request and the Conversation flow unaffected, and SHALL retry persisting the Handover_Alert at most 3 times within 10 seconds before giving up.

### Requirement 2: Alert reasons from flow, visitor intent and emergency

**User Story:** As an agent, I want to know why I am being alerted, so that I can prioritise an emergency over a routine request.

#### Acceptance Criteria

1. WHEN the flow reaches a TRANSFER_TO_AGENT node whose Emergency_Flag is false or not set, and the Conversation has no open Handover_Request, THE Alert_Service SHALL create the Handover_Alert with Alert_Reason `flow_transfer` and Alert_Priority `normal`.
2. WHEN the flow reaches a TRANSFER_TO_AGENT node whose Emergency_Flag is true, and the Conversation has no open Handover_Request, THE Alert_Service SHALL create the Handover_Alert with Alert_Reason `emergency` and Alert_Priority `high`.
3. WHEN a Handover_Request is raised by an Agent_Intent match, and the Conversation has no open Handover_Request, THE Alert_Service SHALL create the Handover_Alert with Alert_Reason `visitor_intent` and Alert_Priority `normal`.
4. WHEN a Conversation with an open Handover_Request whose Handover_Alert has Alert_Reason `flow_transfer`, `visitor_intent` or `ai_escalation` reaches a TRANSFER_TO_AGENT node whose Emergency_Flag is true, THE Alert_Service SHALL update that same Handover_Alert (same alert id) to Alert_Reason `emergency` and Alert_Priority `high`, create zero new Handover_Alerts, and emit exactly one updated `inbox:handover-requested` event to each Alert_Recipient within 2 seconds.
5. WHILE a Conversation has an open Handover_Request whose Handover_Alert has Alert_Priority `high`, THE Alert_Service SHALL keep Alert_Reason `emergency` and Alert_Priority `high` on that Handover_Alert when later non-emergency triggers occur (a TRANSFER_TO_AGENT node with Emergency_Flag false, an Agent_Intent match, or an AI_Handover_Signal), and SHALL emit zero additional `inbox:handover-requested` events for those triggers.
6. THE Alert_Service SHALL determine the Alert_Reason and Alert_Priority only from structured signals (node type, Emergency_Flag, Agent_Intent match, AI_Handover_Signal).
7. WHEN a bot-authored or AI-authored message is sent whose text contains words such as "emergency", "agent" or "human", THE Alert_Service SHALL create zero Handover_Alerts and change zero existing Alert_Reason or Alert_Priority values because of that text.
8. WHERE a bot designer edits a TRANSFER_TO_AGENT node in the flow builder, THE Dashboard SHALL provide an Emergency_Flag toggle that is set to false for new nodes and for existing nodes saved before this feature.
9. WHEN a bot designer saves a flow after changing a TRANSFER_TO_AGENT node's Emergency_Flag, THE Dashboard SHALL show the saved Emergency_Flag value on that node after the flow builder is reloaded, and THE Alert_Service SHALL apply the saved value to every Handover_Request raised at that node after the save.

### Requirement 3: AI escalation signal

**User Story:** As an agent, I want the AI to escalate when the visitor needs a human, so that AI-handled conversations reach me without fragile text matching.

#### Acceptance Criteria

1. THE AI service SHALL return an AI_Handover_Signal on every `QueryResponse`, including responses with `confident` false, with `handover` set to false and `handover_reason` absent unless criterion 2 applies.
2. WHEN the visitor's message explicitly asks to speak with a human (person, agent, staff member or representative) in any language the AI service answers in, or the AI service determines that the request needs an action it cannot perform from its sources, THE AI service SHALL return `handover` true and a `handover_reason` of 1 to 200 characters that summarises why a human is needed.
3. WHEN the Message_Handler receives an AI answer with `handover` true and the AI node has a FAILURE child, THE Message_Handler SHALL raise a Handover_Request with Alert_Reason `ai_escalation`, send the AI answer text to the visitor if it is non-empty after trimming whitespace, and then continue on the AI node's FAILURE child, whatever the value of `confident`.
4. WHEN the Message_Handler receives an AI answer with `handover` true and the AI node has no FAILURE child, THE Message_Handler SHALL raise a Handover_Request with Alert_Reason `ai_escalation`, send the AI answer text to the visitor if it is non-empty after trimming whitespace, and run the agent assignment defined by the dependency spec.
5. IF the Message_Handler receives an AI answer whose `handover` value is false, missing, null or not a boolean, THEN THE Alert_Service SHALL create zero Handover_Alerts for that answer, whatever the answer text says, and THE Message_Handler SHALL route the answer by its `confident` value as before this feature.
6. WHEN a non-confident AI answer with `handover` false is routed through the FAILURE child to a TRANSFER_TO_AGENT node, THE Alert_Service SHALL raise the alert with Alert_Reason `flow_transfer`.
7. WHEN an AI answer with `handover` true is followed by the flow reaching a TRANSFER_TO_AGENT node through the FAILURE child, THE Alert_Service SHALL keep exactly one Handover_Alert with Alert_Reason `ai_escalation` for that Handover_Request, and SHALL apply only the Alert_Priority change from Requirement 2, criterion 4 if that node's Emergency_Flag is true.
8. IF the AI service returns a `handover_reason` longer than 200 characters, THEN THE Message_Handler SHALL truncate it to the first 200 characters and still raise the Handover_Request.
9. THE AI service evaluation datasets SHALL include at least 5 cases that expect `handover` true for explicit human requests and at least 5 cases that expect `handover` false for answers that mention agents only in passing, including at least one case where the answer says it cannot connect the visitor to an agent. The evaluation run SHALL report a pass or fail result for the `handover` value of each case.

### Requirement 4: Sound only on handover alerts

**User Story:** As an agent, I want the alert sound to play only when I am needed, so that routine bot and AI traffic does not distract me.

#### Acceptance Criteria

1. WHEN the Alert_Client receives an `inbox:handover-requested` event with an alert id it has not played before and the Sound_Preference for the Handover_Sound is unmuted, THE Alert_Client SHALL start the Handover_Sound exactly once within 1 second of receiving the event.
2. WHEN the Alert_Client receives an `inbox:handover-requested` event with an alert id it has not shown before, THE Alert_Client SHALL show a visual notification within 1 second that contains the visitor display name (or a placeholder indicating an unnamed visitor when the display name is empty) and the Alert_Reason, whatever the Sound_Preference.
3. WHEN the Alert_Client receives an `inbox:handover-requested` event with Alert_Priority `high`, THE Alert_Client SHALL play a Handover_Sound that is a different audio clip from the one used for Alert_Priority `normal`, and SHALL keep the visual notification on screen until the Handover_Alert becomes Acknowledged.
4. WHEN the Alert_Client shows a visual notification for a Handover_Alert with Alert_Priority `normal`, THE Alert_Client SHALL remove that notification after 10 seconds or when the Handover_Alert becomes Acknowledged, whichever comes first, and SHALL keep the alert in the unacknowledged alert indicator until it is Acknowledged.
5. WHEN the Alert_Client receives an `inbox:message` event or a `message` event, THE Alert_Client SHALL play the Handover_Sound zero times. Any Message_Notification for that event is governed only by Requirement 5.
6. WHEN the Alert_Client receives an `inbox:message` event or a `message` event whose message has Sender_Role `bot`, `agent` or `system`, THE Alert_Client SHALL play no sound and show no notification, whatever the message's direction value, including when direction is missing.
7. IF the Alert_Client receives an `inbox:message` event or a `message` event whose message has a missing or unrecognised Sender_Role, THEN THE Alert_Client SHALL play no sound and show no notification for that message, and SHALL still update the thread list and conversation view as defined in Requirement 9.
8. WHEN the Alert_Client receives a `new-visitor` event, THE Alert_Client SHALL update the conversation list, play no sound and show no visual notification for that event.
9. WHEN the Alert_Client receives an updated `inbox:handover-requested` event for an alert id it has already played, and that event raises the Alert_Priority from `normal` to `high`, THE Alert_Client SHALL play the `high` Handover_Sound once (if the Sound_Preference for the Handover_Sound is unmuted) and keep the visual notification on screen until the Handover_Alert becomes Acknowledged.

### Requirement 5: Softer notification for my agent-owned conversations

**User Story:** As an agent, I want a softer notification when a visitor writes in a conversation I own, so that I can reply in time without a full handover alarm.

#### Acceptance Criteria

1. WHILE a Conversation is Agent_Owned by the signed-in user, WHEN a message with Sender_Role `visitor` arrives for that Conversation and the Sound_Preference for Message_Notification is unmuted, THE Alert_Client SHALL, within 1 second of receiving the message, play the Message_Notification sound once and show a visual notification with the visitor display name and the first 100 characters of the message text. The Alert_Client SHALL decide ownership from the Ownership_State it holds at the moment it receives the message.
2. THE Alert_Client SHALL use a Message_Notification sound that is a different audio file from both the `normal` and `high` Handover_Sounds.
3. WHILE a Conversation is not Agent_Owned by the signed-in user, WHEN a message with Sender_Role `visitor` arrives for that Conversation, THE Alert_Client SHALL play no Message_Notification sound and show no Message_Notification visual notification. Handover_Sound behaviour stays governed by Requirement 4, and list and unread-count updates stay governed by Requirement 9.
4. WHEN one visitor message is delivered to the Alert_Client on both the `message` and `inbox:message` events, in either order and up to 10 seconds apart, THE Alert_Client SHALL play at most one Message_Notification for that message. The Alert_Client SHALL treat two deliveries as the same message when their message ids are equal. If either delivery has no message id, it SHALL treat them as the same message when both the conversation id and the message timestamp are equal.
5. WHILE the signed-in user has the Conversation open, the browser tab is focused, and the latest message of the Conversation is inside the visible area of the message list, WHEN a message with Sender_Role `visitor` arrives for that Conversation, THE Alert_Client SHALL add the message to the message list and play no Message_Notification sound and show no Message_Notification visual notification.
6. WHEN a Message_Notification has played for a Conversation, THE Alert_Client SHALL play no further Message_Notification for visitor messages in that Conversation for the next 5 seconds, measured from the time the notification played. It SHALL play a Message_Notification again for the first visitor message that arrives after those 5 seconds.
7. WHILE the Sound_Preference for Message_Notification is muted, WHEN a message with Sender_Role `visitor` arrives for a Conversation that is Agent_Owned by the signed-in user, THE Alert_Client SHALL play no Message_Notification sound and SHALL still show the Message_Notification visual notification, subject to criteria 4, 5 and 6.

### Requirement 6: Mute, autoplay and multi-tab behaviour

**User Story:** As an agent, I want sounds that respect my mute choice and play once even with several tabs open, so that alerts are reliable and not noisy.

#### Acceptance Criteria

1. WHEN a user changes the Sound_Preference for the Handover_Sound or the Message_Notification, THE Dashboard SHALL store the setting for that user, keep the two settings independent of each other, and apply the new setting in every open Dashboard tab of that user within 2 seconds. The stored setting SHALL still apply after a page reload, after sign-out and sign-in, and on another browser. A user with no stored Sound_Preference SHALL have both the Handover_Sound and the Message_Notification unmuted.
2. WHILE the Sound_Preference for the Handover_Sound is muted, THE Alert_Client SHALL play zero Handover_Sounds for both `normal` and `high` Alert_Priority, and SHALL still show the visual notification and update the unacknowledged alert indicator count for each Handover_Alert received.
3. IF the browser rejects audio playback because of its autoplay policy, THEN THE Alert_Client SHALL handle the rejection without an unhandled error, still show the visual notification for the alert or message, and show one "Enable sound" prompt in that tab, even if several playbacks are rejected. The rejected sound SHALL NOT be replayed later. After the user's first click, tap or key press on the page, THE Alert_Client SHALL hide the prompt and play the next Handover_Sound or Message_Notification normally.
4. WHEN the same Handover_Alert (same alert id) or the same message (same message id) reaches more than one open Dashboard tab of the same user in the same browser, THE Alert_Client SHALL play the sound in exactly one of those tabs, and SHALL show the visual notification and update the alert indicator in every one of those tabs.
5. WHEN the Alert_Client receives a Handover_Alert whose alert id has already played a sound in any tab of the same user in the same browser since the Dashboard was loaded (for example after a socket reconnect or a re-send of the event), THE Alert_Client SHALL play no sound for the repeat and SHALL NOT add the alert to the indicator count a second time.
6. WHILE the Sound_Preference for the Message_Notification is muted, THE Alert_Client SHALL play zero Message_Notification sounds and SHALL still show the visual part of the Message_Notification, without changing whether the Handover_Sound plays.
7. WHEN the Alert_Client receives an updated `inbox:handover-requested` event that raises an already-played Handover_Alert's Alert_Priority from `normal` to `high` (Requirement 2, criterion 4), THE Alert_Client SHALL play the `high` Handover_Sound once, in exactly one tab, subject to the Sound_Preference for the Handover_Sound.
8. IF storing a Sound_Preference change fails, THEN THE Dashboard SHALL show an error message saying the setting was not saved, and SHALL show and apply the last successfully stored setting again in every open tab.

### Requirement 7: Persisted and acknowledged alerts

**User Story:** As an agent, I want unattended handover requests to stay visible until someone picks them up, so that no visitor waiting for a human is missed after a reload or while I was offline.

#### Acceptance Criteria

1. WHEN the Dashboard finishes loading for a signed-in user or the socket reconnects, THE Alert_Client SHALL fetch the unacknowledged Handover_Alerts for the signed-in user within 3 seconds and show them in an alert indicator. The indicator SHALL show a count equal to the number of distinct unacknowledged alert ids, and SHALL list the alerts with Alert_Priority `high` first and then by creation time, oldest first.
2. WHEN the Alert_Client shows Handover_Alerts returned by the fetch in criterion 1, THE Alert_Client SHALL play the Handover_Sound zero times for those alerts, except where Requirement 8, criterion 5 applies. After a reconnect it SHALL merge the returned alerts with alerts already in the indicator by alert id, so that no alert id appears more than once.
3. WHEN an Alert_Recipient selects the thread of a Handover_Alert in the Dashboard inbox, or takes over its Conversation, THE Alert_Service SHALL persist the Handover_Alert as Acknowledged. It SHALL record the acknowledging user, the acknowledgement time and the resolution (`opened` or `taken_over`), and emit one `inbox:handover-acknowledged` event with the alert id and resolution to every Alert_Recipient within 2 seconds.
4. WHEN the Alert_Client receives an `inbox:handover-acknowledged` event, THE Alert_Client SHALL remove that alert id from the indicator within 1 second, reduce the count by 1, and close any open visual notification for that alert id, including notifications with Alert_Priority `high`.
5. WHEN the Conversation of an unacknowledged Handover_Alert ends, THE Alert_Service SHALL persist the Handover_Alert as Acknowledged with the resolution `ended` and emit one `inbox:handover-acknowledged` event with the alert id and resolution `ended` to every Alert_Recipient within 2 seconds.
6. THE Alert_Service SHALL return an unacknowledged Handover_Alert only to a user who is one of that alert's Alert_Recipients and who belongs to the organization of the alert's bot. It SHALL return zero alerts that are Acknowledged, that belong to bots in other organizations, or that list the user as a non-recipient.
7. IF more than one acknowledgement (open, takeover or Conversation end) arrives for the same Handover_Alert, THEN THE Alert_Service SHALL keep only the first acknowledgement's user, time and resolution, and SHALL emit exactly one `inbox:handover-acknowledged` event per Alert_Recipient for that alert.
8. IF a user who is not an Alert_Recipient of a Handover_Alert, or who belongs to a different organization than the alert's bot, tries to acknowledge that alert, THEN THE Alert_Service SHALL reject the request with an error indicating the user is not authorized, and SHALL leave the Handover_Alert unacknowledged and unchanged.
9. IF the fetch of unacknowledged Handover_Alerts fails or does not complete within 10 seconds, THEN THE Alert_Client SHALL keep any alerts already shown in the indicator, show an indication that alerts could not be loaded, and retry the fetch up to 3 times at 5-second intervals.

### Requirement 8: No agent online

**User Story:** As an org admin, I want handover requests made while no agent is online to stay visible, so that someone follows up.

#### Acceptance Criteria

1. IF a Handover_Request is raised and zero agents assigned to the bot have the status ONLINE at that moment, THEN THE Alert_Service SHALL persist the Handover_Alert with the assigned-agent indicator set to false and with the Alert_Recipients set to every agent assigned to the bot plus the bot's org admins, each user counted once.
2. IF a Handover_Request is raised and zero agents assigned to the bot have the status ONLINE, THEN THE Alert_Service SHALL emit the `inbox:handover-requested` event within 2 seconds to each Alert_Recipient that has at least one connected Dashboard session, and SHALL keep the persisted Handover_Alert available to the remaining Alert_Recipients for retrieval per Requirement 7.
3. IF a Handover_Request is raised and the bot has zero agents assigned, THEN THE Alert_Service SHALL persist the Handover_Alert with the bot's org admins as the only Alert_Recipients and emit the `inbox:handover-requested` event to each connected org admin within 2 seconds.
4. WHEN an agent assigned to the bot changes status to ONLINE while one or more unacknowledged Handover_Alerts exist for that bot, THE Alert_Client SHALL show every such alert in that agent's alert indicator with a count within 2 seconds of the status change.
5. WHEN an agent assigned to the bot changes status to ONLINE while one or more unacknowledged Handover_Alerts exist for that bot and the agent's Sound_Preference for the Handover_Sound is unmuted, THE Alert_Client SHALL play the Handover_Sound exactly once for that status change, whatever the number of pending alerts, and SHALL play zero sounds for alert ids already played in that browser per Requirement 6, criterion 5.
6. WHILE an unacknowledged Handover_Alert has zero Alert_Recipients with a connected Dashboard session, THE Alert_Service SHALL keep the Handover_Alert unacknowledged with no time-based expiry, and SHALL change it to Acknowledged only when an Alert_Recipient opens its thread, takes over its Conversation, or the Conversation ends (resolution `ended`).

### Requirement 9: Non-regression

**User Story:** As an org admin, I want other channels and existing views to keep working, so that the change only affects alerting.

#### Acceptance Criteria

1. WHEN the Alert_Client receives an `inbox:message` event, THE Alert_Client SHALL, within 1 second, move the message's thread to its current position in the inbox thread list, update that thread's last-message preview, and append the message to the conversation view if that thread is open. This applies to every Sender_Role (`visitor`, `bot`, `agent`, `system`) and every channel.
2. WHEN the Alert_Client receives an `inbox:message` event or an `inbox:thread-updated` event, THE Alert_Client SHALL show the unread count the event carries for that thread. The unread count increases only for messages that are not bot-authored, as it did before this feature, and this feature does not change how the count is calculated.
3. WHEN the Alert_Client receives a `message` event for a Conversation that is open in the conversation view, THE Alert_Client SHALL append the visitor message to that view within 1 second. A message delivered on both the `message` and `inbox:message` events SHALL appear exactly once, matched by message id or by conversation id and message timestamp.
4. WHEN a message with Sender_Role `visitor` from a non-widget channel (WhatsApp, Telegram, Instagram) arrives on a thread that has no open Handover_Request, THE Alert_Client SHALL apply the Message_Notification rules from Requirement 5 according to the thread's Ownership_State, and SHALL play the Handover_Sound zero times.
5. WHEN a message with Sender_Role `bot`, `agent` or `system` from a non-widget channel arrives, THE Alert_Client SHALL play no sound and show no notification, and SHALL still update the thread list and conversation view as stated in criterion 1.
6. WHILE a Widget runs in preview mode, THE Alert_Service SHALL create zero Handover_Alerts and emit zero `inbox:handover-requested` events for that Conversation. The flow, including TRANSFER_TO_AGENT nodes and AI nodes, SHALL produce the same visitor-facing replies it produced before this feature.
7. IF the Alert_Service fails to persist or emit a Handover_Alert, THEN THE Dashboard SHALL keep delivering and showing the Conversation's messages, thread list updates and unread counts exactly as stated in criteria 1 to 3. The visitor-facing flow SHALL continue without an extra error message reaching the visitor.
