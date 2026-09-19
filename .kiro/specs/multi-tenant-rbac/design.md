# Design — Multi-Tenant RBAC & Subscriptions

## 1. Architecture overview

Everything lives in the **existing NestJS backend**. No new microservice. Two new
feature modules plus targeted changes to auth and existing modules:

```
QuantumMind-backend/src/
  auth/                     (extend: roles, guards, JWT payload, org context)
  organization/   NEW       Organization entity + CRUD (super-admin managed)
  billing/        NEW       Plan + Subscription entities + EntitlementService
  agent/                    (extend: role enum, organizationId, role-aware create)
  bots/                     (extend: organizationId, quota check on create)
  template/                 (extend: organizationId on TemplateInstance)
  common/         NEW       @Roles, RolesGuard, @RequiresFeature, FeatureGuard,
                            tenant-scope helper, audit-log
```

Three orthogonal concerns kept separate:

- **Role** → what actions a user may perform (RBAC guard).
- **Tenancy** → which org's data a request may touch (org-scoping, security boundary).
- **Entitlements** → what an org's subscription allows (limits + features).

A "restricted admin" is a normal `ORG_ADMIN` whose org's subscription caps a limit — it
is *not* a role difference.

**Rationale for single backend:** entitlements/role are read on nearly every request;
co-locating avoids a network hop per call. The system is serverless (AWS Lambda) so a
second service adds cold-start and cross-service-auth cost with no benefit at this stage.
Clean module boundaries (nothing outside `billing/` touches Plan/Subscription docs
directly) keep a future extraction cheap.

## 2. Data model (Mongoose)

### 2.1 New: Organization

```
Organization
  _id
  name: string
  slug: string (unique)
  status: 'active' | 'suspended'   (default 'active')
  ownerId: ObjectId -> Agent        (the ORG_ADMIN)
  botCount: number (default 0)      // atomic counter for quota races
  agentCount: number (default 0)
  templateCount: number (default 0)
  createdBy: ObjectId -> Agent      (super-admin)
  timestamps
```

### 2.2 New: Plan (shared catalog)

```
Plan
  _id
  name: 'Basic' | 'Pro' | 'Enterprise' | string
  isPublic: boolean
  limits: { maxBots, maxAgents, maxPlatforms, maxTemplates }
  features: { [featureKey]: boolean }   // keys from fixed catalog
  billing: { price, interval, currency } // metadata only for now
  timestamps
```

### 2.3 New: Subscription (org ↔ plan + overrides)

```
Subscription
  _id
  organizationId: ObjectId -> Organization (unique)
  planId: ObjectId -> Plan
  status: 'active' | 'trialing' | 'past_due' | 'canceled'
  overrides: {
    limits?:   { maxBots?, maxAgents?, maxPlatforms?, maxTemplates? }
    features?: { [featureKey]?: boolean }
  }
  startedAt, currentPeriodEnd
  timestamps
```

This Plan→Subscription split mirrors the existing `Template`→`TemplateInstance` pattern
(shared defaults + per-tenant override layer), so the codebase stays consistent.

### 2.4 Changed: Agent (the user entity)

- Add `organizationId: ObjectId -> Organization | null` (null only for `SUPER_ADMIN`).
- Widen `role` to the unified 4-value enum.
- Keep `assignedBots` (agent → bots within the same org).
- Update the pre-remove hook: protect `SUPER_ADMIN` (and org owners) from deletion.

### 2.5 Changed: Bot, TemplateInstance, channel connections

- Add required `organizationId` to `Bot`, `TemplateInstance`, and each channel/platform
  connection entity (WhatsApp official/OpenWA, Telegram, Facebook).
- `TemplateInstance.workspaceId` (currently dead) is replaced by `organizationId`.
- Add compound indexes leading with `organizationId` for scoped list queries.

### 2.6 New: AuditLog (lightweight)

```
AuditLog
  _id, actorId, actorRole, action, targetType, targetId,
  organizationId, metadata, createdAt
```

Written on: org create/suspend, subscription/limit change, impersonation start.

## 3. Roles, guards & decorators

