/** AI summary (R15) and live board fan-out (R18, Property 7). */
jest.mock("@nestjs/schedule", () => ({
  Interval: () => () => undefined,
  Cron: () => () => undefined,
  Timeout: () => () => undefined,
  CronExpression: new Proxy({}, { get: () => "* * * * *" }),
  ScheduleModule: { forRoot: () => ({}) },
}));
import { fakeModel, fakeMongo, oid } from "src/profile/fakes.testspec";
import { SR_CHANGED } from "./constants";
import { ServiceRequestEventsService, SR_SOCKET_EVENT } from "./service-request-events.service";
import { ServiceRequestSummaryService } from "./service-request-summary.service";

function summarySetup(ai: any) {
  const updates: any[] = [];
  const events: any[] = [];
  const sr = {
    ref: "SR_ABC123",
    subject: "Lift stuck for Raj Kumar",
    description: "Call raj@x.com or +91 98765 43210 about SR_ABC123",
    contact: { firstName: "Raj", lastName: "Kumar", email: "raj@x.com", phone: "+919876543210" },
  };
  const db: any = {
    serviceRequest: {
      findFirst: async ({ select }: any) => (select?.summary ? { summary: updates.at(-1)?.summary ?? null, summaryError: updates.at(-1)?.summaryError ?? null } : sr),
      update: ({ data }: any) => (updates.push(data), Promise.resolve()),
      updateMany: async ({ data }: any) => updates.push(data),
    },
    serviceRequestEvent: { create: ({ data }: any) => (events.push(data), Promise.resolve()) },
    $transaction: async (ops: any[]) => Promise.all(ops),
  };
  const transcripts = {
    forRequest: async () => ({ source: "live", at: null, lines: [{ from: "visitor", text: "I'm Raj, my number is 9876543210" }] }),
  };
  const svc = new ServiceRequestSummaryService({ forOrg: () => db } as any, transcripts as any, ai);
  (svc as any).logger = { warn: () => undefined };
  svc.retryDelayMs = 0;
  return { svc, updates, events };
}

const AI_OK = { overview: "Lift stops between floors.", customer_ask: "A visit.", actions_taken: "Recorded.", next_step: "Call back." };

describe("ServiceRequestSummaryService (R15)", () => {
  it("sends only masked input and stores the summary with a history event (R15.4)", async () => {
    const ai = { serviceRequestSummary: jest.fn(async () => AI_OK) };
    const h = summarySetup(ai);
    expect(await h.svc.generate("o1", "sr1", { id: "u1", name: "Asha" }, { retry: false })).toBe(true);
    const sent = JSON.stringify((ai.serviceRequestSummary.mock.calls as any)[0][0]);
    for (const leak of ["raj@x.com", "9876543210", "98765 43210", "SR_ABC123", "Raj", "Kumar"]) expect(sent).not.toContain(leak);
    expect(h.updates.at(-1)).toMatchObject({ summary: { overview: AI_OK.overview, nextStep: "Call back.", ai: true }, summaryError: null });
    expect(h.events).toEqual([expect.objectContaining({ type: "SUMMARY_GENERATED", actorId: "u1" })]);
  });

  it("a failure keeps the old summary and records why; one retry in the background (R15.5)", async () => {
    const ai = { serviceRequestSummary: jest.fn(async () => { throw Object.assign(new Error("502"), { response: { data: { detail: "Summary rejected" } } }); }) };
    const h = summarySetup(ai);
    expect(await h.svc.generate("o1", "sr1", {}, { retry: true })).toBe(false);
    expect(ai.serviceRequestSummary).toHaveBeenCalledTimes(2);
    expect(h.updates.every((u) => !("summary" in u))).toBe(true);
    expect(h.updates.at(-1)).toEqual({ summaryError: "Summary rejected" });
  });

  it("one job per request at a time, and nothing without the AI service", async () => {
    let release!: () => void;
    const ai = { serviceRequestSummary: jest.fn(() => new Promise<any>((r) => (release = () => r(AI_OK)))) };
    const h = summarySetup(ai);
    const first = h.svc.generate("o1", "sr1", {}, { retry: false });
    await new Promise((r) => setImmediate(r));
    expect(await h.svc.generate("o1", "sr1", {}, { retry: false })).toBe(false);
    release();
    expect(await first).toBe(true);
    expect(await summarySetup(undefined).svc.generate("o1", "sr1", {}, { retry: false })).toBe(false);
  });
});

describe("ServiceRequestEventsService (R18, Property 7)", () => {
  function eventsSetup() {
    const ORG = oid();
    const OTHER = oid();
    const Agent = fakeModel([
      { _id: oid(), organizationId: ORG, active: true },
      { _id: oid(), organizationId: ORG, active: false },
      { _id: oid(), organizationId: OTHER, active: true },
    ]);
    const pushed: any[] = [];
    const db: any = { serviceRequest: { findFirst: async ({ where }: any) => (where.id === "gone" ? null : { id: where.id, stageId: "s1" }) } };
    const svc = new ServiceRequestEventsService({ forOrg: () => db } as any, { propagateEvent: (e: any) => pushed.push(e) } as any, fakeMongo({ Agent }));
    svc.throttleMs = 5;
    return { svc, pushed, ORG, Agent };
  }

  it("pushes the card to the org's active users only", async () => {
    const h = eventsSetup();
    await h.svc.push({ orgId: h.ORG, id: "sr1", kind: "moved" });
    expect(h.pushed).toHaveLength(1);
    expect(h.pushed[0]).toEqual({
      userId: String(h.Agent.docs[0]._id),
      event: SR_SOCKET_EVENT,
      data: { kind: "moved", id: "sr1", stageId: "s1", data: { id: "sr1", stageId: "s1" } },
    });
    expect(h.pushed[0].platform).toBeUndefined();
  });

  it("throttles a burst into one push and keeps 'created'", async () => {
    const h = eventsSetup();
    h.svc.onChanged({ orgId: h.ORG, id: "sr1", kind: "created" });
    h.svc.onChanged({ orgId: h.ORG, id: "sr1", kind: "moved" });
    h.svc.onChanged({ orgId: h.ORG, id: "sr1", kind: "assigned" });
    await new Promise((r) => setTimeout(r, 30));
    expect(h.pushed.map((p) => p.data.kind)).toEqual(["created"]);
  });

  it("a request that no longer exists is announced as deleted", async () => {
    const h = eventsSetup();
    await h.svc.push({ orgId: h.ORG, id: "gone", kind: "updated" });
    expect(h.pushed[0].data).toMatchObject({ kind: "deleted", id: "gone", data: null });
    expect(SR_CHANGED).toBe("crm.service-request.changed");
  });
});
