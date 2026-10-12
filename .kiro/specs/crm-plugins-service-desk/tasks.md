# Implementation Plan: CRM Plugins, Service Desk and Contact Capture

## Overview

This file is the single tracker for this feature. The architecture is in `design.md` and the rules are in `requirements.md`. Requirement refs use the form `R<n>.<criterion>`.

**How to use across sessions**
1. Read "Session log" (bottom) and "Current position" first.
2. Work one phase at a time, in order. Each phase ships on its own and leaves the system working.
3. Tick `[x]` as tasks finish, then add a dated line to the Session log saying what was done, what is next, and any blockers.
4. Every phase ends with a checkpoint: backend `npx tsc --noEmit` passes, the relevant Jest/pytest/vitest suites pass, the UI type-checks and builds, and new Prisma migrations apply locally.

**Current position:** All code done and tested (1.1–1.10, 2.1–2.7, 3.1–3.10, 4.1–4.9, 5.1, 5.3). Open: 5.2 (product owner decision on restricting contacts/companies/deals APIs), 5.4 (release, done by the owner using `docs/CRM-PLUGINS-SERVICE-DESK.md` → Release), and the manual checks 1.11, 2.8, 3.11, 4.10 on a running stack.

**Review rule (carried over from crm-incident-handover):** after every task, review the code as a senior engineer: walk every scenario and edge case (concurrency, retries, tenancy, null/invalid input, preview mode, role), fix what is found, and add tests for it before ticking.

**Test runner note:** run Jest with Node 18 or 20. On Node 24, `@nestjs/schedule@2` crashes; new specs stub `@nestjs/schedule`. The 43 old scaffold "should be defined" suites fail on any Node and predate this work.

**Conventions**
- Backend `QuantumMind-backend`, AI `QuantumMind-ai`, Dashboard `QuantumMind-ui`, Widget `QuantumMind-widget`.
- Visitor-facing paths never `await` the CRM or the AI for success. Use the outbox or background jobs.
- Every CRM query filters by `organizationId`. Cross-org ids return 404.
- No new UI dependency for drag and drop (native HTML5 + keyboard).
- AI tests run in Docker: `docker run --rm -v "$PWD":/app -w /app quantummind-ai-ai-service:latest python -m pytest -q tests/...`.

---

## Tasks

## Phase 1 — Contact capture everywhere (bug fix)

- [x] 1.1 Prisma migration `contact_capture_identifiers`: `Contact.sourceChannel String?` + index; `IdentifierKind` enum; `ContactIdentifier` table (unique org+kind+value); backfill identifiers from existing contacts' email/phone. `prisma generate`.
  - _R5.1, R21, R22; Design: Data Models_
- [x] 1.1a Resolver: identifier lookups (columns or history), versioned email/phone (newest Current, old kept, no conflict prompt), Channel_Identity matching/creation, platform-only placeholder upgrade/merge (identifiers, deals moved), `claimIdentifier`, `fillName`. Tests incl. Property 1 across identifiers.
  - _R21.1–R21.5, R21.8, R22.3, R22.4_
- [x] 1.2 Remove the capture gate (preview still skipped; `isAskOnceOn` keeps the old flag for "ask once" only): remove the `crmCapture` checks in `CrmBridgeService.captureFromAttributes`, `ensureAnonymous`, `linkReturning` and `CrmBridgeListener.onVisitorText`. Keep the schema field. Update existing specs that assert the flag-off behaviour.
  - _R2.1, R2.3, R2.4_
- [x] 1.3 Field recognition in `crm-bridge/identity.ts`: `NAME_ALIASES`, `readDetails(attributes, mapping, typed?)`. Listener alias pre-filter includes `NAME_ALIASES`. Unit tests (secure answers ignored).
  - _R3.1, R3.3, R3.4_
- [x] 1.4 MH typed answers: in `handleQuestion` and `captureUserInput`, a non-secure `jarcube.email` / `jarcube.phone_number` answer also fills the mapped email/phone alias when empty; emit both keys. Tests.
  - _R3.2_
- [x] 1.5 `ContactCaptureService.capture(ctx, raw, source)`:
  - Mongo `applyToVisitor` (placeholder replacement, latest wins), socket `visitorName` + `nameCaptured`.
  - Emit `visitor.details.updated` when the display name changes.
  - CRM: `bridge.capture` with `sourceChannel` on create; name-only → `resolver.fillName` on a linked contact, no create.
  - Never throws; preview skipped; CRM failure still applies Mongo updates.
  - Tests incl. Property 1 and Property 2.
  - _R1.6, R1.8–R1.10, R4.1, R4.2, R5.1, D7_
