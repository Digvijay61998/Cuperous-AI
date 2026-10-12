/**
 * crm-incident-handover tasks 8.2, 8.3, 8.5: auto-learn from an agent
 * resolution. Real LearnService over in-memory incident / question stores and
 * a fake AI. Covers: once per incident, flag off, masking of the AI input,
 * the PII guard and retries, dedupe (same text and >= 0.9 similarity),
 * ingest, and the edit/delete/status hooks with outbox fallback.
 */
jest.mock("@nestjs/schedule", () => ({
  Interval: () => () => undefined,
  Cron: () => () => undefined,
  Timeout: () => () => undefined,
  CronExpression: new Proxy({}, { get: () => "* * * * *" }),
  ScheduleModule: { forRoot: () => ({}) },
}));

import { fakeModel, fakeMongo, oid } from "src/profile/fakes.testspec";
import { QuestionStatusEnum } from "src/questions/enums/question-status.enum";
import { INCIDENT_KNOWLEDGE_FAILED, LEARN_OP_REMOVE, LEARN_OP_SYNC, LearnService } from "./learn.service";

const ORG = oid();
const BOT = oid();
const SETTING = oid();
const AGENT = oid();
const Q_TEXT = "What should I do if the lift door does not close?";
const A_TEXT = "Check the door sill, then press the door-close button. If it still fails, report a fault.";

function incidentsFake(docs: any[]) {
  return {
    docs,
    claimKnowledge: jest.fn(async (id: string) => {
      const d = docs.find((x) => x._id === id);
      if (!d || d.status !== "resolved" || d.outcome !== "resolved_by_agent" || d.knowledge) return null;
      d.knowledge = { status: "generating", at: new Date() };
      return { ...d };
    }),
    recordKnowledge: jest.fn(async (id: string, s: any) => {
      const d = docs.find((x) => x._id === id);
      if (d) d.knowledge = { ...s, at: new Date() };
    }),
  };
}

function questionsFake() {
  const rows: any[] = [];
  return {
    rows,
    findSameQuestion: async (org: string, q: string) => rows.find((r) => r.organizationId === org && r.question === q.toLowerCase()) ?? null,
    findByKnowledgeSource: async (org: string, s: string) => rows.find((r) => r.organizationId === org && r.source?.knowledgeSource === s) ?? null,
    findLearnedById: async (id: string) => rows.find((r) => r._id === id) ?? null,
    createLearned: jest.fn(async (d: any) => {
      const r = { _id: oid(), organizationId: d.organizationId, question: d.question.toLowerCase(), answers: [d.answer], status: "approved", addedBy: d.addedBy, source: { ...d.source, systemApproved: true } };
      rows.push(r);
      return r;
    }),
    addIncidentToLearned: jest.fn(async (id: string, inc: any, answer: string) => {
      const r = rows.find((x) => x._id === id);
      r.source.incidentIds = [...new Set([...r.source.incidentIds, inc.id])];
      r.source.incidents = [...(r.source.incidents || []), inc];
      if (!r.answers.includes(answer)) r.answers.push(answer);
      return r;
    }),
    setIngestState: jest.fn(async (id: string, s: any) => {
      const r = rows.find((x) => x._id === id);
      if (r) r.source.ingest = s;
    }),
  };
}

