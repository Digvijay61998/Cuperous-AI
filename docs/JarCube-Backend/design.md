# Design — JarCube CRM

## 1. Architecture overview

The CRM is a set of feature modules inside the existing NestJS backend
(`QuantumMind-backend`), backed by its own Postgres (RDS) via Prisma. It sits alongside
the platform's MongoDB (Mongoose), untouched. The Next.js dashboard (`QuantumMind-ui`)
renders it; the Python RAG service (`QuantumMind-ai`) hosts the model for the agent phases.

```
QuantumMind-backend/
  prisma/schema.prisma            CRM Postgres schema + migrations
  src/crm/
    database/                     CrmPrismaService (per-org connection resolver) + module
    common/                       list.util (paginate/facets/sentinels), @OrgId decorator
    contacts/  companies/  deals/ activities/  stats/   (Phase 1)
    fields/    saved-views/                              (Phase 2)
    intelligence/   (facts, evidence, tasks, conversations, tools)   (Phase 3-4, planned)
    crm.module.ts                 aggregates the feature modules

QuantumMind-ui/
  src/store/apps/crm/             redux slice (thunks per resource)
  src/pages/crm/                  overview + contacts/companies/deals (list + [id] detail)
  src/views/crm/                  drawers, timeline, custom-fields, saved-views, utils

QuantumMind-ai/
  app/agent/step (planned)        stateless tool-calling step for the CRM agent loop
```

Three concerns kept separate, mirroring the RBAC design:

- **Tenancy** → which org's data a request may touch (`organizationId` on every row + a
  per-org connection resolver). Security boundary.
- **Records/flexibility** → the CRUD, custom fields, saved views.
- **Intelligence** → evidence-scored facts, the durable task queue, and the agent — added
  in later phases without disturbing the record layer.

**Rationale for one backend / one process:** the CRM is read on the same authenticated
requests as the rest of the app; co-locating avoids a network hop and a second auth
surface. Clean module boundaries (nothing outside `crm/` imports it; it imports nothing
from the Mongo modules except shared auth primitives) keep a future extraction cheap.

## 2. Tenancy & database access

### 2.1 The rule

`organizationId` (the Mongo org id, as a string) is on every CRM row. Every query filters
by it. There are **no cross-database foreign keys** — `ownerId`, `createdById`,
`primaryContactId`-of-a-user, etc. are Mongo ids stored as plain strings and resolved in
application code.

### 2.2 `CrmPrismaService.forOrg(orgId)` — the connection resolver

```
request.user.organizationId  (JWT, via @OrgId())
        │
        ▼
CrmPrismaService.forOrg(orgId)
        ├─ no override  → shared RDS PrismaClient      (default: everyone today)
        └─ has override → that org's dedicated client  (future, per client)
```

- Today `urlForOrg(orgId)` returns the single `CRM_DATABASE_URL` for everyone; the service
  caches one `PrismaClient` per connection string.
- To give a client its own database later, `urlForOrg` returns that client's connection
  string (from an env map / small config table). No service or controller changes.
- `$connect` is non-fatal on boot: a CRM DB outage does not crash the platform.

### 2.3 Uniqueness

Enforced **in the service layer** (a scoped `findFirst` before create), not via partial
unique indexes, to avoid a preview-feature dependency and to keep messages friendly:
one active email per org, one active domain per org. `FieldDefinition`, `FieldValue`, and
`SavedView` use real composite unique constraints (see §3). A hard DB partial-unique on
email/domain can be added by raw SQL migration later.

### 2.4 Auth accessor