- [x] 1.6 `ContactResolverService`: `resolve(..., { sourceChannel })` written only in the create branch; new `fillName(orgId, contactId, name)` (advisory lock, `planFill`, anonymous upgrade). Tests.
  - _R1.6, R5.1_
- [x] 1.7 Wire the sources:
  - `CrmBridgeListener` (attributes, free text, template) → `ContactCaptureService` with source from the platform / `template`.
  - `WidgetService.createVisitor` → capture `widget_form` after the conversation is created; fix `anonymous` to `!email && !phone`.
  - `ChatInitializerService.initializeChat` → capture `whatsapp` / `whatsapp_web` (phone, or `@lid` as Channel_Identity), `telegram` (user id; also key the visitor by it), `facebook` (PSID).
  - `CrmLinksService.addDetails` → capture `agent`.
  - Tests per source.
  - _R1.1–R1.5, R1.7, R4.6_
- [x] 1.8 Socket name fix in `handleMessage` (`nameCaptured` wins over the token name); reset in `createVisitor`, set in `resumeSession` for a real stored name. Test.
  - _R4.3_
- [x] 1.9 Notify the dashboard: `InboxEventsService` listens to `visitor.details.updated` and republishes the conversation's thread (`publishThreadUpdated`); MH emits `visitor-updated` to the assigned agent. Tests.
  - _R4.4_
- [x] 1.10 UI: legacy active-chat store handles `visitor-updated`; inbox already handles `inbox:thread-updated` (verify the header updates). Relabel the `crmCapture` entry in `incidentSettings.ts` as "ask once" (update its vitest). Contact page shows Source and the identifier list with Current marked; contacts list gets a Channel column and filter (backend `ListContactsDto.channel`); search covers earlier identifiers.
  - _R2.2, R2.3, R4.5, R5.2, R21.6, R21.7_
- [ ] 1.11 Checkpoint P1: tsc, Jest (crm-bridge, message-handler, widget, chat-initializer), UI vitest + tsc, migration applied. Manual: in-chat detail questions → contact created, inbox name changes without reload; WhatsApp first message → contact.

## Phase 2 — CRM plugins

- [x] 2.1 Prisma migration `crm_plugins`: `CrmPluginSetting`. `prisma generate`.
  - _R6, R7.7; Design: Data Models_
- [x] 2.2 `src/crm/plugins/plugin-registry.ts` (`contacts`, `service-requests` core; `companies`; `deals` depends on `companies`) and `CrmPluginService` (`list`, `isEnabled` with 30 s cache, `setEnabled` with dependency closure and dry run, `reorder`). Tests incl. Property 3.
  - _R6.1–R6.5, R7.3–R7.5, R7.7, R8.5_
- [x] 2.3 `CrmPluginController`: `GET /crm/plugins` (`ORG_ROLES`), `PATCH /crm/plugins/:key` (+ `?dryRun=true`), `PUT /crm/plugins/order` (`ORG_STAFF`). Agent → 403. Tests.
  - _R7.2, R7.6_
- [x] 2.4 `@RequiresCrmPlugin` + `CrmPluginGuard` on companies, deals and their entity-scoped activities, fields and saved views. `StatsService` returns only enabled plugins' stats. Tests (403 message, core never blocked).
  - _R8.3_
- [x] 2.5 UI: `useCrmPlugins` hook + Redux slice (cached in `localStorage`); navigation builds CRM children from plugins with per-child `tab`; group visible when any child is visible; Plugins child only for staff. Pure nav builder + vitest (agent, staff, disabled, loading).
  - _R8.1, R17.1–R17.3_
- [x] 2.6 UI: `pages/crm/plugins.tsx` (cards, dependency confirm dialog from the dry run, reorder with up/down buttons: keyboard-friendly, no drag). Staff-only page check.
  - _R7.1, R7.4, R7.6_
- [x] 2.7 UI: `PluginOffState` on companies/deals pages; contacts hide company fields when `companies` is off; overview stat cards and quick links from the plugin list.
  - _R8.1, R8.2, R8.4_
- [ ] 2.8 Checkpoint P2: tsc, Jest (plugins), UI vitest + tsc, migration applied. Manual: disable Companies (Deals asked and disabled too), menu and API both off, re-enable shows the same data; agent cannot open Plugins.

## Phase 3 — Service Requests in CRM Postgres (backend)

