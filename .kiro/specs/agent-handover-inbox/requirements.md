# Requirements Document

## Introduction

This feature fixes two defects in the visitor ↔ bot ↔ agent chat path and changes when a conversation reaches human agents.

1. Messages from visitor, bot and agent must render on the correct side in both the visitor widget (QuantumMind-widget) and the agent dashboard (QuantumMind-ui), and the bot/AI must stay silent while an agent owns a conversation.
2. A conversation enters the agent inbox only after the visitor asks for a human. Before the handover the bot collects and stores the visitor's name and email, and the inbox shows the visitor's name instead of "Anonymous".

### How it works today (code analysis)

End-to-end path: widget `socket.emit("events", {event: "chat-message-bot"})` → `JarCubeGateway.handleEvents` → if the in-memory `SocketState.handledByAgent && assignedAgentId`, then `MessageHandlerService.sendMessageToAgent`, else `MessageHandlerService.handleMessage` → flow nodes (`handleNode`) → `sendBotMessage` → `create.new.chat` (Chat row) + `RedisPropagatorService.propagateEvent` → widget `chat-message-bot`. Every persisted chat emits `chat.persisted`. `WidgetInboxBridgeService.onChatPersisted` then upserts one `ChannelThread` per widget conversation and calls `InboxEventsService.publishMessage` for every row, which fans out `inbox:message` to all admins and assigned agents of the bot.

Findings behind the reported symptoms:

- **F1, sides swapped in the widget.** `ChatLog.tsx` sets `isSender = item.senderId === visitorId`, but `visitorId` is never passed into `ChatLog`/`SendMsgForm`. `ChatContent` reads it from Redux and spreads `{...props}`, which don't contain it. So locally echoed visitor messages carry `senderId: undefined`. Agent replies sent from the dashboard inbox (`WidgetInboxBridgeService.onInboxSendMessage`) also carry no `senderId`. `undefined === undefined` puts both on the visitor (right) side. Bot messages carry `senderId: botId`, so they render left.
- **F2, sides ambiguous in the dashboard.** The inbox `ThreadLog.tsx` aligns on `direction === 'outbound'`. Widget rows written through `create.new.chat` (visitor messages, bot messages, gateway agent replies) never set `direction`. Only dashboard inbox replies set `OUTBOUND`. Chat rows have no explicit sender role, so bot, agent and visitor can only be told apart by comparing ids. The legacy active-chat `ChatLog.tsx` compares `sender !== visitor._id`, which is a different rule. I traced the code but did not reproduce the exact on-screen swap at runtime.
- **F3, two ownership stores.** A dashboard "Take over" (`InboxService.setBotControl`) writes `ChannelThread.handledByAgent/assignedAgent` and mirrors them into the in-memory `SocketState`. It does not update `Conversation.agent/type/transferredToAgent`. A flow `TRANSFER_TO_AGENT` (`TransferToAgent`) writes `SocketState` and `Conversation` but not the `ChannelThread`, so the inbox chip still shows "Bot active".
- **F4, the bot answers during takeover.** The suppression check lives only in the gateway, and only against in-memory `SocketState`. `handleMessage` itself never checks ownership. That state is lost in several ways:
  - When the visitor's last socket disconnects while agent-owned, `SocketStateService.remove` expires the conversation and deletes the state.
  - Idle eviction and process restarts also drop it.
  - The state is process-local across instances.
  - `handleConnection` sends `"start"` straight into `handleMessage` on every (re)connect.
  - A returning visitor gets a fresh conversation from `createVisitor`.
  
  Each of these lets the bot/AI answer while the dashboard still shows "AGENT: … / RELEASE TO BOT".
