import * as fc from "fast-check";
import { Types } from "mongoose";
import {
  HANDOVER_ACKNOWLEDGED_EVENT,
  HANDOVER_REQUESTED_EVENT,
} from "./constants";
import {
  AlertReasonEnum,
  AlertResolutionEnum,
} from "./enums/handover-alert.enum";
import { HandoverAlertService } from "./handover-alert.service";

/**
 * Minimal in-memory stand-in for the mongoose model. It reproduces the one
 * behaviour the service relies on for correctness: the partial unique index on
 * `conversationId` where `status: 'open'` (E11000 on a second open insert), and
 * atomic single-document `findOneAndUpdate`.
 */
function fakeModel(opts: { failCreates?: number } = {}) {
  const docs: any[] = [];
  let failCreates = opts.failCreates ?? 0;
  const matches = (d: any, q: any) =>
    Object.entries(q).every(([k, v]) => {
      if (v && typeof v === "object" && "$exists" in (v as any)) {
        return (v as any).$exists ? d[k] !== undefined : d[k] === undefined;
      }
      if (Array.isArray(d[k])) return d[k].includes(v);
      return String(d[k]) === String(v);
    });
  const apply = (d: any, u: any) => {
    Object.assign(d, u.$set || {});
    for (const [k, v] of Object.entries(u.$addToSet || {})) {
      d[k] = d[k] || [];
      if (!d[k].includes(v)) d[k].push(v);
    }
  };
  const q = (v: any) => ({ lean: () => v, select: () => q(v), sort: () => q(v), then: (r: any) => r(v) });
  return {
    docs,
    create: async (doc: any) => {
      if (failCreates-- > 0) throw new Error("db down");
      if (docs.some((d) => d.status === "open" && d.conversationId === doc.conversationId)) {
        throw Object.assign(new Error("E11000"), { code: 11000 });
      }
      const d = { ...doc, _id: new Types.ObjectId(), createdAt: new Date() };
      docs.push(d);
      return { toObject: () => ({ ...d }) };
    },
    findOne: (query: any) => q(docs.find((d) => matches(d, query)) ?? null),
    findById: (id: any) => q(docs.find((d) => String(d._id) === String(id)) ?? null),
    find: (query: any) => {
      const res = docs.filter((d) => matches(d, query));
      return q(res);
    },
    exists: async (query: any) => docs.some((d) => matches(d, query)),
    findOneAndUpdate: (query: any, update: any) => {
      const d = docs.find((x) => matches(x, query));
      if (d) apply(d, update);
      return q(d ? { ...d } : null);
    },
    updateOne: async (query: any, update: any) => {
      const d = docs.find((x) => matches(x, query));
      if (d) apply(d, update);
    },
    updateMany: async () => undefined,
  };
}

function setup(opts: { failCreates?: number; admins?: string[]; inbox?: string[] } = {}) {
  const model = fakeModel(opts);
  const emitted: { users: string[]; event: string; data: any }[] = [];
  const agentService: any = {
    findOrgAdminIds: jest.fn(async () => opts.admins ?? ["admin1"]),
    findInboxRecipientIds: jest.fn(async () => opts.inbox ?? ["agentA", "agentB", "admin1"]),
  };
  const inboxEvents: any = {
    emitToUsers: (users: string[], event: string, data: any) =>
      emitted.push({ users: [...users], event, data }),
  };
  const threads: any = { findByKey: jest.fn(async () => null) };
  const svc = new HandoverAlertService(model as any, agentService, inboxEvents, threads);
  // No real bot lookup in unit tests: every alert belongs to org "org1".
  (svc as any).botOrganizationId = async () => "org1";
  return { svc, model, emitted };
}

const base = {
  conversationId: "conv1",
  botId: new Types.ObjectId().toString(),
  visitorName: "Digvijay",
};
const requested = (e: any[]) => e.filter((x) => x.event === HANDOVER_REQUESTED_EVENT);

