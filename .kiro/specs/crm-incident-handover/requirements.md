# Requirements Document

## Introduction

This feature joins the chat handover path to the CRM. It turns a visitor's request for help into a tracked Incident that is linked to a CRM contact and, when needed, to a Service Request. It fixes four defects in the KONE handover experience:

- the ticket is raised before the problem is known
- the visitor is told "no agent" instantly
- the agent sees an empty chat
- the bot restarts the menu after a terminal answer

It also adds incident summaries and a human-approved path from agent resolutions into the bot's knowledge.

Dependencies:

- `.kiro/specs/agent-handover-inbox`. Reused terms: Handover_Request, Ownership_State, Agent_Owned, Sender_Role, Agent_Intent, Handover_Queue, Contact_Collection_Step, Visitor_Record, Known_Contact, Inbox_Bridge, Bot_Responder. That spec covers sender roles (Req 1–3), durable ownership and takeover/release (Req 4–6), inbox gating (Req 7), handover triggers (Req 8), name/email collection and storage on the Visitor_Record (Req 9–10), titles (Req 11) and the reconnect grace period (Req 5.7–5.9).
- `.kiro/specs/agent-handover-alerts` (implemented). Reused terms: Handover_Alert, Alert_Reason, Alert_Recipients. That spec covers how agents are alerted.

This spec does not repeat those requirements. It covers only what is new, plus these changes to them:

- Requirement 5 and Requirement 6 of this spec replace agent-handover-inbox Req 12.1 and 12.6. A visitor is no longer told "no agent available" immediately.
- Requirement 7 of this spec tightens agent-handover-inbox Req 4.8 and 4.9 so that an org admin override is explicit and audited.

### How it works today (code analysis)

**1. "Service request created but no ticket — where is it?"** A ticket and a Service Request are the same record.

- A `TICKET` node runs `MessageHandlerService.handleCreateTicket`. That calls `TicketsService.create` with `subject` (from `node.payload.ticketSubject`), `visitor`, `bot` and `conversationId`, and adds the ticket to `Visitor.serviceRequests`.
- The records appear in the Dashboard sidebar under **Service Requests** at `/service-request/list` (tab `service-requests`, which the AGENT role can open). The detail view is `/service-request/view/[ticketId]` and includes the chat log.
- Gaps:
  - `description` is never set. The KONE flow maps `contact_topic → ticket_summary` and `contact_reference → ticket_reference` (`kone_set_ticket`), but `handleCreateTicket` ignores attributes, so every ticket carries only the static subject.
  - The confirmation message shows the Mongo `_id` (`#${ticket.id}`) instead of the human id `ticketId` (`SR` + 6 characters).
  - Tickets carry no CRM contact and no incident reference. They are org-scoped only through `bot`.

**2. CRM.** The CRM is a separate Postgres database (Prisma, `CrmPrismaService.forOrg`), with UI pages under `/crm/contacts`, `/crm/companies` and `/crm/deals`, and an `ActivityTimeline` component.

- `Contact` has `organizationId`, `firstName` (required), `lastName`, `email`, `phone` and `source` (`RecordSource`: MANUAL, IMPORT, EMAIL, CALENDAR, TRACKING; there is no chat value).
- `Activity` has `type` (NOTE, CALL, EMAIL, MEETING, TASK, STAGE_CHANGE, ENRICHMENT), `contactId` and a `meta` Json field.
- `ContactsService.create` rejects a duplicate email inside an org with a 409. There is no unique index and no phone dedupe.
- Nothing links a Mongo `Visitor` or `Conversation` to a CRM `Contact`. Values captured in chat (`kone_q_contact`: `contact_name`, `contact_email`, `contact_phone`, `contact_reference`, `contact_topic`, or the OPEN_TEMPLATE contact form) live only in the in-memory `SocketState.attributes`. The message handler never writes them to the Visitor or to the CRM.

**3. Handover timing (KONE flow).** The path is `kone_human_start → kone_tpl_contact` (OPEN_TEMPLATE). On success it goes to `kone_set_ticket`. On failure it goes to `kone_q_contact → kone_set_ticket`. Then it continues `kone_ticket_contact` (TICKET) `→ kone_r_handover` ("Connecting you with a KONE specialist now…") `→ kone_agent` (TRANSFER_TO_AGENT).

- The ticket is always created before any agent is tried.
- On the template path the problem description is only present if the form supplies it.
- `TransferToAgent` raises the Handover_Alert and then calls `AgentService.assignAgent(botId)`. That picks the single ONLINE agent with the fewest `activeConversations` right away. It also returns that agent when the agent is already at `maxConcurrentChats`.
- With no ONLINE agent, it sends the hard-coded `'No agent is available at the moment. Please try again later. Enter "Start" to restart the conversation.'` and takes FAILURE `kone_agent_fail → kone_r_agent_busy` ("All specialists are busy right now…"). Both messages arrive in the same instant. There is no waiting period, queue position or business-hours concept.

**4. Multiple agents.** The ownership checks have gaps:

- `InboxService.setBotControl` rejects a takeover or release by a non-admin when the thread has a different `assignedAgent` (409 `thread_owned_by_other_agent`). However, the check reads the thread and then calls `ChannelThreadService.assignToAgent`, an unconditional `updateOne`. Two concurrent takeovers can both pass.
- An ORG_ADMIN bypasses the check silently.
- `InboxService.sendMessage` does not check ownership, so any agent with access to the bot can reply on a thread someone else owns.
- In `ThreadContent.tsx` the chip shows `Agent: <name>`, but the button reads "Release to bot" for every viewer when `handledByAgent` is true. A non-owner gets a 409 only after clicking. The composer is never disabled, and there is no indicator that an agent is typing.

**5. History disappears for the agent.** Traced in code; not reproduced at runtime.

- (a) A flow transfer emits `new-visitor` with `chats: []` to the legacy active-chat view (`pushToActiveConversations`). Earlier messages appear only after the agent clicks "load old chats" (`loadOldChats`, which refetches `/conversation/:id`).
- (b) Every widget load calls `POST /widget/visitor`. `WidgetService.createVisitor` creates a new `Conversation` each time. `VisitorService.createVisitor` dedupes only by `email + bot`, so an anonymous visitor gets a new Visitor too. Then `JarCubeGateway.handleConnection` sends `"start"` into `handleMessage`. A reconnect or reload therefore starts a fresh conversation whose first visitor message is "start".
- (c) `WidgetInboxBridgeService` keys one inbox thread per conversation (`chatId = conversationId`), and `getThreadMessages` reads by `channelThread`. A new conversation means a new, nearly empty thread.
- (d) Earlier incidents of the same person cannot be shown, because nothing ties the conversations to one identity.

agent-handover-inbox Req 5.8 (resume within the grace period) covers part of (b). It does not cover reloads outside an agent-owned state, the legacy view, or previous incidents.

**6. Summaries and knowledge.** Raw material exists, but nothing connects it:

- The AI service has `POST /generate/summary`, which summarises template submissions, not transcripts. It also has `POST /ingest/text` (`client_id`, `text`, `source`, `source_type`, `bot_id`) into Milvus, with `DELETE /ingest/{client_id}/{source}`.
- The backend Question Bank (`Question`) already has an approval workflow:
  - `status` is `under_review` or `approved`, and `approvedBy` is recorded.
  - "You cannot approve your own question" is enforced.
  - Only `approved`, org-scoped entries answer visitors (`findAnswerFromQuestionBank`).
- Chat rows are kept in Mongo indefinitely. The two-hourly cron only marks conversations `EXPIRED`, and no purge exists.
- No incident summary is generated or stored.

**7. End of conversation.** `kone_r_agent_busy → kone_goto_menu` (GO_TO_STEP to `kone_menu`) sends the main menu straight after the "we will get back to you by email" text. That is a flow-design cause.

- `handleFailureNode`, `handleSuccessNode` and `handleTimeoutNode` fall back to `restOnTerminalNode`. That parks the conversation and lets the AI answer any later message.
- `handleCloseChat` resets state, sends `thankyoumsg` plus `'To start again type "start"'`, and emits `end.conversation`. The widget has no ended state, and the next socket connection sends "start" again.

### Recommended architecture

1. **Incident as the unit.** An Incident_Record (Mongo, next to `Conversation`) is opened by a Handover_Request once a Problem_Description is known. It links:
   - the conversation and its thread
   - the Visitor_Record
   - the CRM_Contact id
   - the Handover_Alert
   - the optional Service_Request
   - the handling agent
   - the outcome

   Only Incident conversations are summarised and kept beyond the retention window.
2. **Contact_Resolver.** A backend service subscribes to captured contact attributes. It upserts the CRM `Contact` through `ContactsService` with org-scoped dedupe (email first, then normalised phone). It stores the Mongo visitor ids on the contact and writes a chat-sourced `Activity`. The CRM keeps its own database, and links are id references with no foreign key, the same pattern as `ownerId`.
3. **Agent_Wait_Queue.** `TransferToAgent` stops failing right away. It places the Incident in the Handover_Queue, tells the visitor to wait (with position and estimate), and offers it to eligible agents until an agent accepts or the Wait_Timeout expires. Only then does it create the Fallback Service_Request, send the email follow-up message, and take the FAILURE branch.
4. **Atomic single owner.** Takeover becomes a conditional update (`assignedAgent` absent, or equal to the caller). Replies are gated on ownership. Admin override is an explicit, audited action. The Dashboard disables controls for non-owners.
5. **Identity-continuous history.** The agent view loads the conversation's full transcript, plus earlier Incidents of the same CRM_Contact, from the server, not from the live socket payload.
6. **Summaries and knowledge with a human gate.** On Incident close, the AI service summarises the transcript (a new transcript-summary endpoint). Agent resolutions become Question Bank entries in `under_review`. Only approved entries reach visitors and, optionally, Milvus ingestion.
7. **Closure_Prompt.** After a terminal outcome the bot asks whether the query is resolved. It restarts only when the visitor asks. Otherwise it closes, and the Widget shows an Ended_State with a "Start new chat" action.

## Glossary