- **F5, inbox flooding.** `WidgetInboxBridgeService` mirrors and announces every widget chat, including bot-only ones. Every visitor conversation therefore appears in the agent feed.
- **F6, "Anonymous" title.** `WidgetService.createVisitor` puts `name: body.name || "Anonymous"` into the socket JWT, and `VisitorService.createVisitor` defaults to `name "Anonymous"` and email `<id>@nomemail.com`. QUESTIONS node answers (e.g. `contact_name`, `contact_email` in `kone-mykone-assistant-flow.json` node `kone_q_contact`) are stored only as conversation attributes, never on the Visitor record. `toThreadName` falls back pushName → visitor.name → phone → chatId, and `TransferToAgent` emits `new-visitor` with the JWT name.
- **F7, the example flow.** `kone_human_start` → `kone_tpl_contact` (OPEN_TEMPLATE) with failure → `kone_q_contact` (QUESTIONS) → ticket → `kone_r_handover` → `kone_agent` (TRANSFER_TO_AGENT). The emergency path `kone_agent_emg` transfers without collecting name or email. `TransferToAgent` calls `AgentService.assignAgent(botId)` (ONLINE agents only). With no agent it sends a fixed message and takes the FAILURE child.

## Glossary

- **Widget**: The visitor-facing chat application (QuantumMind-widget).
- **Dashboard**: The admin/agent web application (QuantumMind-ui), including the inbox view at `/apps/chat/active`.
- **Gateway**: The backend socket gateway (`JarCubeGateway`) that receives visitor and agent socket events.
- **Message_Handler**: The backend service (`MessageHandlerService`) that runs bot flow nodes and sends bot messages.
- **Bot_Responder**: Any backend path that produces a bot-authored or AI-authored message to a visitor: flow nodes, AI_NODE/AI_RESPONSE, question bank, fallback, welcome message, template resume and timeout handlers.
- **Conversation**: The backend record of one visitor session with a bot, holding its persisted Chat_Rows.
- **Chat_Row**: One persisted message belonging to a Conversation.
- **Sender_Role**: The author category of a message: `visitor`, `bot`, `agent` or `system`.
- **Ownership_State**: The durable record of who answers a Conversation: `bot` or `agent`, plus the assigned agent id when `agent`.
- **Agent_Owned**: The Ownership_State value meaning a human agent answers the Conversation.
- **Handover_Request**: The event that a visitor asked to talk to a human. It is raised when the flow reaches a TRANSFER_TO_AGENT node or when the visitor's message matches a configured Agent_Intent.
- **Agent_Intent**: A bot-level configurable list of phrases (e.g. "talk to agent", "human") that raises a Handover_Request.
- **Contact_Collection_Step**: The part of the handover that obtains the visitor's name and email, using the flow's QUESTIONS node where one is configured.
- **Visitor_Record**: The persisted Visitor entity (name, email, phone) linked to the Conversation.
- **Known_Contact**: A Visitor_Record whose name is non-empty and not "Anonymous", and whose email is syntactically valid and not a generated placeholder (`@nomemail.com`).
- **Agent_Inbox**: The Dashboard list of conversations awaiting or under human handling, and its realtime feed (`inbox:message`, `inbox:thread-updated`, `new-visitor`).
- **Inbox_Bridge**: The backend service (`WidgetInboxBridgeService`) that mirrors widget conversations into the Agent_Inbox.
- **Handover_Queue**: The Agent_Inbox state for conversations with a Handover_Request but no assigned agent.
- **Conversation_Title**: The display name shown for a conversation in the Agent_Inbox list, header and notifications.
- **Bot_Only_Conversation**: A Conversation that never received a Handover_Request.

## Requirements

### Requirement 1: Sender role on every message

**User Story:** As a developer, I want every message to carry an explicit author role, so that the Widget and Dashboard can place messages without guessing from ids.

#### Acceptance Criteria

