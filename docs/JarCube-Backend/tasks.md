# Tasks — JarCube CRM

Phased so each phase is shippable and verifiable. Tenancy (the security boundary) and the
record layer land before intelligence. `[x]` = done, `[ ]` = planned. References point to
`requirements.md`.

---

## Phase 0 — Data platform & tenancy foundation ✅

- [x] 0.1 Add Prisma + `@prisma/client`; `prisma/schema.prisma` on Postgres; npm scripts (generate/migrate/deploy/studio). _(Req 0.1)_
- [x] 0.2 Core schema with `organizationId` on every model; tenant-leading indexes; Mongo ids as string refs (no FK). _(Req 0.2, 0.3)_
- [x] 0.3 `CrmPrismaService.forOrg(orgId)` per-org connection resolver (defaults to shared RDS, caches per connection string, non-fatal connect). _(Req 0.4, 0.5)_
- [x] 0.4 `CrmDatabaseModule` (global) + `CrmModule` aggregator wired into `AppModule`. _(Req 0.1)_
- [x] 0.5 `crm.databaseUrl` config (`CRM_DATABASE_URL`, localhost fallback); Mongoose untouched. _(Req 0.6)_
- [x] 0.6 Verify: client generates, backend builds. _(verification)_

## Phase 1 — Core CRUD ✅

- [x] 1.1 `@OrgId()` decorator (403 when no org) + shared `list.util` (paginate, resolveOrderBy, facets, sentinels, archivedFilter). _(Req 1.10)_
- [x] 1.2 Contacts: controller/service/DTOs — list+facets+pagination, byId, create (per-org email guard), update, archive/restore/purge, bulk (owner/company/archive/restore/purge). _(Req 1.1–1.4, 1.9)_
- [x] 1.3 Companies: same shape + per-org domain guard + `_count` contacts/deals + primary-contact validation. _(Req 1.1–1.3, 1.5)_
- [x] 1.4 Deals: list+facets, `/pipeline` (grouped by stage w/ totals), byId, create (company validated), update, `/:id/stage` (stamps closedAt/reason), add/remove contacts, bulk. _(Req 1.6–1.8)_
- [x] 1.5 Activities: list by record + type, create (validates ≥1 parent, bumps `lastActivityAt`), update (complete toggle), delete. _(Req 2.1–2.5)_
- [x] 1.6 Stats: overview counts + open/won deals + pipeline value. _(Req 1.11)_
- [x] 1.7 UI: CRM tab + slice + overview + contacts/companies/deals lists wired to `crm/*`. _(Req 1)_
- [x] 1.8 Verify: `nest build`, migration on throwaway PG, tenant-isolation smoke (list scope, cross-tenant byId = null, per-org email, Decimal round-trip, groupBy, cascade). _(verification)_

## Phase 2 — Detail + flexibility ✅

- [x] 2.1 Schema: `FieldDefinition`/`FieldOption`/`FieldValue`/`SavedView` + `FieldEntity`/`FieldType`; `fieldValues` relations on the three records; migrate + generate. _(Req 3.1–3.4, 4.1–4.3)_
- [x] 2.2 Fields module: definition CRUD (+options), `GET/PUT /values` with typed coerce + SELECT-option validation + per-record uniqueness. _(Req 3.1–3.5)_
- [x] 2.3 SavedViews module: CRUD, own+shared, owner-only mutate, unique per org+entity+owner+name. _(Req 4.1–4.4)_
- [x] 2.4 UI: create/edit drawers for contacts/companies/deals (Add buttons + empty-state actions + row edit/delete). _(Req 1.3)_
- [x] 2.5 UI: record detail pages `[id]` with tabs Overview/Activity/Custom Fields; deal inline stage change; list names/cards link to detail. _(Req 2, 3.5)_
- [x] 2.6 UI: `ActivityTimeline`, `CustomFieldsPanel`, `SavedViewsBar` (contacts list). _(Req 2, 3.5, 4.5)_
- [x] 2.7 Verify: `nest build` (fixed a coerce type bug), migrate Phase 2 tables, smoke (field key uniqueness per org+entity, per-record value uniqueness/upsert, def isolation, saved-view uniqueness, cascade). _(verification)_