- **Incident**: One case where a visitor needs human help. It starts when a Handover_Request is raised with a known Problem_Description, and ends when it is resolved, closed or abandoned.
- **Incident_Record**: The persisted record of an Incident. It holds the incident id, organization id, bot id, conversation id, thread id, Visitor_Record id, CRM_Contact id, Problem_Description, Handover_Alert id, Service_Request id (optional), handling agent id, Incident_Status, Incident_Outcome, timestamps and Incident_Summary.
- **Incident_Status**: One of `waiting`, `agent_active`, `follow_up`, `resolved` or `closed`.
- **Incident_Outcome**: One of `resolved_by_agent`, `resolved_by_bot`, `follow_up_ticket`, `abandoned` or `closed_unresolved`.
- **Incident_Service**: The backend component that creates, updates and closes Incident_Records.
- **Problem_Description**: Free text from the visitor that describes the problem, 10 to 1000 characters after trimming (for example `contact_topic`).
- **Service_Request**: The existing Ticket record (`TicketsService`) shown in the Dashboard under Service Requests (`/service-request/list`). Its human id is `ticketId`.
- **CRM**: The Postgres CRM module (QuantumMind-backend `src/crm`, Dashboard `/crm/*`).
- **CRM_Contact**: A `Contact` row in the CRM.
- **Contact_Details**: The name, email and phone captured in chat by a QUESTIONS node, a USER_INPUT node or an OPEN_TEMPLATE submission, under the attribute aliases configured in Contact_Mapping.
- **Contact_Mapping**: The per-bot setting that lists which attribute aliases hold name, email and phone. The default is `contact_name`, `contact_email` and `contact_phone`.
- **Contact_Resolver**: The backend component that finds or creates the CRM_Contact for Contact_Details and links the Visitor_Record and Conversation to it.
- **Normalised_Phone**: A phone number with every character except digits and a leading `+` removed. It is valid when it has 7 to 15 digits.
- **Agent_Wait_Queue**: The ordered list of Incidents with Incident_Status `waiting` for one bot. It extends the Handover_Queue from agent-handover-inbox.
- **Eligible_Agent**: An agent assigned to the bot, with status ONLINE, active, and with `activeConversations` below `maxConcurrentChats`.
- **Wait_Timeout**: The configurable time an Incident stays in the Agent_Wait_Queue before the fallback runs.
- **Business_Hours**: An optional per-bot weekly schedule with a time zone. It defines when agents are expected to be available.
- **Fallback**: The path taken when no agent accepts an Incident. It creates a Service_Request, sends the email follow-up message, and continues on the TRANSFER_TO_AGENT node's FAILURE branch.
- **Agent_View**: The Dashboard conversation view used by agents. This covers the inbox (`/apps/inbox`) and the legacy active chat (`/apps/chat/active`).
- **Owner_Agent**: The agent named in an Agent_Owned Ownership_State.
- **Admin_Override**: An explicit action by an org admin that moves ownership away from a current Owner_Agent.
- **Incident_Summary**: An AI-generated structured summary of an Incident. Its fields are problem, resolution, handling agent name, CRM_Contact display name, Service_Request `ticketId`, Incident_Outcome and the generation time.
- **Summary_Service**: The component that asks the AI service for an Incident_Summary and stores it.
- **Knowledge_Candidate**: A Question Bank entry with status `under_review` that holds a question and answer derived from an agent's resolution of an Incident.
- **Knowledge_Approver**: A user allowed to approve Question Bank entries, other than the entry's author.
- **Incident_Transcript**: The Chat_Rows of a conversation that has at least one Incident_Record.
- **Non_Incident_Transcript**: The Chat_Rows of a conversation with zero Incident_Records.
- **Transcript_Retention**: The per-organization number of days after which Non_Incident_Transcripts are purged.
- **Terminal_Outcome**: A point where the flow has given its final answer to the visitor's request. That is a TRANSFER_TO_AGENT SUCCESS or FAILURE branch that ends, a Fallback, a CLOSE_CHAT node, or a node marked as terminal in the flow builder.
- **Closure_Prompt**: The bot message sent after a Terminal_Outcome. It asks whether the query is resolved and offers the buttons "Yes, resolved", "I need something else" and "Start again".
- **Visitor_Profile**: One JSON document per CRM_Contact, stored on the CRM_Contact record, that the AI rewrites at the end of every Conversation. It holds standing facts (interests, products or equipment mentioned, preferences, open issues) and an ordered list of dated Profile_Entries. It replaces stored transcripts.
- **Profile_Entry**: One dated item in a Visitor_Profile for one Conversation: date and time, bot, channel, short summary, topic tags, outcome, and Incident id and `ticketId` when present.
- **Anonymous_Contact**: A CRM_Contact created for a visitor with no valid email or phone who raised a Handover_Request, named "Anonymous visitor <6-character id>" and marked anonymous until upgraded or merged.
- **Ended_State**: The Widget state after a conversation is closed. Input is disabled, a closing notice is shown, and a "Start new chat" action is offered.

## Requirements

### Requirement 1: Service Requests linked to the Incident and the CRM_Contact

**User Story:** As an agent, I want each Service Request raised from chat to carry the visitor's problem and links to the contact and incident, so that I can find and act on it from the Service Requests page.

#### Acceptance Criteria

1. WHEN a TICKET node creates a Service_Request, THE Message_Handler SHALL set the Service_Request `description` to the Conversation's Problem_Description on the first line. Below it, on separate lines and in the order of the node's configured attribute list (default `ticket_summary`, `ticket_reference`), THE Message_Handler SHALL append each attribute in that list whose value is non-empty after trimming and is not identical to the Problem_Description after trimming. The static `subject` from the node payload SHALL stay unchanged.
2. WHEN a TICKET node creates a Service_Request for a Conversation that has an Incident_Record with Incident_Status `waiting`, `agent_active` or `follow_up`, THE Message_Handler SHALL store the incident id on the Service_Request and the Service_Request id on the Incident_Record. If the Incident_Record has a CRM_Contact id at that moment, THE Message_Handler SHALL also store that CRM_Contact id on the Service_Request. Both writes SHALL finish before the confirmation in criterion 3 is sent.
3. WHEN a Service_Request is created from chat, THE Message_Handler SHALL send the visitor exactly one confirmation message within 5 seconds of creation. The message SHALL contain the Service_Request `ticketId` (`SR` followed by 6 characters) and SHALL NOT contain the internal record id.
4. WHEN a user opens the Service Request detail view (`/service-request/view/[ticketId]`) for a Service_Request that has a linked CRM_Contact, THE Dashboard SHALL show the CRM_Contact's first name and last name, separated by one space, as a link to `/crm/contacts/[contactId]`. If the Service_Request has a linked Incident_Record, THE Dashboard SHALL also show that Incident_Record's current Incident_Status. If no CRM_Contact or no Incident_Record is linked, THE Dashboard SHALL show "Not linked" in place of the missing value.
5. THE Dashboard SHALL list Service_Requests created from chat on `/service-request/list` with the same filters, sort order and role access (including the AGENT role) as Service_Requests created any other way, scoped to the organization that owns the bot.
6. IF the Conversation has no Problem_Description, or its Problem_Description is empty after trimming, when a TICKET node runs, THEN THE Message_Handler SHALL create the Service_Request with "No problem description provided" on the first line of the `description`, followed by the attribute lines defined in criterion 1. If an open Incident_Record exists, THE Message_Handler SHALL also mark that Incident_Record as having no description.
7. WHEN a Service_Request linked to an Incident_Record changes to resolved status and the Incident_Record's Incident_Status is `waiting`, `agent_active` or `follow_up`, THE Incident_Service SHALL set the Incident_Status to `resolved` within 5 seconds. THE Incident_Service SHALL leave an Incident_Record with Incident_Status `resolved` or `closed` unchanged.
8. IF a TICKET node runs for a Conversation whose open Incident_Record already has a Service_Request id, THEN THE Message_Handler SHALL create no new Service_Request and SHALL send the confirmation from criterion 3 with the existing Service_Request `ticketId`.
9. IF the Service_Request cannot be created, THEN THE Message_Handler SHALL send the visitor no confirmation and no `ticketId`, SHALL send one message saying the request could not be recorded, SHALL leave the Incident_Record's Service_Request id empty, and SHALL continue on the TICKET node's failure path.
10. WHEN the Contact_Resolver links a CRM_Contact to an Incident_Record that already has a Service_Request id, THE Incident_Service SHALL store that CRM_Contact id on the linked Service_Request within 5 seconds, unless the Service_Request already holds a CRM_Contact id.

### Requirement 2: Upsert the CRM_Contact from captured Contact_Details

**User Story:** As an org admin, I want every person who leaves contact details in chat stored once in the CRM, so that our contact list is complete and free of duplicates.

#### Acceptance Criteria