1. WHEN a Chat_Row is persisted through any write path (visitor message, Bot_Responder message, Gateway agent reply, Dashboard inbox agent reply or system notice), THE Message_Handler SHALL store exactly one Sender_Role from the set `visitor`, `bot`, `agent`, `system` and the sender id on the Chat_Row.
2. WHEN a Chat_Row with Sender_Role `visitor` is persisted, THE Message_Handler SHALL store direction `inbound` on the Chat_Row.
3. WHEN a Chat_Row with Sender_Role `bot`, `agent` or `system` is persisted, THE Message_Handler SHALL store direction `outbound` on the Chat_Row.
4. WHEN the backend emits a live message to a Widget socket or a Dashboard socket (including `chat-message-bot` and `inbox:message` events), THE Gateway SHALL include the Sender_Role and the sender id in the message payload, where the sender id is the visitor id for `visitor`, the bot id for `bot` and `system`, and the agent id for `agent`.
5. WHEN an agent reply is sent from the Dashboard inbox to a widget visitor, THE Inbox_Bridge SHALL include Sender_Role `agent`, the sending agent's id and the sending agent's display name in the payload delivered to the Widget.
6. WHEN a stored Chat_Row that has no Sender_Role is read for display or for a live payload, THE Message_Handler SHALL derive the Sender_Role as `bot` when the sender equals the Conversation's bot id, `visitor` when the sender equals the Conversation's visitor id, and `agent` otherwise, and SHALL derive direction `inbound` for `visitor` and `outbound` for every other derived Sender_Role, without modifying the stored Chat_Row.
7. THE Gateway SHALL deliver, for every message, a live payload whose Sender_Role and sender id equal the Sender_Role and sender id of the persisted Chat_Row for the same message (live/persisted consistency property).
8. IF a message reaches a write path without a Sender_Role or with a value outside `visitor`, `bot`, `agent`, `system`, THEN THE Message_Handler SHALL reject the write, persist no Chat_Row, emit no live payload for that message and leave the Conversation's existing Chat_Rows unchanged.
9. IF the sending agent has an empty display name, THEN THE Inbox_Bridge SHALL deliver the agent reply to the Widget with Sender_Role `agent`, the agent id and the display name "Agent".

### Requirement 2: Correct message sides in the Widget

**User Story:** As a visitor, I want my messages on my side and the bot's and agent's messages on the other side, so that I can follow who said what.

#### Acceptance Criteria

1. THE Widget SHALL render every message with Sender_Role `visitor` on the right side of the chat log. This covers local echoes, live messages and messages loaded from history.
2. THE Widget SHALL render every message with Sender_Role `bot`, `agent` or `system` on the left side of the chat log. This covers live messages and messages loaded from history.
3. WHEN a message with Sender_Role `agent` is rendered, THE Widget SHALL show the agent display name from the message payload next to the message, along with an agent avatar that differs from the bot avatar. If the payload has no agent display name, the Widget SHALL show the label "Agent" instead.
4. WHEN the visitor sends a message, THE Widget SHALL render a local echo of that message with Sender_Role `visitor` on the right side within 200 milliseconds of the send action and before the server confirms the message.
5. WHEN the server confirms a visitor message that is already shown as a local echo, THE Widget SHALL replace the local echo with the confirmed message. The result SHALL be exactly one message on the right side, with no duplicate.
6. IF a received or loaded message has no Sender_Role, THEN THE Widget SHALL put the message on the right side when its sender id equals the current visitor id, and on the left side otherwise. A message with no sender id SHALL go on the left side.
7. IF the server does not confirm a visitor message within 10 seconds, or the send fails, THEN THE Widget SHALL keep the local echo on the right side and mark it with a visible failed-delivery indicator.
8. FOR ALL message sequences that include `visitor`, `bot`, `agent` and `system` messages, THE Widget SHALL put each message on the same side, in the same order, whether it arrived live, was loaded after a page reload, or was loaded after a socket reconnect (render consistency property).

### Requirement 3: Correct message sides in the Dashboard

**User Story:** As an agent, I want visitor messages on the visitor's side and bot and agent messages on my side, so that I can read the conversation correctly.

#### Acceptance Criteria

