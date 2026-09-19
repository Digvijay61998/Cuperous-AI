# Requirements — Multi-Tenant RBAC & Subscriptions

## Overview

QuantumMind (Jarcube) currently ships with a flat two-role model (`admin` / `agent`),
no tenant boundary, and no subscription/limit system. Every logged-in user sees the
entire dashboard, and bots attach to individual agents.

This feature restructures the platform into a multi-tenant SaaS:

- A new **SUPER_ADMIN** (the platform owner) sits above everything and manages
  customer organizations, plans, subscriptions, and per-organization limits/features
  from a dedicated console.
- Each customer is an **Organization** (tenant) with a hard data boundary.
- Today's `admin` experience becomes the **ORG_ADMIN** dashboard, scoped to one org.
- Resources (bots, agents, templates, channels) belong to an organization and are
  never visible across organizations.
- A subscription (plan + per-org overrides) controls how many bots/agents/platforms/
  templates an organization may create and which features it can use.

**Deployment note:** This is a fresh start. The database will be wiped; there is **no
migration or backfill** of existing data. A single bootstrap SUPER_ADMIN is seeded at
startup.

**Scope decisions (locked):**

- Bots belong to exactly one organization; no cross-org sharing.
- One organization per user (single `organizationId`), modeled so it can extend to a
  membership join later.
- Access control is **tab-based** for now (which sidebar tabs a role can see);
  per-feature access is future work.
- Super-admin visibility is **operational metadata only** — never conversation content.
  Deep support access is via audit-logged impersonation ("manage as org").
- Everything stays in the **single NestJS backend** as dedicated modules; no new
  microservice.

---

## Roles & Terminology

| Role | Scope | Responsibility |
|------|-------|----------------|
| `SUPER_ADMIN` | Global (org-independent) | Manage organizations, plans, subscriptions, per-org limits/features, global visibility, impersonation |
| `ORG_ADMIN` | One organization | Full control of the org's dashboard within its limits; create managers and agents |
| `ORG_MANAGER` | One organization | Operational management; create agents only |
| `AGENT` | Assigned bots within one org | Inbox and conversation handling |

**Effective entitlements** = plan defaults merged with subscription overrides for the org.

---

## Requirements

### Requirement 1 — Role model & hierarchy

**User story:** As the platform owner, I want a four-role hierarchy so that each user has
a bounded responsibility and creation permission.

#### Acceptance criteria

1. THE SYSTEM SHALL define exactly four roles: `SUPER_ADMIN`, `ORG_ADMIN`, `ORG_MANAGER`, `AGENT`, in a single shared enum used by both backend and UI.
2. WHEN a `SUPER_ADMIN` creates a user THE SYSTEM SHALL allow creating an `ORG_ADMIN` (as an organization owner) only.
3. WHEN an `ORG_ADMIN` creates a user THE SYSTEM SHALL allow creating `ORG_MANAGER` or `AGENT` within the same organization only.
4. WHEN an `ORG_MANAGER` creates a user THE SYSTEM SHALL allow creating `AGENT` within the same organization only.
5. WHEN an `AGENT` attempts to create any user THE SYSTEM SHALL reject the request with 403.
6. WHEN any user attempts to create a role above or equal to their own level THE SYSTEM SHALL reject the request with 403, regardless of what the client sends.
7. THE SYSTEM SHALL seed exactly one `SUPER_ADMIN` at startup from configuration and SHALL NOT attach it to any organization.

### Requirement 2 — Organization tenancy & data isolation

**User story:** As a customer, I want my organization's data fully isolated so that no
other customer can read or modify my bots, agents, templates, or conversations.

#### Acceptance criteria

