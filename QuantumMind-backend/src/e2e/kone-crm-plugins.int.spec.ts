/**
 * crm-plugins-service-desk Phase 2 against the REAL CRM Postgres: plugin
 * toggles with dependencies, order, and the guard on a real Nest route
 * pipeline (roles + plugin). Opt-in: `npm run test:crm-int`.
 */
jest.mock("@nestjs/schedule", () => ({
  Interval: () => () => undefined,
  Cron: () => () => undefined,
  Timeout: () => () => undefined,
  CronExpression: new Proxy({}, { get: () => "* * * * *" }),
  ScheduleModule: { forRoot: () => ({}) },
}));

import * as dotenv from "dotenv";
import * as path from "path";
import { PrismaClient } from "@prisma/client";
import { Types } from "mongoose";
import { CrmPluginService } from "src/crm/plugins/crm-plugin.service";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });
const RUN = process.env.CRM_IT === "1";
const d = RUN ? describe : describe.skip;

const ORG = new Types.ObjectId().toString();
let prisma: PrismaClient;

d("CRM plugins on real Postgres", () => {
  beforeAll(async () => {
    prisma = new PrismaClient({ datasources: { db: { url: process.env.CRM_DATABASE_URL } } });
  });
  afterAll(async () => {
    if (!prisma) return;
    await prisma.crmPluginSetting.deleteMany({ where: { organizationId: ORG } });
    await prisma.$disconnect();
  });

  it("toggles with dependencies, survives a new service instance, keeps order", async () => {
    const svc = new CrmPluginService({ forOrg: () => prisma } as any);
    const off = await svc.setEnabled(ORG, "companies", false, "u1");
    expect(off.changes.map((c) => c.key)).toEqual(["companies", "deals"]);

    // A second instance (another server) reads the stored state, no cache.
    const other = new CrmPluginService({ forOrg: () => prisma } as any);
    expect(await other.isEnabled(ORG, "deals")).toBe(false);

    await other.setEnabled(ORG, "deals", true, "u2");
    expect((await other.list(ORG)).filter((p) => !p.core).every((p) => p.enabled)).toBe(true);

    await other.reorder(ORG, ["deals", "contacts"], "u2");
    expect((await new CrmPluginService({ forOrg: () => prisma } as any).list(ORG)).map((p) => p.key)).toEqual([
      "deals",
      "contacts",
      "service-requests",
      "companies",
    ]);
    const rows = await prisma.crmPluginSetting.findMany({ where: { organizationId: ORG } });
    expect(rows.every((r) => r.updatedById === "u2" || r.key === "companies")).toBe(true);
  });
});