### 3.1 Unified role enum

Replace the two duplicated enums (`auth/enums/role.enum.ts`,
`agent/enums/agent-role.enum.ts`) with one shared enum:

```ts
export enum Role {
  SUPER_ADMIN = 'super_admin',
  ORG_ADMIN   = 'org_admin',
  ORG_MANAGER = 'org_manager',
  AGENT       = 'agent',
}
```

Ordered levels power the "can only create below me" rule:
`SUPER_ADMIN(3) > ORG_ADMIN(2) > ORG_MANAGER(1) > AGENT(0)`.

### 3.2 `@Roles()` + `RolesGuard`

- `@Roles(Role.ORG_ADMIN, Role.SUPER_ADMIN)` on a handler/class.
- `RolesGuard` reads the metadata and the JWT `role`; registered as a global `APP_GUARD`
  **after** the existing `JwtAuthGuard`. Handlers with no `@Roles` default to
  authenticated-any (existing behavior) unless a stricter default is chosen.

### 3.3 Creation rule (delegated administration)

`AgentService.create` derives the target org and validates the actor:

- `SUPER_ADMIN`: may create `ORG_ADMIN` for any org (used by the org-create flow).
- `ORG_ADMIN`: may create `ORG_MANAGER`/`AGENT`, forced into the actor's org.
- `ORG_MANAGER`: may create `AGENT`, forced into the actor's org.
- The requested `role`/`organizationId` from the client is **never trusted** — the org is
  taken from the actor's token (except super-admin's explicit target), and the role is
  validated against `actorLevel > targetLevel`.

### 3.4 Tenant scoping

A `TenantContext` (from JWT: `organizationId`, `role`) is available via the existing
`@CurrentUser()` decorator. A helper `scopedFilter(user, filter)` injects
`{ organizationId }` for non-super-admins. Every list/find/update/delete in tenant
modules uses it. Cross-org access requires `SUPER_ADMIN` (or an active impersonation
context carrying `actingAsOrgId`).

## 4. Entitlements

### 4.1 EntitlementService (in `billing/`)

```
getEffective(orgId): { limits, features }   // plan merged with subscription.overrides
assertCanCreate(orgId, 'bot'|'agent'|'template'|'platform')
isFeatureEnabled(orgId, featureKey): boolean
```

- Effective limit = `subscription.overrides.limits[x] ?? plan.limits[x]`.
- Effective feature = `subscription.overrides.features[x] ?? plan.features[x] ?? false`.
- Cache per org with short TTL; invalidate on subscription change.

### 4.2 Quota enforcement (race-safe)

`assertCanCreate` uses the `Organization.{botCount,agentCount,...}` counters, not a live
`count()`, to avoid the check-then-create race:

```
const org = await Organization.findOneAndUpdate(
  { _id, botCount: { $lt: effectiveMaxBots } },
  { $inc: { botCount: 1 } },
  { new: true },
);
if (!org) throw ForbiddenException('Bot limit reached for your plan');
// ...create bot; on failure, $inc botCount by -1 (compensating)
```

Downgrade below current usage: creates stay blocked (the `$lt` fails); existing resources
are untouched (Req 3.8).

### 4.3 Feature gating

`@RequiresFeature('channel.telegram')` + `FeatureGuard` calls
`EntitlementService.isFeatureEnabled`. Feature keys validated against the fixed catalog
constant. Reuses the merge idea already present in the `FeatureFlag` module.

## 5. Tab-based access

### 5.1 Role → tab matrix (initial; ORG_MANAGER row is the review assumption)

Tabs come from `QuantumMind-ui/src/navigation/vertical/index.ts`.

| Tab | ORG_ADMIN | ORG_MANAGER | AGENT |
|-----|:--:|:--:|:--:|
| Dashboards | ✓ | ✓ | – |
| Conversations | ✓ | ✓ | ✓ |
| Bots | ✓ | ✓ | – |
| Agents | ✓ | ✓ | – |
| Visitors | ✓ | ✓ | ✓ |
| Management (Segments, Tags) | ✓ | ✓ | – |
| Service Requests | ✓ | ✓ | ✓ |
| Question Bank | ✓ | ✓ | – |
| Templates | ✓ | ✓ | – |
| CRM | ✓ | ✓ | – |
| Marketing | ✓ | ✓ | – |
| Social Messengers | ✓ | ✓ | – |
| Channel Providers | ✓ | – | – |
| Reports | ✓ | ✓ | – |
| Support | ✓ | ✓ | ✓ |

