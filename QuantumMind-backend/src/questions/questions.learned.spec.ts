/**
 * crm-incident-handover task 8.3: the Question Bank side of auto-learn.
 * - the self-approval block works for people (it never matched before),
 * - the system path creates approved entries without a person approving,
 * - edits, status changes and deletes of learned entries raise the events the
 *   knowledge-base sync listens to; human entries raise none.
 */
import { Types } from "mongoose";
import { Role } from "src/common/enums/role.enum";
import { QuestionStatusEnum } from "./enums/question-status.enum";
import { QUESTION_CHANGED, QUESTION_DELETED, QuestionsService } from "./questions.service";

const ORG = new Types.ObjectId().toString();

function fakeModel() {
  const rows: any[] = [];
  class Doc {
    [k: string]: any;
    constructor(data: any) {
      Object.assign(this, { _id: new Types.ObjectId(), keywords: [], answers: [], ...data });
      if (typeof this.question === "string") this.question = this.question.toLowerCase();
    }
    markModified() {}
    toObject() {
      return JSON.parse(JSON.stringify(this));
    }
    async save() {
      if (!rows.includes(this)) rows.push(this);
      return this;
    }
    async remove() {
      rows.splice(rows.indexOf(this), 1);
      return this;
    }
  }
  const model: any = function (data: any) {
    return new Doc(data);
  };
  model.rows = rows;
  model.findById = async (id: any) => rows.find((r) => String(r._id) === String(id)) ?? null;
  model.findOne = async (q: any) =>
    rows.find((r) => Object.entries(q).every(([k, v]) => (k.includes(".") ? String(k.split(".").reduce((o: any, p) => o?.[p], r)) === String(v) : String(r[k]) === String(v)))) ?? null;
  model.updateOne = async (q: any, u: any) => {
    const r = rows.find((x) => String(x._id) === String(q._id) && x.source?.kind === "incident");
    if (r) r.source.ingest = u.$set["source.ingest"];
  };
  return model;
}

function setup() {
  const model = fakeModel();
  const emitted: any[] = [];
  const svc = new QuestionsService(model, {} as any, {} as any, { emit: (n: string, p: any) => emitted.push({ n, p }) } as any);
  (svc as any).logger = { error: () => undefined };
  return { svc, model, emitted };
}

const admin = (id = new Types.ObjectId().toString()) => ({ _id: id, role: Role.ORG_ADMIN, organizationId: ORG }) as any;

describe("Question Bank and auto-learn", () => {
  it("a person can no longer approve their own entry (ObjectId vs string)", async () => {
    const h = setup();
    const author = new Types.ObjectId();
    const q = new h.model({ question: "Q?", answers: ["a"], addedBy: author, organizationId: ORG, status: "under_review" });
    await q.save();
    await expect(h.svc.updateStatus(String(q._id), String(author), { status: QuestionStatusEnum.APPROVED }, admin(String(author)))).rejects.toThrow(
      "You cannot approve your own question",
    );
    expect(q.status).toBe("under_review");
    const other = new Types.ObjectId().toString();
    await h.svc.updateStatus(String(q._id), other, { status: QuestionStatusEnum.APPROVED }, admin(other));
    expect(q.status).toBe("approved");
  });

  it("createLearned stores an approved, system-approved entry with the agent as author", async () => {
    const h = setup();
    const agent = new Types.ObjectId().toString();
    const q: any = await h.svc.createLearned({
      organizationId: ORG,
      question: "Why does my DOOR not close?",
      answer: "Clear the sill.",
      addedBy: agent,
      source: { kind: "incident", incidentIds: ["i1"], knowledgeSource: "incident:i1", clientId: "b" },
    });
    expect(q).toMatchObject({ status: "approved", question: "why does my door not close?", answers: ["Clear the sill."], organizationId: ORG });
    expect(String(q.addedBy)).toBe(agent);
    expect(q.source).toMatchObject({ systemApproved: true, knowledgeSource: "incident:i1" });
    expect(q.approvedBy).toBeUndefined();
    const bad: any = await h.svc.createLearned({ organizationId: ORG, question: "x?", answer: "y", addedBy: "not-an-id", source: { kind: "incident", incidentIds: [] } });
    expect(bad.addedBy).toBeUndefined();
  });

  it("addIncidentToLearned keeps every incident and adds a new answer once (max 5)", async () => {
    const h = setup();
    const q: any = await h.svc.createLearned({ organizationId: ORG, question: "q?", answer: "A one", source: { kind: "incident", incidentIds: ["i1"], incidents: [{ id: "i1" }] } });
    await h.svc.addIncidentToLearned(String(q._id), { id: "i2", ticketRef: "SR_2" }, "  a ONE ");
    await h.svc.addIncidentToLearned(String(q._id), { id: "i2" }, "A two");
    expect(q.source.incidentIds).toEqual(["i1", "i2"]);
    expect(q.source.incidents.map((i: any) => i.id)).toEqual(["i1", "i2"]);
    expect(q.answers).toEqual(["A one", "A two"]);
    for (let i = 3; i < 9; i++) await h.svc.addIncidentToLearned(String(q._id), { id: `i${i}` }, `A ${i}`);
    expect(q.answers).toHaveLength(5);
  });

  it("edits, status changes and deletes of learned entries raise sync events; human ones do not", async () => {
    const h = setup();
    const learned: any = await h.svc.createLearned({ organizationId: ORG, question: "q?", answer: "a", source: { kind: "incident", incidentIds: ["i1"], clientId: "b", knowledgeSource: "incident:i1" } });
    const human = new h.model({ question: "h?", answers: ["a"], organizationId: ORG, status: "approved" });
    await human.save();
    const user = admin();
    for (const id of [learned._id, human._id]) {
      await h.svc.updateQuestion(String(id), { answers: ["new answer"] } as any, user);
      await h.svc.updateStatus(String(id), user._id, { status: QuestionStatusEnum.UNDER_REVIEW }, user);
    }
    await h.svc.deleteQuestion(String(human._id), user);
    await h.svc.deleteQuestion(String(learned._id), user);
    expect(h.emitted).toEqual([
      { n: QUESTION_CHANGED, p: { questionId: String(learned._id) } },
      { n: QUESTION_CHANGED, p: { questionId: String(learned._id) } },
      { n: QUESTION_DELETED, p: { questionId: String(learned._id), source: expect.objectContaining({ clientId: "b", knowledgeSource: "incident:i1" }) } },
    ]);
  });

  it("an org cannot touch another org's learned entry", async () => {
    const h = setup();
    const q: any = await h.svc.createLearned({ organizationId: ORG, question: "q?", answer: "a", source: { kind: "incident", incidentIds: [] } });
    const stranger = { _id: new Types.ObjectId().toString(), role: Role.ORG_ADMIN, organizationId: new Types.ObjectId().toString() } as any;
    await expect(h.svc.deleteQuestion(String(q._id), stranger)).rejects.toBeTruthy();
    expect(h.model.rows).toHaveLength(1);
    expect(h.emitted).toHaveLength(0);
  });
});
