# Requirements — JarCube CRM

## Overview

JarCube is adding a full CRM to the dashboard, adapted from an open-source, single-tenant
"agentic-first" CRM but rebuilt to fit JarCube's stack: a **multi-tenant** module inside
the existing NestJS backend (`QuantumMind-backend`), backed by **PostgreSQL (AWS RDS)**
via **Prisma**, with the Next.js dashboard (`QuantumMind-ui`) as the front end and the
Python RAG service (`QuantumMind-ai`) as the model host for the later intelligence phases.

The CRM manages the three core sales records — **Contacts**, **Companies**, **Deals** —
plus their **Activities** (timeline), workspace-defined **custom fields**, **saved views**,
and — in later phases — an **evidence-scored research agent** that fills records in from
observed evidence rather than guesses.

**Key architectural facts (locked):**

- The CRM is a **module in the existing backend**, not a separate service. It can be
  extracted later; the design keeps that cheap but does not pay for it now.
- CRM data lives in **its own Postgres (RDS)**, separate from the platform's MongoDB.
  Both connections run in the same NestJS process. Mongo is untouched.
- **Identity stays in MongoDB.** CRM rows reference users/orgs by their Mongo `_id` stored
  as plain strings — never a cross-database foreign key.
- **Multi-tenant by `organizationId`.** Every CRM row carries it; every query is scoped by
  it. One shared RDS instance today; a client can later be moved to its own database
  purely by configuration (a per-org connection resolver), with no code change.
- ORM split: **Mongoose → Mongo** (all existing features), **Prisma → Postgres** (CRM
  only). Additive; no regression to existing modules.
- The background worker (intelligence phases) uses **Graphile Worker** (Postgres-backed,
  `FOR UPDATE SKIP LOCKED`), chosen for transactional enqueue with CRM writes and to match
  the reference design. Always-on worker process; the project does not use serverless.
- The agent's LLM tool-calling loop lives in **`QuantumMind-ai`** (a new stateless
  `/agent/step` endpoint); tool execution (DB reads/writes) stays in the NestJS backend.
  DB-only enrichment first; external web/LinkedIn providers are optional and added later.

---

## Terminology

| Term | Meaning |
|------|---------|
| Organization / tenant | A JarCube customer org. The CRM tenant key (`organizationId`), sourced from the JWT. Identity lives in Mongo. |
| Record | A Contact, Company, or Deal. |
| Activity | A timeline entry (note, call, email, meeting, task, stage change, enrichment) attached to one or more records. |
| Custom field | A workspace-defined extra attribute on a record type, with a typed value per record. |
| Saved view | A named, optionally shared set of list filters, per entity, per user. |
| Fact | A single evidence-scored claim about a contact (title, employer, a profile URL, …). |
| Evidence | Typed observations (`crm.signature-block`, `linkedin.employer-and-name`, …) that a ledger prices into a score and band. |
| Band | Confidence tier of a fact: `VERIFIED` / `PROBABLE` / `POSSIBLE`. |
| Agent task | A durable unit of background work (enrich this contact, recheck in 14 days) on a leased queue. |
| Owner | The Mongo user id responsible for a record (string reference, no FK). |

---

## Phase map

| Phase | Scope | Status |
|-------|-------|--------|
| 0 | Foundation: RDS Postgres, Prisma, tenancy model, per-org connection resolver, module wiring | **Done** |
| 1 | Core CRUD: Contacts, Companies, Deals, Activities, Stats — list/filter/facets/pagination, tenant-scoped | **Done** |
| 2 | Detail + flexibility: record detail pages, activity timeline, custom fields, saved views, create/edit UI | **Done** |
| 3 | Intelligence core (no LLM): evidence-scored facts + decide-fact, agent-task queue (Graphile Worker), suggestions UI | Planned (next) |
| 4 | The research agent: per-record chat, tool loop in `QuantumMind-ai`, DB-only enrichment tools | Planned |
| 5 | Communications sync: Gmail/Outlook email threads, Google Calendar, relationship signals on records | Planned |
| 6 | No-code agent builder: agent definitions/versions/triggers/runs with human-approval deploy | Planned |
| 7 | Growth: web visitor tracking + form intake → contacts | Planned |
| 8 | Hardening: per-tenant database rollout, currency/FX + reporting, custom-field columns/filters everywhere, tests | Planned |