### Phase 2 follow-ups (open Issues → now being addressed)

- [x] 2.8 (Issue 1) Wire `SavedViewsBar` into companies and deals lists. _(Req 4.5)_
- [x] 2.9 (Issue 2) Field-definition management UI: create/edit/archive custom fields (+SELECT options), slice thunks + `FieldManager` drawer. _(Req 3.6)_
- [x] 2.10 (Issue 3) Surface `showOnTable` custom-field values as list columns: backend `tableValuesFor` on list rows + dynamic UI columns. _(Req 3.7)_
- [x] 2.11 (Issue 4) `CRM_DATABASE_URL` added to `.env` (dev) with RDS note; `npm run prisma:deploy` (production migration path) verified to apply both committed migrations to a fresh DB. _(Production: point `CRM_DATABASE_URL` at RDS in the deploy env.)_
- [x] 2.12 (Issue 5) Runtime E2E through the real Nest service layer against a live Postgres: create, list+facets, per-org email uniqueness (409), custom-field column + value on list rows, deals pipeline totals, stats, cross-tenant byId (404). _(Browser + auth UI E2E still needs the running Mongo/Redis/UI stack.)_

## Phase 3 — Intelligence core (no LLM) ✅

- [x] 3.1 Schema: `ContactFact` (+ `FactBand`/`FactStatus`), `ContactBrief`; migrate + generate. _(Req 5.1)_ — migration `phase3_contact_facts`.
- [x] 3.2 Port `evidence.ts` (weighted ledger, noisy-OR, band thresholds, contradiction clamp). _(Req 5.2, 5.3)_
- [x] 3.3 Port `facts.service.ts` write-path (apply at VERIFIED, propose below; never overwrite human / re-offer dismissed / write without primary). _(Req 5.4, 5.5)_
- [x] 3.4 `decideFact` accept/dismiss + supersede siblings; `GET contacts/:id/facts` + `POST facts/:id/decide`. _(Req 5.6, 5.7)_
- [x] 3.5 `AgentTask` schema + queue: `claimDue` lease (`FOR UPDATE SKIP LOCKED`), dedupe per (kind,record,org), `completeTask`, `retireExhausted` on max attempts; always-on `@Interval` dispatcher (housekeeping now, executor plugs in at Phase 4). _(Req 6.1, 6.2, 6.4, 6.5)_ — migration `phase3_agent_task_queue`. Chose Postgres queue over Graphile Worker: transactional enqueue, no extra store, no job payload needed until Phase 4.
- [x] 3.6 Transactional enqueue on CRM writes: `POST contacts/:id/enrich` schedules an `enrich` task + sets `enrichmentStatus=PENDING`. _(Req 6.3)_
- [x] 3.7 UI: `ContactFactsPanel` suggestions on the contact sheet (accept/dismiss with evidence tooltip + band chips); Enrich button + queue status on the header; Facts tab with suggestion count. _(Req 5.7)_
- [x] 3.8 Verify: 24-check smoke through the compiled services against live Postgres — evidence scoring (VERIFIED/POSSIBLE/null/contradiction-clamp/non-primary-never-VERIFIED), write-path invariants (apply/hold/human-owns/dismissed-refuse/below-floor), `decideFact` accept+supersede, queue (dedupe, disjoint concurrent lease, complete, live-lease blocks re-claim, retire), tenant isolation (no cross-org facts, cross-org decide 404). _(verification)_

## Phase 4 — Research agent & per-record chat ⏳