1. WHEN a QUESTIONS node, a USER_INPUT node or an OPEN_TEMPLATE submission sets at least one Contact_Details attribute in a Conversation whose Widget is not in preview mode, and the Contact_Details contain a valid email or a valid Normalised_Phone, THE Contact_Resolver SHALL find or create exactly one CRM_Contact in the organization that owns the bot. While the CRM database is reachable, this SHALL complete within 5 seconds of the attribute being set. A valid email is one that, after trimming, is at most 254 characters, contains no whitespace, has exactly one "@", has a non-empty local part, and has a domain part that contains at least one "." with characters on both sides.
2. WHEN the Contact_Resolver looks for an existing CRM_Contact, THE Contact_Resolver SHALL first match by email, comparing the trimmed values case-insensitively. Only when no email match exists SHALL it match by Normalised_Phone against the stored phone after the same normalisation. Only non-archived CRM_Contacts of the organization that owns the bot SHALL be considered.
3. WHEN no matching CRM_Contact exists, THE Contact_Resolver SHALL create one CRM_Contact with these values: the first name set to the trimmed captured name up to its first space; the last name set to the rest of the name after that space, trimmed, or empty when the name has no space; the trimmed lower-case email when valid; the Normalised_Phone when valid; and a chat source value. Each name part SHALL be truncated to 100 characters.
4. WHEN a matching CRM_Contact exists, THE Contact_Resolver SHALL write a captured valid value only into CRM_Contact fields (first name, last name, email, phone) that are null or contain only whitespace. Every other field SHALL keep its exact existing value.
5. IF the trimmed captured name is empty or equals "Anonymous" (case-insensitive), THEN THE Contact_Resolver SHALL use the local part of the valid email as the first name. When no valid email exists, it SHALL use the text "Visitor" as the first name. In both cases the last name SHALL be left empty.
6. IF Contact_Details contain neither a valid email nor a valid Normalised_Phone, THEN THE Contact_Resolver SHALL create or update no CRM_Contact and SHALL keep the captured values on the Conversation attributes only.
7. FOR ALL sequences of captures of the same email or Normalised_Phone within one organization, including captures that arrive concurrently from different Conversations or Visitor_Records and repeated captures within one Conversation, THE Contact_Resolver SHALL end with exactly one non-archived CRM_Contact for that email or Normalised_Phone (dedupe property).
8. IF the CRM database is unreachable or the upsert fails, THEN THE Contact_Resolver SHALL continue the chat flow with no added delay or visitor-facing error. It SHALL record the pending upsert in durable storage that survives a process restart, and retry it 3 times at about 1, 3 and 10 minutes after the first failure. After the third failed retry it SHALL mark the upsert as failed and stop retrying.
9. WHERE a bot defines a Contact_Mapping, THE Contact_Resolver SHALL read name, email and phone only from the aliases in that Contact_Mapping. WHERE a bot has no Contact_Mapping, THE Contact_Resolver SHALL read them from `contact_name`, `contact_email` and `contact_phone`.
10. IF more than one non-archived CRM_Contact in the organization matches at the same matching step, THEN THE Contact_Resolver SHALL use the CRM_Contact with the earliest creation time. It SHALL create no new CRM_Contact and SHALL leave the other matching CRM_Contacts unchanged.
11. IF the Contact_Details contain an invalid email and a valid Normalised_Phone, THEN THE Contact_Resolver SHALL match and create using the Normalised_Phone only, and SHALL write the invalid email to no CRM_Contact field.
12. IF the Contact_Details contain a valid email and a phone that does not give a valid Normalised_Phone, THEN THE Contact_Resolver SHALL match and create using the email only, and SHALL write the invalid phone to no CRM_Contact field.

### Requirement 3: Link visitors and conversations to the CRM_Contact

**User Story:** As an agent, I want the chat, the visitor and the CRM contact connected, so that I can move between them and see the person's history.

#### Acceptance Criteria

1. WHEN the Contact_Resolver resolves a CRM_Contact for a Conversation that has no linked CRM_Contact, THE Contact_Resolver SHALL, within 5 seconds of the resolution, store the CRM_Contact id on the Visitor_Record and on the Conversation, and add the Visitor_Record id to the CRM_Contact's list of linked visitor ids if that id is not already in the list.
2. WHEN a Conversation is linked to a CRM_Contact, THE Contact_Resolver SHALL create exactly one CRM Activity on that CRM_Contact that references the conversation id, the bot name, the channel and the link time. Repeated resolutions of the same Conversation to the same CRM_Contact SHALL create zero additional Activities.
3. WHEN a user with access to the CRM opens the CRM_Contact detail page (`/crm/contacts/[contactId]`), THE Dashboard SHALL show three lists: linked Conversations (start time, bot name, channel, link to the Agent_View), linked Incident_Records (opened time, Incident_Status, Incident_Outcome, link to the Agent_View of its Conversation) and linked Service_Requests (`ticketId`, status, link to `/service-request/view/[ticketId]`). Each list SHALL be ordered newest first, show at most 50 items initially with an action to load the next 50, and show an empty-state text when it has zero items.
4. WHEN an agent opens a Conversation in the Agent_View, THE Dashboard SHALL show in the Agent_View header the linked CRM_Contact display name (first name and last name) as a link to `/crm/contacts/[contactId]` if a CRM_Contact is linked, and SHALL show no CRM_Contact link if none is linked.
5. WHEN the Contact_Resolver resolves a CRM_Contact that already has linked visitor ids, THE Contact_Resolver SHALL keep every existing visitor id and add the new Visitor_Record id, so that every Visitor_Record linked to that person resolves to the same CRM_Contact.
6. THE Contact_Resolver SHALL store and read CRM_Contact links only within the organization that owns the bot. The Dashboard SHALL show zero Conversations, Incident_Records or Service_Requests from another organization on a CRM_Contact detail page, and zero CRM_Contact links from another organization in the Agent_View.
7. IF the Contact_Resolver resolves a CRM_Contact for a Conversation that is already linked to a different CRM_Contact, THEN THE Contact_Resolver SHALL keep the existing link on the Conversation and the Visitor_Record unchanged and SHALL create no Activity for that resolution.
8. IF the linked CRM_Contact is archived or no longer exists, THEN THE Dashboard SHALL show in the Agent_View header the text "CRM contact unavailable" with no link, and SHALL keep the Conversation, Incident_Records and Service_Requests accessible.
9. IF storing a link fails because the CRM database is unreachable, THEN THE Contact_Resolver SHALL leave the chat flow unaffected and retry the link with the pending upsert per Requirement 2 criterion 8 (at least 3 attempts over 10 minutes), without creating duplicate visitor ids or Activities when a retry succeeds.

### Requirement 4: Problem description before the Incident

**User Story:** As a support lead, I want an incident raised only after the visitor has said what the problem is, so that agents and tickets never start blind.

#### Acceptance Criteria

1. WHEN a Handover_Request is raised and the Conversation's problem alias attribute (criterion 3) is empty after trimming, THE Message_Handler SHALL send the visitor one message containing the bot's configured problem question, which defaults to "Please describe the problem in a few words.", and SHALL open zero Incident_Records, create zero Service_Requests and offer the Incident to zero agents until a Problem_Description is accepted under criterion 2, 4, 5 or 6.
2. WHEN the visitor sends a text reply to the problem question that is 10 to 1000 characters long after trimming, or a Problem_Description is taken from the problem alias under criterion 3, THE Incident_Service SHALL open exactly one Incident_Record within 2 seconds, with Incident_Status `waiting`, the trimmed Problem_Description, and links to the Conversation, the Visitor_Record, the open Handover_Alert and the CRM_Contact. If the CRM_Contact is resolved after the Incident_Record opens, THE Incident_Service SHALL add the CRM_Contact id to the Incident_Record when the Contact_Resolver links that CRM_Contact to the Conversation.
3. WHERE the flow captures the problem in an attribute alias configured as the problem alias (default `contact_topic`) and that attribute is non-empty after trimming when the Handover_Request is raised, THE Message_Handler SHALL use that attribute value as the Problem_Description, SHALL skip the question in criterion 1, and SHALL apply the length rules of criteria 2, 4, 5 and 6 to that value.
4. IF the visitor's first reply to the problem question contains fewer than 10 characters of text after trimming, including a reply with no text such as a button selection or an attachment with no text, THEN THE Message_Handler SHALL send the problem question once more with an example answer and SHALL open no Incident_Record.
5. IF the visitor's second reply to the problem question also contains fewer than 10 characters of text after trimming, THEN THE Message_Handler SHALL accept the trimmed text as the Problem_Description (or the text "No problem description provided" when the reply has no text), and THE Incident_Service SHALL open the Incident_Record per criterion 2 and mark it as having a short description.
6. IF the Problem_Description is longer than 1000 characters after trimming, THEN THE Incident_Service SHALL store only its first 1000 characters on the Incident_Record and mark the Incident_Record as having a truncated description, and the full text SHALL stay in the Conversation's Chat_Rows.
7. IF the visitor sends no reply to the problem question within 10 minutes of the latest problem question, THEN THE Message_Handler SHALL open no Incident_Record, create no Service_Request and offer nothing to agents for that Handover_Request.
8. WHILE an Incident_Record for the Conversation has Incident_Status `waiting`, `agent_active` or `follow_up`, THE Incident_Service SHALL open zero additional Incident_Records for that Conversation, including when two or more Handover_Requests for the Conversation are raised at the same time, and THE Message_Handler SHALL not send the problem question again.
9. THE KONE example flow SHALL write the visitor's problem text to the problem alias on both the OPEN_TEMPLATE path (`kone_tpl_contact`) and the `kone_q_contact` path before the TRANSFER_TO_AGENT node, and SHALL create a Service_Request only on the Fallback path or by agent action, so that zero Service_Requests exist for the Incident when it enters the Agent_Wait_Queue.

### Requirement 5: Wait for an agent

**User Story:** As a visitor, I want to be told politely that an agent will join and how long it may take, so that I wait instead of being turned away at once.

#### Acceptance Criteria