---

## Requirements

### Requirement 0 — Data platform & tenancy foundation _(Phase 0 — done)_

**User story:** As the platform, I want CRM data in its own multi-tenant Postgres so that
records are isolated per organization and a client can later be moved to a dedicated
database without a rewrite.

#### Acceptance criteria

1. THE SYSTEM SHALL store CRM data in a PostgreSQL database (RDS) accessed via Prisma, separate from the platform MongoDB, within the same NestJS process.
2. THE SYSTEM SHALL place `organizationId` on every CRM row and SHALL scope every read and write by it.
3. THE SYSTEM SHALL reference users and organizations by their Mongo id as a plain string, and SHALL NOT create a foreign key across databases.
4. THE SYSTEM SHALL resolve the database connection for a request through a per-organization resolver that defaults to one shared instance and can return a dedicated connection for a specific organization without code change.
5. WHEN the CRM database is unreachable at startup THE SYSTEM SHALL log the error and continue serving the rest of the platform (CRM routes fail at call time only).
6. THE SYSTEM SHALL keep Mongoose/Mongo behaviour unchanged (the CRM is additive).

### Requirement 1 — Core records CRUD _(Phase 1 — done)_

**User story:** As a sales user, I want to manage contacts, companies, and deals so that I
can track my accounts and pipeline.

#### Acceptance criteria

1. THE SYSTEM SHALL provide Contact, Company, Deal, and Activity records, each carrying `organizationId`, `ownerId` (Mongo user id), timestamps, and a soft-archive (`archivedAt`).
2. THE SYSTEM SHALL expose list endpoints with free-text search, faceted filters, sort, and pagination, all scoped to the caller's organization.
3. THE SYSTEM SHALL expose create, read-by-id, update, archive, restore, purge, and bulk operations for contacts, companies, and deals.
4. WHEN a user creates a contact with an email that already exists (active) in the same organization THE SYSTEM SHALL reject it as a conflict; the same email SHALL be allowed in a different organization.
5. WHEN a user creates a company with a domain that already exists (active) in the same organization THE SYSTEM SHALL reject it as a conflict; the same domain SHALL be allowed in a different organization.
6. THE SYSTEM SHALL model deals with a stage (7-stage pipeline), amount + currency, expected/actual close, and a many-to-many link to contacts with a role.
7. WHEN a deal reaches a closed stage (won/lost) THE SYSTEM SHALL stamp the close timestamp and reason.
8. THE SYSTEM SHALL expose a pipeline view grouping deals by stage with per-stage count and total amount.
9. IF a request references a record belonging to another organization THEN THE SYSTEM SHALL return not-found and SHALL NOT reveal the record's existence.
10. WHEN a token has no organization THE SYSTEM SHALL reject CRM requests with 403.
11. THE SYSTEM SHALL expose an overview stats endpoint (contacts, companies, deals, open deals, won deals, pipeline value) scoped to the organization.

### Requirement 2 — Activities timeline _(Phase 1/2 — done)_

**User story:** As a sales user, I want a timeline on each record so that I can log and see
what happened.

#### Acceptance criteria

1. THE SYSTEM SHALL support activity types: NOTE, CALL, EMAIL, MEETING, TASK, STAGE_CHANGE, ENRICHMENT.
2. THE SYSTEM SHALL allow creating an activity linked to at least one of a contact, company, or deal, scoped to the organization.
3. WHEN an activity is created THE SYSTEM SHALL update the linked records' `lastActivityAt`.
4. THE SYSTEM SHALL list activities for a record ordered most-recent-first, and SHALL allow editing (including marking a task complete) and deleting an activity.
5. IF a create references a record in another organization THEN THE SYSTEM SHALL reject it.

### Requirement 3 — Custom fields _(Phase 2 — done; management UI + table columns in progress)_

**User story:** As a workspace admin, I want to define extra fields per record type so that
the CRM captures data specific to my business.

#### Acceptance criteria