Every CRM route is JWT-guarded (the platform's global `JwtAuthGuard`). `@OrgId()` reads
`request.user.organizationId` and fails closed with 403 when absent (e.g. a SUPER_ADMIN
with no org). `@CurrentUser()` supplies the acting user id for `ownerId`/`createdById`.

## 3. Data model (Prisma, Postgres)

All models carry `organizationId`; indexes lead with it. `@@map` gives snake/camel table
names. Enums: `DealStage`, `ActivityType`, `RecordSource`, `FieldEntity`, `FieldType`
(done); `FactBand`, `FactStatus`, agent/task enums (planned).

### 3.1 Core records (Phase 1 — implemented)

```
Company(id, organizationId, name, domain?, website?, description?, logoUrl?, brandColor?,
        industry?, city?, country?, phone?, email?, linkedinUrl?, ownerId?,
        primaryContactId? unique, source, lastActivityAt?, archivedAt?, timestamps)
  → contacts[], deals[], activities[], fieldValues[], primaryContact?

Contact(id, organizationId, firstName, lastName?, email?, phone?, title?, seniority?,
        function?, linkedinUrl?, twitterUrl?, githubUrl?, imageUrl?, companyId?, ownerId?,
        source, lastActivityAt?, archivedAt?, timestamps)
  → company?, deals(DealContact[]), activities[], fieldValues[]

Deal(id, organizationId, name, description?, companyId, ownerId?, stage, stageChangedAt,
     amount? Decimal(14,2), currency, expectedCloseDate?, closedAt?, closedReason?,
     lastActivityAt?, archivedAt?, timestamps)
  → company, contacts(DealContact[]), activities[], fieldValues[]

DealContact(organizationId, dealId, contactId, role?)   @@id([dealId, contactId])

Activity(id, organizationId, type, subject?, body?, occurredAt?, dueAt?, completedAt?,
         companyId?, contactId?, dealId?, createdById, meta? Json, timestamps)
```

Indexes: `[organizationId, name|domain|email|stage|ownerId|companyId|lastActivityAt|archivedAt]`
as appropriate per model. Deal amount is `Decimal`; the API maps it to a number on read.

### 3.2 Custom fields & saved views (Phase 2 — implemented)

```
FieldDefinition(id, organizationId, entity, key, label, type, required, showOnSheet,
                showOnTable, showOnFilter, position, archivedAt?, timestamps)
  @@unique([organizationId, entity, key])   → options[], values[]

FieldOption(id, organizationId, fieldId, label, position, archivedAt?)

FieldValue(id, organizationId, fieldId, companyId?, contactId?, dealId?,
           text?, number? Decimal, date?, bool?, optionId?, userId?, updatedAt)
  @@unique([fieldId, companyId]) @@unique([fieldId, contactId]) @@unique([fieldId, dealId])

SavedView(id, organizationId, entity, name, shared, filters Json, ownerId, timestamps)
  @@unique([organizationId, entity, ownerId, name])
```

**Edge case handled:** three per-entity uniques (not one on all three link columns) so a
company value (contactId/dealId null) can't collide with another via SQL null-distinctness.
Deleting a record cascades its field values; archiving a SELECT option nulls dependent
values (`onDelete: SetNull`).

### 3.3 Intelligence (Phase 3-4 — planned)

```
ContactFact(id, organizationId, contactId, field, value, score, band FactBand,
            evidence Json, method, sourceUrl?, sessionId?, status FactStatus,
            decidedById?, decidedAt?, observedAt, supersededAt?)
ContactBrief(contactId, organizationId, narrative, sections Json, score, sourceUrl?, refreshedAt)

AgentTask(id, organizationId, contactId?/companyId?/dealId?, kind, reason, payload? Json,
          priority, budget, attempts, dueAt, leasedUntil?, sessionId?, startedAt?,
          finishedAt?, outcome?, createdAt)
AgentConversation(id, organizationId, userId, contactId?/companyId?/dealId?, sessionId? unique,
                  continuationToken?, streamIndex, title?, messageCount, timestamps)
AgentEvent(id, organizationId, sessionId, conversationId?, type, data Json, emittedAt)
```

`FactBand = VERIFIED|PROBABLE|POSSIBLE`; `FactStatus = APPLIED|PROPOSED|DISMISSED|SUPERSEDED`.
`AgentTask` is the Graphile-adjacent work row (leased with `FOR UPDATE SKIP LOCKED`).

### 3.4 Later (Phases 5-8 — planned)

Email/calendar (`MailboxSync`, `EmailThread`, `EmailMessage`, `CalendarEvent`,
`CalendarAttendee`), agent builder (`AgentDefinition`, `AgentVersion`, `AgentTrigger`,
`AgentRun`, `AgentRunEvent`, `AgentAction`, `AgentAuditEvent`), tracking (`TrackedVisitor`,
`TrackedEvent`, `TrackedPageDaily`, `FormSubmission`), currency (`ExchangeRate` — shared,
not tenant-scoped), and per-org `AppSetting`/`WorkspaceProfile`. The platform's Slack and
telemetry are **not** ported (JarCube has its own).

## 4. API surface

All under `crm/*`, JWT-guarded, org-scoped via `@OrgId()`. List endpoints take
`page`/`pageSize`/`q`/`sort`/`dir` + faceted arrays and return `{ rows, total, facetCounts }`.

```
# Phase 1 (done)
crm/stats                                   GET
crm/contacts   GET(list) POST GET/:id PATCH/:id
               POST/:id/archive|restore  DELETE/:id
               POST/bulk-assign-owner|bulk-set-company|bulk-archive|bulk-restore|bulk-purge
crm/companies  (same shape; bulk-assign-owner|archive|restore|purge)
crm/deals      GET(list) GET/pipeline GET/:id POST PATCH/:id
               POST/:id/stage  POST/:id/contacts  DELETE/:id/contacts/:contactId
               POST/:id/archive|restore  DELETE/:id  bulk-*
crm/activities GET(list ?contactId=/companyId=/dealId=) POST PATCH/:id DELETE/:id

# Phase 2 (done)
crm/fields         GET(?entity=) POST PATCH/:id DELETE/:id
                   GET/values(?entity=&recordId=)  PUT/values
crm/saved-views    GET(?entity=) POST PATCH/:id DELETE/:id

# Phase 3-4 (planned)
crm/contacts/:id/facts        GET
crm/facts/:id/decide          POST {accept|dismiss}
crm/contacts/:id/enrich       POST   (enqueues an AgentTask)
crm/conversations             list/save/events   + /eve-style stream bridge to QuantumMind-ai
```

Route ordering note: literal segments (`/pipeline`, `/values`) are declared before `/:id`.

## 5. Evidence engine (Phase 3 — planned)

Ported near-verbatim from the reference (framework-agnostic TypeScript + Prisma):

- **`evidence.ts`** — a `WEIGHTS` table prices each `EvidenceKind` (0.2–0.95, each flagged
  `primary`). `scoreEvidence` combines independent sources with noisy-OR
  `score = 1 − Π(1 − weight)`, capped at 0.99; a `contradiction` clamps to ~0.45.
  `bandFor(score, hasPrimary)`: VERIFIED ≥ 0.85 **and** a primary source; PROBABLE ≥ 0.55;
  POSSIBLE ≥ 0.3; else not stored.
- **`facts.service.ts`** — the only write path to a contact's fields. Applies at VERIFIED,
  proposes below it (into an empty field), and enforces three invariants a prompt cannot:
  never overwrite a human value, never re-offer a dismissed value, never write without a
  primary source. Accepting/dismissing a suggestion (`decideFact`) supersedes the field's
  other pending suggestions.

The model (later) never supplies a confidence — it reports observations; the ledger prices
them. This is what keeps a confident wrong fact off a customer record.

## 6. Background queue (Phase 3 — planned)

**Graphile Worker** on the CRM Postgres. Chosen over BullMQ because:

- Transactional enqueue: "save contact + queue enrich" commit atomically (no lost/dup jobs).
- `FOR UPDATE SKIP LOCKED` matches the reference's `AgentTask` lease model exactly.
- No new infra (uses the RDS we already add); aligns with per-tenant DB isolation.

An always-on worker process drains due tasks; dispatch is also poked on demand after a
write. Tasks dedupe per (kind, record) and retire after a max attempt count. Redis stays
for what it already does (sessions, cache, socket fan-out).

## 7. Agent integration (Phase 4 — planned)

- **Loop in `QuantumMind-ai`**: a new stateless `POST /agent/step` takes messages + tool
  schemas and returns the assistant turn (final text or tool calls) using the existing
  provider abstraction (OpenAI / Moonshot-Kimi / Anthropic). NestJS orchestrates the loop
  and **executes tools** (Prisma reads + the evidence write-path).
- **Tools** are plain service methods: `read_crm_history`, `search_crm`, `record_fact`,
  `enrich_*`. Reads return neighbouring record ids so the agent never asks for one.
- **Per-record chat**: `AgentConversation` holds only the handle; `AgentEvent` holds the
  transcript. Streaming reuses the platform's socket.io. Scoped to user + record + org.
- **Optional sources**: web/LinkedIn providers are capability-gated; a missing key removes
  a capability and never throws. DB-only is fully functional.

## 8. Front end

- **Slice** `src/store/apps/crm` — thunks per resource (list uses `page/pageSize/q` →
  `{rows,total}`), byId (`selectedRecord`), activities, field values, saved views; write
  thunks toast, read thunks fail quietly to empty state.
- **Lists** — MUI DataGrid (contacts/companies) and a pipeline board (deals), with search,
  create/edit drawers, row edit/delete, saved-views bar, and (in progress) dynamic
  custom-field columns for `showOnTable` fields.
- **Detail pages** — `/crm/{contacts|companies|deals}/[id]` with tabs Overview / Activity /
  Custom Fields; inline stage change on a deal.
- **Shared views** — `ContactDrawer`/`CompanyDrawer`/`DealDrawer`, `ActivityTimeline`,
  `CustomFieldsPanel`, `SavedViewsBar`, and (in progress) a `FieldManager` for defining
  fields. Uses the dashboard's existing MUI component set — none of the reference CRM's UI.

## 9. Security notes

- Every CRM query is org-scoped; fetch-by-id across tenants returns not-found (no leak).
- Client-supplied `organizationId` is never trusted — it comes from the JWT via `@OrgId()`.
- No cross-database FK; Mongo ids are opaque strings in Postgres.
- The agent (Phase 4) writes only through the evidence path; the sandbox/tool boundary
  keeps customer text off third-party queries; a missing provider key degrades, never fails.

## 10. Verification approach

Per phase: `nest build` (backend compiles), Prisma migrate against a throwaway Postgres,
and a DB-level smoke test asserting tenant isolation, uniqueness, and (Phase 3+) evidence
scoring and queue leasing. UI verified via LSP diagnostics. Full runtime E2E against a live
RDS + running UI is a remaining gap (see Open items).

## 11. Open items for review

1. **Deployment**: set `CRM_DATABASE_URL` (RDS), run `npm run prisma:deploy`.
2. **Runtime E2E** against live DB + UI not yet executed.
3. **Agent model/keys** (Phase 4) and **external enrichment providers** — to confirm.
4. **Per-plan CRM limits/features** — whether CRM usage counts toward the RBAC entitlement
   system (bots/agents/… ) or is ungated for now.
