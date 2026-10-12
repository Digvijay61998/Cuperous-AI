# CRM plugins, service desk and contact capture — operations

Spec: `.kiro/specs/crm-plugins-service-desk/` (requirements R1–R23, decisions D1–D11, design, tasks).
Builds on [`CRM-INCIDENT-HANDOVER.md`](./CRM-INCIDENT-HANDOVER.md). This page covers running it: what changed, migration, release, and what to check when something looks wrong.

## What it does

- **Contact capture everywhere.** Details from the pre-chat form, chat answers, templates, WhatsApp, WhatsApp-web, Telegram, Messenger and the agent's "Add details" all go through one path (`ContactCaptureService`). It is on for every organization and bot; there is no flag.
- **One contact per person, every identifier kept.** A match on any email, phone or platform id is the same person. A new email or phone becomes Current and the old one is kept and still matches. Telegram, Messenger and WhatsApp `@lid` leads are created by their platform id and merged into the real contact once identified.
- **CRM plugins.** Contacts and Service Requests are core. Companies and Deals can be turned off per organization (Deals needs Companies). Admins and managers change them under CRM → Plugins; the menu and the APIs follow.
- **Service desk in the CRM.** Service Requests live in the CRM Postgres database and are worked on a board under CRM → Service Requests: configurable stages, assignment, filters and saved views, a detail drawer with the AI summary, the conversation, notes and history, and live updates.

## Behaviour changes to tell users about

| Before | Now |
|---|---|
| `incidentHandover` flag per bot; the incident opened after the problem question | Retired, always on. Asking for a person opens the incident ticket at once (green ticket card with the number). An online agent then gets the chat in their **Live Chat** tab; with nobody online the visitor sees a "please wait" card, is asked the problem, and the first agent to open the alert takes the chat. |
| Agents closed a chat with a plain confirm; "Create Ticket" made a new ticket each time | Closing a Live Chat opens the request dialog: the chat's request (created only if it has none), AI-prefilled, status Resolved or Still open, required "I checked the details" tick. In Web Chat, Take over / Release to bot need no ticket; "Create ticket" next to them opens the same dialog when the agent wants one. |
| `crmCapture` flag per bot | Retired. Capture is always on. The old setting is ignored. |
| "Ask once" was a bot setting | Always on (R23): a known contact gets one "We'll follow up with you at …" confirmation instead of the questions. |
| A conflicting email/phone was asked about | Never asked. The newest becomes Current, the old one is kept. |
| Service Requests menu item, `/service-request/*` pages | CRM → Service Requests. Old addresses redirect. |
| Ticket status OPEN / PENDING / DEFERRED / CLOSED | Stages. The `/tickets` API maps stage categories back to the old statuses. "Open" counts on the home cards now mean "not in a Done stage". |
| Existing Mongo tickets | Not migrated (D1). They are test data and are deleted by hand after release. |

## Roles

| Who | Sees |
|---|---|
| Agent | CRM → Service Requests only (board, list, drawer). Can create, move, assign (incl. "Assign to me"), edit, comment. |
| Org admin, org manager | Every enabled CRM page, Plugins, and the Stages dialog on the board. Can delete anyone's note. |

The backend enforces this: `crm/service-requests` accepts every org role; plugin and stage writes accept only admins and managers. Cross-organization ids return 404.

## Stages

New organizations get Open (default), In Progress, Waiting on Customer, Deferred, Resolved, Closed on first use. The category decides what a stage means:

| Category | Meaning |
|---|---|
| Open | New requests land in the default stage, which must be Open. |
| In Progress | An agent accepting the chat handover moves an Open request to the first In Progress stage and becomes its assignee. |
| On Hold | `GET /tickets/mark-as-deferred` moves here. |
| Done | Moving in sets `closedAt`, resolves the linked incident and refreshes the AI summary. Moving out reopens (the incident stays as it is). |

Rules: names 1–40 characters, unique ignoring case; at least one Open and one Done stage; exactly one default. Deleting a stage that holds requests needs a target stage; each moved request gets a history entry.

## Migration

All migrations are additive. Apply them in order:

| Migration | Adds |
|---|---|
| `20261011064538_contact_capture_identifiers` | `contact.sourceChannel`, `contactIdentifier` (unique per org + kind + value), backfill of current emails and phones |
| `20261011084244_crm_plugins` | `crmPluginSetting` |
| `20261011093753_service_requests` | stages, requests, events, comments, `FieldEntity.SERVICE_REQUEST` |
| `20261011094118_service_request_bot_optional` | `serviceRequest.botId` nullable (requests logged by hand) |

```bash
cd QuantumMind-backend
npx prisma migrate deploy
npx prisma migrate status    # "Database schema is up to date!"
```

No new environment variables. `CRM_DATABASE_URL` and `PROFILE_PURGE_MODE` work as before.

## Release

1. Apply the migrations (above).
2. Deploy **backend, AI and dashboard together**. The dashboard board needs the new `crm/service-requests` API; the backend calls the AI `POST /generate/service-request-summary` (without it, requests show "Summary not available" and everything else works).
3. Check:
   - A widget chat that gives an email creates or links a contact; the inbox name changes without a reload.
   - A WhatsApp first message creates a contact with the phone.
   - "Talk to an agent" gives the `SR_…` message, and the request appears on the board in the default stage.
   - As an agent: the menu shows only CRM → Service Requests with "Assigned to me" on.
   - Two browsers: a card dragged in one moves in the other.
   - The dashboard home cards, Service Request reports, agent page and visitor page show numbers.
4. After the release is accepted, the product owner drops the old Mongo collections **by hand** (cannot be undone; nothing reads them any more):

   ```js
   // mongosh, against the production database, after a backup
   db.tickets.drop()
   db.ticketactivities.drop()
   ```

