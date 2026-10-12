# Requirements Document

## Introduction

This feature makes the CRM the single home for customer data and customer requests. It has three parts:

1. **Contact capture everywhere (bug fix).** Every name, email or phone a visitor gives us, on any channel and at any point in the chat, ends up on one CRM contact, and the conversation shows the visitor's real name instead of "Anonymous". The goal is a complete phone directory for follow-ups.
2. **Pluggable CRM.** Contacts and Service Requests are always present. Companies, Deals and future modules are plugins that each organization can turn on or off from a new CRM → Plugins page.
3. **Service desk in the CRM.** Service Requests move from MongoDB to the CRM Postgres database and are managed on a Jira-style board under CRM → Service Requests, with configurable stages, assignment, filters, AI summary, the conversation and a full history.

Dependencies:

- `.kiro/specs/crm-incident-handover` (implemented). Reused terms: Incident, Incident_Record, Service_Request, CRM_Contact, Contact_Details, Contact_Mapping, Contact_Resolver, Anonymous_Contact, Visitor_Profile, Normalised_Phone. Its contact resolver (email-then-phone matching, advisory locks, fill-empty-only, anonymous upgrade and merge, conflict prompt, outbox) is reused unchanged unless a requirement below says otherwise.
- `.kiro/specs/multi-tenant-rbac` (implemented). Reused: roles `org_admin`, `org_manager`, `agent`, `super_admin`; `ORG_ROLES`, `ORG_STAFF`; tab-based navigation (`ROLE_TABS`, mirrored in the UI).

Changes to earlier specs:

- Requirement 2 of this spec removes the per-bot `crmCapture` switch introduced by crm-incident-handover (Phase 0.1). Capture is always on.
- Requirement 9 of this spec replaces the Mongo `Ticket` store used by crm-incident-handover R1 and R19. The Incident keeps pointing at its Service_Request, now by CRM id.

### How it works today (code analysis)

**1. In-chat details never reach the CRM or the conversation name.**

- Every chat-to-CRM capture checks `isFeatureOn(botSettings, "crmCapture")` (`crm-bridge.service.ts` `captureFromAttributes`, `crm-bridge.listener.ts` `onVisitorText`, `ensureAnonymous`). The flag defaults to `false` (`bot-setting.entity.ts`). It is switched on per bot under Bots → bot → Settings → "Save visitor details to the CRM" (`IncidentSettings.tsx`, labels in `incidentSettings.ts`). With the flag off nothing is captured.
- With the flag on, values are read only from the bot's Contact_Mapping aliases (default `contact_name`, `contact_email`, `contact_phone`). A QUESTIONS element that saves to `name` or `phone` is ignored, even when its validation type is `jarcube.email` or `jarcube.phone_number`.
- A name with no email or phone does nothing (`hasIdentifier`).
- Nothing writes captured values back to Mongo. `CrmBridgeService.link` sets only `crmContactId` on Visitor, Conversation, Incident and Ticket. `Visitor.name` stays "Anonymous" (`VisitorService.createVisitor`), the inbox name comes from `Visitor.name` (`inbox.mapper.ts` `toThreadName`), and the legacy `new-visitor` payload uses the socket `visitorName`.
- `MessageHandlerService.handleMessage` overwrites the socket `visitorName` with the widget JWT name (`user.auth.name`, "Anonymous" when the form was skipped) on every inbound message, so even an in-memory update would be reverted.
- `CRM_CONTACT_LINKED` is consumed only by `incident-mail.service.ts`. No socket event refreshes the dashboard when a visitor's details change.

**2. Other sources.**

- Pre-chat form: `WidgetService.createVisitor` stores name, email and phone on the Visitor but never calls the CRM bridge. It also sets `anonymous: body.email ? true : false`, which is inverted.
- WhatsApp (official and WhatsApp-web), Telegram and Facebook visitors are created by `ChatInitializerService.initializeChat` → `VisitorService.CreateVisitorfromSocialMedia`. WhatsApp passes name and phone, Telegram and Facebook pass a name only. None of them creates a CRM contact.
- Template submissions and agent-entered details (`POST crm/conversations/:id/contact/details`) already go through the bridge. The template path is gated by `crmCapture`; the agent path is not.

**3. Service Requests.**

