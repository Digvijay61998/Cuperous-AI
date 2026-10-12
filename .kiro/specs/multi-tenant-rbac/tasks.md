# Implementation Plan: Multi-Tenant RBAC & Subscriptions

## Overview

Phased so each phase is shippable and verifiable. Tenancy (the security boundary) lands
before entitlements and UI. References point back to `requirements.md`.

Verification assets:
- Unit/negative tests: `QuantumMind-backend/src/common/tenant/rbac-security.spec.ts`,
  `src/common/guards/roles.guard.spec.ts`, `src/common/constants/role-tabs.spec.ts`.
- Live HTTP scenario suite (118 checks, isolated DB): `QuantumMind-backend/test/rbac-e2e.js`
  — run the built backend against an empty database, then `node test/rbac-e2e.js`
  (`BASE` env var overrides `http://localhost:4099/api`; super admin `root@e2e.test` /
  `RootPass123!` via `ADMIN_EMAIL` / `ADMIN_PASSWORD`).

## Tasks

### Phase 0 — Foundations: roles & JWT

- [x] 0.1 Unified `Role` enum + `ROLE_LEVEL`, `ORG_ROLES`, `ORG_STAFF`, `isPlatformRole`. _(Req 1.1)_
- [x] 0.2 `organizationId` in JWT payload, refresh re-signs from current DB state. _(Req 7.1)_
- [x] 0.3 `@Roles()` + global `RolesGuard`. Undecorated routes default to org roles (not super admin, not widget tokens); `@AllowVisitor()` opts widget tokens in. _(Req 1, 5.3)_
- [x] 0.4 `role → allowedTabs[]` constant (backend + UI mirror). _(Req 5.1)_
- [x] 0.5 Build succeeds; boots with all DI resolved. _(verification)_

### Phase 1 — Tenancy foundation (security boundary)

- [x] 1.1 `Organization` entity (+ `platformCount`), race-safe slug allocation. _(Req 2.1)_
- [x] 1.2 `organizationId` on Agent, Bot, TemplateInstance, Social, WhatsappWebSession; bot-referencing collections scoped via `TenantScopeService`. _(Req 2.2)_
- [x] 1.3 `scopedFilter` / `assertOwnership` / `TenantScopeService.assertBotInOrg`. _(Req 2.3)_
- [x] 1.4 Scoping applied to agent, bots (incl. flow nodes, settings, styles), conversation, inbox, tickets, visitor, unanswered, questions (incl. bot-runtime Q&A lookup), social, whatsapp-web, telegram, trainingdata, scraper, template instances/submissions, messaging, reports & home stats. _(Req 2.3, 2.4)_
- [x] 1.5 Cross-org references → 404 (no existence leak); malformed ids → 404 not 500. _(Req 2.4, 2.5)_
- [x] 1.6 Suspended **or deleted** org denied at guard, login, refresh and socket handshake. _(Req 6.3, 7.4)_
- [x] 1.7 Verified: org-B user cannot read/mutate org-A bots, flows, nodes, users, connections, training data, reports. _(verification)_

### Phase 2 — RBAC & role-aware user creation

- [x] 2.1 `role`/`organizationId` on `CreateAgentDto`; `UpdateAgentDto` cannot change `organizationId`. _(Req 1)_
- [x] 2.2 Delegated creation (`actorLevel > targetLevel`, org from token, email normalized/unique → 409). _(Req 1.2–1.6)_
- [x] 2.3 `@Roles` applied per tab matrix across controllers. _(Req 5.3, 5.4)_
- [x] 2.4 Agent list authenticated + org-scoped. _(Req 7.5)_
- [x] 2.5 Pre-remove hook protects SUPER_ADMIN and org owners; update/delete enforce outrank rule, no self-delete, no self-role change. _(Req 1.7)_
- [x] 2.6 Verified each role can only create/edit roles below it within its org. _(verification)_

### Phase 3 — Plans, subscriptions & entitlements

- [x] 3.1 `Plan` entity + fixed feature catalog + validator. _(Req 3.1, 4.1, 4.4)_
- [x] 3.2 `Subscription` entity (unique per org). _(Req 3.3)_
- [x] 3.3 `EntitlementService` — **fail-closed** (no/canceled subscription ⇒ 0 limits, no features), catalog-only boolean features, sanitized limits. _(Req 3.4, 4.2, 4.3)_
- [x] 3.4 Atomic counters with compensating release; release on delete (bots, users, platforms, template instances); double-delete safe. _(Req 3.6, 3.7)_
- [x] 3.5 Quota wired into bot, agent, template-instance and platform-connect (social + WhatsApp Web). _(Req 3.6)_
- [x] 3.6 `@RequiresFeature` + per-platform feature gate on connect and publish. _(Req 4.3)_
- [x] 3.7 Verified: limit rejection, 8-way parallel race, downgrade keeps data but blocks creates. _(verification)_

