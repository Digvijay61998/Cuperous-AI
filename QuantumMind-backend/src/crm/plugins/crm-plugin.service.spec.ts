jest.mock("@nestjs/schedule", () => ({
  Interval: () => () => undefined,
  Cron: () => () => undefined,
  Timeout: () => () => undefined,
  CronExpression: new Proxy({}, { get: () => "* * * * *" }),
  ScheduleModule: { forRoot: () => ({}) },
}));
import { BadRequestException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "src/common/decorators/roles.decorator";
import { ORG_ROLES, ORG_STAFF, Role } from "src/common/enums/role.enum";
import { ActivitiesController } from "../activities/activities.controller";
import { CompaniesController } from "../companies/companies.controller";
import { DealsController } from "../deals/deals.controller";
import { FieldsController } from "../fields/fields.controller";
import { SavedViewsController } from "../saved-views/saved-views.controller";
import { CrmPluginController } from "./crm-plugin.controller";
import { CrmPluginGuard } from "./crm-plugin.guard";
import { CrmPluginService, PLUGIN_CACHE_TTL_MS } from "./crm-plugin.service";
import { pluginForActivity, pluginForEntity, REQUIRES_CRM_PLUGIN_KEY } from "./requires-crm-plugin.decorator";

/** crmPluginSetting with the (organizationId, key) unique key. */
function fakeCrm() {
  const rows: any[] = [];
  const reads = { n: 0 };
  const table = {
    findMany: async ({ where }: any) => {
      reads.n++;
      return rows.filter((r) => r.organizationId === where.organizationId).map((r) => ({ ...r }));
    },
    upsert: async ({ where, create, update }: any) => {
      const k = where.organizationId_key;
      const row = rows.find((r) => r.organizationId === k.organizationId && r.key === k.key);
      if (row) Object.assign(row, update);
      else rows.push({ ...create });
      return {};
    },
  };
  const client = {
    crmPluginSetting: table,
    $transaction: async (ops: Promise<any>[]) => Promise.all(ops),
  };
  return { rows, reads, crm: { forOrg: () => client } as any };
}

describe("CrmPluginService", () => {
  it("lists every plugin with its state, labels and dependencies", async () => {
    const f = fakeCrm();
    const list = await new CrmPluginService(f.crm).list("o1");
    expect(list.map((p) => [p.key, p.core, p.enabled])).toEqual([
      ["contacts", true, true],
      ["service-requests", true, true],
      ["companies", false, true],
      ["deals", false, true],
    ]);
    expect(list.find((p) => p.key === "companies")!.requiredBy).toEqual(["deals"]);
  });

  it("turns Companies off together with Deals, records who did it, keeps other orgs apart (R7.4, R7.7)", async () => {
    const f = fakeCrm();
    const svc = new CrmPluginService(f.crm);
    const out = await svc.setEnabled("o1", "companies", false, "u1");
    expect(out.changes.map((c) => [c.key, c.enabled])).toEqual([
      ["companies", false],
      ["deals", false],
    ]);
    expect(f.rows.every((r) => r.updatedById === "u1" && r.organizationId === "o1")).toBe(true);
    expect(await svc.isEnabled("o1", "deals")).toBe(false);
    expect(await svc.isEnabled("o2", "deals")).toBe(true);
    expect(await svc.isEnabled("o1", "contacts")).toBe(true);
  });

  it("dry run saves nothing (R7.4)", async () => {
    const f = fakeCrm();
    const out = await new CrmPluginService(f.crm).setEnabled("o1", "companies", false, "u1", { dryRun: true });
    expect(out.changes).toHaveLength(2);
    expect(f.rows).toEqual([]);
  });

  it("rejects core and unknown plugins", async () => {
    const svc = new CrmPluginService(fakeCrm().crm);
    await expect(svc.setEnabled("o1", "contacts", false, "u1")).rejects.toBeInstanceOf(BadRequestException);
    await expect(svc.setEnabled("o1", "invoices", true, "u1")).rejects.toBeInstanceOf(NotFoundException);
    await expect(svc.reorder("o1", ["nope"], "u1")).rejects.toBeInstanceOf(BadRequestException);
  });

  it("re-enabling shows the same state; data is never touched (R7.5)", async () => {
    const f = fakeCrm();
    const svc = new CrmPluginService(f.crm);
    await svc.setEnabled("o1", "companies", false, "u1");
    await svc.setEnabled("o1", "deals", true, "u1");
    expect((await svc.list("o1")).filter((p) => !p.core).map((p) => p.enabled)).toEqual([true, true]);
  });

  it("reorders and keeps the order", async () => {
    const f = fakeCrm();
    const svc = new CrmPluginService(f.crm);
    await svc.reorder("o1", ["deals", "companies"], "u1");
    expect((await svc.list("o1")).map((p) => p.key)).toEqual(["deals", "companies", "contacts", "service-requests"]);
  });

  it("caches reads for the TTL and refreshes after it (R8.5)", async () => {
    const f = fakeCrm();
    const svc = new CrmPluginService(f.crm);
    const now = jest.spyOn(Date, "now").mockReturnValue(1_000);
    await svc.isEnabled("o1", "deals");
    await svc.isEnabled("o1", "companies");
    expect(f.reads.n).toBe(1);
    now.mockReturnValue(1_000 + PLUGIN_CACHE_TTL_MS + 1);
    await svc.isEnabled("o1", "deals");
    expect(f.reads.n).toBe(2);
    now.mockRestore();
  });
});

describe("CrmPluginController roles (R7.2, D2)", () => {
  it("everyone in the org reads; only admins and managers write", () => {
    const roles = (m: string) => Reflect.getMetadata(ROLES_KEY, (CrmPluginController.prototype as any)[m]);
    expect(roles("list")).toEqual(ORG_ROLES);
    expect(roles("setEnabled")).toEqual(ORG_STAFF);
    expect(roles("reorder")).toEqual(ORG_STAFF);
    expect(ORG_STAFF).not.toContain(Role.AGENT);
  });

  it("Companies, Deals and the shared entity routes are guarded", () => {
    for (const C of [CompaniesController, DealsController, FieldsController, SavedViewsController, ActivitiesController]) {
      expect(Reflect.getMetadata("__guards__", C)).toContain(CrmPluginGuard);
      expect(Reflect.getMetadata(REQUIRES_CRM_PLUGIN_KEY, C)).toBeDefined();
    }
    expect(Reflect.getMetadata(REQUIRES_CRM_PLUGIN_KEY, CompaniesController)).toBe("companies");
    expect(Reflect.getMetadata(REQUIRES_CRM_PLUGIN_KEY, DealsController)).toBe("deals");
  });
});

describe("CrmPluginGuard (R8.3)", () => {
  const ctx = (req: any, requirement: any) => {
    const reflector = { getAllAndOverride: (k: string) => (k === REQUIRES_CRM_PLUGIN_KEY ? requirement : undefined) } as any as Reflector;
    return {
      reflector,
      context: {
        getHandler: () => undefined,
        getClass: () => undefined,
        switchToHttp: () => ({ getRequest: () => req }),
      } as any,
    };
  };
  const plugins = (enabled: boolean) => ({ isEnabled: jest.fn(async () => enabled) }) as any;

  it("blocks a request for a disabled plugin with its name", async () => {
    const { reflector, context } = ctx({ user: { organizationId: "o1" } }, "deals");
    const guard = new CrmPluginGuard(reflector, plugins(false));
    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    await expect(guard.canActivate(context)).rejects.toThrow(/Deals module is turned off/);
  });

  it("lets through enabled plugins, routes without a requirement, and requests without an org", async () => {
    const p = plugins(true);
    expect(await new CrmPluginGuard(ctx({ user: { organizationId: "o1" } }, "deals").reflector, p).canActivate(ctx({ user: { organizationId: "o1" } }, "deals").context)).toBe(true);
    const off = plugins(false);
    expect(await new CrmPluginGuard(ctx({}, undefined).reflector, off).canActivate(ctx({}, undefined).context)).toBe(true);
    expect(await new CrmPluginGuard(ctx({ user: {} }, "deals").reflector, off).canActivate(ctx({ user: {} }, "deals").context)).toBe(true);
  });

  it("shared routes: the entity in the request decides", async () => {
    const off = plugins(false);
    const deal = ctx({ user: { organizationId: "o1" }, query: { entity: "DEAL" } }, pluginForEntity);
    await expect(new CrmPluginGuard(deal.reflector, off).canActivate(deal.context)).rejects.toThrow(ForbiddenException);
    const contact = ctx({ user: { organizationId: "o1" }, body: { entity: "CONTACT" } }, pluginForEntity);
    expect(await new CrmPluginGuard(contact.reflector, off).canActivate(contact.context)).toBe(true);
    expect(pluginForActivity({ body: { companyId: "c1" } })).toBe("companies");
    expect(pluginForActivity({ query: { dealId: "d1", companyId: "c1" } })).toBe("deals");
    expect(pluginForActivity({ query: { contactId: "x" } })).toBeNull();
  });

  it("fails open when the plugin state cannot be read (the route reports the real error)", async () => {
    const { reflector, context } = ctx({ user: { organizationId: "o1" } }, "deals");
    const broken = { isEnabled: jest.fn(async () => { throw new Error("db down"); }) } as any;
    expect(await new CrmPluginGuard(reflector, broken).canActivate(context)).toBe(true);
  });
});