Rollback: redeploy the previous backend and dashboard. The new tables are left in place and unused; requests created meanwhile are only in Postgres.

## Live board

Every create, move, assignment, edit and note pushes `crm:service-request` (`{kind, id, stageId, data}`) to every active user of the organization through the Redis propagator, at most once per request every 300 ms. The board patches itself; the card being dragged is left alone; with search, date or age filters on, new requests are not added until the next load. A socket reconnect refetches the open board or drawer.

Stage edits are not pushed: other users see them on their next load.

## Conversation kept with the request

A copy of the chat (last 500 messages, secured answers kept as `[secure]`) is stored on the request when it is created, when it moves into Done, and before the session lifecycle deletes the chats (`PROFILE_PURGE_MODE=live`). If the copy fails, the chats are kept and the daily run (03:30) retries. The drawer shows the live chat while it exists, then the saved copy.

## Endpoints added

| Endpoint | Who |
|---|---|
| `GET /crm/plugins` | org users |
| `PATCH /crm/plugins/:key` (`?dryRun=true`), `PUT /crm/plugins/order` | admins, managers |
| `GET /crm/service-requests` (`view=board\|list`, filters, `column`, `skip`, `take`, `sort`, `dir`), `POST` | org users |
| `GET /crm/service-requests/assignees` | org users |
| `GET\|PATCH /crm/service-requests/:id`, `POST …/move`, `…/assign`, `…/assign-to-me` | org users |
| `GET\|POST …/comments`, `PATCH\|DELETE …/comments/:commentId` | org users (edit: author; delete: author or admin/manager) |
| `GET …/events`, `GET …/transcript`, `POST …/summary` | org users |
| `GET /crm/service-request-stages` | org users |
| `POST /crm/service-request-stages`, `PATCH /:id`, `PUT /order`, `DELETE /:id?moveTo=` | admins, managers |
| `GET /crm/service-requests/wrap-up?conversationId\|threadId` (request + AI draft), `POST …/wrap-up` (confirmed card, `outcome: resolved\|open`) | org users |
| `GET /tickets/mark-as-deferred` | as the other `/tickets` routes |
| AI `POST /generate/service-request-summary` | backend only |

The existing `/tickets` routes keep their paths and response shapes; `_id` is now the request's CRM id (a cuid), not a Mongo id.

## When something looks wrong

| Symptom | Look at |
|---|---|
| Contact not created | Preview mode creates nothing. Did the visitor give an email, phone or platform id? A name alone only names an already linked contact. `crm_outbox` items with `status: failed` and `lastError`. |
| Two contacts for one person | Only when an email matches one contact and a phone another: both get a "Possible duplicate contact" note; merge by hand. |
| Name not updated | Names guessed from free text or platform display names only replace blanks, "Anonymous" or platform names. A stated name always wins. |
| Agent sees no CRM menu | The dashboard caches plugins in the browser; reload. The agent's role must be `agent` (sees only Service Requests). |
| "This module is turned off" | The plugin is off for the organization (CRM → Plugins). |
| Board empty for an agent | "Assigned to me" is the default; switch the Assignee filter to "Any". |
| Card jumps back after a drop | The save failed (toast shows why). The card returns to where it was. |
| "Summary not available" | AI call failed twice; `summaryError` on the request. Regenerate from the drawer. The old summary is kept. |
| Conversation missing in the drawer | No conversation linked (manual request), or the chats were deleted before a copy was taken; check the daily lifecycle log. |
| Stage cannot be deleted | It is the default, the last Open or the last Done stage, or it holds requests and no target was chosen. |

## Tests

```bash
cd QuantumMind-backend
npx jest                      # unit and property tests (Node 18 or 20)
npm run test:crm-int          # against the real CRM Postgres (CRM_DATABASE_URL), 27 tests
cd ../QuantumMind-ai
docker run --rm -v "$PWD":/app -w /app quantummind-ai-ai-service:latest \
  sh -c "pip install -q -r requirements-dev.txt >/dev/null 2>&1; python -m pytest -q"
cd ../QuantumMind-ui && npx vitest run && npx tsc --noEmit -p tsconfig.json
```

Property tests (design §Correctness Properties) and where they run:

| Property | Unit | Real Postgres (`src/e2e/`) |
|---|---|---|
| 1 One contact per person | `contact-resolver.service.spec.ts` | `kone-crm-identifiers`, `kone-crm-hardening` (three sources, in sequence and at once) |
| 2 Visitor follows latest, CRM safe | `identity.spec.ts` (`planFill`), `contact-capture.service.spec.ts` | `kone-crm-hardening` |
| 3 Plugin dependency closure | `plugin-registry.spec.ts` | `kone-crm-plugins`, `kone-crm-hardening` (random toggles, two instances) |
| 4 Stage invariants | `rules.spec.ts` | `kone-crm-service-desk`, `kone-crm-hardening` (random edits incl. delete-with-move) |
| 5 Board order | `rules.spec.ts` | `kone-crm-service-desk`, `kone-crm-hardening` (two people, stale neighbours) |
| 6 One request per incident | — | `kone-crm-service-desk` (5 concurrent creates) |
| 7 Tenant isolation | `summary-events.spec.ts` (realtime fan-out) | `kone-crm-service-desk`, `kone-crm-hardening` (detail, notes, history, transcript, stages, search, stats, plugins) |
| 8 History completeness | — | `kone-crm-service-desk`, `kone-crm-hardening` (unbroken from/to chains under concurrency) |
| 9 No transcript loss | `session-lifecycle.spec.ts` | `kone-crm-hardening` (`live` mode, failure then daily repair) |