1. THE Dashboard SHALL render every message with Sender_Role `visitor` left-aligned in the conversation view, whatever the message's sender id or direction value.
2. THE Dashboard SHALL render every message with Sender_Role `bot`, `agent` or `system` right-aligned in the conversation view. This includes agent messages sent by an agent other than the one currently viewing the conversation.
3. WHEN a message with Sender_Role `bot` is rendered, THE Dashboard SHALL show a bot label on the message, and the label SHALL differ from any agent display name.
4. WHEN a message with Sender_Role `agent` is rendered, THE Dashboard SHALL show the sending agent's display name on the message. If the payload has no display name, THE Dashboard SHALL show the generic label "Agent".
5. WHEN an agent sends a reply, THE Dashboard SHALL show the optimistic message right-aligned at once. When the server echo for that reply arrives, THE Dashboard SHALL replace the optimistic message with the echo so that exactly one right-aligned message is shown for the reply.
6. IF an agent's reply fails to be delivered or persisted, THEN THE Dashboard SHALL keep the optimistic message right-aligned, mark it with a failure indicator, and keep the reply text so the agent can resend it.
7. IF a message received live or loaded from history has no Sender_Role, THEN THE Dashboard SHALL place it using the Sender_Role derived by the rule in Requirement 1 criterion 6 (`bot` when the sender equals the Conversation's bot id, `visitor` when the sender equals the Conversation's visitor id, `agent` otherwise).
8. FOR ALL conversations, THE Dashboard SHALL put each message on the same side and with the same bot/agent label in the inbox view, the active-chat view and the history view. This SHALL hold whether the message arrived live or was loaded after a page reload (cross-view consistency property).

### Requirement 4: Single durable ownership state

**User Story:** As an agent, I want takeover, flow transfer and release to update one authoritative record, so that the dashboard and the bot always agree on who is answering.

#### Acceptance Criteria

1. WHEN an agent assigned to the Conversation's bot, or an org admin of the bot's organization, takes over a Conversation from the Dashboard, THE Message_Handler SHALL set the Ownership_State to Agent_Owned with that agent's id in durable storage before confirming the takeover to the Dashboard.
2. WHEN the flow assigns an agent through a TRANSFER_TO_AGENT node, THE Message_Handler SHALL set the Ownership_State to Agent_Owned with the assigned agent's id in durable storage before sending the visitor any transfer confirmation message.
3. WHEN the agent that currently owns the Conversation, or an org admin of the bot's organization, releases the Conversation to the bot, THE Message_Handler SHALL set the Ownership_State to `bot` and clear the assigned agent id in durable storage; IF the Ownership_State is already `bot`, THEN THE Message_Handler SHALL leave all records unchanged and emit no event.
4. WHEN the Ownership_State changes, THE Message_Handler SHALL update, in the same operation, the Conversation fields `agent` (set to the agent id when Agent_Owned, cleared when `bot`), `type` (set to the agent-handled value when Agent_Owned, the bot-handled value when `bot`) and `transferredToAgent` (true when Agent_Owned, false when `bot`), the ChannelThread fields `handledByAgent` (true when Agent_Owned, false when `bot`), `assignedAgent` (set to the agent id when Agent_Owned, cleared when `bot`) and `botEnabled` (false when Agent_Owned, true when `bot`), and the in-memory visitor state where one exists.
5. WHEN the Ownership_State change has been written to durable storage, THE Message_Handler SHALL emit one `inbox:thread-updated` event carrying the thread id, the new Ownership_State, and the assigned agent id and display name (empty when `bot`) to the bot's org admins and assigned agents, so that every open Dashboard view shows the new owner within 2 seconds of the write.
6. THE Message_Handler SHALL keep the Conversation, the ChannelThread and the in-memory visitor state (where one exists) reporting the same Ownership_State and the same assigned agent id after each completed takeover, transfer or release operation, for all sequences of these operations (ownership consistency property).
7. IF any durable write of an ownership change fails, THEN THE Message_Handler SHALL leave the previous Ownership_State and assigned agent id unchanged on the Conversation, the ChannelThread and the in-memory visitor state, emit no `inbox:thread-updated` event, and return an error indicating the ownership change failed to the requesting Dashboard user.
8. IF an agent requests a takeover while the Conversation is already Agent_Owned by a different agent, THEN THE Message_Handler SHALL reject the takeover, keep the current owner unchanged, and return an error indicating the current owner's display name; when two takeover requests for the same Conversation arrive concurrently, exactly one SHALL succeed.
9. IF a takeover or release is requested by a user who is neither an agent assigned to the Conversation's bot nor an org admin of the bot's organization, or a release is requested by an agent who is not the current owner and not an org admin, THEN THE Message_Handler SHALL reject the request, keep the Ownership_State unchanged, and return an error indicating the user lacks permission.

