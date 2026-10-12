import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Public } from 'src/auth/Public/public.decorator';
import { AllowVisitor } from '../decorators/allow-visitor.decorator';
import { Roles } from '../decorators/roles.decorator';
import { Role } from '../enums/role.enum';
import { RolesGuard } from './roles.guard';

// Real decorated classes so the guard reads genuine metadata via Reflector.
@Roles(Role.ORG_ADMIN)
class AdminController {
  classLevel() {}

  @Roles(Role.AGENT)
  methodOverride() {}

  @Public()
  publicRoute() {}
}

class PlainController {
  undecorated() {}

  @Roles(Role.ORG_ADMIN, Role.ORG_MANAGER)
  managers() {}

  @Roles()
  emptyRoles() {}

  @AllowVisitor()
  @Roles(Role.SUPER_ADMIN)
  widgetOnly() {}

  @AllowVisitor()
  @Roles(Role.ORG_ADMIN)
  widgetOrAdmin() {}
}

function ctx(
  cls: new () => unknown,
  method: string,
  user?: unknown,
): ExecutionContext {
  const request = user === undefined ? {} : { user };
  return {
    getHandler: () => (cls.prototype as Record<string, unknown>)[method],
    getClass: () => cls,
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

const allow = (c: ExecutionContext, guard: RolesGuard) =>
  expect(guard.canActivate(c)).toBe(true);
const deny = (c: ExecutionContext, guard: RolesGuard) =>
  expect(() => guard.canActivate(c)).toThrow(ForbiddenException);

describe('RolesGuard', () => {
  const guard = new RolesGuard(new Reflector());

  describe('undecorated routes default to ORG roles', () => {
    it.each([Role.ORG_ADMIN, Role.ORG_MANAGER, Role.AGENT])('allows %s', (r) =>
      allow(ctx(PlainController, 'undecorated', { role: r }), guard),
    );

    it('allows SUPER_ADMIN (full access)', () =>
      allow(ctx(PlainController, 'undecorated', { role: Role.SUPER_ADMIN }), guard));

    it('treats empty @Roles() like undecorated', () => {
      allow(ctx(PlainController, 'emptyRoles', { role: Role.AGENT }), guard);
      allow(ctx(PlainController, 'emptyRoles', { role: Role.SUPER_ADMIN }), guard);
    });
  });

  describe('widget / visitor tokens', () => {
    it.each(['visitor', 'live', 'preview', 'admin', 'constructor'])(
      "rejects non-platform role '%s' on dashboard routes",
      (r) => deny(ctx(PlainController, 'undecorated', { role: r }), guard),
    );

    it('allows a widget token only on @AllowVisitor routes', () => {
      allow(ctx(PlainController, 'widgetOnly', { role: 'visitor' }), guard);
      allow(ctx(PlainController, 'widgetOnly', { role: 'live' }), guard);
    });

    it('@AllowVisitor does not widen dashboard roles', () => {
      deny(ctx(PlainController, 'widgetOnly', { role: Role.ORG_ADMIN }), guard);
      allow(ctx(PlainController, 'widgetOrAdmin', { role: Role.ORG_ADMIN }), guard);
      deny(ctx(PlainController, 'widgetOrAdmin', { role: Role.AGENT }), guard);
    });

    it('@AllowVisitor still requires an authenticated user', () =>
      deny(ctx(PlainController, 'widgetOnly'), guard));
  });

  it('skips @Public() routes even when request.user is undefined', () =>
    allow(ctx(AdminController, 'publicRoute'), guard));

  it('allows a user whose role is listed', () =>
    allow(ctx(PlainController, 'managers', { role: Role.ORG_MANAGER }), guard));

  it('throws 403 when role is not listed', () =>
    deny(ctx(PlainController, 'managers', { role: Role.AGENT }), guard));

  it('throws 403 (not 500) when request.user is missing', () =>
    deny(ctx(PlainController, 'managers'), guard));

  it('throws 403 when user has no role', () =>
    deny(ctx(PlainController, 'managers', {}), guard));

  it('applies class-level @Roles to undecorated methods', () => {
    allow(ctx(AdminController, 'classLevel', { role: Role.ORG_ADMIN }), guard);
    deny(ctx(AdminController, 'classLevel', { role: Role.AGENT }), guard);
  });

  it('method-level @Roles overrides class-level', () => {
    allow(ctx(AdminController, 'methodOverride', { role: Role.AGENT }), guard);
    deny(ctx(AdminController, 'methodOverride', { role: Role.ORG_ADMIN }), guard);
  });

  it('allows SUPER_ADMIN on org-staff routes', () =>
    allow(ctx(PlainController, 'managers', { role: Role.SUPER_ADMIN }), guard));
});