1. WHEN the flow reaches a TRANSFER_TO_AGENT node with an open Incident_Record and at least one agent is assigned to the bot, THE Message_Handler SHALL add the Incident to the Agent_Wait_Queue, record the queue entry time, and send the visitor exactly one wait message within 2 seconds. The wait message SHALL use the bot's configured wait text (1 to 500 characters), which defaults to "Thanks, please wait. A specialist will join this chat shortly." The Message_Handler SHALL take neither the SUCCESS nor the FAILURE branch of the node at this point.
2. WHEN an Incident is added to the Agent_Wait_Queue, THE Message_Handler SHALL include in the wait message the visitor's 1-based position in the Agent_Wait_Queue and an estimated wait in whole minutes. The estimate SHALL be the median time from queue entry to agent acceptance across that bot's Incidents accepted in the previous 7 days, rounded up to the next whole minute, with a minimum of 1 minute. IF fewer than 5 such accepted Incidents exist, THEN THE Message_Handler SHALL omit the estimate and still include the position.
3. WHILE an Incident is in the Agent_Wait_Queue, WHEN the Incident's position decreases, THE Message_Handler SHALL send the visitor a position message that contains the current 1-based position. It SHALL send at most one position message per Incident in any 60-second window. When the position decreases more than once within that window, it SHALL send only the latest position once the window ends. It SHALL send no position message when the position increases or stays the same.
4. WHILE an Incident is in the Agent_Wait_Queue, WHEN an Eligible_Agent accepts the Incident from the Dashboard, THE Message_Handler SHALL set the Ownership_State to Agent_Owned per agent-handover-inbox Req 4, set the Incident_Status to `agent_active`, record the acceptance time and the handling agent id on the Incident_Record, remove the Incident from the Agent_Wait_Queue, and stop the Wait_Timeout. Within 2 seconds of the acceptance, it SHALL send the visitor one message that contains the agent's display name.
5. WHILE an Incident is in the Agent_Wait_Queue, THE Bot_Responder SHALL send no flow, AI or fallback reply to visitor messages. Every visitor message SHALL be persisted as a Chat_Row and shown in the Agent_View within 2 seconds of receipt. Visitor messages SHALL leave the queue position and the remaining Wait_Timeout unchanged.
6. WHILE an Incident is in the Agent_Wait_Queue, THE Dashboard SHALL list the Incident in the Handover_Queue of every Eligible_Agent of the bot. Incidents SHALL be ordered by Alert_Priority and then by queue entry time, oldest first. The Dashboard SHALL add the Incident to the list within 2 seconds of its queue entry and remove it within 2 seconds of its removal from the Agent_Wait_Queue.
7. THE Message_Handler SHALL keep each queued Incident's queue entry time, Emergency_Flag and Wait_Timeout deadline in durable storage. After a process restart, or after a visitor reconnect within the agent-handover-inbox reconnect grace period, the wait SHALL resume with the same queue order and the same Wait_Timeout deadline, and the Message_Handler SHALL send no second initial wait message. IF the Wait_Timeout deadline passed while the process was down, THEN THE Message_Handler SHALL run the Fallback per Requirement 6 within 10 seconds of restart.
8. WHERE the TRANSFER_TO_AGENT node has the Emergency_Flag set, THE Message_Handler SHALL place the Incident ahead of every Incident without the Emergency_Flag and behind any earlier Incidents that have the Emergency_Flag, ordered by queue entry time. It SHALL send the node's emergency wait text instead of the standard wait text. IF the emergency wait text is empty, THEN THE Message_Handler SHALL send the standard wait text.
9. THE Message_Handler SHALL read the Wait_Timeout from the bot settings, accept whole-second values from 30 to 1800 seconds, and use a default of 180 seconds when no value is set. IF an org admin saves a Wait_Timeout outside 30 to 1800 seconds, THEN THE Dashboard SHALL reject the save with an error message that states the allowed range and SHALL keep the previously saved value. A changed Wait_Timeout SHALL apply only to Incidents that enter the Agent_Wait_Queue after the change.
10. IF an agent who is not an Eligible_Agent tries to accept an Incident in the Agent_Wait_Queue, THEN THE Message_Handler SHALL reject the acceptance with an error message indicating the reason (offline, inactive, not assigned to the bot, or at `maxConcurrentChats`). The Incident SHALL keep its queue position and remaining Wait_Timeout, and the visitor SHALL receive no message.
11. IF the visitor stays disconnected beyond the agent-handover-inbox reconnect grace period while the Incident is in the Agent_Wait_Queue, THEN THE Message_Handler SHALL remove the Incident from the Agent_Wait_Queue, set the Incident_Outcome to `abandoned` and the Incident_Status to `closed`, run no Fallback, and recalculate the positions of the remaining queued Incidents.

### Requirement 6: Fallback after the wait

**User Story:** As a visitor, I want a clear follow-up promise when no agent can join, and as a support lead, I want that promise backed by a ticket, so that the request is not lost.

#### Acceptance Criteria

1. IF the Wait_Timeout, measured from the time the Incident entered the Agent_Wait_Queue, expires while the Incident is still in the Agent_Wait_Queue, THEN THE Message_Handler SHALL, within 5 seconds of expiry, remove the Incident from the Agent_Wait_Queue, run the Fallback, set the Incident_Status to `follow_up` and set the Incident_Outcome to `follow_up_ticket`.
2. IF, at the moment the flow reaches a TRANSFER_TO_AGENT node with an open Incident_Record, the bot has zero agents assigned, or Business_Hours are configured and the current time in the bot's time zone is outside them, THEN THE Message_Handler SHALL run the Fallback without adding the Incident to the Agent_Wait_Queue, set the Incident_Status to `follow_up` and set the Incident_Outcome to `follow_up_ticket`.
3. WHEN the Fallback runs, THE Message_Handler SHALL create exactly one Service_Request for the Incident, or reuse the Service_Request already linked to the Incident_Record, and store its id on the Incident_Record.
4. WHEN the Fallback runs, THE Message_Handler SHALL send the visitor one follow-up message that contains the Service_Request `ticketId` and the email address the reply will go to, taken from the CRM_Contact email when valid, otherwise from the Visitor_Record email. If neither email is valid, the message SHALL contain the `ticketId` and state that no email is on file.
5. WHEN the Fallback runs and the CRM_Contact or the Visitor_Record has a valid email (same order as criterion 4), THE Message_Handler SHALL send one acknowledgement email to that address, containing the `ticketId` and the Problem_Description, within 5 minutes of the Fallback.
6. WHEN the Fallback runs, THE Message_Handler SHALL send the visitor exactly one unavailability message, followed by the follow-up message from criterion 4, with no other bot message in between. It SHALL send neither the hard-coded "No agent is available… Enter "Start" to restart" text nor the first BOT_RESPONSE node of the FAILURE branch when that node is marked as the busy message. After that, it SHALL continue on the TRANSFER_TO_AGENT node's FAILURE branch.
7. WHEN the Fallback runs outside Business_Hours, THE Message_Handler SHALL state in the follow-up message the next opening date and time (24-hour HH:mm) in the bot's time zone, with the time zone name. If the Business_Hours schedule has no opening in the next 7 days, the next opening time SHALL be left out.
8. WHILE an Incident has Incident_Status `follow_up`, WHEN an agent opens it from the Handover_Queue or the Service Request detail view and the visitor's Widget is connected or within the agent-handover-inbox reconnect grace period, THE Message_Handler SHALL allow the agent to take over the Conversation per Requirement 7, and on takeover SHALL set the Incident_Status to `agent_active` while keeping the linked Service_Request.
9. FOR ALL Incidents, THE Message_Handler SHALL run the Fallback at most once (single-fallback property) and create at most one Service_Request per Incident, including when the Wait_Timeout expiry and an agent acceptance happen within the same second. The first committed state change SHALL win. If the acceptance wins, no Fallback SHALL run. If the Fallback wins, the acceptance SHALL be rejected with a message indicating the Incident is in `follow_up`, and the agent may take over per criterion 8.
10. IF the Service_Request cannot be created when the Fallback runs, THEN THE Message_Handler SHALL still send the unavailability message and a follow-up message without a `ticketId` stating that the reference will be sent by email, keep the Incident_Status `follow_up`, and retry the creation at least 3 times over 10 minutes. Once creation succeeds, it SHALL send the acknowledgement email from criterion 5.
11. IF the acknowledgement email cannot be delivered after 3 attempts within 5 minutes, THEN THE Message_Handler SHALL record the delivery failure on the Incident_Record and keep the Incident_Status `follow_up`. The Dashboard SHALL show the failure on the Service Request detail view.
12. IF an agent opens a `follow_up` Incident while the visitor's Widget is neither connected nor within the reconnect grace period, THEN THE Dashboard SHALL disable the Take over button and show that the visitor is offline, and THE Message_Handler SHALL leave the Incident_Status `follow_up`.

### Requirement 7: One owner per conversation

**User Story:** As an agent, I want only one person able to answer a conversation at a time, so that two agents never reply to the same visitor.

#### Acceptance Criteria

1. WHEN one or more takeover requests for the same Conversation are received, including requests received in the same millisecond, THE Inbox_Service SHALL apply at most one of them through a single conditional write. The write SHALL succeed only when the Conversation has no Owner_Agent or the requester is already the Owner_Agent. On success, the requester SHALL be the Owner_Agent and the Ownership_State SHALL be Agent_Owned. Every other request SHALL be rejected with reason `thread_owned_by_other_agent` and the current Owner_Agent's display name, and SHALL leave the Ownership_State unchanged.
2. IF a user who is not the Owner_Agent sends a reply on an Agent_Owned Conversation, including a previous Owner_Agent after an Admin_Override, THEN THE Inbox_Service SHALL reject the reply with reason `not_thread_owner` and the current Owner_Agent's display name, persist no Chat_Row and deliver nothing to the visitor.
3. WHEN an org admin of the organization that owns the bot performs an Admin_Override on an Agent_Owned Conversation, THE Inbox_Service SHALL accept it only as an explicit override action separate from takeover. It SHALL set the org admin, or an agent the admin selects, as the Owner_Agent. It SHALL record the previous Owner_Agent id, the actor id, the new Owner_Agent id and the time on the open Incident_Record, or on the Conversation when no Incident_Record is open. It SHALL notify the previous Owner_Agent in the Dashboard within 2 seconds, and the notification SHALL name the actor.
4. IF an org admin sends a plain takeover request for a Conversation owned by another agent, THEN THE Inbox_Service SHALL reject the request with reason `thread_owned_by_other_agent` and leave the Ownership_State unchanged, the same as for any other user.
5. WHEN the Owner_Agent changes through takeover, release or Admin_Override, THE Inbox_Service SHALL emit exactly one `inbox:thread-updated` event within 2 seconds to the bot's org admins and assigned agents. The event SHALL carry the new Owner_Agent id and display name, or no owner after a release. A takeover by the existing Owner_Agent SHALL emit no event.
6. IF a user who is not the Owner_Agent requests a release to bot on an Agent_Owned Conversation, THEN THE Inbox_Service SHALL reject the request with reason `thread_owned_by_other_agent` and the current Owner_Agent's display name, and SHALL leave the Ownership_State unchanged.
7. IF an Admin_Override is requested by a user who is not an org admin of the organization that owns the bot, or names a target agent who is not assigned to the bot or is not active, THEN THE Inbox_Service SHALL reject the override with a rejection indicating the reason, leave the Ownership_State unchanged, and record no override entry.
8. IF a takeover request comes from a user who is neither an agent assigned to the bot nor an org admin of the organization that owns the bot, THEN THE Inbox_Service SHALL reject the request with a rejection indicating missing access, and SHALL leave the Ownership_State unchanged.