describe("HandoverAlertService", () => {
  it("creates one alert and emits to every recipient", async () => {
    const { svc, emitted } = setup();
    const view = await svc.raise({ ...base, reason: AlertReasonEnum.FLOW_TRANSFER });
    expect(view).toMatchObject({ reason: "flow_transfer", priority: "normal", agentAssigned: false });
    expect(requested(emitted)).toHaveLength(1);
    expect(requested(emitted)[0].users.sort()).toEqual(["admin1", "agentA", "agentB"]);
  });

  it("creates nothing in preview mode", async () => {
    const { svc, model, emitted } = setup();
    expect(await svc.raise({ ...base, reason: AlertReasonEnum.EMERGENCY, mode: "preview" })).toBeNull();
    expect(model.docs).toHaveLength(0);
    expect(emitted).toHaveLength(0);
  });

  it("emergency gets high priority; assigned agent + admins are recipients", async () => {
    const { svc, emitted } = setup();
    await svc.raise({ ...base, reason: AlertReasonEnum.EMERGENCY, agentAssigned: true, assignedAgentId: "agentZ" });
    expect(requested(emitted)[0].data.priority).toBe("high");
    expect(requested(emitted)[0].users.sort()).toEqual(["admin1", "agentZ"]);
  });

  it("falls back to an anonymous display name", async () => {
    const { svc } = setup();
    const v = await svc.raise({ ...base, visitorName: "  ", reason: AlertReasonEnum.VISITOR_INTENT });
    expect(v?.visitorName).toBe("Anonymous visitor");
  });

  it("truncates handoverReason to 200 chars", async () => {
    const { svc, model } = setup();
    await svc.raise({ ...base, reason: AlertReasonEnum.AI_ESCALATION, handoverReason: "x".repeat(500) });
    expect(model.docs[0].handoverReason).toHaveLength(200);
  });

  it("retries persistence and gives up silently after 3 retries", async () => {
    const constants = require("./constants");
    const original = [...constants.PERSIST_RETRY_DELAYS_MS];
    constants.PERSIST_RETRY_DELAYS_MS.splice(0, 3, 0, 0, 0);
    try {
      const { svc, model, emitted } = setup({ failCreates: 10 });
      expect(await svc.raise({ ...base, reason: AlertReasonEnum.FLOW_TRANSFER })).toBeNull();
      expect(model.docs).toHaveLength(0);
      expect(emitted).toHaveLength(0);

      // 2 failures then success → persisted and emitted.
      const ok = setup({ failCreates: 2 });
      expect(await ok.svc.raise({ ...base, reason: AlertReasonEnum.FLOW_TRANSFER })).not.toBeNull();
      expect(ok.model.docs).toHaveLength(1);
    } finally {
      constants.PERSIST_RETRY_DELAYS_MS.splice(0, 3, ...original);
    }
  });

  it("property: once per open request, priority monotonic, emergency upgrade emitted once", async () => {
    const reasons = fc.constantFrom(...Object.values(AlertReasonEnum));
    await fc.assert(
      fc.asyncProperty(fc.array(reasons, { minLength: 1, maxLength: 12 }), async (seq) => {
        const { svc, model, emitted } = setup();
        // Concurrent triggers for the same conversation.
        await Promise.all(seq.map((reason) => svc.raise({ ...base, reason })));
        const open = model.docs.filter((d) => d.status === "open");
        expect(open).toHaveLength(1);

        const events = requested(emitted);
        const fresh = events.filter((e) => !e.data.updated);
        const upgrades = events.filter((e) => e.data.updated);
        expect(fresh).toHaveLength(1);

        const firstWasEmergency = fresh[0].data.reason === AlertReasonEnum.EMERGENCY;
        const anyEmergency = seq.includes(AlertReasonEnum.EMERGENCY);
        expect(upgrades).toHaveLength(anyEmergency && !firstWasEmergency ? 1 : 0);
        expect(open[0].priority).toBe(anyEmergency ? "high" : "normal");
      }),
      { numRuns: 100 },
    );
  });

  it("a new request after acknowledgement creates a new alert id", async () => {
    const { svc } = setup();
    const a = await svc.raise({ ...base, reason: AlertReasonEnum.FLOW_TRANSFER });
    await svc.acknowledgeByConversation("conv1", AlertResolutionEnum.ENDED);
    const b = await svc.raise({ ...base, reason: AlertReasonEnum.FLOW_TRANSFER });
    expect(b?.id).not.toEqual(a?.id);
  });

  it("property: concurrent acknowledgements — first wins, one event", async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 1, max: 8 }), async (n) => {
        const { svc, model, emitted } = setup();
        const a = await svc.raise({ ...base, reason: AlertReasonEnum.FLOW_TRANSFER });
        const user = { _id: "agentA", organizationId: "org1" };
        await Promise.all(
          Array.from({ length: n }, () => svc.acknowledge(a!.id, user, AlertResolutionEnum.OPENED)),
        );
        expect(emitted.filter((e) => e.event === HANDOVER_ACKNOWLEDGED_EVENT)).toHaveLength(1);
        expect(model.docs[0]).toMatchObject({ status: "acknowledged", ackBy: "agentA", resolution: "opened" });
      }),
      { numRuns: 30 },
    );
  });

  it("rejects acknowledgement from a non-recipient or another org", async () => {
    const { svc, model } = setup();
    const a = await svc.raise({ ...base, reason: AlertReasonEnum.FLOW_TRANSFER });
    await expect(svc.acknowledge(a!.id, { _id: "stranger", organizationId: "org1" }, AlertResolutionEnum.OPENED)).rejects.toThrow();
    await expect(svc.acknowledge(a!.id, { _id: "agentA", organizationId: "org2" }, AlertResolutionEnum.OPENED)).rejects.toThrow();
    expect(model.docs[0].status).toBe("open");
  });

  it("lists only my open alerts in my org, high priority first", async () => {
    const { svc } = setup();
    await svc.raise({ ...base, conversationId: "c1", reason: AlertReasonEnum.FLOW_TRANSFER });
    await svc.raise({ ...base, conversationId: "c2", reason: AlertReasonEnum.EMERGENCY });
    await svc.raise({ ...base, conversationId: "c3", reason: AlertReasonEnum.FLOW_TRANSFER, agentAssigned: true, assignedAgentId: "other" });
    const mine = await svc.listOpenForUser({ _id: "agentA", organizationId: "org1" });
    expect(mine.map((a) => a.conversationId)).toEqual(["c2", "c1"]);
    expect(await svc.listOpenForUser({ _id: "agentA", organizationId: "org2" })).toEqual([]);
  });

  it("setAssigned adds the agent to recipients", async () => {
    const { svc, model } = setup();
    await svc.raise({ ...base, reason: AlertReasonEnum.FLOW_TRANSFER });
    await svc.setAssigned("conv1", "agentNew");
    expect(model.docs[0]).toMatchObject({ agentAssigned: true, assignedAgentId: "agentNew" });
    expect(model.docs[0].recipients).toContain("agentNew");
  });
});
