// @nestjs/schedule@2 calls util.isString, which Node >= 23 removed. The
// decorator is irrelevant to these unit tests, so stub it out.
jest.mock("@nestjs/schedule", () => ({ Interval: () => () => undefined }));

import { Types } from "mongoose";
import { CRM_OUTBOX_RETRY_DELAYS_MS } from "./constants";
import { CrmOutboxService } from "./crm-outbox.service";

/** In-memory model covering the queries the service uses. */
function fakeModel() {
  const docs: any[] = [];
  const matches = (d: any, q: any): boolean =>
    Object.entries(q).every(([k, v]: [string, any]) => {
      if (k === "$or") return v.some((sub: any) => matches(d, sub));
      if (k === "_id") return String(d._id) === String(v);
      if (v && typeof v === "object" && "$lte" in v) return d[k] && d[k] <= v.$lte;
      return d[k] === v;
    });
  const apply = (d: any, u: any) => {
    Object.assign(d, u.$set || {});
    for (const [k, n] of Object.entries(u.$inc || {})) d[k] = (d[k] ?? 0) + (n as number);
    for (const k of Object.keys(u.$unset || {})) delete d[k];
  };
  const q = (v: any) => ({ lean: () => v });
  return {
    docs,
    create: async (doc: any) => {
      if (
        doc.dedupeKey &&
        docs.some(
          (d) => d.dedupeKey === doc.dedupeKey && ["pending", "processing"].includes(d.status),
        )
      ) {
        throw Object.assign(new Error("dup"), { code: 11000 });
      }
      const d = { ...doc, _id: new Types.ObjectId() };
      docs.push(d);
      return d;
    },
    findOneAndUpdate: (query: any, update: any) => {
      const due = docs.filter((d) => matches(d, query)).sort((a, b) => a.nextAt - b.nextAt);
      const d = due[0];
      if (d) apply(d, update);
      return q(d ? { ...d } : null);
    },
    updateOne: async (query: any, update: any) => {
      const d = docs.find((x) => matches(x, query));
      if (d) apply(d, update);
    },
  };
}

// Anchored to real time because enqueue() schedules from Date.now().
const BASE = Date.now();
const at = (ms: number) => new Date(BASE + ms);