### Requirement 8: Ownership visibility in the Agent_View

**User Story:** As an agent, I want to see who is handling a chat and have my controls disabled when it is not mine, so that I do not collide with a colleague.

#### Acceptance Criteria

1. WHILE a Conversation is Agent_Owned by a user other than the signed-in user, THE Dashboard SHALL show the text "<Owner_Agent display name> is handling this chat" in the Agent_View header (in both the inbox and the legacy active chat), disable the Take over button, disable the message composer so that no reply can be typed or sent, and hide the Release to bot button. When the Owner_Agent has no display name, THE Dashboard SHALL use the Owner_Agent's email address in place of the display name.
2. WHILE a Conversation is Agent_Owned by the signed-in user, THE Dashboard SHALL show the text "You are handling this chat" in the Agent_View header, enable the message composer, show the Release to bot button, and hide the Take over button.
3. WHILE a Conversation is Agent_Owned by another user and the signed-in user is an org admin, THE Dashboard SHALL show an "Override" action that opens a confirmation dialog naming the current Owner_Agent and performs the Admin_Override only after the admin confirms. The Dashboard SHALL hide the "Override" action from every user who is not an org admin.
4. IF the org admin cancels the Override confirmation dialog, or the Admin_Override request fails, THEN THE Dashboard SHALL leave the Owner_Agent unchanged, keep the current header text, button states and composer state, and, on failure, show an error message indicating that the override did not complete.
5. WHEN the Dashboard receives an `inbox:thread-updated` event that changes the Owner_Agent, THE Dashboard SHALL update the header text, the button states and the composer state per criteria 1 and 2 within 2 seconds in every open Agent_View of that Conversation. If the signed-in user loses ownership, THE Dashboard SHALL keep that user's unsent reply text in the disabled composer.
6. WHEN the Owner_Agent types in the composer of a Conversation, THE Dashboard SHALL send a typing signal at most once every 3 seconds, and every other open Agent_View of that Conversation SHALL show "<Owner_Agent display name> is replying…" within 2 seconds of receiving the signal.
7. WHEN 5 seconds pass after the last typing signal, or the Owner_Agent's message is delivered, THE Dashboard SHALL remove the "<Owner_Agent display name> is replying…" indicator from every other Agent_View of that Conversation.
8. WHERE the bot setting `typingIndicator` is enabled, WHILE the Owner_Agent is typing, THE Widget SHALL show the existing typing indicator to the visitor, and SHALL remove it 5 seconds after the last typing signal or when the Owner_Agent's message is delivered.
9. IF a takeover or reply is rejected with reason `thread_owned_by_other_agent` or `not_thread_owner`, THEN THE Dashboard SHALL show an error message naming the current Owner_Agent, update the header text, button states and composer state per criterion 1 within 2 seconds, and keep the agent's unsent reply text in the composer.

### Requirement 9: Full history for the agent

**User Story:** As an agent, I want to see everything the visitor already said to the bot and AI, and their earlier incidents, so that I do not ask the visitor to repeat themselves.

#### Acceptance Criteria

1. WHEN an agent opens an Incident's Conversation in any Agent_View, THE Dashboard SHALL load every Chat_Row of that Conversation from the server, including visitor, bot, AI, agent and system messages persisted before the Handover_Request. It SHALL show them in ascending order of persisted timestamp, with each Chat_Row's sender role and timestamp. For Conversations of up to 1000 Chat_Rows, it SHALL display them within 3 seconds of the open action. THE Dashboard SHALL NOT use the chats carried in the `new-visitor` event payload as the source of the displayed history.
2. WHEN the Gateway emits `new-visitor` for an Incident, THE Gateway SHALL include the conversation id and the thread id in the event. THE legacy active-chat view (`/apps/chat/active`) SHALL load the full history per criterion 1 without the agent clicking "load old chats".
3. WHEN a Widget visitor whose browser holds a stored visitor id reloads the page or reconnects, and that visitor's latest Conversation for the same bot is neither in Ended_State nor marked `EXPIRED`, THE Widget and THE Gateway SHALL resume that Conversation and its inbox thread. They SHALL create zero new Conversations and zero new Visitor_Records, and THE Gateway SHALL send no automatic "start" message into the resumed Conversation.
4. WHEN an agent opens an Incident whose CRM_Contact has other Incident_Records, THE Dashboard SHALL list up to the 20 most recent of them, newest first by Incident open time, excluding the current Incident. Each entry SHALL show the open date, Problem_Description, Incident_Outcome, Incident_Summary and Service_Request `ticketId`, and a missing field SHALL be shown as "Not available". When more than 20 exist, THE Dashboard SHALL offer an action that loads the next 20.
5. WHEN an agent selects an earlier Incident from the list in criterion 4, THE Dashboard SHALL open its full Incident_Transcript in read-only mode. In that mode the message composer, the Take over button, the Release to bot button and the Override action SHALL NOT be shown.
6. IF the opened Incident has no linked CRM_Contact, or its CRM_Contact has no other Incident_Records, THEN THE Dashboard SHALL show a notice that no earlier incidents exist in place of the list.
7. THE Dashboard SHALL list and open earlier Incidents only when they come from Conversations of bots in the signed-in user's organization. IF a request names an Incident_Record of another organization, THEN THE Dashboard SHALL show no data from that Incident_Record.
8. FOR ALL Conversations, THE Agent_View SHALL show the same set and order of Chat_Rows as the Conversation history view, with no duplicate and no missing Chat_Row (history completeness property).
9. WHILE an Agent_View of a Conversation is open, WHEN a new Chat_Row is persisted for that Conversation, THE Dashboard SHALL append it to the displayed history within 2 seconds, in timestamp order and without duplicating a Chat_Row that is already displayed.
10. IF loading the Chat_Rows or the earlier Incidents fails or takes longer than 10 seconds, THEN THE Dashboard SHALL show an error message saying that the history could not be loaded, together with a Retry action. It SHALL NOT show an empty conversation as if no messages existed, and it SHALL keep any reply text the agent has not sent in the composer.
11. IF the Widget's stored visitor id matches no Visitor_Record of the bot, or the visitor's latest Conversation is in Ended_State or marked `EXPIRED`, THEN THE Widget and THE Gateway SHALL start a new Conversation and keep every earlier Conversation and its Chat_Rows unchanged.

### Requirement 10: Incident lifecycle and closing

**User Story:** As a support lead, I want every incident to end with a recorded outcome, so that reporting and summaries are accurate.

#### Acceptance Criteria

1. WHEN the Owner_Agent marks an Incident with Incident_Status `agent_active` or `follow_up` as resolved in the Agent_View and supplies a resolution note of 10 to 2000 characters after trimming, THE Incident_Service SHALL set the Incident_Status to `resolved`, set the Incident_Outcome to `resolved_by_agent`, store the trimmed resolution note, the Owner_Agent id and the resolution time on the Incident_Record, and remove the Incident from the Agent_Wait_Queue if it is listed there.
2. WHEN the Owner_Agent releases an Incident's Conversation to the bot without marking the Incident as resolved, THE Incident_Service SHALL leave the Incident_Status, Incident_Outcome and handling agent id unchanged, and SHALL record the releasing agent id and the release time on the Incident_Record.
3. WHEN the visitor selects "Yes, resolved" in the Closure_Prompt while the Conversation's Incident has Incident_Status `waiting`, `agent_active` or `follow_up`, THE Incident_Service SHALL set the Incident_Status to `resolved`, remove the Incident from the Agent_Wait_Queue if it is listed there, and set the Incident_Outcome to `resolved_by_agent` when the Incident_Record has a handling agent id, or to `resolved_by_bot` when it has none.
4. IF the Conversation ends by a CLOSE_CHAT node, by conversation expiry, or by the end of the agent-handover-inbox reconnect grace period while its Incident has Incident_Status `waiting` or `agent_active`, THEN THE Incident_Service SHALL remove the Incident from the Agent_Wait_Queue if it is listed there, set the Incident_Status to `closed`, set the Incident_Outcome to `abandoned` when the Incident_Record has no handling agent id, or to `closed_unresolved` when it has one, and store the closing time and the end cause on the Incident_Record. An Incident with Incident_Status `follow_up` SHALL keep that status and its Incident_Outcome when the Conversation ends.
5. WHEN an Incident_Status changes to `resolved` or `closed` and the Incident_Record has a CRM_Contact id, THE Incident_Service SHALL create exactly one CRM Activity on that CRM_Contact within 5 seconds, holding the incident id, the Incident_Outcome, the handling agent name (or none when no agent handled it), the Service_Request `ticketId` (or none when no Service_Request is linked) and the closing time. IF the CRM database is unreachable, THEN THE Incident_Service SHALL keep the Incident_Status change, record the pending Activity, and retry at least 3 times over 10 minutes, so that at most one Activity exists per Incident.
6. IF a resolve request comes from a user who is not the Owner_Agent, or its resolution note is shorter than 10 or longer than 2000 characters after trimming, THEN THE Incident_Service SHALL reject the request with an error indicating the reason (not owner, or note length out of range), leave the Incident_Record unchanged, and THE Dashboard SHALL keep the entered note text in the resolve dialog.
7. IF any status change is requested for an Incident whose Incident_Status is already `resolved` or `closed`, THEN THE Incident_Service SHALL leave the Incident_Status, Incident_Outcome and timestamps unchanged and SHALL create no additional CRM Activity (single-closure property).

### Requirement 11: Incident summaries

**User Story:** As an agent, I want a short AI summary of every closed incident on the contact's timeline, so that I can understand past cases at a glance.

#### Acceptance Criteria