### Requirement 5: Bot and AI silence while Agent_Owned

**User Story:** As an agent, I want the bot and AI to stay silent while I own a conversation, so that the visitor gets only my answers.

#### Acceptance Criteria

1. WHILE a Conversation is Agent_Owned, THE Bot_Responder SHALL send no bot-authored or AI-authored message to the visitor and SHALL persist no Chat_Row with Sender_Role `bot` for that Conversation. This covers flow nodes, AI_NODE/AI_RESPONSE, question bank, fallback, welcome message, template resume and timeout handlers.
2. WHILE a Conversation is Agent_Owned, WHEN the visitor sends a message, THE Message_Handler SHALL persist the message as a Chat_Row with Sender_Role `visitor` and deliver it to every open Dashboard view of the assigned agent within 2 seconds.
3. WHILE a Conversation is Agent_Owned, WHEN the visitor's Widget connects or reconnects, THE Gateway SHALL skip the automatic `start` message and the welcome message, so that zero Bot_Responder messages are sent for that connection event.
4. WHILE a Conversation is Agent_Owned, WHEN the visitor presses a button, quick reply or gallery item, THE Message_Handler SHALL persist and deliver to the assigned agent a visitor message containing the label the visitor saw on the selected item, and SHALL leave the flow position and Conversation attributes unchanged.
5. WHEN a Conversation becomes Agent_Owned, THE Message_Handler SHALL cancel every bot message for that Conversation that is scheduled but not yet delivered, and SHALL discard any AI or flow response that finishes generating after the ownership change instead of sending it to the visitor.
6. WHEN the Gateway or Message_Handler processes a visitor event and the in-memory visitor state lacks the Ownership_State, THE Message_Handler SHALL read the Ownership_State from durable storage before running any Bot_Responder path, so that suppression survives a process restart, idle eviction and a multi-instance deployment.
7. WHILE a Conversation is Agent_Owned, IF the visitor's last socket disconnects, THEN THE Gateway SHALL keep the Conversation open and Agent_Owned for a reconnect grace period that is configurable from 1 to 1440 minutes, with a default of 10 minutes.
8. WHILE a Conversation is Agent_Owned, WHEN a visitor with the same visitor id reopens the Widget within the reconnect grace period, THE Gateway SHALL resume the same Conversation with its existing Chat_Rows and Ownership_State instead of creating a new Conversation, and SHALL cancel the pending grace period expiry.
9. IF the reconnect grace period elapses with no visitor socket connected, THEN THE Gateway SHALL end the Conversation, keep its Chat_Rows in history and emit an `inbox:thread-updated` event that shows the Conversation as ended in every open Dashboard view within 2 seconds.
10. IF the Ownership_State cannot be read from durable storage while a visitor event is processed, THEN THE Message_Handler SHALL persist the visitor message, send no Bot_Responder message for that event and leave the Ownership_State unchanged.
11. WHILE a Conversation is Agent_Owned, IF the assigned agent has no open Dashboard view when the visitor sends a message, THEN THE Inbox_Bridge SHALL keep the message in the Conversation's Agent_Inbox thread marked unread, and THE Bot_Responder SHALL stay silent.

### Requirement 6: Resume the bot on release

**User Story:** As an agent, I want to hand the conversation back to the bot, so that the bot continues after my part is done.

#### Acceptance Criteria

