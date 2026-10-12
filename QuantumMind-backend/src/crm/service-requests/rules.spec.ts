/** Pure rules of the service desk (crm-plugins-service-desk R10, R11, R12, R16, R19). */
import * as fc from "fast-check";
import { needsRenumber, positionBetween, renumber } from "./board-order";
import { buildWhere } from "./list-filters";
import {
  assertStageInvariants,
  cleanColor,
  cleanStageName,
  DEFAULT_STAGES,
  firstOfCategory,
  StageRow,
  StageRuleError,
} from "./stage-rules";
import { chatText, toTranscript, TRANSCRIPT_MAX } from "./transcript";
import { toActivities, toTicketView } from "src/tickets/ticket-view";

const stages = (): StageRow[] =>
  DEFAULT_STAGES.map((s, i) => ({ id: `s${i}`, name: s.name, category: s.category, position: i, isDefault: !!s.isDefault }));

describe("stage rules (R10)", () => {
  it("defaults are valid: Open is the default, there is a Done stage", () => {
    expect(() => assertStageInvariants(stages())).not.toThrow();
    expect(DEFAULT_STAGES.map((s) => s.name)).toEqual(["Open", "In Progress", "Waiting on Customer", "Deferred", "Resolved", "Closed"]);
  });

  it("rejects duplicate names (case-insensitive), no OPEN, no DONE, no or two defaults, a non-OPEN default", () => {
    const s = stages();
    expect(() => assertStageInvariants([...s, { ...s[1], id: "x", name: "in progress" }])).toThrow(/already a stage/);
    expect(() => assertStageInvariants(s.filter((x) => x.category !== "OPEN"))).toThrow(StageRuleError);
    expect(() => assertStageInvariants(s.filter((x) => x.category !== "DONE"))).toThrow(/finished/);
    expect(() => assertStageInvariants(s.map((x) => ({ ...x, isDefault: false })))).toThrow(/Exactly one/);
    expect(() => assertStageInvariants(s.map((x) => ({ ...x, isDefault: true })))).toThrow(/Exactly one/);
    expect(() =>
      assertStageInvariants(s.map((x) => ({ ...x, isDefault: x.id === "s1" }))),
    ).toThrow(/Open category/);
    // Archived stages do not count.
    expect(() => assertStageInvariants([...s, { ...s[0], id: "old", isDefault: true, archivedAt: new Date() }])).not.toThrow();
  });

  it("cleans names and colours", () => {
    expect(cleanStageName("  Waiting   on  parts ")).toBe("Waiting on parts");
    expect(() => cleanStageName("")).toThrow();
    expect(() => cleanStageName("x".repeat(41))).toThrow(/40/);
    expect(cleanColor("#a1b2c3")).toBe("#A1B2C3");
    expect(cleanColor("")).toBeNull();
    expect(() => cleanColor("red")).toThrow();
  });

  it("first stage of a category follows board order", () => {
    const s = stages().map((x) => (x.id === "s3" ? { ...x, position: -1 } : x));
    expect(firstOfCategory(s, "ON_HOLD")!.name).toBe("Deferred");
    expect(firstOfCategory(s, "DONE")!.name).toBe("Resolved");
  });
});

describe("board order (R11.4, Property 5)", () => {
  it("midpoint, top, bottom and an empty column", () => {
    expect(positionBetween(1, 2)).toBe(1.5);
    expect(positionBetween(null, 3)).toBe(2);
    expect(positionBetween(3, undefined)).toBe(4);
    expect(positionBetween()).toBe(0);
    expect(needsRenumber(1 + 1e-9, 1, 1 + 2e-9)).toBe(true);
    expect([...renumber(["a", "b"])]).toEqual([["a", 0], ["b", 1]]);
  });

  it("property: any sequence of drops keeps positions distinct and in drop order", () => {
    fc.assert(
      fc.property(fc.array(fc.nat(), { minLength: 1, maxLength: 60 }), (slots) => {
        // Simulate a column: each drop inserts a new card at slot % (len + 1).
        let col: { id: number; pos: number }[] = [];
        let expected: number[] = [];
        slots.forEach((slot, id) => {
          const at = slot % (col.length + 1);
          const above = col[at - 1]?.pos;
          const below = col[at]?.pos;
          let pos = positionBetween(above, below);
          if (needsRenumber(pos, above, below)) {
            const ids = col.map((c) => c.id);
            ids.splice(at, 0, id);
            const n = renumber(ids.map(String));
            col = ids.filter((x) => x !== id).map((x) => ({ id: x, pos: n.get(String(x))! }));
            pos = n.get(String(id))!;
          }
          col.push({ id, pos });
          col.sort((a, b) => a.pos - b.pos);
          expected.splice(at, 0, id);
        });
        expect(new Set(col.map((c) => c.pos)).size).toBe(col.length);
        expect(col.map((c) => c.id)).toEqual(expected);
      }),
      { numRuns: 200 },
    );
  });
});