1. WHEN an Incident_Status changes to `resolved` or `closed` and the Incident_Record has no Incident_Summary, THE Summary_Service SHALL send exactly one summary request for that Incident's Incident_Transcript to the AI service. An Incident whose status goes from `resolved` to `closed`, or that already has an Incident_Summary, SHALL trigger zero more requests.
2. WHEN the AI service returns a valid Incident_Summary, THE Summary_Service SHALL store it on the Incident_Record, marked as AI-generated. If a CRM_Contact is linked, it SHALL also add the summary to the CRM Activity from Requirement 10 criterion 5. Both SHALL happen within 5 minutes of the Incident_Status change.
3. THE Summary_Service SHALL request Incident_Summaries only for Conversations that have an Incident_Record, and SHALL generate zero summaries for Non_Incident_Transcripts.
4. THE AI service SHALL provide a transcript summary endpoint. It SHALL accept the ordered Chat_Rows of one Incident_Transcript, each with its Sender_Role, and return a problem field and a resolution field, each 1 to 500 characters after trimming. THE Summary_Service SHALL fill the other Incident_Summary fields from the Incident_Record, not from the AI response: handling agent name, CRM_Contact display name, Service_Request `ticketId`, Incident_Outcome and generation time. When the Incident_Record has no agent, CRM_Contact or Service_Request, the matching field SHALL be empty.
5. WHEN the Summary_Service sends a transcript to the AI service, THE Summary_Service SHALL replace every email address, every phone number of 7 to 15 digits, and every value captured by a QUESTIONS element marked `secure` with a placeholder token that names the replaced data type (email, phone or secure value). The transmitted transcript SHALL contain zero of the original values.
6. IF the AI service returns an error, does not respond within 60 seconds, or returns a problem or resolution that is empty or longer than 500 characters, THEN THE Summary_Service SHALL treat the attempt as failed and retry up to 3 times, waiting 30, 60 and 120 seconds before the 1st, 2nd and 3rd retry.
7. IF all 4 attempts fail, THEN THE Summary_Service SHALL store a fallback Incident_Summary on the Incident_Record, and on the CRM Activity when a CRM_Contact is linked, within 10 minutes of the Incident_Status change. It SHALL build the summary from the Problem_Description (problem), the resolution note or empty when none exists (resolution), the handling agent, the `ticketId` and the Incident_Outcome, and mark it as not AI-generated. The Incident_Status and Incident_Outcome SHALL stay unchanged.
8. WHEN the Owner_Agent or an org admin of the bot's organization saves an edit to the problem or resolution of an Incident_Summary, THE Incident_Service SHALL accept each edited field only when it is 1 to 500 characters after trimming. It SHALL store the edited text, the editor's user id and the edit time, and keep the original AI text unchanged on the Incident_Record.
9. IF a user who is neither the Incident's Owner_Agent nor an org admin of the bot's organization submits an Incident_Summary edit, or an edited field is empty or longer than 500 characters, THEN THE Incident_Service SHALL reject the edit with an error indicating the reason and leave the stored Incident_Summary unchanged.
10. WHEN an Incident_Summary is stored or edited, THE Dashboard SHALL show the summary's current text (the edited text when an edit exists) in the CRM_Contact's ActivityTimeline on `/crm/contacts/[contactId]` and in the earlier-incidents list from Requirement 9 criterion 4. It SHALL label the summary as AI-generated, fallback or edited.

### Requirement 12: Agent resolutions as knowledge, with approval

**User Story:** As an org admin, I want agent answers to become bot knowledge only after a person approves them, so that the bot improves without learning mistakes or private data.

#### Acceptance Criteria

1. WHEN an Incident_Status becomes `resolved` with Incident_Outcome `resolved_by_agent`, THE Summary_Service SHALL create at most one Knowledge_Candidate for that Incident_Record within 5 minutes. This holds even when the Incident becomes `resolved` more than once. The Knowledge_Candidate SHALL reference the incident id and SHALL record the Owner_Agent who resolved the Incident as its author.
2. WHEN the Summary_Service creates a Knowledge_Candidate, THE Summary_Service SHALL derive the question from the Problem_Description and the answer from the resolution note (Requirement 10 criterion 1), using the AI service on input masked per Requirement 11 criterion 5. The question SHALL be 10 to 500 characters, and the answer SHALL be 10 to 2000 characters. Neither SHALL contain an email address, a phone number, a value captured by a QUESTIONS element marked `secure`, the CRM_Contact name or the Service_Request `ticketId`.
3. THE Summary_Service SHALL create Knowledge_Candidates only in the Question Bank of the organization that owns the Incident's bot, with status `under_review`.
4. WHILE a Knowledge_Candidate has status `under_review`, THE Message_Handler SHALL use it for zero visitor answers, and THE AI service SHALL hold zero vectors for it.
5. WHEN a Knowledge_Approver of the same organization approves a Knowledge_Candidate, THE Question Bank SHALL set the status to `approved` and record the approver id and the approval time. THE Message_Handler SHALL be able to use the entry for visitor answers from the next visitor message processed after approval.
6. IF the author of a Knowledge_Candidate, or a user outside the candidate's organization, tries to approve it, THEN THE Question Bank SHALL reject the approval with an error indicating that the user is not allowed to approve this entry, and SHALL leave the status `under_review`, as today.
7. WHERE the organization enables knowledge-base ingestion of approved candidates, WHEN a Knowledge_Candidate is approved, THE backend SHALL ingest its question and answer into the AI service through `POST /ingest/text` with source `incident:<incident id>` within 5 minutes of approval. WHEN the approved entry is later rejected or deleted, THE backend SHALL delete that source within 5 minutes.
8. IF ingestion or deletion of source `incident:<incident id>` fails, THEN THE backend SHALL keep the Question Bank status unchanged, retry at least 3 times over 10 minutes, and after the last failure show the entry in the Question Bank review list as having an ingestion failure.
9. IF the AI service fails to return a question and answer within 60 seconds on each of 3 attempts, or the result breaks the length or personal-data rules in criterion 2, THEN THE Summary_Service SHALL create no Knowledge_Candidate and SHALL record on the Incident_Record that knowledge-candidate generation failed.
10. WHEN a Knowledge_Approver rejects a Knowledge_Candidate, THE Question Bank SHALL remove the entry, so it is used for zero visitor answers, and THE Incident_Service SHALL record the rejecting user and the rejection time on the Incident_Record.
11. THE Dashboard SHALL list every Knowledge_Candidate with status `under_review` in the Question Bank review list of its organization. Each item SHALL show the question, the answer, the author, the creation date and a link to the source Incident and its Incident_Summary.

### Requirement 13: Transcript retention

**User Story:** As an org admin, I want routine bot chats purged after a set time while incident chats are kept, so that we store only what we need.

#### Acceptance Criteria

1. WHERE an organization has a Transcript_Retention value set, THE backend SHALL run one purge per 24-hour period. Each run SHALL delete all Chat_Rows of every Non_Incident_Transcript in that organization whose Conversation end time is more than Transcript_Retention days (Transcript_Retention × 24 hours) before the start of the run. A Conversation's end time is the time it was closed (CLOSE_CHAT, Closure_Prompt, idle close) or marked `EXPIRED`. A Conversation SHALL be purged no later than 24 hours after it first meets this condition.
2. WHILE a Conversation has not ended, or has at least one Incident_Record at the moment the purge run evaluates it, THE backend SHALL delete zero of its Chat_Rows. THE backend SHALL keep all Incident_Transcripts, Incident_Records, Incident_Summaries, Service_Requests, CRM_Contacts and CRM Activities unchanged during a purge, and SHALL delete Chat_Rows only from Conversations of bots owned by the organization being purged.
3. WHEN the Chat_Rows of a Conversation are purged, THE backend SHALL delete either all of that Conversation's Chat_Rows or none of them. It SHALL keep the Conversation record with its message counts, start and end dates, bot, channel and outcome unchanged, so that reports give the same totals before and after the purge, and SHALL mark the Conversation as transcript-purged with the purge time.
4. WHEN an org admin saves a Transcript_Retention value, THE backend SHALL accept only a whole number from 1 to 3650 days or no value, and SHALL apply the saved value from the next purge run. With no value (the default), THE backend SHALL purge zero Chat_Rows for that organization. Chat_Rows already purged SHALL stay purged when the value is raised or removed.
5. WHEN a purge run completes, THE backend SHALL log the organization id, the run start and end time, the Transcript_Retention value used, the number of Conversations purged, the number of Chat_Rows deleted and the number of Conversations that failed to purge.
6. IF an org admin submits a Transcript_Retention value that is not a whole number from 1 to 3650, THEN THE backend SHALL reject the change with an error indicating the allowed range, and SHALL keep the previously saved value.
7. IF a user who is not an org admin of the organization tries to set or clear Transcript_Retention, THEN THE backend SHALL reject the change with an error indicating insufficient permission, and SHALL keep the previously saved value.
8. IF deleting the Chat_Rows of a Conversation fails during a purge run, THEN THE backend SHALL leave all Chat_Rows of that Conversation in place, leave the Conversation unmarked, continue with the remaining Conversations, and include the Conversation in the next purge run.

### Requirement 14: Closing the conversation after a Terminal_Outcome

**User Story:** As a visitor, I want the bot to check whether I'm done instead of restarting the menu, so that the chat ends cleanly.

#### Acceptance Criteria

