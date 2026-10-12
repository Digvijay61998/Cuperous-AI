/**
 * crm-incident-handover task 9.2 (R15.2): a conversation with no handover
 * behaves the same whether the CRM / incident / profile / auto-learn flags
 * are on or off: same bot and AI messages, same order, same node path, zero
 * incidents. The flags-off transcript is also kept as a golden snapshot
 * (`__snapshots__/kone-golden.spec.ts.snap`), so any later change to these
 * paths shows up as a diff to review.
 *
 * `closurePrompt` is left out on purpose: R15.2 allows the R14 differences
 * (it replaces menu restarts at terminal outcomes).
 */
jest.mock("@nestjs/schedule", () => ({
  Interval: () => () => undefined,
  Cron: () => () => undefined,
  Timeout: () => () => undefined,
  CronExpression: new Proxy({}, { get: () => "* * * * *" }),
  ScheduleModule: { forRoot: () => ({}) },
}));

import { harness } from "./kone-harness.testspec";

const ALL_ON = { crmCapture: true, incidentHandover: true, profileSummaries: true, autoLearn: true };

/** KONE paths that never ask for a person. Fixed ids keep the snapshot stable. */
const SCRIPTS: Record<string, string[]> = {
  "delivery and invoices menus": ["start", "delivery", "delivery stages", "menu", "invoices", "download invoice", "cant see invoices", "menu"],
  "free questions answered by the AI": ["start", "how do I add a new user to myKONE?", "ask a question", "what does waiting for PO number mean?", "and how long does approval take?"],
  "reports and tenders": ["start", "reports", "explain a finding", "Rope wear on the hoist ropes", "menu", "tenders", "status meaning", "menu"],
  "equipment with an unreachable connector, then goodbye": ["start", "equipment", "41230018", "status", "menu", "bye", "hello again"],
  // The segment id is a placeholder in the shipped flow, so the node throws and
  // the generic fallback is sent (documented in the flow README). Same either way.
  "unconfigured segment node": ["start", "stop reminders", "invoices"],
};

async function run(features: Record<string, boolean>, script: string[]) {
  const h = harness({
    features,
    orgId: "64b000000000000000000001",
    botId: "64b0000000000000000000b1",
    visitorId: "64c0000000000000000000a1",
    conversationId: "64c0000000000000000000c1",
    // profileSummaries on: a known contact's profile would be read. None here.
    profileService: { contextForConversation: async () => null },
  });
  const turns: { visitor: string; bot: string[]; node: string }[] = [];
  for (const line of script) {
    const from = h.sent.length;
    await h.mh.handleMessage(line, { auth: { userId: h.visitorId, name: "Visitor" } } as any);
    await h.flush();
    turns.push({ visitor: line, bot: h.transcriptOf(h.sent.slice(from)), node: h.state()?.currentNode?.id ?? "(none)" });
  }
  const aiQuestions = h.http.post.mock.calls.map((c: any[]) => c[1]?.question);
  return { turns, aiQuestions, incidents: h.models.Incident.docs.length, tickets: h.models.Ticket.docs.length };
}

beforeEach(() => {
  jest.useFakeTimers({ doNotFake: ["performance", "setImmediate"] } as any);
  // The menu greets with a random variant; pin it.
  jest.spyOn(Math, "random").mockReturnValue(0);
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe("golden transcripts: flows without a handover (R15.2)", () => {
  it.each(Object.entries(SCRIPTS))("%s: identical with the flags on and off", async (_name, script) => {
    const off = await run({}, script);
    const on = await run(ALL_ON, script);
    expect(on.turns).toEqual(off.turns);
    expect(on.aiQuestions).toEqual(off.aiQuestions);
    expect(off.incidents + on.incidents).toBe(0);
    expect(off.tickets + on.tickets).toBe(0);
    // Every visitor line got a reply, except after the chat was closed.
    const closedAt = off.turns.findIndex((t) => t.visitor === "bye");
    off.turns.forEach((t, i) => {
      if (closedAt >= 0 && i > closedAt) expect(t.bot).toEqual([]);
      else expect(t.bot.length).toBeGreaterThan(0);
    });
    expect(off.turns).toMatchSnapshot();
  });
});