- [x] 3.1 Prisma migration `service_requests`: enums, `ServiceRequestStage`, `ServiceRequest`, `ServiceRequestEvent`, `ServiceRequestComment`, `Contact.serviceRequests`, `FieldEntity.SERVICE_REQUEST`. `prisma generate`.
  - _R9.3; Design: Data Models_
- [x] 3.2 `ServiceRequestStagesService` + controller: `ensureDefaults` (advisory lock), CRUD, reorder, delete-with-move; invariants; `ORG_STAFF` writes. Tests incl. Property 4.
  - _R10.1–R10.5_
- [x] 3.3 `ServiceRequestsService` core: `createFromChat` (org from bot, ref retry, unique incident, Default_Stage, priority rules), `create` (dashboard), `byId`, `update`, `move` (fractional positions, renumber, DONE/reopen, `ticket.resolved`), `assign` / assign-to-me (same-org active users), events in the same transaction, `firstResponseAt`. Tests incl. Property 5, 6, 8.
  - _R9.1–R9.5, R9.7, R10.6, R10.7, R13.1–R13.3, R14.4_
- [x] 3.4 List and filters (`ListServiceRequestsDto`): every filter of R12.2, board grouping with per-column paging, list paging/sorting, search with contact join, org scoping. Tests incl. Property 7.
  - _R11.6, R12.2, R12.5_
- [x] 3.5 Comments (author edit, author/staff delete) and events endpoints; `GET /crm/service-requests/assignees`. Controllers with `ORG_ROLES`. Tests.
  - _R14.3, R13.3, R17.4_
- [x] 3.6 `TicketsService` facade: delegate create/find/update/assign/resolve, add `markAsDeferred` + route, status ⇄ category mapping, old response shapes; stats and reports in SQL. Update `src/e2e/api-compat.spec.ts` for the intended `_id` change. Tests.
  - _R19.1, R19.2_
- [x] 3.7 Callers and readers:
  - `Incident.ticketId` → `String`; `escalate` → SR priority CRITICAL + emergency.
  - `CrmBridgeService.link` / `repointMongo` → `linkContactForConversation`.
  - `CrmLinksService` tickets kind, `TagService` counts, `AgentService` "requests handled" (remove `ticket.assigned.agent` listener), `VisitorService.getVisitor` service requests, `BotsService` counts → Postgres.
  - Incident accept listener → assign + move to first IN_PROGRESS.
  - Tests for each.
  - _R9.6, R13.4, R13.5, R19.3, R19.4_
- [x] 3.8 Transcript snapshot: `snapshotTranscript` / `snapshotForConversation` (last 500, masked rows kept masked) on create and on DONE; `SessionLifecycleService` awaits the snapshot before `deleteChats`, keeps chats on failure; `GET …/transcript`. Tests incl. Property 9.
  - _R16.1–R16.4_
- [x] 3.9 AI: `POST /generate/service-request-summary` (JSON prompt, length caps, PII/ref guard) + pytest. Backend `aiService.serviceRequestSummary` and `ServiceRequestSummaryService` (background, 2 attempts, masked input, keep old on failure, `SUMMARY_GENERATED` event); `POST …/summary`. Tests.
  - _R15.1–R15.5_
- [x] 3.10 Realtime: `ServiceRequestEventsService` → `crm:service-request` to every active user of the org via `RedisPropagatorService`, throttled. Tests (org isolation).
  - _R18.1_
- [ ] 3.11 Checkpoint P3: tsc, Jest full suite (only the 43 scaffold suites fail), AI pytest, migration applied, opt-in Postgres integration for concurrent creates and moves. Manual: handover and TICKET node create a Postgres SR with the `SR_` ref shown in chat; dashboard home cards and reports still render.

## Phase 4 — Board and detail (UI)

- [x] 4.1 Redux `store/apps/crm-service-requests` (board, list, detail, stages, assignees, comments, events) and the socket subscription in `socket.services.ts`.
  - _R18.2_
- [x] 4.2 Pure helpers with vitest: `srFilters.ts` (URL ⇄ filters, default `assignee=me`), `boardOrder.ts` (positions for a drop), `boardState.ts` (apply realtime events, skip the dragged card).
  - _R12.1, R12.3, R11.4, R18.2_
  - Drop positions (`neighbours`, `dropTarget`, `keyboardTarget`) live in `boardState.ts`; there is no separate `boardOrder.ts`.