### Phase 4 — Bootstrap & seeding (fresh start)

- [x] 4.1 Idempotent super-admin seed (race-safe, never logs password, refuses to hijack a non-super-admin email). _(Req 1.7, 8.2, 8.4)_
- [x] 4.2 Idempotent plan seed (Basic/Pro/Enterprise). _(Req 3.2, 8.2)_
- [x] 4.3 No org auto-created, no backfill. _(Req 8.1, 8.3)_
- [x] 4.4 Verified clean-DB boot and restart idempotency (1 super admin, 3 plans). _(verification)_

### Phase 5 — Super-admin console API

- [x] 5.1 `POST /organizations` — validated up front, compensated on failure. _(Req 6.1)_
- [x] 5.2 `GET /organizations` (+ `/:id`) — metadata only. _(Req 6.2, 6.6)_
- [x] 5.3 `PATCH /organizations/:id` — rename, suspend/reactivate, plan, subscription status, limit/feature overrides. _(Req 3.5, 6.3)_
- [x] 5.4 `GET /admin/overview`, `/admin/plans`, `/admin/features`, `/admin/audit-logs`; `POST /organizations/:id/reconcile`. _(Req 6.4)_
- [x] 5.5 Impersonation: 1h ORG_ADMIN token with `impersonatedBy`, no refresh token, refused for suspended orgs, cannot reach console, audit-logged. _(Req 6.5, 6.7)_
- [x] 5.6 `GET /me/entitlements` (incl. platform usage). _(Req 5.1, 7.3)_
- [x] 5.7 Verified all console APIs reject non-super-admins. _(verification)_

### Phase 6 — UI

- [x] 6.1 Shared role enum/helpers; role/org from `/agent/me`. _(Req 5)_
- [x] 6.2 Role-aware navigation. _(Req 5.1, 5.2)_
- [x] 6.3 Role-aware route guard. _(Req 5.2)_
- [x] 6.4 Role-based post-login routing. _(Req 7.2)_
- [x] 6.5 Role dropdown in Add Agent drawer. _(Req 1.2–1.4)_
- [x] 6.6 Create buttons gated on `/me/entitlements`. _(Req 3.6, 4.3)_
- [x] 6.7 `/super-admin` console (list, create, detail, suspend, impersonate + banner). _(Req 6.1–6.4)_
- [ ] 6.8 Manual browser pass per role (tabs + direct URL). UI type-checks clean; not click-tested. _(verification)_

### Phase 7 — Hardening

- [x] 7.1 Audit coverage: org create/rename/suspend/reactivate, subscription change (before/after), impersonation, reconcile; secrets redacted. _(Req 6.7)_
- [x] 7.2 Negative tests: cross-org, quota race, disabled features, privilege escalation (unit + live). _(Req 2, 3, 4)_
- [x] 7.3 Console / audit contain no conversation content or passwords (verified). _(Req 6.6)_
- [x] 7.4 Closed previously-public data routes (whatsapp-web, social, trainingdata, scraper, upload, conversation transcript, all home/report stats, questions search, chat-initializer); socket requires a token and agent-only socket events check conversation ownership. _(Req 7.5)_

## Known gaps / follow-ups

- Tag, Segment, Webhook, Video have no `organizationId` in the original model; tag/segment/webhook services were scoped in this pass but rows created before it are unowned (fresh-start assumption makes this moot).
- Entitlement cache is per-process (30s TTL); in multi-instance deploys a limit change can take up to 30s to apply everywhere. Counters themselves are atomic in Mongo.
- Inbound channel webhooks (WhatsApp/Facebook/Telegram) remain public by necessity; signature verification is outside this feature.
- Channel Providers page must pass a `botId` for org admins (global switch is super-admin only).
- A user deactivated mid-session keeps access until the access token expires (refresh is refused).

## Notes

Review checkpoints resolved: ORG_MANAGER = admin minus Channel Providers; plan limits Basic 1/3/1/5, Pro 5/10/3/20, Enterprise 20/50/10/100 (bots/agents/platforms/templates); feature catalog = the seven keys in Req 4.1.

## Task Dependency Graph

```
Phase0 -> Phase1 -> Phase2 -> Phase3 -> Phase5 -> Phase6 -> Phase7
                         \-> Phase4 --/
```