1. WHEN an agent releases an Agent_Owned conversation to the bot, THE Message_Handler SHALL persist a Chat_Row with Sender_Role `system` that tells the visitor the bot has resumed, and SHALL deliver it to the visitor's Widget and to every open Dashboard view of that Conversation within 2 seconds of the release.
2. WHEN an agent releases an Agent_Owned conversation to the bot, THE Message_Handler SHALL set the flow position to the SUCCESS child of the TRANSFER_TO_AGENT node that most recently assigned an agent to that Conversation. If that Conversation became Agent_Owned through a Dashboard takeover with no TRANSFER_TO_AGENT node, if the TRANSFER_TO_AGENT node has no SUCCESS child, or if that node or its SUCCESS child no longer exists in the current flow, THE Message_Handler SHALL set the flow position to the bot's start node instead.
3. WHEN an agent releases an Agent_Owned conversation to the bot, THE Bot_Responder SHALL send the visitor no bot-authored or AI-authored message, other than the system message in criterion 1, until the visitor sends the next message.
4. WHEN the visitor sends the first message after a release, THE Bot_Responder SHALL answer that message by running the flow from the flow position set at release, following the same node behaviour as Requirement 13 criterion 6.
5. WHEN an agent releases an Agent_Owned conversation to the bot, THE Bot_Responder SHALL send no reply to any visitor message persisted while the Conversation was Agent_Owned.
6. IF a release is requested for a Conversation whose Ownership_State is already `bot`, THEN THE Message_Handler SHALL leave the Ownership_State and flow position unchanged, SHALL send no system message, and SHALL return an error to the Dashboard indicating that the conversation is not agent-owned.
7. IF a release is requested by a user who is neither the assigned agent of that Conversation nor an org admin of the bot's organization, THEN THE Message_Handler SHALL reject the release, leave the Ownership_State, assigned agent id and flow position unchanged, and return an error to the Dashboard indicating insufficient permission.
8. IF the visitor has no connected Widget socket at the time of release, THEN THE Message_Handler SHALL still complete the release and persist the system message from criterion 1, and THE Widget SHALL show that system message from the Conversation's history when the visitor reconnects within the reconnect grace period from Requirement 5.

### Requirement 7: Agent inbox gating

**User Story:** As an agent, I want to see only conversations where the visitor asked for a human, so that thousands of bot-only chats do not overwhelm me.

#### Acceptance Criteria

1. WHILE a widget Conversation is a Bot_Only_Conversation, THE Inbox_Bridge SHALL publish zero `inbox:message`, `inbox:thread-updated` and `new-visitor` events for that Conversation, for every Chat_Row persisted in that Conversation.
2. WHILE a widget Conversation is a Bot_Only_Conversation, THE Agent_Inbox SHALL exclude that Conversation from its default thread list, including after a Dashboard page reload and after the list is re-fetched.
3. WHEN the first Handover_Request is raised for a Conversation, THE Inbox_Bridge SHALL add the Conversation to the Agent_Inbox default thread list within 2 seconds, with every Chat_Row persisted before the Handover_Request shown in chronological order and none omitted.
4. WHEN a Conversation is added to the Agent_Inbox, THE Inbox_Bridge SHALL publish exactly one `new-visitor` realtime notification to each recipient, where the recipients are the assigned agent (or, while the Conversation is in the Handover_Queue, every agent assigned to the bot) and the bot's org admins, and a user who holds more than one of these roles SHALL receive one notification.
5. WHEN an agent takes over a Bot_Only_Conversation from a monitoring view, THE Inbox_Bridge SHALL treat the takeover as a Handover_Request, so that the Conversation stops being a Bot_Only_Conversation and appears in the Agent_Inbox default thread list per criteria 3 and 4.
6. WHERE an org admin enables the "All conversations" filter in the Agent_Inbox, THE Agent_Inbox SHALL list Bot_Only_Conversations as read-only entries that show the message history, hide the reply input, and trigger zero realtime pop-up notifications.
7. WHILE a Conversation has received a Handover_Request, WHEN a new Chat_Row is persisted for that Conversation, THE Inbox_Bridge SHALL publish one `inbox:message` event for that Chat_Row to the assigned agent and the bot's org admins within 2 seconds, including after the Conversation is released to the bot.
8. IF publishing the realtime notification for a newly added Conversation fails, THEN THE Inbox_Bridge SHALL keep the Conversation in the Agent_Inbox, so that it appears in the default thread list on the next list load, and SHALL leave the Conversation's persisted Chat_Rows and Ownership_State unchanged.
9. WHILE the signed-in Dashboard user is not an org admin, THE Agent_Inbox SHALL hide the "All conversations" filter and SHALL list zero Bot_Only_Conversations for that user.

### Requirement 8: Handover request triggers

**User Story:** As a visitor, I want to ask for a human in the flow or in my own words, so that I can reach an agent when the bot cannot help.