- [x] 4.3 `pages/crm/service-requests/index.tsx` with `SrBoard` / `SrColumn` / `SrCard` (HTML5 drag, "Move to…" menu, keyboard move with `aria-live`), load more per column, optimistic move with rollback.
  - _R11.1–R11.4, R11.6_
- [x] 4.4 `SrListView` (DataGrid, server sort/paging) and the board/list toggle.
  - _R11.5_
- [x] 4.5 `SrFiltersBar` with every filter of R12.2 and `SavedViewsBar` (entity `SERVICE_REQUEST`).
  - _R12.2, R12.4_
- [x] 4.6 `SrDetailDrawer` + `pages/crm/service-requests/[srId].tsx`: fields, inline edits, assignee picker with "Assign to me", contact link / "Not linked" with link-existing, `SrSummaryCard` (regenerate, "Summary not available"), `SrTranscript`, `SrHistory`, `SrComments`.
  - _R13.2, R14.1–R14.5, R15.3, R15.5, R16.3_
- [x] 4.7 `StageManagerDialog` (staff only): add, rename, colour, category, default, reorder, delete with target stage; error messages for the invariants.
  - _R10.2–R10.5_
- [x] 4.8 Routing and access: `PATH_TAB` `/crm/service-requests` → `service-requests` before `/crm`; remove the top-level Service Requests nav item; redirect `/service-request/*`; update "view" links in agent page, visitor page, dashboard cards, `CreateTicket.tsx`, `Ticket-Cards.tsx` to `/crm/service-requests/[id]`.
  - _R17.1, R17.2, R17.5, R19.5_
- [x] 4.9 Contact page "Service Requests" tab (opens the drawer); activity timeline kept for follow-ups.
  - _R20.1, R20.2_
- [ ] 4.10 Checkpoint P4: UI vitest + tsc + build. Manual: agent sees only CRM → Service Requests with "Assigned to me" on; per-agent and per-stage filters; drag between columns in two browsers updates both; stage rename shows everywhere; drawer shows summary, chat, history and comments.

## Phase 5 — Hardening

- [x] 5.1 Property tests reviewed together (Properties 1–9) and the opt-in Postgres integration extended: capture from three sources for one person, plugin toggles, stage delete-with-move, board moves under concurrency, snapshot before purge in `live` mode.
- [ ] 5.2 Open question 1 (restrict contacts/companies/deals APIs to `ORG_STAFF`) decided with the product owner and applied or recorded.
- [x] 5.3 Docs: `docs/CRM-PLUGINS-SERVICE-DESK.md` (plugins, stages, board, capture sources, endpoints, migration, troubleshooting). Note in `docs/CRM-INCIDENT-HANDOVER.md` that `crmCapture` is retired and tickets live in Postgres.
- [ ] 5.4 Release: apply migrations, deploy backend + AI + UI together, then the owner drops the Mongo `tickets` / `ticketactivities` collections by hand.

---

## Session log

- 2026-10-11 (planning): Requirements, design and tasks written from the code analysis and the product owner's answers (D1–D6; D7 proposed by engineering). No code changed. **Next:** Phase 1, task 1.1. **Open:** open question 1 in `requirements.md`.
- 2026-10-11 (P1): Owner confirmed D7 and added D8 (versioned email/phone, newest Current, no question) and D9 (Telegram / Messenger leads by platform id). Spec updated (R1.4, R1.5, R2.2–R2.3, new R21, R22, D8–D10). Phase 1 tasks 1.1–1.10 done.
  - Prisma `20261011064538_contact_capture_identifiers`: `Contact.sourceChannel`, `IdentifierKind`, `contactIdentifier` (unique org+kind+value) with a backfill of current emails/phones. Applied locally.
  - Resolver: lookups by current column or earlier identifier; email/phone of a match replaced by the newest with the old kept; platform ids (`TELEGRAM`, `FACEBOOK`, `WHATSAPP_LID`) match and create; platform-only leads are placeholders (upgraded in place or merged: identifiers, activities, deal links, visitor ids, profile); `fillName`. Conflict outcomes are no longer produced (the prompt code only settles pending ones; remove in Phase 5).
  - **Bug found in review:** recording a contact's previous email/phone runs without that identifier's advisory lock, so a concurrent capture could insert the same row and fail the whole capture (seen by the new property test, ~1 in 100 runs). Fixed with `createMany … skipDuplicates` (ON CONFLICT DO NOTHING).
  - `ContactCaptureService` (one entry point: Visitor record latest-wins, live `visitorName` + `nameCaptured`, `visitor.details.updated`, CRM). Wired: listener (attributes, free text, template), widget pre-chat form (+ inverted `anonymous` fixed), WhatsApp, WhatsApp-web (`@lid`), Telegram (visitor now keyed by user id: handle-less users all shared one visitor before), Messenger (PSID), agent "Add details".
  - MH: typed email/phone answers also fill the mapped alias; captured name no longer overwritten by the token's "Anonymous"; `visitor-updated` to the legacy active-chat agent. Inbox threads republished on a name change.
  - Contacts API: `identifiers` and `sourceChannel` on the detail, `channel` filter + facet, search over phone, earlier emails/phones and phone digits.
  - UI: contact page lists identifiers with Current marked and the source; contacts list Phone + Source columns and Source filter; active-chat rename on `visitor-updated`; bot setting relabelled "Don't ask again for contact details we already have".
  - Tests: backend full suite 601 pass, only the 43 old scaffold suites fail; new/changed: contact-resolver (+11 incl. property across identifiers), identity (+4), contact-capture (9), crm-bridge (+2, flag-off tests rewritten), returning (+1), identity-flow (+4), visitor-refresh (2), channel-capture (3); opt-in Postgres `kone-crm-identifiers.int.spec.ts` (4) and the existing `kone-crm.int.spec.ts` (4) pass on the local DB. UI vitest 84 (+8), UI and backend tsc clean.
  - **Open:** 1.11 manual run (widget chat → contact + inbox rename; WhatsApp/Telegram first message → contact). **Next:** Phase 2, task 2.1.