describe("CrmOutboxService", () => {
  it("enqueue schedules the first retry ~1 minute out, and dedupes by key", async () => {
    const model = fakeModel();
    const svc = new CrmOutboxService(model as any);
    await svc.enqueue("contact.resolve", { a: 1 }, { dedupeKey: "k1" });
    await svc.enqueue("contact.resolve", { a: 1 }, { dedupeKey: "k1" });
    expect(model.docs).toHaveLength(1);
    expect(model.docs[0]).toMatchObject({ status: "pending", attempts: 1 });
  });

  it("retries at 1, 3 and 10 minutes after the first failure, then FAILED", async () => {
    const model = fakeModel();
    const svc = new CrmOutboxService(model as any);
    const handler = jest.fn(async () => {
      throw new Error("db down");
    });
    svc.registerHandler("op", handler);
    await svc.enqueue("op", {});
    model.docs[0].nextAt = at(CRM_OUTBOX_RETRY_DELAYS_MS[0]); // first failure at t=0

    const runTimes: number[] = [];
    for (let t = 0; t <= 15 * 60_000; t += 60_000) {
      const before = handler.mock.calls.length;
      await svc.drain(at(t));
      if (handler.mock.calls.length > before) runTimes.push(t / 60_000);
    }
    expect(runTimes).toEqual([1, 3, 10]);
    expect(model.docs[0]).toMatchObject({ status: "failed", attempts: 4 });
  });

  it("emits crm.outbox.failed once when an item ends FAILED (R12.8)", async () => {
    const model = fakeModel();
    const emit = jest.fn();
    const svc = new CrmOutboxService(model as any, { emit } as any);
    svc.registerHandler("op", async () => {
      throw new Error("db down");
    });
    await svc.enqueue("op", { questionId: "q1" });
    for (let t = 0; t <= 15 * 60_000; t += 60_000) await svc.drain(at(t));
    expect(emit).toHaveBeenCalledTimes(1);
    expect(emit).toHaveBeenCalledWith("crm.outbox.failed", { op: "op", payload: { questionId: "q1" }, error: "db down" });
  });

  it("marks DONE when the handler succeeds", async () => {
    const model = fakeModel();
    const svc = new CrmOutboxService(model as any);
    const handler = jest.fn(async () => undefined);
    svc.registerHandler("op", handler);
    await svc.enqueue("op", { x: 1 }, { dedupeKey: "k" });
    await svc.drain(at(10 * 60_000));
    expect(handler).toHaveBeenCalledWith({ x: 1 });
    expect(model.docs[0].status).toBe("done");
    expect(model.docs[0].dedupeKey).toBeUndefined();
  });

  it("keeps items without a registered handler pending, without burning retries", async () => {
    const model = fakeModel();
    const svc = new CrmOutboxService(model as any);
    await svc.enqueue("unknown", {});
    await svc.drain(at(10 * 60_000));
    expect(model.docs[0]).toMatchObject({ status: "pending", attempts: 1 });
  });

  it("re-leases an item whose worker died (expired lease)", async () => {
    const model = fakeModel();
    const svc = new CrmOutboxService(model as any);
    const handler = jest.fn(async () => undefined);
    svc.registerHandler("op", handler);
    await svc.enqueue("op", {});
    Object.assign(model.docs[0], { status: "processing", leaseUntil: at(0) });
    await svc.drain(at(2 * 60_000));
    expect(model.docs[0].status).toBe("done");
  });

  it("frees the dedupe key and sets a TTL when an item finishes", async () => {
    const model = fakeModel();
    const svc = new CrmOutboxService(model as any);
    svc.registerHandler("op", async () => undefined);
    await svc.enqueue("op", {}, { dedupeKey: "k" });
    await svc.drain(at(2 * 60_000));
    expect(model.docs[0].expireAt).toBeInstanceOf(Date);
    // Same key can be queued again once the first is done.
    await svc.enqueue("op", {}, { dedupeKey: "k" });
    expect(model.docs).toHaveLength(2);
  });

  it("treats a hung handler as a failure instead of wedging the drain", async () => {
    const model = fakeModel();
    const svc = new CrmOutboxService(model as any);
    svc.handlerTimeoutMs = 20;
    svc.registerHandler("op", () => new Promise<void>(() => undefined));
    await svc.enqueue("op", {});
    await svc.drain(at(2 * 60_000));
    expect(model.docs[0]).toMatchObject({ status: "pending", attempts: 2 });
    expect(model.docs[0].lastError).toMatch(/timed out/);
  });

  it("fails an item that keeps killing its worker instead of looping forever", async () => {
    const model = fakeModel();
    const svc = new CrmOutboxService(model as any);
    svc.registerHandler("op", async () => undefined);
    await svc.enqueue("op", {});
    // Three crashed attempts after the live one: next re-lease exceeds the cap.
    Object.assign(model.docs[0], { status: "processing", attempts: 4, leaseUntil: at(0) });
    await svc.drain(at(2 * 60_000));
    expect(model.docs[0].status).toBe("failed");
    expect(model.docs[0].lastError).toMatch(/worker died/);
  });

  it("does not overwrite an item another worker re-leased", async () => {
    const model = fakeModel();
    const svc = new CrmOutboxService(model as any);
    svc.registerHandler("op", async () => {
      // While we run, our lease expires and someone else takes the item.
      model.docs[0].leaseUntil = at(60 * 60_000); // the other worker's live lease
      model.docs[0].status = "processing";
      throw new Error("slow failure");
    });
    await svc.enqueue("op", {});
    await svc.drain(at(2 * 60_000));
    expect(model.docs[0]).toMatchObject({ status: "processing", attempts: 1 });
  });

  it("refuses oversized payloads without throwing", async () => {
    const model = fakeModel();
    const svc = new CrmOutboxService(model as any);
    const ok = await svc.enqueue("op", { blob: "x".repeat(70 * 1024) });
    expect(ok).toBe(false);
    expect(model.docs).toHaveLength(0);
  });

  it("drain ignores a non-Date argument from the scheduler", async () => {
    const model = fakeModel();
    const svc = new CrmOutboxService(model as any);
    await expect(svc.drain(undefined as any)).resolves.toBe(0);
  });

  it("runOrEnqueue only queues on failure and never throws", async () => {
    const model = fakeModel();
    const svc = new CrmOutboxService(model as any);
    expect(await svc.runOrEnqueue("op", {}, async () => undefined)).toBe(true);
    expect(
      await svc.runOrEnqueue("op", {}, async () => {
        throw new Error("boom");
      }),
    ).toBe(false);
    expect(model.docs).toHaveLength(1);
    expect(model.docs[0].lastError).toBe("boom");
  });
});
