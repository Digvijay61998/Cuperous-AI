/** IncidentService.claimKnowledge: one winner, only agent resolutions, stale claims re-taken (R12.1). */
jest.mock("@nestjs/schedule", () => ({
  Interval: () => () => undefined,
  Cron: () => () => undefined,
  Timeout: () => () => undefined,
  CronExpression: new Proxy({}, { get: () => "* * * * *" }),
  ScheduleModule: { forRoot: () => ({}) },
}));
import { IncidentService } from "src/incident/incident.service";
import { fakeModel, oid } from "src/profile/fakes.testspec";

function setup(doc: any) {
  const id = oid();
  const model: any = fakeModel([{ _id: id, status: "resolved", outcome: "resolved_by_agent", ...doc }]);
  const svc = new IncidentService(model, {} as any, {} as any, { emit: () => undefined } as any);
  return { svc, model, id };
}

describe("claimKnowledge", () => {
  it("lets exactly one concurrent caller win", async () => {
    const h = setup({});
    const results = await Promise.all([h.svc.claimKnowledge(h.id), h.svc.claimKnowledge(h.id), h.svc.claimKnowledge(h.id)]);
    expect(results.filter(Boolean)).toHaveLength(1);
    expect(h.model.docs[0].knowledge.status).toBe("generating");
  });

  it.each([
    ["resolved by the bot", { outcome: "resolved_by_bot" }],
    ["still open", { status: "agent_active", outcome: undefined }],
    ["already learned", { knowledge: { status: "learned", at: new Date() } }],
    ["already failed", { knowledge: { status: "failed", at: new Date() } }],
    ["a fresh claim", { knowledge: { status: "generating", at: new Date() } }],
  ])("refuses an incident %s", async (_n, doc) => {
    const h = setup(doc);
    expect(await h.svc.claimKnowledge(h.id)).toBeNull();
  });

  it("re-takes a claim left by a crashed worker", async () => {
    const h = setup({ knowledge: { status: "generating", at: new Date(Date.now() - 31 * 60_000) } });
    expect(await h.svc.claimKnowledge(h.id)).toBeTruthy();
  });

  it("records the outcome", async () => {
    const h = setup({});
    await h.svc.recordKnowledge(h.id, { status: "failed", error: "x".repeat(400) });
    expect(h.model.docs[0].knowledge).toMatchObject({ status: "failed" });
    expect(h.model.docs[0].knowledge.error).toHaveLength(300);
  });
});