describe("list filters (R12.2, R12.5)", () => {
  const where = (f: any, me?: string) => JSON.parse(JSON.stringify(buildWhere("o1", f, me, new Date("2026-10-11T00:00:00Z"))));

  it("always pins the org first", () => {
    expect(where({}).AND[0]).toEqual({ organizationId: "o1" });
  });

  it("assignee: me, unassigned, named users, any; 'me' without a user matches nothing", () => {
    expect(where({ assignee: ["me"] }, "u1").AND[1]).toEqual({ OR: [{ assigneeId: { in: ["u1"] } }] });
    expect(where({ assignee: ["unassigned", "u2"] }, "u1").AND[1]).toEqual({ OR: [{ assigneeId: null }, { assigneeId: { in: ["u2"] } }] });
    expect(where({ assignee: ["any", "me"] }, "u1").AND).toHaveLength(1);
    expect(where({ assignee: ["me"] }).AND[1]).toEqual({ OR: [{ id: "__nobody__" }] });
  });

  it("stage, category, priority, emergency, bot, channel, tags, dates, age and search", () => {
    const w = where({
      stageId: ["s1"],
      category: ["done", "bogus"],
      priority: ["critical"],
      emergency: true,
      botId: ["b1"],
      channel: ["whatsapp"],
      source: ["chat"],
      tags: ["Sales"],
      createdFrom: "2026-10-01",
      updatedTo: "2026-10-10",
      olderThanHours: 24,
      q: "+91 98765",
    });
    expect(w.AND).toEqual(
      expect.arrayContaining([
        { stageId: { in: ["s1"] } },
        { stage: { category: { in: ["DONE"] } } },
        { priority: { in: ["CRITICAL"] } },
        { emergency: true },
        { botId: { in: ["b1"] } },
        { channel: { in: ["whatsapp"] } },
        { source: { in: ["chat"] } },
        { tags: { hasSome: ["Sales"] } },
        { createdAt: { gte: "2026-10-01T00:00:00.000Z" } },
        { updatedAt: { lte: "2026-10-10T00:00:00.000Z" } },
        { createdAt: { lte: "2026-10-10T00:00:00.000Z" } },
      ]),
    );
    const search = w.AND.find((x: any) => x.OR && x.OR.some((o: any) => o.ref));
    expect(search.OR).toEqual(expect.arrayContaining([{ contact: { phoneNormalized: { contains: "9198765" } } }]));
  });

  it("an invalid date is ignored, not an error", () => {
    expect(where({ createdFrom: "not a date" }).AND).toHaveLength(1);
  });
});

describe("transcript (R16.4)", () => {
  it("orders by time, keeps the last 500, masks secured answers, labels senders", () => {
    const rows = Array.from({ length: 510 }, (_, i) => ({
      message: `m${i}`,
      sender: i % 2 ? "bot1" : "v1",
      time: new Date(1_000 + i * 1000),
      secured: i === 509,
    })).reverse();
    const t = toTranscript(rows, { botId: "bot1", visitorId: "v1" });
    expect(t).toHaveLength(TRANSCRIPT_MAX);
    expect(t[0].text).toBe("m10");
    expect(t[t.length - 1].text).toBe("[secure]");
    expect(t[0].from).toBe("visitor");
    expect(t[1].from).toBe("bot");
  });

  it("reads buttons and cards as text", () => {
    expect(chatText({ value: "Pick one", buttons: [{ title: "A" }] })).toBe("Pick one");
    expect(chatText({ buttons: [{ title: "A" }, { title: "B" }] })).toBe("A / B");
    expect(chatText(null)).toBe("");
  });
});

describe("old ticket shape (R19.2)", () => {
  const row = {
    id: "sr1",
    ref: "SR_ABC123",
    subject: "Lift stuck",
    description: null,
    priority: "HIGH",
    emergency: false,
    tags: ["Support"],
    botId: "b1",
    botName: "Bot",
    visitorId: "v1",
    assigneeId: "u1",
    assigneeName: "Asha",
    conversationId: "c1",
    incidentId: "i1",
    contactId: "ct1",
    contact: { id: "ct1", firstName: "Raj", lastName: "Kumar", email: "raj@x.com", phone: null, isAnonymous: false },
    source: "chat",
    channel: "widget",
    closedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    stage: { id: "s2", name: "Waiting on Customer", color: "#FDB528", category: "ON_HOLD" },
  };

  it("maps the stage category to the old status and keeps the old field names", () => {
    const v = toTicketView(row, { _id: "v1", name: "Raj" });
    expect(v).toMatchObject({
      _id: "sr1",
      ticketId: "SR_ABC123",
      status: "DEFERRED",
      bot: { _id: "b1", name: "Bot" },
      agents: [{ _id: "u1", name: "Asha" }],
      visitor: { _id: "v1", name: "Raj" },
      incident: "i1",
      crmContactId: "ct1",
      contact: { name: "Raj Kumar" },
    });
    expect(toTicketView({ ...row, stage: { ...row.stage, category: "DONE" } }).status).toBe("CLOSED");
    expect(toTicketView({ ...row, stage: { ...row.stage, category: "IN_PROGRESS" } }).status).toBe("PENDING");
  });

  it("history becomes the old activity timeline, oldest first", () => {
    const a = toActivities([
      { id: "e2", type: "STAGE_CHANGED", actorName: "Asha", to: { name: "Resolved", category: "DONE" }, createdAt: new Date(2000) },
      { id: "e1", type: "CREATED", createdAt: new Date(1000) },
    ]);
    expect(a.map((x) => [x.status, x.message])).toEqual([
      ["CREATED", "Service Request Created"],
      ["RESOLVED", "Moved to Resolved by Asha"],
    ]);
  });
});