1. THE SYSTEM SHALL let a workspace define custom fields per entity (CONTACT/COMPANY/DEAL) with a typed value: TEXT, LONG_TEXT, NUMBER, DATE, CHECKBOX, SELECT, URL, EMAIL, PHONE, USER.
2. THE SYSTEM SHALL enforce a field key unique per organization + entity; the same key SHALL be allowed in a different organization.
3. THE SYSTEM SHALL store at most one value per (field, record) and SHALL upsert in place when a value changes.
4. WHEN a SELECT value is set THE SYSTEM SHALL validate the option belongs to that field.
5. THE SYSTEM SHALL expose the definitions with each record's current value for the record sheet, and SHALL apply/clear values per record.
6. THE SYSTEM SHALL provide UI to create, edit, and archive field definitions (including SELECT options). _(in progress)_
7. WHEN a field is marked `showOnTable` THE SYSTEM SHALL surface its value as a column in that entity's list grid. _(in progress)_
8. WHEN a field definition is archived or a record is deleted THE SYSTEM SHALL not orphan values (cascade/soft handling).

### Requirement 4 — Saved views _(Phase 2 — done; all-lists coverage in progress)_

**User story:** As a sales user, I want to save and reuse list filters so that I can return
to a view quickly.

#### Acceptance criteria

1. THE SYSTEM SHALL let a user save a named set of list filters per entity, scoped to the organization and owned by the user.
2. THE SYSTEM SHALL show a user their own views plus any shared views in the organization.
3. THE SYSTEM SHALL enforce a view name unique per organization + entity + owner.
4. WHEN a non-owner attempts to modify or delete a view THE SYSTEM SHALL reject with 403.
5. THE UI SHALL provide save/apply/delete controls on the contacts, companies, and deals lists. _(contacts done; companies/deals in progress)_

### Requirement 5 — Evidence-scored facts _(Phase 3 — planned)_

**User story:** As a sales user, I want facts about a contact to carry the evidence behind
them so that the CRM never fills a field with a confident guess.

#### Acceptance criteria

1. THE SYSTEM SHALL record a fact as a field + value + a list of typed evidence observations, and SHALL derive the score and band from the evidence, never from a caller-supplied confidence.
2. THE SYSTEM SHALL price evidence with a fixed weighted ledger and combine independent observations with a noisy-OR, capped below certainty; a contradiction SHALL cap the score.
3. THE SYSTEM SHALL assign band VERIFIED only when the score clears the high threshold AND at least one primary (identity-bearing) source is present; otherwise PROBABLE, POSSIBLE, or not stored.
4. WHEN evidence reaches VERIFIED THE SYSTEM SHALL write the value to the record; otherwise it SHALL store the fact as a PROPOSED suggestion under an empty field.
5. THE SYSTEM SHALL never overwrite a human-entered value, never re-offer a dismissed value, and never write a fact without a primary source.
6. WHEN a rep accepts or dismisses a suggestion THE SYSTEM SHALL apply or discard it and settle the field's other pending suggestions.
7. THE SYSTEM SHALL surface a record's applied facts and pending suggestions with their evidence for display.

### Requirement 6 — Agent task queue _(Phase 3 — planned)_

**User story:** As the platform, I want a durable background work queue so that enrichment
and rechecks run reliably and can resume after a crash.

#### Acceptance criteria

1. THE SYSTEM SHALL persist background work as durable task rows in Postgres, scoped by organization, with a due time, priority, attempt count, and lease.
2. THE SYSTEM SHALL lease work with `FOR UPDATE SKIP LOCKED` so multiple workers take disjoint work and a dead worker's lease expires and frees its row.
3. THE SYSTEM SHALL enqueue a task in the same transaction as the CRM write that triggers it (transactional enqueue).
4. THE SYSTEM SHALL dedupe an open task per (kind, record) and SHALL retire a task after a maximum attempt count.
5. WHEN a task is due THE SYSTEM SHALL run it on an always-on worker; the system SHALL NOT depend on serverless cron.
6. THE SYSTEM SHALL scope every task and its effects to the task's organization.

### Requirement 7 — Research agent & per-record chat _(Phase 4 — planned)_

**User story:** As a sales user, I want to ask an agent about a record and have it research
and update the record so that the CRM stays current without manual data entry.

#### Acceptance criteria