- 2026-10-11 (P1 follow-up, owner feedback): D10 changed to "ask once for every bot" and new R23; D11 names are not versioned.
  - Pre-chat form values seed the conversation attributes (`formAttributes`); `IdentityPromptService.known` also reads the Visitor record (works with the CRM down). Any known contact question (mapped alias, `jarcube.email`/`jarcube.phone_number`, common name alias) → one confirm "We'll follow up with you at …" with Yes / Update details; Yes or any other reply continues with the node's first unanswered question (mixed questionnaires now work, not only all-contact nodes); later known contact questions are skipped mid-node. No switch; the bot-settings entry is gone; `isAskOnceOn` removed.
  - Names: a stated name (question, form, agent) replaces the stored one, no proposal. `weakName` (free text, platform display names) only fills blank/"Anonymous"/platform names, on the Visitor record and the contact.
  - Tests updated/added: identity-flow (+3), identity (+1), resolver (2 rewritten), contact-capture (+1), channel-capture, form-attributes (2).
- 2026-10-11 (P2): Phase 2 tasks 2.1–2.7 done.
  - Prisma `20261011084244_crm_plugins` (`crmPluginSetting`, unique org+key). Applied locally.
  - `src/crm/plugins/`: registry (contacts and service-requests core; companies; deals depends on companies; service-requests `showInMenu: false` until the Phase 4 board), pure `effectiveStates` / `planToggle` / `planOrder`, `CrmPluginService` (30 s per-org cache, dry run, one transaction, `updatedById`), `CrmPluginController` (`GET` ORG_ROLES, `PATCH :key` / `PUT order` ORG_STAFF), `@RequiresCrmPlugin` + `CrmPluginGuard` on Companies, Deals and the entity-scoped fields / saved views / activities routes (fails open if the plugin state cannot be read). Stats return null for off plugins.
  - Gap noted: PATCH/DELETE of a field, saved view or activity by id is not plugin-checked (the entity is only known after a lookup); the UI hides those screens while the plugin is off.
  - UI: `crmPlugins.ts` (pure, vitest 6), `crm-plugins` slice (localStorage cache read after mount), CRM menu built from plugins (old menu while loading), Plugins page (staff only; agents get a message), `withCrmPlugin` + `PluginOffState` on companies/deals list and detail, overview cards/links/subtitle from plugins, contacts hide company column/row and the deals block.
  - Tests: backend full suite 627 pass, only the 43 old scaffold suites fail; plugins 20 unit tests (incl. Property 3) + opt-in Postgres `kone-crm-plugins.int.spec.ts` (all 9 opt-in tests pass). UI vitest 90, tsc clean.
  - **Open:** 2.8 manual run. **Next:** Phase 3, task 3.1.