1. WHEN the flow reaches a Terminal_Outcome, THE Message_Handler SHALL send exactly one Closure_Prompt with the buttons "Yes, resolved", "I need something else" and "Start again", SHALL send no main-menu message and no AI answer until the visitor responds, and SHALL act only on the first button selection or message received after that Closure_Prompt and ignore later selections of the same Closure_Prompt.
2. WHEN the visitor selects "Yes, resolved", THE Message_Handler SHALL send the bot's closing message exactly once (default "Thank you for contacting us. Have a good day."), mark the Conversation as ended, and emit one event that puts the Widget in the Ended_State.
3. WHEN the visitor selects "I need something else", THE Message_Handler SHALL send one message asking what else the visitor needs and continue from the bot's start node in the same Conversation, keeping the Conversation id, its attributes and the CRM_Contact link unchanged.
4. WHEN the visitor selects "Start again" or sends "start", "reset" or "restart" (matched after trimming whitespace and ignoring letter case), THE Message_Handler SHALL restart the flow from the start node in the same Conversation and SHALL create no new Conversation.
5. IF the visitor sends neither a button selection nor a message within the configured idle time after the Closure_Prompt is sent (default 10 minutes, range 1 to 60 minutes, measured from the time the Closure_Prompt is sent), THEN THE Message_Handler SHALL send the closing message exactly once, mark the Conversation as ended, and emit one event that puts the Widget in the Ended_State.
6. WHILE the Widget is in the Ended_State, THE Widget SHALL disable the message input and the Closure_Prompt buttons, show the closing notice, and show one "Start new chat" action.
7. WHILE the Widget is in the Ended_State, WHEN the Widget reloads or reconnects, THE Widget SHALL show the Ended_State, and THE Gateway SHALL send no automatic "start" message.
8. WHERE a TRANSFER_TO_AGENT FAILURE branch is followed by a GO_TO_STEP to the main menu, as in `kone_r_agent_busy → kone_goto_menu`, THE KONE example flow SHALL be changed to end in the Closure_Prompt.
9. WHILE the Widget is in the Ended_State, WHEN the visitor selects "Start new chat", THE Widget SHALL start a new Conversation for the same visitor id that begins at the bot's start node, and the ended Conversation SHALL remain ended.
10. IF the visitor sends free text after the Closure_Prompt that is not a button label and not one of the restart keywords in criterion 4, THEN THE Message_Handler SHALL handle it as "I need something else" and process that text as the visitor's first input at the bot's start node, keeping the Conversation and its CRM_Contact link.
11. WHILE the Conversation's Ownership_State is Agent_Owned, THE Message_Handler SHALL send no Closure_Prompt and SHALL start no idle-time countdown, and SHALL send the Closure_Prompt only after the Ownership_State returns to the bot at a Terminal_Outcome.

### Requirement 15: Scope and non-regression

**User Story:** As an org admin, I want these changes limited to where they apply, so that existing channels and bot-only chats keep working.

#### Acceptance Criteria

1. WHILE a Widget runs in preview mode, THE Contact_Resolver, THE Incident_Service, THE Summary_Service and THE Message_Handler SHALL create zero CRM_Contacts, zero CRM Activities, zero Incident_Records, zero Service_Requests, zero Incident_Summaries and zero Knowledge_Candidates, SHALL send zero emails, and SHALL send zero transcript summary requests to the AI service.
2. WHILE a Conversation has no Handover_Request, THE Message_Handler SHALL, for the same bot flow and the same sequence of visitor inputs, send the same bot and AI messages in the same order and take the same node transitions as before this feature, and SHALL open zero Incident_Records. The only permitted differences are those required by Requirement 9 criterion 3 and Requirement 14.
3. WHERE the bot setting that enables this feature for the WhatsApp channel is on (default off), THE Contact_Resolver SHALL use the WhatsApp sender phone number as the captured phone in Contact_Details, convert it to a Normalised_Phone, and match or create the CRM_Contact per Requirement 2 criteria 2 to 7.
4. THE backend SHALL keep the existing CRM endpoints, Service Request endpoints and Question Bank endpoints backward compatible: every request accepted before this feature SHALL still be accepted with the same required parameters, every response field returned before this feature SHALL still be returned with the same name and type, new request parameters SHALL be optional, and new response fields SHALL only be added, never removed or renamed.
5. WHERE the bot setting that enables this feature for the WhatsApp channel is on, THE Message_Handler SHALL apply Requirements 5, 6, 10 and 11 to WhatsApp Conversations with the same Incident_Status and Incident_Outcome transitions as for Widget Conversations.
6. WHERE the bot setting that enables this feature for the WhatsApp channel is on, WHEN a WhatsApp Conversation ends per Requirement 14 criterion 2 or 5, THE Message_Handler SHALL send the closing notice as exactly one WhatsApp message instead of the Widget Ended_State, and SHALL start a new Conversation for the same sender on the next inbound WhatsApp message.
7. WHERE the bot setting that enables this feature for the WhatsApp channel is off, THE Message_Handler SHALL handle WhatsApp Conversations, and Conversations on every channel other than the Widget and WhatsApp, with the same messages, node transitions and agent assignment as before this feature, and SHALL open zero Incident_Records for them.

### Requirement 16: Ask for contact details only once

**User Story:** As a visitor, I want to give my details once, so that the bot and agents never ask me again.

#### Acceptance Criteria

1. WHEN a flow node is about to ask for a Contact_Details field (name, email or phone) and that field already has a valid value from the current Conversation, the Visitor_Record or the linked CRM_Contact, THE Message_Handler SHALL skip the question, store the known value on the node's attribute alias, and continue as if the visitor had answered.
2. WHEN all Contact_Details fields a QUESTIONS node or OPEN_TEMPLATE asks for are already known, THE Message_Handler SHALL skip the whole node and send one message confirming the details on file ("I have you as <name>, <masked email>. Is that still right?") with the buttons "Yes" and "Update details".
3. WHEN the visitor selects "Update details", THE Message_Handler SHALL ask only for the fields the visitor chooses to change.
4. WHEN a returning visitor's Widget sends its stored visitor id, THE Contact_Resolver SHALL use the CRM_Contact already linked to that Visitor_Record as known Contact_Details from the first message. JarCube SHALL depend on no host application's API or identity system for this; identity comes only from what the visitor tells the bot or from JarCube's own records.
5. WHEN the visitor states a name, email or phone in free text at any point (for example "I'm Raj, raj@x.com"), THE Message_Handler SHALL extract the values and pass them to the Contact_Resolver. The values SHALL count as captured Contact_Details, and no question SHALL be asked for them later.

### Requirement 17: Smart identity matching with confirmation

**User Story:** As an org admin, I want the bot to resolve identity like a careful human would, so that contacts are neither duplicated nor wrongly merged.

#### Acceptance Criteria

1. WHEN captured Contact_Details match exactly one CRM_Contact on both email and phone, or on the only identifier given, THE Contact_Resolver SHALL link to that CRM_Contact without asking.
2. WHEN captured Contact_Details match a CRM_Contact on one identifier and conflict on the other (for example, same email with a different stored phone), THE Message_Handler SHALL ask the visitor once: "We have a different <phone/email> on file ending <last 3 characters>. Which should we use?", with the buttons "Keep existing", "Use new" and "Keep both".
3. WHEN the visitor answers the question in criterion 2, THE Contact_Resolver SHALL apply the choice. For "Keep both", it SHALL keep the existing value in the primary field and store the new value as an additional identifier on the same CRM_Contact.
4. WHEN captured email and phone match two different CRM_Contacts, THE Contact_Resolver SHALL link the Conversation to the email match, ask no question, and record a merge suggestion on both CRM_Contacts for an org admin to review.
5. IF the visitor does not answer the identity question within 2 visitor turns, THEN THE Contact_Resolver SHALL keep the existing CRM_Contact values unchanged, record the new value as a proposed fact (existing `ContactFact`, status PROPOSED), and continue the flow.
6. THE Contact_Resolver SHALL never overwrite a CRM_Contact field that a human edited in the CRM, and SHALL propose the new value instead.

### Requirement 18: One rolling Visitor_Profile instead of transcripts

**User Story:** As a support lead, I want one compact, dated profile per contact that grows with every visit, so that the AI and agents know who the visitor is and what happened before, without us storing every message as the organization grows.

#### Acceptance Criteria

1. THE backend SHALL store exactly one Visitor_Profile per CRM_Contact, as a single JSON document on the CRM_Contact record in the CRM database. THE backend SHALL use no separate per-session summary table.
2. WHEN a Conversation linked to a CRM_Contact ends (Closure_Prompt, idle close, CLOSE_CHAT, Widget disconnect beyond the reconnect grace period, or expiry), THE Summary_Service SHALL send the current Visitor_Profile and the Conversation's Chat_Rows to the AI service and replace the Visitor_Profile with the merged result. The merge SHALL append one dated Profile_Entry for this Conversation and update the profile's standing facts (interests, products or equipment mentioned, preferences, open issues) without dropping earlier entries' dates.
3. EACH Profile_Entry SHALL hold the date and time in the organization's time zone (Requirement 22), the bot name, the channel, a 1 to 300 character summary of what the visitor asked and what happened, up to 10 topic tags, the outcome, and the Incident id and Service_Request `ticketId` when the Conversation had an Incident. Entries SHALL be ordered newest first.
4. WHEN a Conversation that had an Incident ends, THE Summary_Service SHALL write the Incident's problem, the agent's resolution, the handling agent and the Incident_Outcome into that Conversation's Profile_Entry. An Incident_Summary (Requirement 11) SHALL be stored only inside the Visitor_Profile and on the Incident_Record, not as a separate CRM Activity body.
5. WHEN the Visitor_Profile has been updated for a Conversation, THE backend SHALL delete all Chat_Rows of that Conversation, keep the Conversation record with its counts, dates, bot, channel and outcome, and mark it summarised. This applies to Conversations with and without an Incident. Raw Incident transcripts SHALL NOT be retained after the profile update.
6. WHILE a Conversation has an Incident_Record with Incident_Status `waiting`, `agent_active` or `follow_up`, THE backend SHALL keep that Conversation's Chat_Rows, so that the agent can read them, and SHALL run criteria 2 to 5 when the Incident becomes `resolved` or `closed`.
7. WHEN a Conversation ends with no linked CRM_Contact and no Incident_Record, THE backend SHALL delete its Chat_Rows without generating anything.
8. WHEN a CRM_Contact starts a new Conversation, THE Message_Handler SHALL pass the Visitor_Profile to the AI node as context. WHEN an agent opens any Conversation of that CRM_Contact, THE Agent_View SHALL show the Visitor_Profile, with its dated Profile_Entries, in place of earlier transcripts.
9. THE Summary_Service SHALL keep the Visitor_Profile at most 8,000 characters. When a merge would exceed that, the AI service SHALL compress the oldest Profile_Entries into one dated "earlier history" entry, preserving every Incident id and `ticketId`.
10. IF the AI merge fails after the retries of Requirement 11 criterion 6, THEN THE backend SHALL leave the Visitor_Profile unchanged, keep the Conversation's Chat_Rows, retry at the next daily run, and SHALL NOT delete Chat_Rows that have not been merged.
11. WHEN two Conversations of the same CRM_Contact end at the same time, THE Summary_Service SHALL apply their merges one after the other, so that the final Visitor_Profile contains both Profile_Entries (no lost update).
12. WHEN an org admin opens a CRM_Contact in `/crm/contacts/[contactId]`, THE Dashboard SHALL show the Visitor_Profile, and SHALL let the org admin correct a standing fact or delete a Profile_Entry. The next AI merge SHALL keep the admin's correction.

