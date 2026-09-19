import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums/role.enum';

export const ROLES_KEY = 'roles';

/**
 * Restricts a route (or controller) to the listed roles. Enforced by
 * {@link RolesGuard}. A handler with no `@Roles(...)` is left as
 * authenticated-any, preserving existing behavior.
 *
 * @example
 * ```ts
 * @Roles(Role.SUPER_ADMIN)
 * @Get('overview')
 * getOverview() {}
 * ```
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
