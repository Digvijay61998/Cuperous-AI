# Tasks — Multi-Tenant RBAC & Subscriptions

Phased so each phase is shippable and verifiable. Tenancy (the security boundary) lands
before entitlements and UI. References point back to `requirements.md`.

---

## Phase 0 — Foundations: roles & JWT

- [ ] 0.1 Create unified `Role` enum (`super_admin`, `org_admin`, `org_manager`, `agent`) in a shared location; delete the two duplicated enums and update all imports. _(Req 1.1)_
- [ ] 0.2 Add `organizationId` to the JWT payload; update `TokenService.sign`, refresh-token creation, and `JwtStrategy.validate`. _(Req 7.1)_
- [ ] 0.3 Implement `@Roles()` decorator + `RolesGuard`; register as global `APP_GUARD` after `JwtAuthGuard`. _(Req 1, 5.3)_
- [ ] 0.4 Add `role → allowedTabs[]` constant (single source of truth) in a shared module. _(Req 5.1)_
- [ ] 0.5 Build succeeds; existing endpoints still authenticate. _(verification)_

## Phase 1 — Tenancy foundation (security boundary)

- [ ] 1.1 Create `Organization` entity/schema (name, slug, status, ownerId, counters, createdBy) + module/provider. _(Req 2.1)_
- [ ] 1.2 Add `organizationId` to `Agent`, `Bot`, `TemplateInstance` (replace dead `workspaceId`), and each channel connection entity; add org-leading indexes. _(Req 2.2)_
- [ ] 1.3 Implement `TenantContext` + `scopedFilter(user, filter)` helper. _(Req 2.3)_
- [ ] 1.4 Apply `scopedFilter` to all list/find/update/delete in agent, bots, template, channels, conversations. _(Req 2.3, 2.4)_
- [ ] 1.5 Add ownership guard: reject cross-org resource references with 403/404 (no existence leak); allow `SUPER_ADMIN`. _(Req 2.4, 2.5)_
- [ ] 1.6 Enforce suspended-org denial at the guard layer. _(Req 6.3, 7.4)_
- [ ] 1.7 Verify isolation: an org-B user cannot read/mutate org-A bot by id. _(verification, Req 2.4)_

## Phase 2 — RBAC & role-aware user creation

- [ ] 2.1 Add `role` (+ optional `organizationId` for super-admin flow) to `CreateAgentDto` with validation. _(Req 1)_
- [ ] 2.2 Implement delegated-creation rule in `AgentService.create`: derive org from actor's token, validate `actorLevel > targetLevel`, never trust client role/org. _(Req 1.2–1.6, 3.x)_
- [ ] 2.3 Apply `@Roles(...)` to agent/bots/template/channel/management controllers per the tab matrix. _(Req 5.3, 5.4)_
- [ ] 2.4 Remove `@Public()` from `GET /agent` (agent list); make it authenticated + org-scoped. _(Req 7.5)_
- [ ] 2.5 Update Agent pre-remove hook to protect `SUPER_ADMIN` and org owners. _(Req 1.7)_
- [ ] 2.6 Verify each role can only create the roles below it, within its own org. _(verification, Req 1)_

## Phase 3 — Plans, subscriptions & entitlements

- [ ] 3.1 Create `Plan` entity + module; define fixed feature-catalog constant + validator. _(Req 3.1, 4.1, 4.4)_
- [ ] 3.2 Create `Subscription` entity (org↔plan + overrides, unique per org). _(Req 3.3)_
- [ ] 3.3 Implement `EntitlementService`: `getEffective`, `assertCanCreate`, `isFeatureEnabled` with plan+override merge and per-org cache. _(Req 3.4, 4.2, 4.3)_
- [ ] 3.4 Add race-safe quota: `Organization` counters via `findOneAndUpdate({ count: { $lt: max } }, { $inc })` + compensating decrement on create failure. _(Req 3.6, 3.7)_
- [ ] 3.5 Wire `assertCanCreate` into bot create, agent create, template-instance create, and platform-connect paths. _(Req 3.6)_
- [ ] 3.6 Implement `@RequiresFeature()` + `FeatureGuard`; apply to channel/feature endpoints. _(Req 4.3)_
- [ ] 3.7 Verify: exceeding a limit is rejected; downgrade blocks new creates without deleting existing. _(verification, Req 3.6, 3.8)_