- Stored in Mongo (`tickets/entities/ticket.entity.ts`): `ticketId` (`SR_` + 6 characters), subject, description, status `OPEN | CLOSED | PENDING | DEFERRED`, priority `LOW | MEDIUM | HIGH | CRITICAL`, visitor, bot (the only tenant anchor; no `organizationId`), `agents[]` (its `ref` imports `Agent` from Node's `http` module by mistake), activities, conversationId, tags, incident, crmContactId, source.
- Created in three places: the TICKET node (`MessageHandlerService.handleCreateTicket`, default priority LOW), the handover (`IncidentService.openForHandover`, MEDIUM or CRITICAL) and `POST /tickets` (dashboard, including `views/apps/active-chat/CreateTicket.tsx`).
- Other readers and writers of the Mongo Ticket: `IncidentService.escalate` (priority), `Incident.ticketId` (ObjectId ref), `CrmBridgeService.link` and `repointMongo`, `CrmLinksService` (contact page "tickets" list), `TagService` (ticket counts per tag), `BotsService` (`getTotalCount`), `AgentService` (`ticket.assigned.agent` → `Agent.serviceRequests[]`, "requests handled"), `VisitorService` (`Visitor.serviceRequests[]`), dashboard stats and reports (`/tickets/stats*`, `/tickets/report/*`).
- The UI calls `GET /tickets/mark-as-deferred`, which does not exist, so "Defer" always fails. `PATCH /tickets/:id` writes no activity. Accepting an incident does not add the agent to the ticket.
- The detail page shows bot, status, agents, tags, subject, description, visitor name/phone/email, an activity timeline and the transcript loaded live from `/conversation/:id`. When `PROFILE_PURGE_MODE=live`, `SessionLifecycleService.deleteChats` removes those chats after the profile merge, so the transcript a ticket depends on can disappear.
- There is no summary field and no board.

**4. CRM.**

- Postgres via Prisma (`prisma/schema.prisma`, `CRM_DATABASE_URL`, `CrmPrismaService.forOrg`), every row scoped by `organizationId` from `@OrgId()`.
- Models: Company, Contact, Deal (requires a Company), DealContact, Activity (NOTE, CALL, EMAIL, MEETING, TASK with `dueAt`/`completedAt` — the follow-up record), custom fields (`FieldEntity` COMPANY, CONTACT, DEAL), SavedView, ContactFact, ContactBrief, AgentTask.
- The UI sidebar CRM group is hard-coded: Overview, Contacts, Companies, Deals (`navigation/vertical/index.ts`). The overview stats and quick links are hard-coded too (`pages/crm/index.tsx`).
- The only gating is the plan feature catalog (`FEATURE_CATALOG`, `EntitlementService`, `FeatureGuard`, `/me/entitlements`), edited only by a super admin. There is no plugin concept and no tenant-controlled module setting.
- The AGENT role sees only Conversations, Visitors, Service Requests and Support (`ROLE_TABS`, backend and UI). CRM controllers declare no `@Roles`, so they default to `ORG_ROLES` and an agent can call them through the API even though the UI hides them.

## Glossary

- **Capture_Source**: Where Contact_Details came from: `widget_form`, `widget_chat`, `template`, `whatsapp`, `whatsapp_web`, `telegram`, `facebook` or `agent`.
- **Contact_Capture**: The single backend operation that takes Contact_Details from any Capture_Source and updates the Visitor_Record, the live conversation and the CRM_Contact.
- **Channel_Identity**: A platform account id that lets the team message the person on that platform: Telegram user id, Messenger page-scoped id (PSID), or a WhatsApp account id (`…@lid`) when the number is hidden. Unique per organization.
- **Contact_Identifier**: One email, phone or Channel_Identity known for a CRM_Contact, with when it was first and last given and from which Capture_Source. A contact's Current email and Current phone are the most recently given ones.
- **Typed_Question**: A QUESTIONS or USER_INPUT element whose validation is `jarcube.email` or `jarcube.phone_number`.
- **Name_Aliases**: The attribute names treated as a person's name when the Contact_Mapping alias holds no value: `contact_name`, `name`, `full_name`, `fullname`, `your_name`, `visitor_name`, `customer_name`.
- **Visitor_Display_Name**: The name shown for a conversation in the inbox, the legacy active chat and alerts. It is `Visitor.name` unless that is empty or "Anonymous".
- **CRM_Plugin**: A CRM module that can be enabled per organization. Each has a key, label, description, icon, menu path, dependencies and a default state.
- **Core_Plugin**: A CRM_Plugin that is always enabled and cannot be turned off: `contacts` and `service-requests`.
- **Optional_Plugin**: A CRM_Plugin an organization may turn off: `companies` and `deals` in this release.
- **Plugin_Setting**: The per-organization record of a CRM_Plugin's enabled state, position and config.
- **Plugin_Admin**: A user with role `org_admin` or `org_manager` (or `super_admin` acting in an organization).
- **Service_Request (SR)**: A customer request tracked in the CRM Postgres database. Its human reference is `SR_` followed by 6 characters.
- **Stage**: A per-organization board column. It has a name, colour, position and a Stage_Category.
- **Stage_Category**: `OPEN`, `IN_PROGRESS`, `ON_HOLD` or `DONE`. It gives a Stage its meaning for reports, filters and incident closing.
- **Default_Stage**: The one Stage in an organization where new Service_Requests are placed. Its Stage_Category is `OPEN`.
- **Board**: The kanban view at `/crm/service-requests`, one column per Stage.
- **SR_Event**: One history entry of a Service_Request (created, stage changed, assigned, priority changed, edited, commented, reopened, summary generated, contact linked).
- **SR_Comment**: An internal note on a Service_Request, never shown to the visitor.
- **SR_Summary**: The AI-written summary of a Service_Request: overview, what the customer asked, what was done, suggested next step, and when it was generated.
- **Transcript_Snapshot**: A copy of the conversation messages stored on the Service_Request so it survives chat deletion.
- **Assignee**: The one org user (agent, manager or admin) responsible for a Service_Request.

## Requirements

### Requirement 1: Capture Contact_Details from every source

**User Story:** As an org admin, I want every visitor who gives us a name, email or phone, on any channel, saved as a CRM contact, so that we have a complete phone directory for follow-ups.

#### Acceptance Criteria

1. WHEN a visitor submits the widget pre-chat form with a valid email or a valid Normalised_Phone, THE backend SHALL run Contact_Capture with Capture_Source `widget_form` after the conversation is created.
2. WHEN a QUESTIONS node, a USER_INPUT node, a SET_ATTRIBUTES node or an OPEN_TEMPLATE submission sets a value that Requirement 3 recognises as a name, email or phone, THE backend SHALL run Contact_Capture with Capture_Source `widget_chat` (or `template` for an OPEN_TEMPLATE submission, or the conversation's channel for a social channel).
3. WHEN a visitor's free text contains an email or a phone (existing extraction, R16.5 of crm-incident-handover), THE backend SHALL run Contact_Capture with Capture_Source `widget_chat` or the conversation's channel.
4. WHEN a WhatsApp or WhatsApp-web conversation is created for a visitor whose phone number is known, THE backend SHALL run Contact_Capture with the phone and the WhatsApp display name and Capture_Source `whatsapp` or `whatsapp_web`. A WhatsApp-web contact whose number is hidden (`@lid`) SHALL be captured with its WhatsApp account id as a Channel_Identity (Requirement 22).
5. WHEN a Telegram or Facebook conversation is created, THE backend SHALL run Contact_Capture with the platform name and the platform account id as a Channel_Identity (Telegram user id, Messenger page-scoped id), and Capture_Source `telegram` or `facebook`. No email or phone is needed: the team follows up on the same platform (D9).
6. IF Contact_Details contain a name but no valid email, no valid Normalised_Phone and no Channel_Identity, THEN Contact_Capture SHALL update the Visitor_Record name (Requirement 4) and, when the conversation is already linked to a CRM_Contact, fill that contact's name under the fill-empty-only and anonymous-upgrade rules. It SHALL create no new CRM_Contact.
7. WHEN an agent adds details to a conversation (existing `POST crm/conversations/:id/contact/details`), THE backend SHALL run Contact_Capture with Capture_Source `agent`.
8. THE Contact_Capture SHALL use the existing Contact_Resolver for matching, creating, filling, conflicts and anonymous upgrade or merge, so that one person stays one CRM_Contact per organization (dedupe property of crm-incident-handover R2.7).
9. IF the CRM database is unreachable, THEN Contact_Capture SHALL still apply the Mongo updates of Requirement 4, SHALL queue the CRM part in the existing CRM outbox, and SHALL add no delay or error to the visitor's chat.
10. WHILE the widget is in preview mode, THE backend SHALL run no Contact_Capture.

### Requirement 2: Capture is always on

**User Story:** As an org admin, I don't want to remember to switch on contact saving per bot.

#### Acceptance Criteria

1. THE backend SHALL run Contact_Capture for every bot of every organization, regardless of the bot's `features.crmCapture` value.
2. THE Dashboard SHALL no longer offer a switch for saving visitor details. The Contact_Mapping fields SHALL stay.
3. THE stored `features.crmCapture` field SHALL stay readable so existing bot documents stay valid, and SHALL affect nothing: capture and "ask once" (Requirement 23) are always on.
4. THE creation of an Anonymous_Contact on handover (crm-incident-handover R20.1) SHALL no longer depend on `crmCapture`.

### Requirement 3: Recognise name, email and phone in chat

**User Story:** As a bot builder, I want the bot's detail questions to save to the CRM even when I didn't use the exact default attribute names.

#### Acceptance Criteria

1. THE backend SHALL read name, email and phone from the bot's Contact_Mapping aliases first, as today.
2. WHEN a Typed_Question accepts an answer, THE backend SHALL treat it as the visitor's email (`jarcube.email`) or phone (`jarcube.phone_number`) whatever its alias is, and SHALL also store it under the mapped email or phone alias when that alias has no value yet.
3. WHEN the mapped name alias has no value, THE backend SHALL use the first non-empty value among the Name_Aliases.
4. A value from a QUESTIONS element marked `secure` SHALL never be read as a name, email or phone.

### Requirement 4: Update the visitor record and the conversation name

**User Story:** As an agent, I want the conversation to show the visitor's real name as soon as they tell the bot, so that I know who I'm talking to.

#### Acceptance Criteria

1. WHEN Contact_Capture receives a valid name, email or phone, THE backend SHALL write it to the Visitor_Record. A captured value SHALL replace an empty value, "Anonymous", a `@nomemail.com` email or a placeholder phone. A different real value SHALL be replaced by the newer one (the Visitor_Record follows the visitor's latest statement; the CRM_Contact keeps its own fill-empty-only and conflict rules).
2. WHEN the Visitor_Record name changes, THE backend SHALL update the live conversation state so that later handover alerts, incident records and `new-visitor` payloads use the new name.
3. THE Message_Handler SHALL NOT overwrite a captured name with the widget token name on later messages.
4. WHEN the Visitor_Display_Name changes, THE backend SHALL notify the dashboard within 5 seconds: the inbox thread of the conversation SHALL be republished (`inbox:thread-updated`) and the assigned agent of a legacy active chat SHALL receive a `visitor-updated` event with the conversation id and the new name.
5. THE Dashboard SHALL show the new name in the inbox list, the open thread header and the legacy active chat without a page reload.
6. THE widget pre-chat form SHALL set the Conversation `anonymous` flag to true only when the visitor gave neither an email nor a phone.

### Requirement 5: Record where a contact came from

**User Story:** As a sales user, I want to see where each contact came from, so that I can follow up in the right way.

#### Acceptance Criteria

1. WHEN Contact_Capture creates a CRM_Contact, THE backend SHALL store its Capture_Source on the contact. A later capture SHALL NOT change it.
2. THE Dashboard SHALL show the Capture_Source on the contact detail page and offer it as a filter and a column on the contacts list.

### Requirement 6: CRM plugin catalogue and defaults

**User Story:** As an org admin, I want the CRM to show only the modules we use.

#### Acceptance Criteria

1. THE backend SHALL define the CRM_Plugins in one code registry with: key, label, description, icon, menu path, API prefix, dependencies, whether it is core, and its default state.
2. THE registry SHALL contain the Core_Plugins `contacts` and `service-requests`, and the Optional_Plugins `companies` and `deals`. `deals` SHALL depend on `companies`.
3. WHERE an organization has no Plugin_Setting for an Optional_Plugin, THE backend SHALL treat it as enabled (default on for `companies` and `deals`).
4. THE backend SHALL ignore any stored Plugin_Setting whose key is not in the registry.
5. Adding a new CRM_Plugin SHALL require only a registry entry, its module code and its pages; no change to the plugin settings storage.

### Requirement 7: Manage plugins from CRM → Plugins

**User Story:** As an org admin or manager, I want to turn CRM modules on and off and order them myself.

#### Acceptance Criteria

1. THE Dashboard SHALL add a CRM → Plugins page that lists every CRM_Plugin as a card with its label, description, icon, state and a switch. Core_Plugins SHALL show as always on, with the switch disabled.
2. THE backend SHALL allow only Plugin_Admins to change a Plugin_Setting. A request from an `agent` SHALL get 403. There SHALL be no plan limit on plugins.
3. WHEN a Plugin_Admin enables a plugin, THE backend SHALL also enable every plugin it depends on, in the same operation.
4. WHEN a Plugin_Admin disables a plugin that another enabled plugin depends on, THE Dashboard SHALL ask for confirmation naming the dependent plugins, and THE backend SHALL disable them together.
5. WHEN a plugin is disabled, THE backend SHALL keep all of its data. Enabling it again SHALL show the same data.
6. A Plugin_Admin SHALL be able to change the order in which enabled plugins appear in the CRM menu.
7. THE backend SHALL record who changed a Plugin_Setting and when.

### Requirement 8: Plugin state is enforced

**User Story:** As an org admin, I want a disabled module to disappear everywhere, not just from the menu.

#### Acceptance Criteria

1. THE Dashboard SHALL build the CRM menu, the CRM overview stat cards and quick links from the organization's enabled plugins, in their configured order. Overview and Plugins SHALL always be listed (Plugins only for Plugin_Admins).
2. WHEN a user opens the page of a disabled plugin, THE Dashboard SHALL show a "This module is turned off" state, with a link to Plugins for Plugin_Admins.
3. THE backend SHALL reject every API request under a disabled plugin's API prefix with 403 and a message naming the plugin.
4. WHILE `companies` is disabled, THE Dashboard SHALL hide company fields and columns on contacts. Stored company links SHALL stay.
5. THE backend SHALL apply a Plugin_Setting change to every server instance within 30 seconds.

### Requirement 9: Service Requests live in the CRM Postgres database

**User Story:** As an org admin, I want all customer requests stored with the customer in the CRM.

#### Acceptance Criteria

1. THE backend SHALL store every new Service_Request in the CRM Postgres database with its organization id. No new Service_Request SHALL be written to the Mongo Ticket collection.
2. THE TICKET node, the handover (`IncidentService.openForHandover`) and the dashboard create action SHALL create Service_Requests through the same CRM service.
3. Each Service_Request SHALL hold: reference, subject, description, Stage, priority, emergency flag, tags, CRM_Contact link (a database foreign key), Assignee, creator, source (`chat`, `dashboard`, `api`), channel, bot, conversation, visitor, incident, SR_Summary, Transcript_Snapshot and timestamps (created, updated, stage changed, first response, closed).
4. THE reference SHALL be `SR_` plus 6 characters, unique within the organization, and SHALL be the only id shown to visitors.
5. THE backend SHALL keep at most one Service_Request per Incident.
6. WHEN the Contact_Resolver links a conversation to a CRM_Contact (including an anonymous merge), THE backend SHALL link that conversation's Service_Requests to the same contact unless they already hold a different non-anonymous contact.
7. A Service_Request created from chat SHALL be placed in the Default_Stage with priority MEDIUM (CRITICAL for an emergency), whether it came from the TICKET node or the handover.
8. IF the Service_Request cannot be created, THEN the chat SHALL take the existing failure path (crm-incident-handover R1.9, R19.5).
9. Existing Mongo tickets SHALL NOT be migrated. The product owner deletes them by hand.

### Requirement 10: Configurable stages

**User Story:** As an org admin or manager, I want to name and order the board columns to match how my team works.

#### Acceptance Criteria

1. WHEN an organization has no Stages, THE backend SHALL create the defaults in this order: Open (OPEN, default), In Progress (IN_PROGRESS), Waiting on Customer (ON_HOLD), Deferred (ON_HOLD), Resolved (DONE), Closed (DONE).
2. A Plugin_Admin SHALL be able to add a Stage, rename it, change its colour and Stage_Category, reorder Stages and choose the Default_Stage. Agents SHALL get 403.
3. Stage names SHALL be 1 to 40 characters and unique within the organization, compared case-insensitively.
4. THE backend SHALL keep at least one `OPEN` Stage and at least one `DONE` Stage, and exactly one Default_Stage whose category is `OPEN`.
5. IF a Plugin_Admin deletes a Stage that holds Service_Requests, THEN THE backend SHALL require a target Stage and move them there, writing an SR_Event for each, before archiving the Stage.
6. WHEN a Service_Request moves into a `DONE` Stage, THE backend SHALL set `closedAt` and emit `ticket.resolved` so the linked Incident is resolved (crm-incident-handover R1.7).
7. WHEN a Service_Request moves out of a `DONE` Stage, THE backend SHALL clear `closedAt` and write a reopened SR_Event. The linked Incident SHALL stay as it is.

### Requirement 11: Board

**User Story:** As an agent, I want a Jira-like board of requests, so that I can see and move work at a glance.

#### Acceptance Criteria

1. THE Dashboard SHALL show CRM → Service Requests as a Board with one column per Stage in order, each with its name, colour and count.
2. Each card SHALL show the reference, subject, priority, emergency marker, CRM_Contact name (or "Anonymous visitor"), Assignee avatar and name (or "Unassigned"), channel, and age since creation.
3. A user SHALL be able to move a card to another column or another position by drag and drop, and with the keyboard or a "Move to" menu on the card.
4. WHEN a card is moved, THE backend SHALL save the Stage and position, write an SR_Event, and return the saved card. IF the save fails, THEN THE Dashboard SHALL put the card back and show the error.
5. THE Dashboard SHALL offer a list view of the same filtered Service_Requests with sortable columns.
6. A column SHALL load at most 50 cards at first and load more on demand.

### Requirement 12: Filters and saved views

**User Story:** As an agent, I want to see my requests first and filter the rest any way I need.

#### Acceptance Criteria

1. WHEN a user opens the Board with no filter in the address, THE Dashboard SHALL apply "Assigned to me".
2. THE Dashboard SHALL offer these filters, combinable: Assignee (me, unassigned, any, one or more named users); Stage (one or more); Stage_Category (open, in progress, on hold, done); priority (one or more); emergency only; bot; channel; source; CRM_Contact; tags; created date range; updated date range; age (older than N hours or days); and a search over reference, subject, description and the contact's name, email and phone.
3. THE Dashboard SHALL keep the active filters in the address so a view can be shared or reloaded.
4. A user SHALL be able to save the active filters as a named view, private or shared with the organization, using the existing saved views.
5. THE backend SHALL apply every filter in the database and scope every query to the caller's organization.

### Requirement 13: Assignment

**User Story:** As an agent, I want to take a request or see who owns it.

#### Acceptance Criteria

1. Any org user SHALL be able to see the Assignee of every Service_Request in the organization.
2. Any org user SHALL be able to "Assign to me" an unassigned Service_Request, and to reassign or unassign one. Each change SHALL write an SR_Event with the previous and new Assignee.
3. THE Assignee picker SHALL list only active users of the same organization.
4. WHEN an agent accepts the Incident linked to a Service_Request (crm-incident-handover R10), THE backend SHALL make that agent the Assignee if it has none, and move it from an `OPEN` Stage to the first `IN_PROGRESS` Stage.
5. THE backend SHALL keep the agent's "requests handled" figure, now counted from Service_Requests assigned to that agent.

### Requirement 14: Service Request detail

**User Story:** As an agent, I want everything about a request in one place.

#### Acceptance Criteria

1. WHEN a user opens a card, THE Dashboard SHALL show a detail drawer with: reference, subject, description (editable), Stage, priority, tags, Assignee (with "Assign to me"), CRM_Contact name, email and phone linked to the contact page, bot, channel, created and updated times, SR_Summary, the conversation, the history and the SR_Comments.
2. THE drawer SHALL have its own address (`/crm/service-requests/[srId]`) so it can be linked.
3. Any org user SHALL be able to add an SR_Comment of 1 to 5000 characters. Only its author SHALL be able to edit it; its author or a Plugin_Admin SHALL be able to delete it.
4. Every change to Stage, Assignee, priority, subject, description, tags or contact SHALL write an SR_Event with the actor, time, old value and new value, shown in the history newest first.
5. A Service_Request with no linked contact SHALL show "Not linked" and let the user link an existing CRM_Contact.

### Requirement 15: AI summary

**User Story:** As an agent, I want a short summary instead of reading the whole chat.

#### Acceptance Criteria

1. WHEN a Service_Request is created from chat, THE backend SHALL ask the AI service for an SR_Summary in the background and store it. The visitor's chat SHALL NOT wait for it.
2. WHEN a Service_Request moves into a `DONE` Stage, THE backend SHALL refresh the SR_Summary.
3. A user SHALL be able to regenerate the SR_Summary from the drawer.
4. THE input sent to the AI SHALL be masked with the existing PII masker.
5. IF the AI call fails, THEN THE backend SHALL keep the previous SR_Summary (or none), and THE Dashboard SHALL show "Summary not available" with a retry action.

### Requirement 16: Keep the conversation with the request

**User Story:** As an agent, I want the chat to stay with the request even after chats are cleaned up.

#### Acceptance Criteria

1. THE backend SHALL store a Transcript_Snapshot on the Service_Request when it is created, when it moves into a `DONE` Stage, and before any chat of its conversation is deleted.
2. THE session lifecycle SHALL NOT delete a conversation's chats until every Service_Request of that conversation holds a snapshot taken after the conversation's last message. IF the snapshot fails, THEN the chats SHALL be kept and retried by the existing daily job.
3. THE drawer SHALL show the live conversation while its chats exist and the Transcript_Snapshot after that.
4. A snapshot SHALL hold at most the last 500 messages. Masked secure answers SHALL stay masked.

### Requirement 17: Access by role

**User Story:** As an org admin, I want agents to work the board without seeing the rest of the CRM.

#### Acceptance Criteria

1. THE AGENT role SHALL see a CRM menu with only Service Requests, and SHALL be able to open the Board and the drawer.
2. THE AGENT role SHALL NOT see or open Overview, Contacts, Companies, Deals or Plugins.
3. Plugin_Admins SHALL see every enabled CRM page.
4. The backend Service Request endpoints SHALL accept `ORG_ROLES`. Plugin and Stage write endpoints SHALL accept only `ORG_STAFF`.
5. THE old Service Requests menu item SHALL be removed, and `/service-request/*` SHALL redirect to `/crm/service-requests`.

### Requirement 18: Live board

**User Story:** As an agent, I want new and moved requests to appear without refreshing.

#### Acceptance Criteria

1. WHEN a Service_Request is created, moved, assigned or edited, THE backend SHALL notify every signed-in user of the organization within 5 seconds, on every server instance.
2. THE Board and an open drawer SHALL apply the change without a reload. A card the user is dragging SHALL NOT jump.

### Requirement 19: Existing features keep working

**User Story:** As a product owner, I want the move to Postgres to break nothing that reads Service Requests.

#### Acceptance Criteria

1. The dashboard home cards, the Service Request reports, the bot detail counts, the tag counts, the agent detail page and the visitor detail page SHALL read Service_Requests from Postgres, with the same response shape as today.
2. The `/tickets` HTTP routes SHALL stay, delegate to the CRM service, and map Stage_Category to the old status (`OPEN` → OPEN, `IN_PROGRESS` → PENDING, `ON_HOLD` → DEFERRED, `DONE` → CLOSED). `GET /tickets/mark-as-deferred` SHALL exist and move the request to the first `ON_HOLD` Stage.
3. The Incident SHALL store the Service_Request's CRM id and reference. Incident escalation SHALL raise the Service_Request priority to CRITICAL.
4. The contact page's Service Requests list, the learned-knowledge source links and the incident emails SHALL use the Postgres Service_Request.
5. The dashboard create-ticket dialog in the active chat SHALL create a Postgres Service_Request.

### Requirement 20: Service Requests on the contact

**User Story:** As a sales user, I want a contact's requests and follow-ups together.

#### Acceptance Criteria

1. THE contact detail page SHALL have a Service Requests tab listing that contact's Service_Requests, newest first, with reference, subject, Stage, Assignee and created date, each opening the drawer.
2. THE contact detail page SHALL keep the activity timeline (notes, calls, tasks with due dates) as the place for follow-ups.

### Requirement 21: Keep every email and phone a contact has used

**User Story:** As a sales user, I want a person who changes their email or phone to stay one contact, with the newest details highlighted and the old ones kept.

#### Acceptance Criteria

1. THE Contact_Resolver SHALL match a capture to a CRM_Contact when any one of its email, phone or Channel_Identity equals a Contact_Identifier of that contact, current or earlier. Matching order: email, then phone, then Channel_Identity.
2. WHEN a capture matches a contact and gives a different email (or phone), THE Contact_Resolver SHALL make the new value the contact's Current email (or phone) and SHALL keep the previous value as an earlier Contact_Identifier. No question SHALL be asked (replaces crm-incident-handover R17.2–R17.5 and R17.6 for email and phone).
3. WHEN a capture gives a value the contact already has, THE Contact_Resolver SHALL update its last-given time and make it Current again.
4. IF the email matches one contact and the phone matches a different contact, THEN THE Contact_Resolver SHALL link to the email match, SHALL NOT move the phone, and SHALL leave a merge suggestion on both (crm-incident-handover R17.4 kept).
5. A Contact_Identifier SHALL belong to at most one non-archived contact in an organization.
6. THE contact page SHALL list every Contact_Identifier with its Capture_Source and last-given date, newest first, and SHALL mark the Current email and Current phone.
7. THE contacts search SHALL also find a contact by an earlier email or phone.
8. A name the visitor or an agent states SHALL replace the stored name; no name history is kept (D11). A guessed name (read from free text, or a platform display name) SHALL only fill a blank, "Anonymous" or platform-display name.

### Requirement 22: Platform account identities

**User Story:** As a sales user, I want Telegram, Messenger and hidden-number WhatsApp leads in the CRM, so that I can follow up on that platform.

#### Acceptance Criteria

1. THE backend SHALL take the Telegram Channel_Identity from the sender's numeric user id, never from the @username (which is optional and can change).
2. THE backend SHALL take the Messenger Channel_Identity from the page-scoped id (PSID) of the sender.
3. WHEN a Channel_Identity matches no contact and no email or phone is given, THE Contact_Resolver SHALL create a contact named from the platform name, with the Channel_Identity and the Capture_Source.
4. WHEN a platform-only contact (no email, no phone, not edited by a person) is later identified by an email or phone that belongs to another contact, THE Contact_Resolver SHALL merge the platform-only contact into that contact, moving its identifiers, activities, deals and visitor links, and archive it.
5. THE Visitor_Record of a Telegram visitor SHALL be keyed by the user id, so two Telegram users without a username never share one visitor.

### Requirement 23: Never ask for details the visitor already gave

**User Story:** As a visitor, I don't want to type my name, email and phone again after filling the pre-chat form.

#### Acceptance Criteria

1. THE widget backend SHALL store the valid pre-chat form values as the conversation's first attributes, under the bot's contact aliases.
2. WHEN a QUESTIONS node starts and any of its contact questions (mapped alias, `jarcube.email` / `jarcube.phone_number` type, or a common name alias) has a known answer, from the conversation, the Visitor_Record or the linked CRM_Contact, THE bot SHALL send one confirm: "We'll follow up with you at <name, masked email, masked phone>. Is that right?" with "Yes" and "Update details".
3. "Yes" (or any other reply) SHALL keep the details and continue with the node's first unanswered question, or past the node when none is left. Details typed in another reply SHALL still be captured.
4. "Update details" SHALL ask the node's contact questions again; the new answers are captured like any other.
5. While a questionnaire runs, a contact question whose answer became known (for example an email typed earlier in the same node) SHALL be skipped.
6. There SHALL be no switch for this; it applies to every bot. A node with a `secure` question is asked as configured.

## Decisions from review

Taken with the product owner on 2026-10-11. Where a criterion above conflicts with a decision, the decision wins.

- **D1 New data only.** Service_Requests are written only to the CRM Postgres database from this release on. Existing Mongo tickets are test data, are not migrated, and are deleted by hand. The final output lives in CRM Postgres only.
- **D2 Who manages plugins.** Everyone except agents (org admins and org managers) can enable, disable and order plugins and edit stages. There is no plan limit.
- **D3 Plugin defaults.** Contacts, Companies and Deals are on by default. Companies and Deals can be removed. Contacts and Service Requests are core and always on. Deals depends on Companies.
- **D4 Capture for all.** Contact capture is on for every organization and every channel, including WhatsApp and Telegram.
- **D5 Configurable stages.** The default stages ship as listed in Requirement 10.1; organizations can add stages, rename existing ones and reorder them.
- **D6 Agents on the board.** Agents see all requests and who each is assigned to. "Assigned to me" is the default filter; every other filter, including per-agent and per-state, is available.
- **D7 Name only (confirmed 2026-10-11).** On the widget, a name without an email or phone renames the conversation and fills an already-linked contact, but creates no new contact, because a name alone cannot be matched later.
- **D8 Versioned identifiers (2026-10-11).** If any one of email or phone matches, the same contact is updated. A different email (or phone) for that person is stored too: the newest is Current and highlighted, earlier ones are kept. Requirement 21.
- **D9 Platform identities (2026-10-11).** Telegram and Messenger leads are stored with their platform account id; no email or phone is required because follow-up happens on the same platform. The Telegram user id and the Messenger page-scoped id are stable per person (per page for Messenger), per [Meta's Pages API docs](https://developers.facebook.com/docs/pages-api/overview/) and [Telegram user id guides](https://www.technobezz.com/how-to-find-user-ids-in-telegram/). Requirement 22.
- **D10 Ask once for every bot (owner, 2026-10-11).** Details from the pre-chat form (or anywhere earlier) are not asked again; the visitor gets one "We'll follow up with you at … / Update details" confirm. No switch. Requirement 23.
- **D11 Names are not versioned (owner, 2026-10-11).** A stated name replaces the stored one (usually a spelling fix). Engineering keeps one guard: names guessed from free text or platform display names do not replace a real name.

## Open questions

1. CRM endpoints for contacts, companies and deals declare no `@Roles`, so an agent can call them through the API although the UI hides them. Restrict them to `ORG_STAFF` in this release (the board returns the contact fields it needs itself)? Engineering recommends yes.
2. SLA targets and due dates on Service_Requests are not requested and are out of scope; the age filter covers "old requests" for now.
