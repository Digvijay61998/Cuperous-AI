/**
 * Negative/security tests for the multi-tenant RBAC feature (tasks 1.7, 2.6,
 * 3.7, 7.2). Exercises the real service logic with in-memory fakes, so no
 * database is needed.
 */
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Role } from '../enums/role.enum';
import {
  assertOwnership,
  ownsResource,
  scopedFilter,
  TenantContext,
} from './tenant-context';
import { EntitlementService } from 'src/billing/entitlement.service';
import { SubscriptionStatus } from 'src/billing/enums/subscription-status.enum';
import { tabsForRole, Tab } from '../constants/role-tabs';

const ORG_A = '64b000000000000000000001';
const ORG_B = '64b000000000000000000002';

const user = (role: Role, org: string | null, id = 'u1'): TenantContext => ({
  _id: id,
  role,
  organizationId: org,
});

// ---------------------------------------------------------------------------
describe('tenant-context', () => {
  it('pins non-super-admins to their own org and overwrites a spoofed org', () => {
    const f = scopedFilter(user(Role.ORG_ADMIN, ORG_A), {
      organizationId: ORG_B,
      status: 'active',
    } as any);
    expect(f).toEqual({ organizationId: ORG_A, status: 'active' });
  });

  it('fails closed for an org role with no org', () => {
    expect(scopedFilter(user(Role.AGENT, null), {})).toEqual({
      organizationId: null,
    });
    expect(scopedFilter(undefined, {})).toEqual({ organizationId: null });
  });

  it('leaves SUPER_ADMIN unscoped', () => {
    expect(scopedFilter(user(Role.SUPER_ADMIN, null), { a: 1 })).toEqual({ a: 1 });
  });

  it('cross-org resource access is a 404 (no existence leak)', () => {
    expect(() =>
      assertOwnership(user(Role.ORG_ADMIN, ORG_B), { organizationId: ORG_A }),
    ).toThrow(NotFoundException);
    expect(() => assertOwnership(user(Role.ORG_ADMIN, ORG_A), null)).toThrow(
      NotFoundException,
    );
    // An unowned (null-org) resource is never reachable by a tenant.
    expect(ownsResource(user(Role.ORG_ADMIN, ORG_A), null)).toBe(false);
    expect(() =>
      assertOwnership(user(Role.ORG_ADMIN, ORG_A), { organizationId: ORG_A }),
    ).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
describe('role -> tab matrix', () => {
  it('agents only get conversation-oriented tabs', () => {
    const t = tabsForRole(Role.AGENT);
    expect(t).not.toContain(Tab.BOTS);
    expect(t).not.toContain(Tab.AGENTS);
    expect(t).toContain(Tab.CONVERSATIONS);
  });
  it('managers do not see channel providers', () => {
    expect(tabsForRole(Role.ORG_MANAGER)).not.toContain(Tab.CHANNEL_PROVIDERS);
  });
  it('unknown roles get nothing', () => {
    expect(tabsForRole('visitor')).toEqual([]);
    expect(tabsForRole('__proto__')).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// AgentService delegated creation / update / delete
// ---------------------------------------------------------------------------
import { AgentService } from 'src/agent/agent.service';

function makeAgentService(opts: {
  existing?: any[];
  reserve?: jest.Mock;
  release?: jest.Mock;
  orgs?: Record<string, { status: string }>;
}) {
  const docs: any[] = [...(opts.existing ?? [])];
  const agentModel: any = {
    exists: jest.fn(async (q: any) => docs.some((d) => d.email === q.email)),
    create: jest.fn(async (d: any) => {
      const doc = { _id: 'new' + docs.length, ...d };
      docs.push(doc);
      return doc;
    }),
    findById: jest.fn(async (id: string) => {
      const d = docs.find((x) => String(x._id) === String(id));
      if (!d) return null;
      return {
        ...d,
        updateOne: jest.fn(async (c: any) => Object.assign(d, c)),
        remove: jest.fn(async () => docs.splice(docs.indexOf(d), 1)),
      };
    }),
  };
  const entitlement: any = {
    reserveQuota: opts.reserve ?? jest.fn(async () => undefined),
    releaseQuota: opts.release ?? jest.fn(async () => undefined),
  };
  const orgs = opts.orgs ?? { [ORG_A]: { status: 'active' }, [ORG_B]: { status: 'active' } };
  const organizationService: any = {
    findById: jest.fn(async (id: string) => (orgs[id] ? { _id: id, ...orgs[id] } : null)),
    assertActive: jest.fn(async (id: string) => {
      if (orgs[id]?.status === 'suspended') throw new ForbiddenException('suspended');
    }),
    isSuspended: jest.fn(async (id: string) => orgs[id]?.status === 'suspended'),
  };
  const config: any = { get: () => 4 };
  const svc = new AgentService(agentModel, config, {} as any, entitlement, organizationService);
  // No real Bot model in unit tests.
  (svc as any).filterOrgBots = jest.fn(async () => []);
  return { svc, docs, agentModel, entitlement };
}

const dto = (role?: Role, organizationId?: string) =>
  ({ name: 'n', email: `x${Math.random()}@t.io`, password: 'secret123', tags: [], role, organizationId } as any);

describe('AgentService delegated administration', () => {
  it.each([
    [Role.ORG_ADMIN, Role.ORG_MANAGER, true],
    [Role.ORG_ADMIN, Role.AGENT, true],
    [Role.ORG_ADMIN, Role.ORG_ADMIN, false],
    [Role.ORG_ADMIN, Role.SUPER_ADMIN, false],
    [Role.ORG_MANAGER, Role.AGENT, true],
    [Role.ORG_MANAGER, Role.ORG_MANAGER, false],
    [Role.ORG_MANAGER, Role.ORG_ADMIN, false],
    [Role.AGENT, Role.AGENT, false],
  ])('%s creating %s -> allowed=%s', async (actorRole, target, ok) => {
    const { svc } = makeAgentService({});
    const p = svc.create(dto(target), user(actorRole, ORG_A));
    if (ok) {
      const a: any = await p;
      expect(a.role).toBe(target);
      expect(String(a.organizationId)).toBe(ORG_A);
    } else {
      await expect(p).rejects.toMatchObject({ status: 403 });
    }
  });

  it('ignores a client-supplied organizationId for org creators', async () => {
    const { svc } = makeAgentService({});
    const a: any = await svc.create(dto(Role.AGENT, ORG_B), user(Role.ORG_ADMIN, ORG_A));
    expect(String(a.organizationId)).toBe(ORG_A);
  });

  it('SUPER_ADMIN may only create ORG_ADMIN, into an explicit existing org', async () => {
    const { svc } = makeAgentService({});
    const sa = user(Role.SUPER_ADMIN, null);
    await expect(svc.create(dto(Role.AGENT, ORG_A), sa)).rejects.toMatchObject({ status: 403 });
    await expect(svc.create(dto(Role.ORG_ADMIN), sa)).rejects.toMatchObject({ status: 400 });
    await expect(
      svc.create(dto(Role.ORG_ADMIN, '64b0000000000000000000ff'), sa),
    ).rejects.toMatchObject({ status: 400 });
    const a: any = await svc.create(dto(Role.ORG_ADMIN, ORG_A), sa);
    expect(a.role).toBe(Role.ORG_ADMIN);
  });

  it('owner provisioning does not consume agent quota; staff creation does', async () => {
    const reserve = jest.fn(async () => undefined);
    const { svc } = makeAgentService({ reserve });
    await svc.create(dto(Role.ORG_ADMIN, ORG_A), user(Role.SUPER_ADMIN, null));
    expect(reserve).not.toHaveBeenCalled();
    await svc.create(dto(Role.AGENT), user(Role.ORG_ADMIN, ORG_A));
    expect(reserve).toHaveBeenCalledWith(ORG_A, 'agent');
  });

  it('refuses to create users in a suspended org', async () => {
    const { svc } = makeAgentService({ orgs: { [ORG_A]: { status: 'suspended' } } });
    await expect(svc.create(dto(Role.AGENT), user(Role.ORG_ADMIN, ORG_A))).rejects.toMatchObject({
      status: 403,
    });
  });

  it('duplicate email -> 409 and quota is not consumed', async () => {
    const reserve = jest.fn(async () => undefined);
    const { svc } = makeAgentService({ reserve, existing: [{ _id: 'e1', email: 'dup@t.io' }] });
    await expect(
      svc.create({ ...dto(Role.AGENT), email: ' DUP@t.io ' }, user(Role.ORG_ADMIN, ORG_A)),
    ).rejects.toMatchObject({ status: 409 });
    expect(reserve).not.toHaveBeenCalled();
  });

  it('quota exhausted -> 403, nothing created', async () => {
    const reserve = jest.fn(async () => {
      throw new ForbiddenException('limit');
    });
    const { svc, agentModel } = makeAgentService({ reserve });
    await expect(svc.create(dto(Role.AGENT), user(Role.ORG_ADMIN, ORG_A))).rejects.toMatchObject({
      status: 403,
    });
    expect(agentModel.create).not.toHaveBeenCalled();
  });

  describe('update/delete', () => {
    const OID = (n: number) => `64c00000000000000000000${n}`;
    const seed = () => [
      { _id: OID(1), role: Role.ORG_ADMIN, organizationId: ORG_A, active: true },
      { _id: OID(2), role: Role.ORG_MANAGER, organizationId: ORG_A, active: true },
      { _id: OID(3), role: Role.AGENT, organizationId: ORG_A, active: true },
      { _id: OID(4), role: Role.AGENT, organizationId: ORG_B, active: true },
    ];

    it('an agent cannot promote themselves', async () => {
      const { svc } = makeAgentService({ existing: seed() });
      await expect(
        svc.update(OID(3), { role: Role.ORG_ADMIN } as any, user(Role.AGENT, ORG_A, OID(3))),
      ).rejects.toMatchObject({ status: 403 });
    });

    it('an agent cannot edit a peer', async () => {
      const { svc } = makeAgentService({
        existing: [...seed(), { _id: OID(5), role: Role.AGENT, organizationId: ORG_A }],
      });
      await expect(
        svc.update(OID(5), { name: 'x' } as any, user(Role.AGENT, ORG_A, OID(3))),
      ).rejects.toMatchObject({ status: 403 });
    });

    it('a manager cannot edit or delete the org admin', async () => {
      const { svc } = makeAgentService({ existing: seed() });
      const mgr = user(Role.ORG_MANAGER, ORG_A, OID(2));
      await expect(svc.update(OID(1), { name: 'x' } as any, mgr)).rejects.toMatchObject({ status: 403 });
      await expect(svc.remove(OID(1), mgr)).rejects.toMatchObject({ status: 403 });
    });

    it('an admin cannot promote a user to their own level', async () => {
      const { svc } = makeAgentService({ existing: seed() });
      await expect(
        svc.update(OID(3), { role: Role.ORG_ADMIN } as any, user(Role.ORG_ADMIN, ORG_A, OID(1))),
      ).rejects.toMatchObject({ status: 403 });
    });

    it('cross-org update/delete -> 404', async () => {
      const { svc } = makeAgentService({ existing: seed() });
      const admin = user(Role.ORG_ADMIN, ORG_A, OID(1));
      await expect(svc.update(OID(4), { name: 'x' } as any, admin)).rejects.toMatchObject({ status: 404 });
      await expect(svc.remove(OID(4), admin)).rejects.toMatchObject({ status: 404 });
      await expect(svc.remove('not-an-id', admin)).rejects.toMatchObject({ status: 404 });
    });

    it('nobody can delete themselves', async () => {
      const { svc } = makeAgentService({ existing: seed() });
      await expect(svc.remove(OID(1), user(Role.ORG_ADMIN, ORG_A, OID(1)))).rejects.toMatchObject({
        status: 403,
      });
    });

    it('deleting a staff user releases one agent slot', async () => {
      const release = jest.fn(async () => undefined);
      const { svc } = makeAgentService({ existing: seed(), release });
      (global as any).__noOrgModel = true;
      await svc.remove(OID(3), user(Role.ORG_ADMIN, ORG_A, OID(1)));
      expect(release).toHaveBeenCalledWith(ORG_A, 'agent');
    });

    it('organizationId in an update body is ignored', async () => {
      const { svc, docs } = makeAgentService({ existing: seed() });
      await svc.update(
        OID(3),
        { name: 'renamed', organizationId: ORG_B } as any,
        user(Role.ORG_ADMIN, ORG_A, OID(1)),
      );
      const d = docs.find((x) => x._id === OID(3));
      expect(d.organizationId).toBe(ORG_A);
      expect(d.name).toBe('renamed');
    });
  });
});

// ---------------------------------------------------------------------------
// EntitlementService: merge, fail-closed, race-safe quota
// ---------------------------------------------------------------------------
function makeEntitlements(
  sub: any,
  plan: any,
  counters: Record<string, number> = {},
  // Real usage in the source collections; defaults to "matches the counter".
  actual: Record<string, number> = {},
) {
  const lean = (v: any) => ({ lean: async () => v });
  const subscriptionModel: any = { findOne: jest.fn(() => lean(sub)) };
  const planModel: any = { findById: jest.fn(() => lean(plan)) };
  // Atomic counter emulation: JS is single-threaded, so each call is atomic,
  // exactly like Mongo's findOneAndUpdate with a $lt guard.
  const orgSvc: any = {
    reserveCounter: jest.fn(async (_id: string, field: string, limit: number) => {
      const v = counters[field] ?? 0;
      if (v < limit) {
        counters[field] = v + 1;
        return true;
      }
      return false;
    }),
    releaseCounter: jest.fn(async (_id: string, field: string) => {
      if ((counters[field] ?? 0) > 0) counters[field] -= 1;
    }),
    recountCounter: jest.fn(async (_id: string, field: string) => {
      const before = counters[field] ?? 0;
      const after = field in actual ? actual[field] : before;
      counters[field] = after;
      return { before, after };
    }),
  };
  return { svc: new EntitlementService(planModel, subscriptionModel, orgSvc), counters };
}

const PLAN = {
  limits: { maxBots: 2, maxAgents: 10, maxPlatforms: 1, maxTemplates: 5 },
  features: { 'channel.telegram': true, 'channel.facebook': false },
};

describe('EntitlementService', () => {
  it('override beats plan; unknown feature keys never surface', async () => {
    const { svc } = makeEntitlements(
      {
        planId: 'p',
        status: SubscriptionStatus.ACTIVE,
        overrides: {
          limits: { maxBots: 7, maxAgents: -3, maxTemplates: 'abc' },
          features: { 'channel.facebook': true, 'evil.key': true, 'channel.telegram': 'yes' },
        },
      },
      PLAN,
    );
    const e = await svc.getEffective(ORG_A);
    expect(e.limits.maxBots).toBe(7);
    expect(e.limits.maxAgents).toBe(10); // invalid override ignored
    expect(e.limits.maxTemplates).toBe(5);
    expect(e.features['channel.facebook']).toBe(true);
    expect(e.features['channel.telegram']).toBe(true); // non-boolean override ignored
    expect((e.features as any)['evil.key']).toBeUndefined();
  });

  it('no subscription -> fail closed (0 limits, no features)', async () => {
    const { svc } = makeEntitlements(null, PLAN);
    await expect(svc.reserveQuota(ORG_A, 'bot')).rejects.toBeInstanceOf(ForbiddenException);
    expect(await svc.isFeatureEnabled(ORG_A, 'channel.telegram')).toBe(false);
  });

  it('canceled subscription -> fail closed', async () => {
    const { svc } = makeEntitlements(
      { planId: 'p', status: SubscriptionStatus.CANCELED, overrides: {} },
      PLAN,
    );
    await expect(svc.reserveQuota(ORG_A, 'bot')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('missing org id -> feature disabled', async () => {
    const { svc } = makeEntitlements({ planId: 'p', overrides: {} }, PLAN);
    expect(await svc.isFeatureEnabled('', 'channel.telegram')).toBe(false);
  });

  it('concurrent creates never exceed the limit (quota race)', async () => {
    const { svc, counters } = makeEntitlements(
      { planId: 'p', status: SubscriptionStatus.ACTIVE, overrides: {} },
      PLAN,
    );
    const results = await Promise.allSettled(
      Array.from({ length: 10 }, () => svc.reserveQuota(ORG_A, 'bot')),
    );
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(2);
    expect(counters.botCount).toBe(2);
  });

  it('downgrade below usage blocks new creates without touching usage', async () => {
    const { svc, counters } = makeEntitlements(
      { planId: 'p', status: SubscriptionStatus.ACTIVE, overrides: { limits: { maxBots: 1 } } },
      PLAN,
      { botCount: 3 },
    );
    await expect(svc.reserveQuota(ORG_A, 'bot')).rejects.toBeInstanceOf(ForbiddenException);
    expect(counters.botCount).toBe(3);
  });

  it('a drifted counter is repaired from real usage instead of blocking', async () => {
    // Counter says 2/2 but both bots were deleted: the create must succeed.
    const { svc, counters } = makeEntitlements(
      { planId: 'p', status: SubscriptionStatus.ACTIVE, overrides: {} },
      PLAN,
      { botCount: 2 },
      { botCount: 0 },
    );
    await expect(svc.reserveQuota(ORG_A, 'bot')).resolves.toBeUndefined();
    expect(counters.botCount).toBe(1);
  });

  it('a drifted platform counter is repaired too', async () => {
    const { svc, counters } = makeEntitlements(
      { planId: 'p', status: SubscriptionStatus.ACTIVE, overrides: {} },
      PLAN,
      { platformCount: 1 },
      { platformCount: 0 },
    );
    await svc.reserveQuota(ORG_A, 'platform');
    expect(counters.platformCount).toBe(1);
  });

  it('real usage at the limit is still refused after a recount', async () => {
    const { svc, counters } = makeEntitlements(
      { planId: 'p', status: SubscriptionStatus.ACTIVE, overrides: {} },
      PLAN,
      { botCount: 2 },
      { botCount: 2 },
    );
    await expect(svc.reserveQuota(ORG_A, 'bot')).rejects.toBeInstanceOf(ForbiddenException);
    expect(counters.botCount).toBe(2);
  });

  it('release never drives a counter negative', async () => {
    const { svc, counters } = makeEntitlements({ planId: 'p', overrides: {} }, PLAN, { platformCount: 0 });
    await svc.releaseQuota(ORG_A, 'platform');
    expect(counters.platformCount).toBe(0);
  });

  it('platform quota is enforced', async () => {
    const { svc } = makeEntitlements(
      { planId: 'p', status: SubscriptionStatus.ACTIVE, overrides: {} },
      PLAN,
    );
    await svc.reserveQuota(ORG_A, 'platform');
    await expect(svc.reserveQuota(ORG_A, 'platform')).rejects.toBeInstanceOf(ForbiddenException);
  });
});
