/**
 * crm-plugins-service-desk Phase 1 against the REAL CRM Postgres: versioned
 * emails/phones (R21), platform ids (R22) and concurrency on the
 * contactIdentifier unique key (Property 1).
 *
 * Opt-in like kone-crm.int.spec.ts: `npm run test:crm-int`. Uses a fresh
 * organization id and deletes every row it wrote.
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
import { ContactResolverService } from "src/crm-bridge/contact-resolver.service";
import { cleanDetails } from "src/crm-bridge/identity";
import { ContactsService } from "src/crm/contacts/contacts.service";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });
const RUN = process.env.CRM_IT === "1";
const d = RUN ? describe : describe.skip;

const ORG = new Types.ObjectId().toString();
let prisma: PrismaClient;
let resolver: ContactResolverService;

const active = () => prisma.contact.findMany({ where: { organizationId: ORG, archivedAt: null } });
const ids = (contactId: string) =>
  prisma.contactIdentifier.findMany({ where: { organizationId: ORG, contactId }, orderBy: { lastSeenAt: "desc" } });

d("contact identifiers on real Postgres", () => {
  beforeAll(async () => {
    prisma = new PrismaClient({ datasources: { db: { url: process.env.CRM_DATABASE_URL } } });
    await prisma.$queryRaw`SELECT 1`;
    resolver = new ContactResolverService({ forOrg: () => prisma } as any);
  });
  afterEach(async () => {
    await prisma.contactFact.deleteMany({ where: { organizationId: ORG } });
    await prisma.activity.deleteMany({ where: { organizationId: ORG } });
    await prisma.contact.deleteMany({ where: { organizationId: ORG } });
  });
  afterAll(async () => {
    if (!prisma) return;
    expect(await prisma.contactIdentifier.count({ where: { organizationId: ORG } })).toBe(0);
    await prisma.$disconnect();
  });

  it("a new email on a phone match becomes Current, the old one is kept and still matches (R21.1–R21.3)", async () => {
    await resolver.resolve(ORG, { details: cleanDetails({ name: "Raj Kumar", email: "old@x.com", phone: "+91 98765 43210" }), source: "widget_form" });
    await resolver.resolve(ORG, { details: cleanDetails({ email: "new@x.com", phone: "+919876543210" }), source: "widget_chat" });
    let rows = await active();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ email: "new@x.com", phone: "+919876543210", sourceChannel: "widget_form" });
    expect((await ids(rows[0].id)).map((i) => `${i.kind}:${i.value}`).sort()).toEqual([
      "EMAIL:new@x.com",
      "EMAIL:old@x.com",
      "PHONE:919876543210",
    ]);
    // The old email still finds Raj and is Current again.
    const out: any = await resolver.resolve(ORG, { details: cleanDetails({ email: "OLD@x.com" }) });
    rows = await active();
    expect(out.contactId).toBe(rows[0].id);
    expect(rows).toHaveLength(1);
    expect(rows[0].email).toBe("old@x.com");
  });

  it("a Telegram lead is created by its user id and merged into a known contact when identified (R22.3, R22.4)", async () => {
    const known: any = await resolver.resolve(ORG, { details: cleanDetails({ name: "Rajesh", email: "raj@x.com" }) });
    const lead: any = await resolver.resolve(ORG, {
      details: cleanDetails({ name: "Raj", channel: { kind: "TELEGRAM", value: "777001" } }),
      source: "telegram",
    });
    expect(lead.created).toBe(true);
    const merged: any = await resolver.resolve(ORG, {
      details: cleanDetails({ email: "raj@x.com" }),
      currentContactId: lead.contactId,
    });
    expect(merged).toMatchObject({ contactId: known.contactId, merged: true });
    expect((await active()).map((c) => c.id)).toEqual([known.contactId]);
    expect((await ids(known.contactId)).map((i) => i.kind).sort()).toEqual(["EMAIL", "TELEGRAM"]);
  });

  it("search finds a contact by an earlier email and by phone digits (R21.7)", async () => {
    await resolver.resolve(ORG, { details: cleanDetails({ name: "Raj", email: "first@x.com", phone: "+919876543210" }) });
    await resolver.resolve(ORG, { details: cleanDetails({ email: "second@x.com", phone: "+919876543210" }) });
    const contacts = new ContactsService({ forOrg: () => prisma } as any, { tableData: async () => ({ valuesByRecord: {}, columns: [] }) } as any, {} as any);
    for (const q of ["first@x", "98765 432", "second"]) {
      const res = await contacts.list(ORG, { q, page: 1, pageSize: 25 } as any);
      expect(res.rows.map((r: any) => r.email)).toEqual(["second@x.com"]);
    }
    const detail: any = await contacts.byId(ORG, (await active())[0].id);
    expect(detail.identifiers[0]).toMatchObject({ kind: expect.any(String), display: expect.any(String) });
  });

  it("concurrent mixed captures of one person: no identifier with two active owners (Property 1)", async () => {
    const tg = { kind: "TELEGRAM", value: "990011" };
    const caps = [
      { email: "p1@x.com" },
      { phone: "+15550001111", channel: tg },
      { channel: tg },
      { email: "p1@x.com", channel: tg },
      { email: "p2@x.com", phone: "+15550001111" },
      { phone: "+15550001111" },
    ];
    await Promise.all(caps.map((c) => resolver.resolve(ORG, { details: cleanDetails(c) })));
    const owners = await prisma.$queryRaw<{ n: bigint }[]>`
      SELECT count(DISTINCT i."contactId") AS n FROM "contactIdentifier" i
      JOIN "contact" c ON c.id = i."contactId" AND c."archivedAt" IS NULL
      WHERE i."organizationId" = ${ORG}
      GROUP BY i.kind, i.value HAVING count(DISTINCT i."contactId") > 1`;
    expect(owners).toHaveLength(0);
  });
});