## Phase 4 — Bootstrap & seeding (fresh start)

- [ ] 4.1 Idempotent `onModuleInit`: seed one `SUPER_ADMIN` (org = null) from config. _(Req 1.7, 8.2, 8.4)_
- [ ] 4.2 Idempotent seed of Basic/Pro/Enterprise plans (defaults bots 5 / agents 10 / platforms 3 / templates 20, tuned per tier). _(Req 3.2, 8.2)_
- [ ] 4.3 Ensure no organization is auto-created and no migration/backfill runs. _(Req 8.1, 8.3)_
- [ ] 4.4 Verify clean-DB startup and restart idempotency. _(verification, Req 8.4)_

## Phase 5 — Super-admin console API

- [ ] 5.1 `POST /organizations`: atomic create of Organization + `ORG_ADMIN` owner + Subscription (plan, editable limits, feature toggles). _(Req 6.1)_
- [ ] 5.2 `GET /organizations` (+ `/:id`): list with plan, bots used/limit, owner, counts, channels, active template(s), subscription/org status — metadata only. _(Req 6.2, 6.6)_
- [ ] 5.3 `PATCH /organizations/:id`: suspend/reactivate + edit limits/features as subscription overrides. _(Req 3.5, 6.3)_
- [ ] 5.4 `GET /admin/overview`: global totals. _(Req 6.4)_
- [ ] 5.5 Impersonation endpoint + `actingAsOrgId` context + `AuditLog`; guard all console APIs with `@Roles(SUPER_ADMIN)`. _(Req 6.5, 6.7)_
- [ ] 5.6 `GET /me/entitlements`: role, org, allowedTabs, limits, usage, features. _(Req 5.1, 7.3)_
- [ ] 5.7 Verify all console APIs reject non-super-admins. _(verification, Req 6.5)_

## Phase 6 — UI

- [ ] 6.1 Add shared `Role` enum + role helper in `QuantumMind-ui`; store role/org from token. _(Req 5)_
- [ ] 6.2 Make `navigation/vertical/index.ts` a function of role (filter tabs via matrix). _(Req 5.1, 5.2)_
- [ ] 6.3 Add role-aware route guard: redirect direct URL access to disallowed tabs. _(Req 5.2)_
- [ ] 6.4 Role-based post-login routing: SUPER_ADMIN→`/super-admin`, ORG_ADMIN/ORG_MANAGER→`/dashboard`, AGENT→`/inbox`. _(Req 7.2)_
- [ ] 6.5 Add Role dropdown to the Add Agent drawer, options filtered by logged-in role. _(Req 1.2–1.4)_
- [ ] 6.6 Gate create buttons/tabs on `/me/entitlements` usage vs limits and enabled features. _(Req 3.6, 4.3)_
- [ ] 6.7 Build the `/super-admin` console: org list, create-org flow, org detail (limits/features/suspend/impersonate), global overview. _(Req 6.1–6.4)_
- [ ] 6.8 Verify each role sees only its tabs and cannot reach others by URL. _(verification, Req 5)_

## Phase 7 — Hardening

- [ ] 7.1 Audit-log coverage: org create/suspend, limit/feature change, impersonation. _(Req 6.7)_
- [ ] 7.2 Negative tests: cross-org access, quota race, disabled-feature calls, privilege escalation on create. _(Req 2, 3, 4)_
- [ ] 7.3 Confirm no conversation content is reachable from console/impersonation logs. _(Req 6.6)_

---

## Review checkpoints (decide before/while building)

- ORG_MANAGER tab row (design §5.1) — admin-minus-settings vs stricter.
- Per-plan limit numbers for Basic/Pro/Enterprise.
- Final feature-catalog keys.