function setup(o: { incidents?: any[]; flag?: boolean; candidate?: jest.Mock; similar?: jest.Mock; addKnowledge?: jest.Mock; contact?: any } = {}) {
  const incId = oid();
  const incidents = incidentsFake(
    o.incidents ?? [
      {
        _id: incId,
        organizationId: ORG,
        botId: BOT,
        status: "resolved",
        outcome: "resolved_by_agent",
        agentId: AGENT,
        crmContactId: "ct1",
        ticketId: oid(),
        ticketRef: "SR_Ab12Cd",
        problem: "Raj here (raj@x.io). Lift door on floor 3 does not close, ref SR_Ab12Cd",
        resolutionNote: "Told Raj to clear the sill; reset the door operator remotely.",
      },
    ],
  );
  const questions = questionsFake();
  const ai = {
    knowledgeCandidate: o.candidate ?? jest.fn(async () => ({ question: Q_TEXT, answer: A_TEXT })),
    knowledgeSimilar: o.similar ?? jest.fn(async () => ({})),
    addKnowledge: o.addKnowledge ?? jest.fn(async () => ({})),
    removeKnowledgeSource: jest.fn(async () => undefined),
  };
  const outbox = { registerHandler: jest.fn(), enqueue: jest.fn(async () => true) };
  const emitted: any[] = [];
  const models = {
    Bot: fakeModel([{ _id: BOT, name: "Assistant", botSetting: SETTING }]),
    BotSetting: fakeModel([{ _id: SETTING, features: { autoLearn: o.flag ?? true } }]),
  };
  const crm = { forOrg: () => ({ contact: { findFirst: async () => o.contact ?? { firstName: "Raj", lastName: "Kumar" } } }) };
  const svc = new LearnService(
    incidents as any,
    questions as any,
    ai as any,
    outbox as any,
    { orgIdForBot: async () => ORG } as any,
    { emit: (n: string, p: any) => emitted.push({ n, p }) } as any,
    fakeMongo(models),
    crm as any,
  );
  const waits: number[] = [];
  svc.sleep = async (ms) => {
    waits.push(ms);
  };
  (svc as any).logger = { warn: () => undefined, error: () => undefined, log: () => undefined };
  return { svc, incidents, questions, ai, outbox, emitted, incId, waits };
}

const event = (h: ReturnType<typeof setup>, extra: any = {}) => ({
  incidentId: h.incId,
  botId: BOT,
  outcome: "resolved_by_agent",
  resolutionNote: "Told Raj to clear the sill; reset the door operator remotely.",
  ...extra,
});

