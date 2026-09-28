import {
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";

/**
 * Resolves the caller's organization id (the CRM tenant key) from the JWT.
 *
 * Every CRM route is tenant-scoped, so a token without an organization (e.g. a
 * SUPER_ADMIN acting globally) cannot read or write CRM data — it must act in
 * the context of an organization. Fails closed with 403 rather than silently
 * querying across tenants.
 */
export const OrgId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const organizationId = request.user?.organizationId;
    if (!organizationId) {
      throw new ForbiddenException(
        "This account is not attached to an organization, so it cannot access CRM data.",
      );
    }
    return String(organizationId);
  },
);