1. THE SYSTEM SHALL provide an `Organization` entity that is the tenant boundary.
2. THE SYSTEM SHALL stamp `organizationId` on every tenant-owned resource (Agent/user, Bot, TemplateInstance, channel connections, conversations, and related records).
3. WHEN a non-super-admin user makes any request THE SYSTEM SHALL scope all reads and writes to the user's `organizationId`.
4. IF a user references a resource belonging to another organization (e.g. passes another org's botId) THEN THE SYSTEM SHALL reject the request with 403/404 and SHALL NOT leak the resource's existence.
5. WHEN a `SUPER_ADMIN` makes a request THE SYSTEM SHALL allow cross-organization access for management operations only.
6. THE SYSTEM SHALL enforce that every user belongs to at most one organization (`SUPER_ADMIN` belongs to none).

### Requirement 3 — Plans, subscriptions & limits

**User story:** As the platform owner, I want plans with editable per-organization limits
so that I can control how many resources each customer may create.

#### Acceptance criteria

1. THE SYSTEM SHALL provide a `Plan` entity holding default limits (`maxBots`, `maxAgents`, `maxPlatforms`, `maxTemplates`) and a feature map.
2. THE SYSTEM SHALL seed starter plans (Basic, Pro, Enterprise) with default limits (defaults: bots 5, agents 10, platforms 3, templates 20; adjustable per plan).
3. THE SYSTEM SHALL provide a `Subscription` entity linking one organization to one plan, with optional `overrides` for limits and features.
4. WHEN computing an organization's effective limit THE SYSTEM SHALL use the subscription override if present, otherwise the plan default.
5. WHEN a `SUPER_ADMIN` edits an organization's limits THE SYSTEM SHALL persist them as subscription overrides without changing the shared plan.
6. WHEN a user attempts to create a resource that would exceed the org's effective limit for that resource type THE SYSTEM SHALL reject the creation with a clear "limit reached / upgrade" error.
7. WHEN concurrent create requests race against the last available quota slot THE SYSTEM SHALL ensure the effective limit is never exceeded (atomic count/guard).
8. IF an organization is later given a lower limit than its current usage THEN THE SYSTEM SHALL continue to block new creates but SHALL NOT delete existing resources.

### Requirement 4 — Feature gating (tab-based)

**User story:** As the platform owner, I want to enable/disable features per organization so
that customers only access what their plan allows.

#### Acceptance criteria

1. THE SYSTEM SHALL maintain a fixed catalog of feature keys (no free-form keys). Initial catalog: `channel.whatsapp_official`, `channel.whatsapp_openwa`, `channel.telegram`, `channel.facebook`, `question-bank`, `advertisements`, `offers`.
2. WHEN a `SUPER_ADMIN` toggles a feature for an organization THE SYSTEM SHALL store it as a subscription feature override.
3. WHEN a user accesses a feature that is disabled for their organization THE SYSTEM SHALL reject the request with 403.
4. THE SYSTEM SHALL validate any submitted feature key against the fixed catalog and reject unknown keys.

### Requirement 5 — Role-based dashboard access (by tab)

**User story:** As a user, I want to see only the dashboard sections my role permits so that
the interface matches my responsibilities.

#### Acceptance criteria

1. THE SYSTEM SHALL define a mapping from role to the set of visible sidebar tabs.
2. WHEN a user loads the dashboard THE UI SHALL render only the tabs permitted for their role.
3. THE BACKEND SHALL enforce the same role permission on the APIs behind each tab, independent of UI visibility.
4. WHEN a role attempts to call an API for a tab it cannot access THE SYSTEM SHALL reject with 403.
5. THE SYSTEM SHALL treat `ORG_MANAGER` as having the same tabs as `ORG_ADMIN` except organization-settings/subscription tabs (assumption — confirm during review), while still being restricted at the action level (create `AGENT` only).
6. THE SYSTEM SHALL restrict `AGENT` to conversation/inbox-oriented tabs.

### Requirement 6 — Super-admin console

**User story:** As the platform owner, I want a dedicated console to manage and observe all
organizations so that I can operate the platform without entering each org individually.

#### Acceptance criteria

1. WHEN a `SUPER_ADMIN` opens the console THE SYSTEM SHALL allow creating an organization together with its owner (`ORG_ADMIN`), a selected plan, editable limits, and feature toggles in one flow.
2. THE SYSTEM SHALL list all organizations with plan, bots used/limit, owner, agent/manager counts, connected channels, active template(s), subscription status, and org status.
3. WHEN a `SUPER_ADMIN` suspends an organization THE SYSTEM SHALL block that org's users from access WHILE preserving all its data.
4. THE SYSTEM SHALL expose global totals (organizations, agents, managers, bots, active subscriptions).
5. THE SYSTEM SHALL restrict all console APIs to `SUPER_ADMIN` only.
6. THE SYSTEM SHALL expose operational metadata only and SHALL NOT expose conversation content in the console.
7. WHEN a `SUPER_ADMIN` uses "manage as org" (impersonation) THE SYSTEM SHALL scope access to that org AND SHALL write an audit-log entry.

### Requirement 7 — Authentication & login routing

**User story:** As a user, I want to land on the right area after login so that I go straight
to the tools for my role.

#### Acceptance criteria

1. THE SYSTEM SHALL include the user's `role` and `organizationId` in the JWT payload.
2. WHEN login succeeds THE UI SHALL route `SUPER_ADMIN` to `/super-admin`, `ORG_ADMIN`/`ORG_MANAGER` to `/dashboard`, and `AGENT` to `/inbox`.
3. THE SYSTEM SHALL provide an endpoint returning the current user's role, organization, effective limits, current usage, and enabled features, for the UI to gate on.
4. WHEN a user belonging to a suspended organization attempts to log in or call an API THE SYSTEM SHALL deny access.
5. THE SYSTEM SHALL protect every non-public route with authentication AND role authorization (the current `@Public()` agent-list gap SHALL be closed).

### Requirement 8 — Fresh-start bootstrap

**User story:** As the platform owner, I want a clean startup with no legacy data so that the
new model has no inconsistent records.

#### Acceptance criteria

1. THE SYSTEM SHALL assume an empty database and SHALL NOT run any data migration/backfill.
2. THE SYSTEM SHALL seed one `SUPER_ADMIN` and the starter plans on first startup if absent.
3. THE SYSTEM SHALL NOT auto-create any organization; organizations are created by the `SUPER_ADMIN`.
4. THE SYSTEM SHALL be idempotent on restart (no duplicate super-admin or plans).