- [ ] 4.1 `QuantumMind-ai`: stateless `POST /agent/step` (messages + tool schemas → assistant turn / tool calls) over the existing provider abstraction. _(Req 7.2, 7.6)_
- [ ] 4.2 Backend agent loop + tool registry: `read_crm_history`, `search_crm` (return neighbour ids), `record_fact` (evidence path), `enrich_*`. _(Req 7.2–7.4)_
- [ ] 4.3 `AgentConversation` + `AgentEvent`; per-record chat over socket.io; scoped to user+record+org. _(Req 7.1, 7.7)_
- [ ] 4.4 Capability gating for external providers (web/LinkedIn); DB-only fully functional; missing key never throws. _(Req 7.5)_
- [ ] 4.5 UI: per-record Agent tab (chat, streamed, durable). _(Req 7.1)_
- [ ] 4.6 Verify: tool loop e2e (mocked model), fact writes via evidence path, isolation. _(verification)_

## Phase 5 — Communications sync ⏳

- [ ] 5.1 Schema + read-only Gmail/Outlook sync (forward-only) → `EmailThread`/`EmailMessage`. _(Req 8.1, 8.3)_
- [ ] 5.2 Google Calendar sync → `CalendarEvent`/`CalendarAttendee`. _(Req 8.1)_
- [ ] 5.3 Relationship signals on records (email count, last reply, next meeting). _(Req 8.2)_
- [ ] 5.4 UI: comms on the record timeline. _(Req 8.1)_

## Phase 6 — No-code agent builder ⏳

- [ ] 6.1 Schema: `AgentDefinition`/`AgentVersion`/`AgentTrigger`/`AgentRun`/`AgentRunEvent`/`AgentAction`/`AgentAuditEvent`. _(Req 9.1)_
- [ ] 6.2 Immutable versioning + human deploy step. _(Req 9.2)_
- [ ] 6.3 Action ledger + run-time data-scope/action enforcement; cancel-as-row. _(Req 9.3, 9.4)_
- [ ] 6.4 UI: builder + runs console. _(Req 9)_

## Phase 7 — Web tracking & forms ⏳

- [ ] 7.1 Tracking collector + `TrackedVisitor`/`TrackedEvent`/`TrackedPageDaily` (UTM, DNT). _(Req 10.1, 10.3)_
- [ ] 7.2 Form intake endpoint → dedup contact create/link. _(Req 10.2)_
- [ ] 7.3 UI: visitors + forms surfaces. _(Req 10)_

## Phase 8 — Hardening ⏳

- [ ] 8.1 Per-tenant database rollout via the resolver + data export/import as a single `WHERE organizationId=` cut; pooler (RDS Proxy) for many connections. _(Req 11.1)_
- [ ] 8.2 Shared `ExchangeRate` + per-org reporting currency for totals/pipeline. _(Req 11.2)_
- [ ] 8.3 Custom-field filters across lists (`showOnFilter`); saved-views on all lists. _(Req 11.3, 4.5)_
- [ ] 8.4 Automated tests: tenant isolation, quota/uniqueness, evidence scoring, queue. _(Req 11.4)_

---

## Open Issues (tracked)

| # | Type | Item | Status |
|---|------|------|--------|
| 1 | UI | Saved-views bar on companies + deals lists | Fixed (2.8) |
| 2 | UI | Field-definition management screen | Fixed (2.9) |
| 3 | Full-stack | `showOnTable` custom-field columns in list grids | Fixed (2.10) |
| 4 | Deploy | `CRM_DATABASE_URL` wired; `prisma:deploy` path verified on fresh DB | Fixed (2.11) — set RDS URL in prod |
| 5 | Verify | Service-layer runtime E2E on live DB (create/list/facets/custom columns/pipeline/stats/isolation) | Fixed (2.12) — browser UI E2E still pending stack |

## Review checkpoints

- Whether CRM usage is gated by the RBAC entitlement system (Phase 8) or ungated for now.
- Agent default model + key location; external enrichment providers (Phase 4).
- Per-tenant DB trigger: which clients, and the pooler choice (Phase 8).
