/**
 * The single source of truth for user roles across the platform.
 *
 * Replaces the two previously duplicated enums (`AuthRole` in auth/ and
 * `RoleEnum` in agent/). Ordered by privilege via {@link ROLE_LEVEL} so the
 * "a user may only create roles below their own level" rule can be expressed
 * as a numeric comparison.
 */
export enum Role {
  SUPER_ADMIN = 'super_admin',
  ORG_ADMIN = 'org_admin',
  ORG_MANAGER = 'org_manager',
  AGENT = 'agent',
}

/** Higher number = more privileged. Used for delegated-administration checks. */
export const ROLE_LEVEL: Record<Role, number> = {
  [Role.SUPER_ADMIN]: 3,
  [Role.ORG_ADMIN]: 2,
  [Role.ORG_MANAGER]: 1,
  [Role.AGENT]: 0,
};

/** Every platform (dashboard/console) role. */
export const ALL_ROLES: Role[] = [
  Role.SUPER_ADMIN,
  Role.ORG_ADMIN,
  Role.ORG_MANAGER,
  Role.AGENT,
];

/** Every role that lives inside an organization (the tenant dashboard). */
export const ORG_ROLES: Role[] = [Role.ORG_ADMIN, Role.ORG_MANAGER, Role.AGENT];

/** Org roles that may manage/configure (everything except AGENT). */
export const ORG_STAFF: Role[] = [Role.ORG_ADMIN, Role.ORG_MANAGER];

/** True when `role` is one of the four platform roles (not a widget token). */
export const isPlatformRole = (role: unknown): role is Role =>
  typeof role === 'string' && (ALL_ROLES as string[]).includes(role);