1. THE SYSTEM SHALL provide a per-record conversation: a durable handle (session id + cursor) plus a separate transcript of events, scoped to the user and one record.
2. THE SYSTEM SHALL run the model tool-calling loop in `QuantumMind-ai` via a stateless step endpoint; tool execution (DB reads/writes) SHALL run in the NestJS backend.
3. THE SYSTEM SHALL provide read tools (record history, cross-entity search) that return neighbouring record ids so the agent never asks a user for an id.
4. THE SYSTEM SHALL write facts only through the evidence write-path of Requirement 5.
5. THE SYSTEM SHALL treat every external data source (web/LinkedIn) as optional; a missing provider key SHALL remove a capability and SHALL NOT throw. DB-only operation SHALL be fully functional.
6. THE SYSTEM SHALL let the model be swapped by configuration (provider-agnostic: OpenAI / Anthropic / Kimi K2), defaulting to the configured model.
7. THE SYSTEM SHALL scope a conversation to its record's organization and to the requesting user.

### Requirement 8 — Communications sync _(Phase 5 — planned)_

**User story:** As a sales user, I want email and calendar activity to appear on records so
that I see the full relationship.

#### Acceptance criteria

1. THE SYSTEM SHALL sync email threads/messages (Gmail/Outlook, read-only, forward-only) and calendar events/attendees, linked to contacts/companies and scoped by organization.
2. THE SYSTEM SHALL derive relationship signals (email count, last reply, next meeting) on a record.
3. THE SYSTEM SHALL never send, modify, or delete mail, and SHALL not import history prior to first connection.

### Requirement 9 — No-code agent builder _(Phase 6 — planned)_

**User story:** As a workspace admin, I want to build and deploy custom agents so that I can
automate CRM workflows without code.

#### Acceptance criteria

1. THE SYSTEM SHALL model agent definitions with immutable versions, triggers (manual/schedule/event/webhook), runs, run events, actions, and audit events, all scoped by organization.
2. THE SYSTEM SHALL require an explicit human deploy step to make a validated version live.
3. THE SYSTEM SHALL ledger every agent action before execution and SHALL enforce data-scope and action permissions at run time.
4. WHEN a run is cancelled THE SYSTEM SHALL settle the run row as the source of truth for stopping work.

### Requirement 10 — Web tracking & forms _(Phase 7 — planned)_

**User story:** As a marketer, I want website visitors and form submissions to flow into the
CRM so that inbound leads become contacts.

#### Acceptance criteria

1. THE SYSTEM SHALL record tracked visitors, events, and daily page rollups with UTM attribution, scoped by organization.
2. THE SYSTEM SHALL accept form submissions at an intake endpoint and link/create a contact, deduped, scoped by organization.
3. THE SYSTEM SHALL honour Do-Not-Track and the tenant's tracking configuration.

### Requirement 11 — Per-tenant database, currency, reporting, hardening _(Phase 8 — planned)_

**User story:** As the platform owner, I want to offer a dedicated database to a client and
report on pipeline in a chosen currency so that larger customers and finance needs are met.

#### Acceptance criteria

1. WHEN a client is assigned a dedicated database THE SYSTEM SHALL route that organization's connection to it via the resolver, and its data SHALL be exportable/importable as a single `WHERE organizationId =` cut, with no application code change.
2. THE SYSTEM SHALL support a shared exchange-rate table and a per-organization reporting currency for deal totals and pipeline value.
3. THE SYSTEM SHALL surface custom-field columns and custom-field filters across the list grids for fields marked to show.
4. THE SYSTEM SHALL carry automated tests for tenant isolation, quota/uniqueness, evidence scoring, and the queue.

---

## Open items for review

1. **Deployment**: `CRM_DATABASE_URL` (RDS) must be set and `npm run prisma:deploy` run before CRM routes work. _(Issue 4 — deployment step.)_
2. **Runtime E2E**: full Next.js UI flows have not been executed against a live DB; verification so far is build + DB-level smoke tests. _(Issue 5.)_
3. **Agent model & keys** (Phase 4): confirm default model and where the LLM key lives (reuse `QuantumMind-ai` provider config vs a CRM-specific key).
4. **External enrichment providers** (Phase 4): which web/LinkedIn provider(s), if any, beyond DB-only.