### Requirement 19: Handover always records an Incident and a Service_Request

**User Story:** As a support lead, I want every request for a human tracked as a ticket from the start, so that no request is lost even when no agent is online.

#### Acceptance Criteria

1. WHEN a Handover_Request is raised and a Problem_Description is known (Requirement 4), THE Incident_Service SHALL open the Incident_Record and create its Service_Request in the same operation, linked to the CRM_Contact (identified or anonymous, Requirement 20).
2. WHEN the Incident is opened, THE Message_Handler SHALL send the visitor exactly one message: the bot's handover text (default "Thanks. Your request <ticketId> has been recorded and a specialist will connect with you soon."), and SHALL NOT mention agent availability, hours, queue position or wait time.
3. WHILE the visitor stays connected and the Incident is not yet Agent_Owned, THE Bot_Responder SHALL keep answering the visitor's other questions with the flow and the AI, and SHALL leave the Incident open.
4. WHEN an agent takes over the Incident while the visitor is connected, THE Message_Handler SHALL tell the visitor the agent's display name. WHEN an agent opens the Incident after the visitor has left, THE Dashboard SHALL let the agent reply by email from the Incident, using the CRM_Contact email.
5. THE TRANSFER_TO_AGENT node SHALL NOT send "No agent is available…" or take the FAILURE branch because no agent is online. The FAILURE branch SHALL be taken only when the Incident or Service_Request could not be created.

### Requirement 20: Anonymous visitors

**User Story:** As an agent, I want to help visitors who don't share details, and capture their identity later, so that nobody is turned away and nothing is lost.

#### Acceptance Criteria

1. WHEN a Handover_Request is raised for a visitor with no valid email or phone, THE Contact_Resolver SHALL create an anonymous CRM_Contact named "Anonymous visitor <6-character id>", with the chat source and an anonymous marker, and link the Visitor_Record, the Conversation and the Incident to it.
2. THE Dashboard SHALL show anonymous CRM_Contacts with an "Anonymous" badge in the Agent_View and on `/crm/contacts`, and SHALL offer the agent an "Add details" form in the Agent_View.
3. WHEN the agent saves details in the Agent_View, or the visitor provides them in chat, THE Contact_Resolver SHALL run the matching of Requirement 17 against the organization's other CRM_Contacts. With no match, it SHALL upgrade the anonymous CRM_Contact in place. With a match, it SHALL merge the anonymous CRM_Contact into the existing one, moving its Conversations, Incidents and Service_Requests, merging its Visitor_Profile entries into the existing Visitor_Profile in date order, and archiving the anonymous record.
4. WHILE a Conversation is anonymous and has no Incident, THE Contact_Resolver SHALL create no CRM_Contact (D5).

### Requirement 21: Learn from agent resolutions

**User Story:** As an org admin, I want the bot to learn from every agent resolution, so that human help is needed less over time.

#### Acceptance Criteria

1. WHEN an Incident is resolved by an agent with a resolution note, THE Summary_Service SHALL generate one generalised question and answer from the Problem_Description and the resolution note, with personal data removed, and add it to the bot's Question Bank as `approved`, with the resolving agent as author and the incident id as source. The Question Bank's self-approval block SHALL be bypassed for this system-generated path only.
2. WHEN the Question Bank entry is created, THE backend SHALL ingest it into the AI knowledge base through `POST /ingest/text` with source `incident:<incident id>`, so that the AI node can use it from the next question.
3. WHEN a new learned entry is semantically close to an existing learned entry (cosine similarity at least 0.9), THE backend SHALL update the existing entry instead of adding a duplicate, and SHALL keep both incident ids as sources.
4. THE Dashboard SHALL list learned entries in the Question Bank with a "Learned from incident" label and a link to the Incident. WHEN an org admin edits or deletes one, THE backend SHALL update or delete the matching knowledge-base source within 5 minutes.
5. THE Dashboard SHALL show, per bot and per month, the share of Conversations that needed an agent (target shown: 1%).

### Requirement 22: Organization time zone

**User Story:** As an org admin anywhere in the world, I want times shown in my organization's time zone, so that dates on summaries, incidents and emails are correct.

#### Acceptance Criteria

1. THE backend SHALL store a country and an IANA time zone on each organization. It SHALL default the time zone from the country when only the country is set, and use UTC when neither is set.
2. THE backend SHALL render every date sent to a visitor or written into a summary or email in the organization's time zone, with the zone abbreviation.

## Decisions from review (supersede conflicting criteria above)

These decisions were taken with the product owner after the first draft. Where a criterion above conflicts with a decision here, the decision wins, and the replacement is given in Requirements 16 to 22 above. The open questions at the end are now answered.

- **D1 Emergency.** Emergency is a conversational path. The bot asks clarifying questions about the concern (no special priority handling beyond the existing Emergency_Flag alert). Any request to talk to an agent always opens an Incident_Record **and** a Service_Request at handover time, so that response and result are tracked from the start. Everything said in an Incident is recorded.
- **D2 No queue, no business hours to the visitor.** The visitor is never told about agent hours, queue positions or timeouts. After handover the bot says the request is recorded and a specialist will connect soon. The Incident stays open until an agent handles it, which may take days. The Wait_Timeout, Business_Hours and queue-position criteria are withdrawn (Requirement 5 and 6 revised). The goal is that the AI answers almost everything (target: human intervention in about 1% of conversations), and agent resolutions feed the AI (Requirement 12).
- **D3 Ask, don't guess, on identity conflicts.** When captured details partly match an existing contact (same email, different phone, or the reverse), the bot asks the visitor to confirm which is current, and stores the answer. It never merges silently on a partial match.
- **D4 Storage and privacy.** All visitor data is stored in the single shared CRM Postgres database, isolated per organization by `organizationId` under the existing multi-tenant auth model. No per-organization databases. No extra masking beyond sending only the summary input the model needs.
- **D5 Summaries replace transcripts.** Raw chat history is not kept long-term for anyone. When a session ends:
  - **Identified visitor** (a valid email or phone is known): the conversation is merged into that contact's single Visitor_Profile as a dated entry, and the raw Chat_Rows are then deleted. Incident conversations keep their Chat_Rows only while the Incident is open, so the agent can read them, and are then merged and deleted too. No raw transcript is kept after that (D9).
  - **Anonymous visitor with no Incident:** the raw Chat_Rows are deleted, and nothing is summarised.
  - **Anonymous visitor with an Incident:** kept as an anonymous CRM_Contact (see D8) and summarised like an identified one.

  Requirement 13 (retention days) is replaced by this session-end rule.
- **D6 Approval explained.** "Approval" means a human reviews an agent's answer before the AI is allowed to reuse it for other visitors. Agent resolutions are added to the bot's knowledge **automatically**: the agent's own resolution note is the review, and no second approver is required. An org admin can still edit or remove any learned entry.
- **D7 Web widget only.** WhatsApp and other channels are out of scope for this release. Requirement 15 criteria 3, 5 and 6 are withdrawn.
- **D8 Anonymous handover allowed.** An anonymous visitor can reach an agent. The Incident and Service_Request are created against an anonymous CRM_Contact named "Anonymous visitor <short id>". When the agent (or the bot) later learns the name, email or phone, the same CRM_Contact is upgraded in place. It is merged into an existing contact only after the identity check in D3.

- **D9 One rolling profile, no transcripts.** Raw chats, including Incident chats, are not kept once summarised. Each CRM_Contact has exactly one Visitor_Profile JSON that the AI updates after every Conversation, with each entry dated, so the AI knows what happened and when. No separate summary table is used (Requirement 18).
- **D11 One shared database.** Every organization uses the same CRM Postgres instance; tenant isolation is by `organizationId` on every row and query, enforced by the existing org-scoped auth. Separate per-organization databases are out of scope and will not be built, because one service instance cannot sensibly manage many tenant connections and migrations.
- **D10 JarCube is independent.** JarCube is a standalone chatbot product. It SHALL NOT call, embed or depend on any API, identity system or data of a customer or reference project (for example the myKONE portal). Customer projects are references only. Bot-specific wording such as "KONE" belongs in each bot's own flow and settings, never in product code or defaults.

### Withdrawn or replaced by the decisions

- Requirement 4 criterion 9 (create the Service_Request only on the Fallback path) is replaced by Requirement 19 criterion 1.
- Requirement 5 (queue, positions, estimates, Wait_Timeout) is withdrawn by D2. Criteria 4, 5 and 10 survive only as Requirement 19 criterion 3 and Requirement 19 criterion 4.
- Requirement 6 (timeout Fallback, Business_Hours, next opening time) is withdrawn by D2. Criteria 3 to 5 (the ticket and acknowledgement email) move to Requirement 19 criterion 1 and Requirement 19 criterion 2, and the email is still sent when a valid email exists.
- Requirement 12 criteria 2 to 6, 10 and 11 (a second approver) are replaced by Requirement 21.
- Requirement 13 (retention days) is replaced by Requirement 18.
- Requirement 11 criteria 2 and 10 (summary on a CRM Activity and the ActivityTimeline), and Requirement 13 criterion 2 (keep Incident_Transcripts), are replaced by Requirement 18 criteria 4 and 5: the Incident summary lives in the Visitor_Profile, and Incident transcripts are deleted after the merge.
- Requirement 9 criterion 5 (open an earlier Incident's full transcript) is replaced by showing that Incident's dated Profile_Entry, because the transcript no longer exists.
- Requirement 16 criterion 4 (identity passed by the host page) is replaced by JarCube's own returning-visitor identity (D10).
- Requirement 15 criteria 3, 5 and 6 (WhatsApp) are withdrawn by D7.

## Open questions

All open questions from the first draft are answered by decisions D1 to D11 above.
