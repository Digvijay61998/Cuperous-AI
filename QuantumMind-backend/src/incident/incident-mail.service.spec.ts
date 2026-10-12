jest.mock("@nestjs/schedule", () => ({
  Interval: () => () => undefined,
  Cron: () => () => undefined,
  Timeout: () => () => undefined,
  CronExpression: new Proxy({}, { get: () => "* * * * *" }),
  ScheduleModule: { forRoot: () => ({}) },
}));

import { Types } from "mongoose";
import { Role } from "src/common/enums/role.enum";
import { sanitizeIncidentSettings } from "src/bots/incident-settings";
import { renderHandoverMessage } from "src/message-handler/message-handler.service";
import { IncidentMailService } from "./incident-mail.service";

const ORG = "64b000000000000000000001";

function setup(opts: { contact?: any; visitor?: any; mailFails?: boolean } = {}) {
  const inc: any = {
    _id: new Types.ObjectId(),
    organizationId: ORG,
    crmContactId: "c1",
    visitorId: "64c0000000000000000000a1",
    ticketRef: "SR_ABC123",
    problem: "Door <b>stuck</b>",
    createdAt: new Date("2026-10-07T15:42:00Z"),
    agentId: "a1",
  };
  const docs = [inc];
  const q = (v: any) => ({ lean: async () => (v ? { ...v } : null), select: () => q(v), catch: () => q(v) });
  const model: any = {
    db: {
      models: {
        Visitor: { findById: () => ({ select: () => ({ lean: () => ({ catch: async () => opts.visitor ?? null }) }) }) },
        Organization: {
          findById: () => ({ select: () => ({ lean: () => ({ catch: async () => ({ name: "Acme Lifts", timeZone: "Asia/Kolkata" }) }) }) }),
        },
      },
    },
    findOneAndUpdate: (query: any, u: any) => ({
      lean: async () => {
        const d = docs.find((x) => String(x._id) === String(query._id));
        const ack = d?.mail?.ack;
        if (!d || (ack && ack.status !== "no_email")) return null;
        d.mail = { ack: u.$set["mail.ack"] };
        return { ...d };
      },
    }),
    updateOne: (query: any, u: any) => ({
      catch: async () => {
        const d = docs.find((x) => String(x._id) === String(query._id));
        if (d) d.mail = { ack: u.$set["mail.ack"] };
      },
    }),
  };
  const sent: any[] = [];
  const mails = {
    sendTemplate: jest.fn(async (to: string, subject: string, template: string, ctx: any) => {
      if (opts.mailFails) throw new Error("smtp down");
      sent.push({ to, subject, template, ctx });
    }),
  };
  const activities: any[] = [];
  const crm = {
    forOrg: () => ({
      contact: { findFirst: async () => opts.contact ?? null },
      activity: { create: async ({ data }: any) => activities.push(data) },
    }),
  };
  const incidents = {
    findOneScoped: jest.fn(async () => ({ ...inc })),
    findOpenByConversation: jest.fn(async () => inc),
  };
  const svc = new IncidentMailService(model, incidents as any, crm as any, mails as any);
  (svc as any).logger.warn = () => undefined;
  return { svc, inc, sent, mails, activities };
}

