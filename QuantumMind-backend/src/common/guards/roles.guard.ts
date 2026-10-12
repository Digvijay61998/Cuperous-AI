import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from 'src/auth/constants';
import { ALLOW_VISITOR_KEY } from '../decorators/allow-visitor.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { isPlatformRole, ORG_ROLES, Role } from '../enums/role.enum';

/**
 * Authorizes requests against the `@Roles(...)` metadata.
 *
 * Registered as a global guard AFTER `JwtAuthGuard`, so `request.user` is
 * already populated by the time this runs. Behavior:
 *  - `@Public()` routes are skipped.
 *  - Widget tokens (role is not a platform role, e.g. `visitor`/`live`) are
 *    rejected unless the route is marked `@AllowVisitor()`.
 *  - Routes with `@Roles(...)` require the user's role to be in the list.
 *  - Routes with no `@Roles(...)` default to the ORG roles (ORG_ADMIN,
 *    ORG_MANAGER, AGENT). They are tenant-dashboard routes; data inside is
 *    org-scoped by the services.
 *  - Method-level `@Roles(...)` overrides class-level (`getAllAndOverride`).
 *  - A missing `request.user` or role yields 403 (never a 500).
 *
 * SUPER_ADMIN passes every role check: it can perform all CRUD an ORG_ADMIN
 * can, across all organizations. Impersonation remains available for acting
 * "as" a specific org (org-scoped token, audit-logged).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const targets = [context.getHandler(), context.getClass()];

    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      targets,
    );
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const userRole = request?.user?.role;

    if (!isPlatformRole(userRole)) {
      const allowVisitor = this.reflector.getAllAndOverride<boolean>(
        ALLOW_VISITOR_KEY,
        targets,
      );
      if (allowVisitor && request?.user) return true;
      throw new ForbiddenException(
        'You do not have permission to perform this action',
      );
    }

    // SUPER_ADMIN may perform every dashboard operation an ORG_ADMIN can, in
    // any organization. Data access stays correct because the tenant helpers
    // (scopedFilter / ownsResource / TenantScopeService) treat SUPER_ADMIN as
    // cross-org.
    if (userRole === Role.SUPER_ADMIN) return true;

    const declared = this.reflector.getAllAndOverride<Role[]>(
      ROLES_KEY,
      targets,
    );
    const requiredRoles =
      declared && declared.length > 0 ? declared : ORG_ROLES;

    if (!requiredRoles.includes(userRole)) {
      throw new ForbiddenException(
        'You do not have permission to perform this action',
      );
    }
    return true;
  }
}