describe("LearnService.learn", () => {
  it("creates one approved entry, authored by the agent, ingested as incident:<id> (R21.1, R21.2)", async () => {
    const h = setup();
    await h.svc.onIncidentClosed(event(h));
    expect(h.questions.rows).toHaveLength(1);
    const q = h.questions.rows[0];
    expect(q).toMatchObject({ organizationId: ORG, status: "approved", addedBy: AGENT, answers: [A_TEXT] });
    expect(q.source).toMatchObject({ kind: "incident", incidentIds: [h.incId], knowledgeSource: `incident:${h.incId}`, clientId: BOT, systemApproved: true });
    expect(q.source.incidents[0]).toMatchObject({ id: h.incId, ticketRef: "SR_Ab12Cd" });
    expect(h.ai.addKnowledge).toHaveBeenCalledWith(expect.objectContaining({ clientId: BOT, source: `incident:${h.incId}`, content: `Q: ${Q_TEXT.toLowerCase()}\nA: ${A_TEXT}` }));
    expect(q.source.ingest.status).toBe("ok");
    expect(h.incidents.docs[0].knowledge).toMatchObject({ status: "learned", questionId: q._id });
  });

  it("sends the AI only masked input: no email, name or ticket ref (R12.2)", async () => {
    const h = setup();
    await h.svc.learn(h.incId, BOT);
    const req = h.ai.knowledgeCandidate.mock.calls[0][0];
    const all = JSON.stringify(req);
    expect(all).not.toMatch(/raj@x\.io|SR_Ab12Cd|\bRaj\b/i);
    expect(req.problem).toContain("[email]");
    expect(req.problem).toContain("[ref]");
    expect(req.resolution).toContain("[name]");
    expect(req.company).toBe("Assistant");
  });

  it("at most one entry per incident, even when the event arrives twice (R12.1)", async () => {
    const h = setup();
    await Promise.all([h.svc.onIncidentClosed(event(h)), h.svc.onIncidentClosed(event(h))]);
    await h.svc.onIncidentClosed(event(h));
    expect(h.questions.rows).toHaveLength(1);
    expect(h.ai.knowledgeCandidate).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["flag off", { flag: false }, {}],
    ["resolved by the bot", {}, { outcome: "resolved_by_bot" }],
    ["no resolution note", {}, { resolutionNote: "" }],
  ])("does nothing when %s", async (_n, o, ev) => {
    const h = setup(o as any);
    await h.svc.onIncidentClosed(event(h, ev));
    expect(h.questions.rows).toHaveLength(0);
    expect(h.ai.knowledgeCandidate).not.toHaveBeenCalled();
    expect(h.incidents.docs[0].knowledge).toBeUndefined();
  });

  it("an incident resolved through the ticket page (no note) is skipped once", async () => {
    const h = setup();
    h.incidents.docs[0].resolutionNote = undefined;
    expect(await h.svc.learn(h.incId)).toBe("skipped");
    expect(h.incidents.docs[0].knowledge.status).toBe("skipped");
  });

  it("an unsafe result is retried; 3 failures record the failure and emit (R12.9)", async () => {
    const candidate = jest.fn(async () => ({ question: Q_TEXT, answer: `${A_TEXT} Contact Raj on raj@x.io.` }));
    const h = setup({ candidate });
    expect(await h.svc.learn(h.incId, BOT)).toBe("failed");
    expect(candidate).toHaveBeenCalledTimes(3);
    expect(h.waits).toEqual([30_000, 60_000]);
    expect(h.questions.rows).toHaveLength(0);
    expect(h.incidents.docs[0].knowledge).toMatchObject({ status: "failed" });
    expect(h.emitted).toEqual([{ n: INCIDENT_KNOWLEDGE_FAILED, p: expect.objectContaining({ incidentId: h.incId }) }]);
  });

  it("a timeout then a clean result is learned", async () => {
    const candidate = jest.fn().mockRejectedValueOnce(new Error("timeout")).mockResolvedValue({ question: Q_TEXT, answer: A_TEXT });
    const h = setup({ candidate });
    expect(await h.svc.learn(h.incId, BOT)).toBe("learned");
    expect(h.waits).toEqual([30_000]);
  });

  it("dedupe: a >= 0.9 match updates the existing learned entry and keeps both incidents (R21.3)", async () => {
    const first = oid();
    const second = oid();
    const base = { organizationId: ORG, botId: BOT, status: "resolved", outcome: "resolved_by_agent", agentId: AGENT, problem: "Door stuck open on floor 2", resolutionNote: "Reset the door operator remotely." };
    const similar = jest.fn().mockResolvedValueOnce({}).mockResolvedValueOnce({ best: { source: `incident:${first}`, score: 0.93 } });
    const candidate = jest
      .fn()
      .mockResolvedValueOnce({ question: Q_TEXT, answer: A_TEXT })
      .mockResolvedValueOnce({ question: "My lift door will not shut, what can I do?", answer: "Clear the sill and press door-close; if it persists, report a fault." });
    const h = setup({ incidents: [{ ...base, _id: first }, { ...base, _id: second }], similar, candidate });
    expect(await h.svc.learn(first, BOT)).toBe("learned");
    expect(await h.svc.learn(second, BOT)).toBe("merged");
    expect(h.questions.rows).toHaveLength(1);
    expect(h.questions.rows[0].source.incidentIds).toEqual([first, second]);
    expect(h.questions.rows[0].answers).toHaveLength(2);
    expect(h.incidents.docs[1].knowledge).toMatchObject({ status: "merged", questionId: h.questions.rows[0]._id });
    // Re-ingested under the original source name.
    expect(h.ai.addKnowledge.mock.calls.at(-1)[0].source).toBe(`incident:${first}`);
  });

  it("a match below 0.9, or one outside incident:*, adds a new entry", async () => {
    for (const best of [{ source: "incident:x", score: 0.89 }, { source: "faq", score: 0.99 }]) {
      const h = setup({ similar: jest.fn(async () => ({ best })) });
      expect(await h.svc.learn(h.incId, BOT)).toBe("learned");
    }
  });

  it("the same question text in a human-written entry is never modified", async () => {
    const h = setup();
    h.questions.rows.push({ _id: oid(), organizationId: ORG, question: Q_TEXT.toLowerCase(), answers: ["human"], status: "approved" });
    expect(await h.svc.learn(h.incId, BOT)).toBe("learned");
    expect(h.questions.rows[0].answers).toEqual(["human"]);
    expect(h.questions.rows).toHaveLength(2);
  });

  it("a crash after the claim records the failure instead of leaving it generating", async () => {
    const h = setup();
    h.questions.createLearned.mockRejectedValueOnce(new Error("mongo down"));
    expect(await h.svc.learn(h.incId, BOT)).toBe("failed");
    expect(h.incidents.docs[0].knowledge).toMatchObject({ status: "failed", error: "mongo down" });
    expect(h.emitted[0].n).toBe(INCIDENT_KNOWLEDGE_FAILED);
  });

  it("ingest failure: the entry stays approved, the sync is queued and marked pending (R12.8)", async () => {
    const h = setup({ addKnowledge: jest.fn(async () => { throw new Error("AI down"); }) });
    expect(await h.svc.learn(h.incId, BOT)).toBe("learned");
    const q = h.questions.rows[0];
    expect(q.status).toBe("approved");
    expect(q.source.ingest).toMatchObject({ status: "pending", error: "AI down" });
    expect(h.outbox.enqueue).toHaveBeenCalledWith(LEARN_OP_SYNC, { questionId: q._id }, expect.objectContaining({ dedupeKey: `learn:${q._id}` }));
    await h.svc.onOutboxFailed({ op: LEARN_OP_SYNC, payload: { questionId: q._id }, error: "AI down" });
    expect(q.source.ingest.status).toBe("failed");
  });
});