describe("IncidentMailService", () => {
  it("acks once to the CRM email with the date in the org zone", async () => {
    const h = setup({ contact: { email: "Raj@Example.com", firstName: "Raj", isAnonymous: false } });
    expect(await h.svc.sendAcknowledgement(String(h.inc._id))).toBe("sent");
    expect(await h.svc.sendAcknowledgement(String(h.inc._id))).toBe("skipped");
    expect(h.sent).toHaveLength(1);
    expect(h.sent[0]).toMatchObject({ to: "raj@example.com", template: "ticket-ack.hbs" });
    expect(h.sent[0].ctx).toMatchObject({ name: "Raj", orgName: "Acme Lifts", ticketRef: "SR_ABC123" });
    expect(h.sent[0].ctx.date).toMatch(/07 Oct 2026, 21:12/);
    expect(h.inc.mail.ack.status).toBe("sent");
  });

  it("never mails a placeholder visitor email; records no_email and retries after a link", async () => {
    const h = setup({ visitor: { email: "visitor_x@nomemail.com", name: "Anonymous" } });
    expect(await h.svc.sendAcknowledgement(String(h.inc._id))).toBe("skipped");
    expect(h.inc.mail.ack.status).toBe("no_email");
    expect(h.sent).toHaveLength(0);
    // Contact gains an email later.
    (h.svc as any).crm = { forOrg: () => ({ contact: { findFirst: async () => ({ email: "a@b.co", firstName: "A" }) } }) };
    await h.svc.onContactLinked({ conversationId: "c" });
    expect(h.sent).toHaveLength(1);
  });

  it("records a failed delivery instead of throwing", async () => {
    const h = setup({ contact: { email: "a@b.co", firstName: "A" }, mailFails: true });
    expect(await h.svc.sendAcknowledgement(String(h.inc._id))).toBe("failed");
    expect(h.inc.mail.ack).toMatchObject({ status: "failed", error: "smtp down" });
  });

  it("email reply: validates, checks the handler, sends and records an activity", async () => {
    const h = setup({ contact: { email: "a@b.co", firstName: "A" } });
    const agent = { _id: "a1", role: Role.AGENT, organizationId: ORG, name: "Priya" } as any;
    await expect(h.svc.emailReply(String(h.inc._id), agent, "   ")).rejects.toThrow(/1 to 5000/);
    await expect(
      h.svc.emailReply(String(h.inc._id), { ...agent, _id: "a2" }, "Hello"),
    ).rejects.toThrow(/Only the agent/);
    // An org admin may reply on anyone's incident.
    await h.svc.emailReply(String(h.inc._id), { ...agent, _id: "admin", role: Role.ORG_ADMIN }, "Hi from admin");
    const res = await h.svc.emailReply(String(h.inc._id), agent, "We fixed the sensor.");
    expect(res).toEqual({ sent: true, to: "a***@b.co" });
    expect(h.sent.at(-1)).toMatchObject({ template: "incident-reply.hbs", ctx: { agentName: "Priya", body: "We fixed the sensor." } });
    expect(h.activities.at(-1)).toMatchObject({ type: "EMAIL", contactId: "c1", meta: { kind: "incident_email_reply" } });
  });

  it("email reply without any email on file is a 400", async () => {
    const h = setup({});
    const agent = { _id: "a1", role: Role.AGENT, organizationId: ORG } as any;
    await expect(h.svc.emailReply(String(h.inc._id), agent, "Hello")).rejects.toThrow(/No valid email/);
  });
});

describe("handover message and settings", () => {
  it("renders {{ticketId}} anywhere, or appends the ref", () => {
    expect(renderHandoverMessage("Logged {{ ticketId }}. Ref {{ticketId}}", "SR1")).toBe("Logged SR1. Ref SR1");
    expect(renderHandoverMessage("We got it.", "SR1")).toBe("We got it. Your reference is SR1.");
  });

  it("sanitises the incident settings in a bot settings update", () => {
    const out = sanitizeIncidentSettings({
      welcomeMessages: "hi",
      features: { incidentHandover: "yes", crmCapture: true, evil: true } as any,
      handoverMessage: "   ",
      problemQuestion: "x".repeat(900),
      problemAlias: "bad alias",
      contactMapping: { email: "my_mail", name: "has space" },
      closureIdleMinutes: "999",
    });
    expect(out.welcomeMessages).toBe("hi");
    expect(out.features).toEqual({ incidentHandover: false, crmCapture: true });
    expect(out.handoverMessage).toBeNull();
    expect(out.problemQuestion).toHaveLength(500);
    expect(out.problemAlias).toBeNull();
    expect(out.contactMapping).toEqual({ email: "my_mail", name: undefined, phone: undefined });
    expect(out.closureIdleMinutes).toBe(60);
    // Absent keys stay absent (partial update).
    expect("handoverMessage" in sanitizeIncidentSettings({ a: 1 } as any)).toBe(false);
  });
});