- 2026-10-11 (P3): Phase 3 tasks 3.1–3.10 done; 3.11 automated checks pass, manual run open.
  - Prisma `20261011093753_service_requests` (stages, requests, events, comments, `FieldEntity.SERVICE_REQUEST`) and `…_service_request_bot_optional` (`botId` nullable: a request logged by hand from a phone call has no bot). Applied locally.
  - `src/crm/service-requests/`: pure `stage-rules`, `board-order`, `list-filters`, `transcript`; `ServiceRequestStagesService` (defaults on first use under a per-org advisory lock, invariants checked on the planned list, delete-with-move writes one event per moved request); `ServiceRequestsService` (createFromChat one per incident incl. lost-race read-back, dashboard create with bot/contact/assignee checks, update/move/assign with events in the same transaction, column + row advisory locks for moves, fractional positions with renumber, DONE → `closedAt` + `ticket.resolved`, out of DONE → `REOPENED`, incident accept → assign + first IN_PROGRESS stage, contact link/repoint, comments, history, assignees, channel read from the conversation); transcript snapshot (on create, on close, and awaited by the session lifecycle before deleting chats, 10 s cap; an empty read never overwrites a snapshot); AI summary (masked input incl. the contact's own name/email/phone and SR refs, 2 attempts in background, keep old on failure, `summaryError`); realtime `crm:service-request` via the Redis propagator to the org's active users, throttled 300 ms. Controllers `crm/service-requests` (ORG_ROLES) and `crm/service-request-stages` (writes ORG_STAFF).
  - `/tickets` facade: same routes and shapes (`_id`, `ticketId`, `status`, `agents`, `bot`, `visitor`, `activities`); new `GET /tickets/mark-as-deferred` (the old Defer button now works); stats and reports in SQL. **Behaviour change:** "open" / "pending" counts are now "not finished" (any stage not in the Done category) instead of the old exact `OPEN` status.
  - Readers moved: incident (`ticketId` Mixed, string match), CRM bridge link/repoint, contact page requests, tag counts, agent page (requests owned by the agent; `ticket.assigned.agent` listener removed), visitor page, bot stats. Nothing writes the Mongo Ticket collection.
  - AI: `POST /generate/service-request-summary` (+7 pytest; full suite 286 pass).
  - Tests: backend full suite 649 pass, only the 43 old scaffold suites fail; new `rules.spec` (14, incl. Property 4 stages and Property 5 board order), `summary-events.spec` (6, incl. masking and Property 7 fan-out), lifecycle +2 (Property 9); opt-in Postgres `kone-crm-service-desk.int.spec.ts` (10: concurrent stage defaults, one request per incident under 5 concurrent creates, close/reopen/history replay, 60 drops with renumber, tenancy, comments, stage delete-with-move, facade + raw-SQL reports, snapshot, contact link). All 19 opt-in Postgres tests pass. App boots with the new modules (checked on port 4123).
  - **Open:** 3.11 manual run (handover and TICKET node create an SR with the `SR_` ref in chat; dashboard home cards, reports, agent and visitor pages render). **Next:** Phase 4, task 4.1.
- 2026-10-11 (P4): Phase 4 tasks 4.1–4.9 done; 4.10 automated checks pass, manual run open.
  - Store `store/apps/crm-service-requests` (board, list, drawer, stages, assignees, comments, history, transcript; stale board/list answers ignored by request id; optimistic move rolled back to the old place on failure; your own save that no longer matches the filters drops the card). Socket `crm:service-request` → `srRealtime` in `AuthContext` (board/list patched in place, open drawer refetches notes/history, "deleted" shows a notice); a reconnect bumps `gap` so open views refetch.
  - Pure helpers + vitest: `srFilters` (address ⇄ filters, empty address = "Assigned to me", `assignee=any` keeps "everyone", date pickers sent as whole local days), `boardState` (move, neighbours, drop index, Alt+arrow targets, announcements, realtime apply that skips the dragged card and never adds on search/date/age), `srHistory` (sentences), `stageEdit` (stage rule pre-checks).
  - UI under `views/crm/service-requests/`: `ServiceDeskPage` (used by `pages/crm/service-requests/index.tsx` and `[srId].tsx`; filters, view, page and sort in the address), `SrBoard` / `SrColumn` / `SrCard` (native drag, "Move to…" menu, Alt+arrows with `aria-live`, load more per column), `SrListView` (server paging/sort), `SrFiltersBar` (every R12.2 filter; bots and tags from the loaded requests), `SavedViewsBar` (`SERVICE_REQUEST`, new save dialog with "Share with my organization"), `SrDetailDrawer` (inline subject/description, stage, priority, emergency, tags, assignee + Assign to me, contact with link-existing/unlink, summary with regenerate / "Summary not available", conversation live or saved copy, notes with author edit and author/staff delete, history), `StageManagerDialog` (staff only), `SrCreateDialog`, `ContactServiceRequests` (new contact tab).
  - Access: CRM menu items carry a role tab; agents see CRM with only Service Requests; top-level Service Requests item removed (horizontal menu repointed); `PATH_TAB` `/crm/service-requests` → `service-requests`; backend registry `service-requests` `showInMenu: true`. `/service-request/list` and `/view/[id]` redirect. Links moved: contact links, learned-entry links (CRM ids only; old Mongo ids stay labels, R9.9), agent page, visitor ticket cards (also fixed a `legnth` typo that hid them), dashboard button, create-ticket toast.
  - Tests: UI vitest 139 (+49: srFilters 12, boardState 18, srHistory 6, stageEdit 5, store 4, navigation 3, plugins/links/learned updated), UI tsc clean, `next build` passes. Backend tsc clean, plugins jest 20 pass.
  - Known limits: stage edits reach other users on their next load (no push); the list view patches rows live but does not insert new ones; the colour picker saves on blur; a fresh login subscribes to the socket only after a reload (same as the inbox today).
  - **Open:** 4.10 manual run (agent menu, "Assigned to me" default, per-agent/stage filters, two-browser drag, stage rename, drawer content). **Next:** Phase 5, task 5.1.
- 2026-10-11 (P5): 5.1 and 5.3 done; 5.2 waits for the product owner; 5.4 is the owner's release.
  - 5.1: Properties 1–9 mapped to their unit and Postgres tests (table in `docs/CRM-PLUGINS-SERVICE-DESK.md` → Tests). New opt-in `src/e2e/kone-crm-hardening.int.spec.ts` (8): one person from the pre-chat form, WhatsApp, Telegram and the agent → one contact with every identifier, every conversation and the request linked, Visitor records latest-wins; the three sources at the same moment (fast-check order) → one contact, nothing queued; random plugin toggles from two server instances keep dependencies and leave another org untouched; random stage edits incl. delete-with-move keep the rules and no request on an archived stage; two people working 8 cards at once from a stale board view → distinct positions and unbroken from/to history chains per field ending at the current values; `live` purge copies the chat onto every request of the conversation before deleting; a failing snapshot write keeps the chats and the daily repair deletes them once it works; cross-org detail, notes, history, transcript, edit, assign, comment, stage edit, move into another org's stage → 404, and search, filters and stats never show the other org.
  - **Bug found:** a drop with a stale neighbour (the card below had moved away, or another card had landed in between) could take the exact position of an existing card (`above + 1`). The move now anchors on one valid neighbour and takes the card really next to it. The new test fails without the fix (checked) and passes with it.
  - 5.3: `docs/CRM-PLUGINS-SERVICE-DESK.md` (what changed, behaviour changes, roles, stages, migrations, release incl. dropping the Mongo collections by hand, live board, transcript, endpoints, troubleshooting, tests and the property map). `docs/CRM-INCIDENT-HANDOVER.md`: note that `crmCapture` is retired and tickets live in Postgres.
  - Tests: `npm run test:crm-int` 27 pass (+8). Backend full jest 649 pass, only the 43 old scaffold suites fail; tsc and tsc build clean.
  - **Open:** 5.2 decision (open question 1 in `requirements.md`; restricting needs an agent-safe contact search for the board's link/create/filter, which today call `GET crm/contacts?q=`); 5.4 release; manual checks 1.11, 2.8, 3.11, 4.10. Follow-up noted in P1: the identity-conflict prompt code only settles conflicts created before this release and can be removed once none are pending.
- 2026-10-11 (owner feedback after P5): one bug fixed, two changes.
  - **Bug: a request the agent raised by hand had no contact and its card said "Anonymous visitor".** Causes: the dashboard create path never looked up the chat's contact; nothing linked it later unless the visitor gave an email/phone afterwards; the card showed "Anonymous visitor" for any anonymous contact even when it had a name; contact edits and anonymous upgrades never pushed the cards; the merge repoint wrote no history and no push. Fixes: create (dashboard and chat) uses the conversation's, else the visitor's, contact; with none, `crm.service-request.needs-contact` makes the CRM bridge find/create the contact from the Visitor record (email/phone → resolve; else anonymous named after the visitor) and link every request of the chat; captures, name fills and contact edits push the contact's cards (`touchContact`); repoint writes `CONTACT_LINKED` per request and pushes; the UI shows a known name on an anonymous contact.
  - **Incident first (owner decision):** `incidentHandover` is retired and always on (like `crmCapture`). Asking for a person opens the incident and its request at once, before any question; the visitor gets "Your incident ticket SR_… has been created and our team will follow up with you on it…". If the problem is unknown it is asked afterwards and written onto the same incident and request (`IncidentService.recordProblem`, only over the "no problem" placeholder); an answer after an agent took over is still recorded. The legacy "No agent is available" path is no longer reachable.
  - **Wrap-up before close / release:** "Close conversation" (active chat) and "Release to bot" (inbox) open `SrWrapUpDialog`: the chat's request is loaded (created only if none), the AI prefills subject and description from the masked conversation (`GET crm/service-requests/wrap-up`), the agent sets status (Resolved closes the request and the incident; Still open keeps it on the board) and must tick "I checked the AI-filled details"; `POST crm/service-requests/wrap-up` updates the card, assigns it to the agent if unowned, then the chat closes / is released. The old "Create Ticket" button opens the same dialog in save mode, so a chat never gets a second card. An AI failure still opens the form from stored values.
  - Tests: backend full jest 662 pass, only the 43 old scaffold suites fail (features, crm-bridge +6, handover-replay rewritten for incident first +3, incident-ticket, new wrap-up.spec 2); `npm run test:crm-int` 35 pass (+8 in `kone-crm-wrap-up.int.spec.ts`: contact from the conversation, from the visitor's details, anonymous named; AI prefill masked, update-not-duplicate and close; one request per chat; thread lookup; AI failure; cross-org 404). UI vitest 144 (+wrapUp 5, srFilters, incidentSettings), tsc clean, `next build` passes.
  - **Open:** manual run: agent "Create ticket" from a chat with known details → card shows the visitor's name and links to the contact; "talk to an agent" → incident number at once, then the problem question; close and release → dialog prefilled, confirm required, one card per chat.
- 2026-10-12 (owner feedback): live chats back in the Live Chat tab, Web Chat release without a ticket, widget status cards and typing dots.
  - **Regression found:** the incident-first change routed every "talk to an agent" through the incident path, which only raised an alert and never handed the chat to an agent, so agent chats showed only in the Web Chat (bot) tab. Now `handoverWithIncident` creates the incident and ticket first, sends the ticket card, then `connectLiveAgent` gives the chat to an online agent of the bot (conversation REALTIME + agent → their Live Chat tab, `new-visitor` to the agent, "<name> has joined" to the visitor, incident agent_active so the request is assigned and In Progress, alert cleared, Web Chat thread marked owned via `inbox.live.connected` so nobody else can take it over). Nobody online: a "specialists are busy, stay here" notice and the problem question; opening the alert calls `POST /incidents/by-conversation/:id/accept-live` (connected / 409 taken / offline) and opens the chat in Live Chat, falling back to Web Chat when the visitor has left. **Decision change:** the D2 rule "never mention availability" is replaced by the owner's request for a waiting notice; the old dead end ("No agent is available… enter Start") still never appears.
  - **Bug fixed:** Web Chat "Release to bot" opened the wrap-up dialog (and saved a ticket). Take over / Release are plain again; a separate "Create ticket" button next to them opens the request dialog (create or update, never a second card). The confirm-before-close dialog stays mandatory in the Live Chat tab. The AI now also replaces the "Customer request from <bot>" placeholder subject.
  - Widget: `info` messages render as `StatusNotice` cards (green for ticket created / agent joined, blue with a pulsing dot for waiting); a ticket reference is shown as a copyable "Ticket number" pill. Typing dots in a bubble while the bot prepares a reply (cleared on the reply, 20 s cap, not while a person handles the chat) and while the agent types (existing signal).
  - Tests: handover-replay +2 (agent online → Live Chat connect with ticket card first and no question; nobody online → waiting notice, first accept wins, second refused, offline visitor), wrap-up subject +2 assertions, journey/replay availability assertions narrowed to the old dead-end text. Backend jest 661 pass (only the 43 old scaffold suites fail), tsc + build clean; UI vitest 144, tsc, `next build` pass; widget `npm run build` passes.
  - Known limit: accepting from the alert works when the visitor's live state is on the same server instance as the request (socket state is per process); otherwise it reports "offline" and opens the Web Chat view.
  - **Open:** manual run in two browsers: talk to an agent with an agent online → Live Chat tab, green cards in the widget; with nobody online → waiting card, then accept from the alert; Web Chat take over / release creates nothing; Create ticket opens the dialog; Live Chat close requires the confirm.