#### Acceptance Criteria

1. WHEN the flow reaches a TRANSFER_TO_AGENT node and the Conversation has no open Handover_Request, THE Message_Handler SHALL raise exactly one Handover_Request for the Conversation and record whether it came from the TRANSFER_TO_AGENT node or from an Agent_Intent.
2. WHEN a visitor text message matches a configured Agent_Intent phrase, THE Message_Handler SHALL raise a Handover_Request for the Conversation. A match means the message, after trimming, lowercasing, collapsing repeated whitespace to one space and removing leading and trailing punctuation, contains the lowercased phrase as a whole-word sequence.
3. WHEN a Handover_Request is raised by an Agent_Intent match and the bot's configured handover start node exists in the bot's flow, THE Message_Handler SHALL move the flow position to that node. It SHALL skip all other flow navigation, AI_NODE/AI_RESPONSE answering, question bank and fallback handling for the matching message.
4. IF a visitor message matches an Agent_Intent and the bot has no configured handover start node, or the configured node does not exist in the bot's flow, THEN THE Message_Handler SHALL run the Contact_Collection_Step followed by the agent assignment and send no other bot-authored or AI-authored reply to the matching message.
5. WHILE a Conversation has an open Handover_Request, WHEN another Agent_Intent message arrives or the flow reaches another TRANSFER_TO_AGENT node, THE Message_Handler SHALL leave the existing Handover_Request unchanged, create no second Handover_Request and publish no additional Agent_Inbox notification. A Handover_Request is open from the moment it is raised until an agent releases the Conversation to the bot or the Conversation ends.
6. WHEN a visitor message matches an Agent_Intent phrase, THE Message_Handler SHALL persist the message as a Chat_Row with Sender_Role `visitor` before raising the Handover_Request, so that the message appears in the history added to the Agent_Inbox.
7. WHERE a bot has Agent_Intent configured, THE Message_Handler SHALL accept between 0 and 50 phrases per bot, each 1 to 100 characters after trimming, and SHALL raise no Agent_Intent-based Handover_Request when the list is empty.

### Requirement 9: Name and email collection before handover

**User Story:** As an agent, I want the bot to collect the visitor's name and email before handing over, so that I know who I am talking to and can follow up.

#### Acceptance Criteria

1. WHEN a Handover_Request is raised and the Visitor_Record is a Known_Contact, THE Message_Handler SHALL skip the Contact_Collection_Step and continue to agent assignment.
2. WHEN a Handover_Request is raised and the Visitor_Record is not a Known_Contact, THE Message_Handler SHALL run the Contact_Collection_Step before agent assignment.
3. WHERE the flow contains a QUESTIONS node on the handover path that captures name and email attributes, THE Message_Handler SHALL use that QUESTIONS node as the Contact_Collection_Step.
4. WHERE the flow reaches a TRANSFER_TO_AGENT node without a preceding Contact_Collection_Step, THE Message_Handler SHALL ask for the missing name and email in chat before agent assignment.
5. WHEN the visitor provides an email, THE Message_Handler SHALL accept the email only when the email matches the RFC 5322 address syntax validated by the existing `jarcube.email` entity.
6. WHEN the visitor provides a name, THE Message_Handler SHALL accept the name only when the trimmed name contains 1 to 100 characters and differs from "Anonymous".
7. IF the visitor provides an invalid name or email, THEN THE Message_Handler SHALL re-prompt with a validation message up to the configured question lifespan.
8. IF the visitor exhausts the lifespan without a valid email, THEN THE Message_Handler SHALL follow the QUESTIONS node FAILURE branch and SHALL leave the Conversation without a Handover_Request.
9. WHERE the Visitor_Record holds a valid name but no valid email, THE Message_Handler SHALL ask only for the email, and the reverse for a valid email without a name.

### Requirement 10: Store contact details on the visitor record

**User Story:** As an agent, I want collected contact details saved on the visitor, so that they show up in the inbox, on returning visits and in reports.

#### Acceptance Criteria