describe("Question Bank hooks (R21.4, R12.4)", () => {
  it("an edit re-ingests; moving to under review removes it from the knowledge base", async () => {
    const h = setup();
    await h.svc.learn(h.incId, BOT);
    const q = h.questions.rows[0];
    q.answers = ["Edited answer that is long enough."];
    await h.svc.onQuestionChanged({ questionId: q._id });
    expect(h.ai.addKnowledge.mock.calls.at(-1)[0].content).toContain("Edited answer");
    q.status = QuestionStatusEnum.UNDER_REVIEW;
    await h.svc.onQuestionChanged({ questionId: q._id });
    expect(h.ai.removeKnowledgeSource).toHaveBeenCalledWith(BOT, `incident:${h.incId}`);
    expect(q.source.ingest.status).toBe("removed");
  });

  it("a delete removes the source; a failed delete is queued", async () => {
    const h = setup();
    await h.svc.onQuestionDeleted({ questionId: "q", source: { clientId: BOT, knowledgeSource: "incident:1" } });
    expect(h.ai.removeKnowledgeSource).toHaveBeenCalledWith(BOT, "incident:1");
    h.ai.removeKnowledgeSource.mockRejectedValueOnce(new Error("down"));
    await h.svc.onQuestionDeleted({ questionId: "q", source: { clientId: BOT, knowledgeSource: "incident:2" } });
    expect(h.outbox.enqueue).toHaveBeenCalledWith(LEARN_OP_REMOVE, { clientId: BOT, source: "incident:2" }, expect.anything());
  });

  it("human entries are never synced", async () => {
    const h = setup();
    h.questions.rows.push({ _id: "human", status: "approved", question: "q", answers: ["a"] });
    await h.svc.onQuestionChanged({ questionId: "human" });
    expect(h.ai.addKnowledge).not.toHaveBeenCalled();
  });

  it("registers its outbox handlers", () => {
    const h = setup();
    h.svc.onModuleInit();
    expect(h.outbox.registerHandler.mock.calls.map((c: any) => c[0])).toEqual([LEARN_OP_SYNC, LEARN_OP_REMOVE]);
  });
});
