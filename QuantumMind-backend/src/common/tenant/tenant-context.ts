import { NotFoundException } from '@nestjs/common';
import { Role } from '../enums/role.enum';

/**
 * The minimal per-request identity used for tenant scoping. Populated from the
 * JWT by `JwtStrategy.validate` and read off `request.user`.
 */
export interface TenantContext {
  _id: string;
  role: Role;
  organizationId: string | null;
}

/**
 * Injects the organization boundary into a Mongo filter.
 *
 * - SUPER_ADMIN is org-independent: the filter is returned unchanged (full
 *   cross-org visibility for management operations).
 * - Everyone else is pinned to their own `organizationId`. A caller-supplied
 *   `organizationId` in `filter` is always overwritten, so a client can never
 *   widen its own scope.
 *
 * Fail-closed: a non-super-admin with a missing organizationId resolves to
 * `{ organizationId: null }`, which matches only unassigned records rather
 * than leaking another tenant's data.
 *
 * @example
 * const bots = await this.botModel.find(scopedFilter(user, { status: 'active' }));
 */
export function scopedFilter<T extends Record<string, any>>(
  user: TenantContext | undefined,
  filter: T = {} as T,
): T & { organizationId?: string | null } {
  if (user?.role === Role.SUPER_ADMIN) {
    return filter;
  }
  return { ...filter, organizationId: user?.organizationId ?? null };
}

/** True when the caller may reach across organizations. */
export function isCrossOrg(user: TenantContext | undefined): boolean {
  return user?.role === Role.SUPER_ADMIN;
}

/**
 * Guards a single resource's ownership. Returns true when the caller may act on
 * a resource belonging to `resourceOrgId`. SUPER_ADMIN may act on anything;
 * everyone else only within their own organization.
 */
export function ownsResource(
  user: TenantContext | undefined,
  resourceOrgId: string | null | undefined,
): boolean {
  if (isCrossOrg(user)) return true;
  if (!user?.organizationId || !resourceOrgId) return false;
  return String(user.organizationId) === String(resourceOrgId);
}

/**
 * Throws NotFound when the caller may not act on a resource owned by another
 * organization. Uses 404 rather than 403 so cross-tenant probing cannot even
 * confirm the resource's existence. Call after loading a resource by id.
 */
export function assertOwnership(
  user: TenantContext | undefined,
  resource: { organizationId?: any } | null | undefined,
): void {
  if (!resource) {
    throw new NotFoundException('Resource not found');
  }
  if (!ownsResource(user, resource.organizationId?.toString?.() ?? null)) {
    throw new NotFoundException('Resource not found');
  }
}