1. WHEN the Contact_Collection_Step captures a valid name, THE Message_Handler SHALL store the name on the Visitor_Record.
2. WHEN the Contact_Collection_Step captures a valid email, THE Message_Handler SHALL store the email on the Visitor_Record.
3. WHEN an OPEN_TEMPLATE contact form submission contains a valid name or email, THE Message_Handler SHALL store the value on the Visitor_Record.
4. WHEN contact details are stored on the Visitor_Record, THE Message_Handler SHALL also keep them as Conversation attributes under the aliases configured in the flow.
5. IF a captured value is empty or invalid, THEN THE Message_Handler SHALL keep the existing Visitor_Record value unchanged.
6. WHEN the Visitor_Record name changes, THE Message_Handler SHALL update the in-memory visitor display name used for agent notifications.
7. FOR ALL valid name and email inputs, storing the values and then reading the Visitor_Record SHALL return the same trimmed name and the same email (store/read round-trip property).

### Requirement 11: Conversation title uses the visitor's name

**User Story:** As an agent, I want each inbox entry titled with the visitor's name, so that I can tell conversations apart.

#### Acceptance Criteria

1. THE Agent_Inbox SHALL set the Conversation_Title to the Visitor_Record name when the Visitor_Record is a Known_Contact.
2. IF the Visitor_Record name is empty or "Anonymous" and the Visitor_Record holds a valid email, THEN THE Agent_Inbox SHALL set the Conversation_Title to that email.
3. IF the Visitor_Record has neither a valid name nor a valid email, THEN THE Agent_Inbox SHALL set the Conversation_Title to "Visitor" followed by the last 6 characters of the visitor id.
4. WHEN the Visitor_Record name or email changes, THE Inbox_Bridge SHALL publish an `inbox:thread-updated` event with the new Conversation_Title.
5. THE Dashboard SHALL show the same Conversation_Title in the inbox list, the conversation header, the new-conversation notification and the history view.
6. THE Dashboard SHALL show the visitor's email in the conversation header subtitle when the email is valid.

### Requirement 12: No agent available

**User Story:** As a visitor, I want to be told when no agent is free, and as an agent, I want waiting requests kept for me, so that no handover request is lost.

#### Acceptance Criteria

1. IF a Handover_Request is raised and no agent assigned to the bot is online, THEN THE Message_Handler SHALL send the visitor the bot's configured "no agent available" message and continue on the TRANSFER_TO_AGENT node's FAILURE branch.
2. IF a Handover_Request is raised and no agent assigned to the bot is online, THEN THE Inbox_Bridge SHALL place the Conversation in the Handover_Queue with its Conversation_Title and contact details.
3. WHILE a Conversation is in the Handover_Queue, THE Ownership_State SHALL remain `bot`.
4. WHEN an agent takes over a Conversation from the Handover_Queue, THE Message_Handler SHALL set the Ownership_State to Agent_Owned and notify the visitor with the agent's name.
5. IF the Conversation ends before an agent takes it over, THEN THE Inbox_Bridge SHALL remove the Conversation from the Handover_Queue and keep the Conversation in history.
6. IF the bot defines no "no agent available" message, THEN THE Message_Handler SHALL send the default text "No agent is available right now. We have your details and will get back to you by email."

### Requirement 13: Non-regression for bot-only conversations, history and other channels

**User Story:** As an org admin, I want bot-only conversations still stored and reported, so that analytics and history stay complete.

#### Acceptance Criteria

1. THE Message_Handler SHALL persist every message of a Bot_Only_Conversation as a Chat_Row.
2. THE Dashboard SHALL list Bot_Only_Conversations in the conversation history view with the same filters as before this feature.
3. THE backend reports SHALL count Bot_Only_Conversations as handled by bot and Conversations with an assigned agent as handled by agent.
4. WHILE a Conversation is not Agent_Owned, THE Bot_Responder SHALL answer visitor messages with the same flow behaviour as before this feature.
5. THE Inbox_Bridge SHALL leave the existing WhatsApp Web inbox behaviour unchanged.
6. WHILE a Widget runs in preview mode, THE Message_Handler SHALL skip persistence, Agent_Inbox publication and Visitor_Record updates.