`SUPER_ADMIN` does not use this dashboard; it uses the console (section 6).
`ORG_MANAGER` differs from `ORG_ADMIN` at the **action** level (create AGENT only) and by
hiding org-settings/subscription surfaces. Confirm this row during review.

### 5.2 Implementation

- Backend: a `role → allowedTabs[]` constant is the single source of truth; each tab's
  APIs carry `@Roles(...)`.
- UI: navigation becomes a function of `role` (filter the existing array). Add a
  role-aware route guard so direct URL access to a disallowed tab redirects.
- The `/me/entitlements` endpoint (section 7) returns `allowedTabs`, limits, usage,
  features so the UI renders from one payload.

## 6. Super-admin console

New UI area at `/super-admin` (Next.js), backed by `organization/` + `billing/` APIs.

Screens:

1. **Organizations list** — name, plan, bots used/limit, owner, #managers, #agents,
   channels, active template(s), subscription status, org status; search/filter.
2. **Create organization** — one flow: org name + owner (name/email/password) + plan +
   editable limits + feature toggles. Creates Organization, the `ORG_ADMIN`, and the
   Subscription atomically.
3. **Organization detail** — edit limits/features (persisted as subscription overrides),
   suspend/reactivate, "manage as org" (impersonation).
4. **Global overview** — totals (orgs, agents, managers, bots, active subscriptions).

Console APIs are `@Roles(SUPER_ADMIN)` only and expose **metadata only** (no conversation
content). Impersonation issues a scoped context (`actingAsOrgId`) and writes an audit log.

## 7. Auth & API surface

### 7.1 JWT payload

Extend to `{ sub, _id, role, email, organizationId }`. `jwt.strategy.validate` returns
`organizationId`; `TokenService.sign` / refresh include it.

### 7.2 New / changed endpoints (indicative)

```
GET  /me/entitlements        -> { role, organizationId, allowedTabs, limits, usage, features }

# super-admin only
POST /organizations          -> create org + owner + subscription
GET  /organizations          -> list with metadata
GET  /organizations/:id
PATCH/organizations/:id       -> status, limits/feature overrides
POST /organizations/:id/impersonate
GET  /admin/overview         -> global totals
GET  /plans                  -> list/seed-managed
POST /plans, PATCH /plans/:id

# tenant, role-guarded, org-scoped
POST /agent                  -> role-aware create (see 3.3); remove @Public from GET /agent
POST /bots                   -> quota-checked create
```

Close the current `@Public()` gap on `GET /agent` (agent list) — it must be authenticated
and org-scoped.

## 8. Bootstrap (fresh start)

`onModuleInit` (idempotent):

1. Seed one `SUPER_ADMIN` from config (`admin.email`, etc.), `organizationId = null`.
2. Seed Basic/Pro/Enterprise plans if absent (defaults: bots 5 / agents 10 / platforms 3 /
   templates 20, tuned per tier).
3. Do **not** create any organization.

No migration/backfill code — the DB starts empty.

## 9. Security notes

- Every tenant query org-scoped; cross-org needs `SUPER_ADMIN`.
- Client-supplied `role`/`organizationId` never trusted on create.
- Suspended org → all its users denied at the guard layer.
- Super-admin console = metadata only; deep access only via audited impersonation.
- Emails remain globally unique (one org per user).

## 10. Open items for review

1. **ORG_MANAGER tab row** (section 5.1) — confirm managers get admin-minus-settings, or
   restrict further.
2. **Per-plan limit numbers** for Basic/Pro/Enterprise (defaults applied; adjust).
3. **Final feature catalog** (section 4.3 / Req 4.1) — confirm the seven keys.
