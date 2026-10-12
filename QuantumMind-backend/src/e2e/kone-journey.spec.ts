/**
 * crm-incident-handover task 9.1 (the journeys that need no Postgres) and
 * 9.2 (preview). Real MessageHandler, IncidentService, ChannelThreadService,
 * ConversationService and gateway on the real KONE flow, over in-memory Mongo.
 *
 * The CRM journeys (anonymous -> details -> merge, returning visitor profile)
 * run against the real CRM Postgres in kone-crm.int.spec.ts.
 */
jest.mock("@nestjs/schedule", () => ({
  Interval: () => () => undefined,
  Cron: () => () => undefined,
  Timeout: () => () => undefined,
  CronExpression: new Proxy({}, { get: () => "* * * * *" }),
  ScheduleModule: { forRoot: () => ({}) },
}));

import { ChannelThreadService } from "src/channel-thread/channel-thread.service";
import { ConversationService } from "src/conversation/conversation.service";
import { JarCubeGateway } from "src/jarcube/jarcube.gateway";
import { DEFAULT_CLOSING_MESSAGE, DEFAULT_CLOSURE_PROMPT } from "src/message-handler/closure";
import { fakeModel } from "src/profile/fakes.testspec";
import { decideResume } from "src/widget/resume";
import { harness, oid } from "./kone-harness.testspec";

const MAIN_MENU = /I'm the myKONE Assistant/;
// The old dead end. A "please wait, a specialist will join" notice is wanted now (owner).
const NO_AGENT_TEXT = /no agent is available|try again later|enter "start"/i;

beforeEach(() => jest.useFakeTimers({ doNotFake: ["performance", "setImmediate"] } as any));
afterEach(() => jest.useRealTimers());

/** Visitor asks for a specialist; the incident and its ticket are recorded. */
async function recordRequest(h: ReturnType<typeof harness>, problem = "The lift door on floor 3 does not close properly") {
  await h.say("start");
  h.state().attributes = { contact_topic: problem };
  const from = h.sent.length;
  await h.mh.TransferToAgent("", h.nodes.kone_agent, h.visitorId);
  await h.flush();
  return h.texts(h.sent.slice(from));
}

describe("journey: two agents race for the same request", () => {
  it("exactly one owns it, the visitor hears one name, the incident ends resolved by that agent", async () => {
    const h = harness({ features: { incidentHandover: true } });
    const recorded = await recordRequest(h);
    expect(h.models.Incident.docs).toHaveLength(1);
    expect(h.models.Ticket.docs).toHaveLength(1);
    expect(recorded.join(" ")).toContain(h.models.Ticket.docs[0].ticketId);
    expect(recorded.join(" ")).not.toMatch(NO_AGENT_TEXT);

    const threads = fakeModel([{ _id: oid(), channel: "widget", chatId: h.conversationId, visitor: h.visitorId }]);
    const threadSvc = new ChannelThreadService(threads as any);
    const threadId = String(threads.docs[0]._id);
    const [priya, arun] = [oid(), oid()];

    // Both press "Take over" at the same moment.
    const claims = await Promise.all([threadSvc.claim(threadId, priya), threadSvc.claim(threadId, arun)]);
    expect(claims.filter((c) => c.ok)).toHaveLength(1);
    const winner = claims[0].ok ? priya : arun;
    const loser = winner === priya ? arun : priya;
    const lost = claims.find((c) => !c.ok) as any;
    expect(lost.owner?.id).toBe(winner);
    expect(threads.docs[0]).toMatchObject({ assignedAgent: winner, handledByAgent: true, botEnabled: false });

    // The takeover event for the winner (what InboxService emits), twice (retry).
    const from = h.sent.length;
    const ev = { visitorId: h.visitorId, conversationId: h.conversationId, agentId: winner, agentName: winner === priya ? "Priya" : "Arun" };
    await Promise.all([h.mh.onAgentTookOver(ev), h.mh.onAgentTookOver(ev)]);
    await h.flush();
    const joined = h.texts(h.sent.slice(from)).filter((m) => /has joined the chat/.test(m));
    expect(joined).toHaveLength(1);
    expect(h.models.Incident.docs[0]).toMatchObject({ status: "agent_active", agentId: winner });

    // The loser cannot accept the incident behind the winner's back.
    const incidentId = String(h.models.Incident.docs[0]._id);
    await expect(h.incidents.accept(incidentId, loser)).rejects.toThrow(/Another agent/);

    // Only the owner can resolve, with a note.
    const orgUser = (id: string) => ({ _id: id, role: "agent", organizationId: h.orgId }) as any;
    h.models.Incident.docs[0].organizationId = h.orgId;
    await expect(h.incidents.resolve(incidentId, orgUser(loser), "Reset the door operator")).rejects.toThrow(/Only the agent/);
    await h.incidents.resolve(incidentId, orgUser(winner), "Reset the door operator remotely.");
    expect(h.models.Incident.docs[0]).toMatchObject({ status: "resolved", outcome: "resolved_by_agent", resolvedBy: winner });
    expect(h.events.filter((e) => e.name === "incident.closed")).toHaveLength(1);
    // A second resolve changes nothing (single closure, Property 4).
    await expect(h.incidents.resolve(incidentId, orgUser(winner), "Reset the door operator again.")).rejects.toThrow();
    expect(h.events.filter((e) => e.name === "incident.closed")).toHaveLength(1);
  });
});

describe("journey: closure, then a reload into the Ended_State", () => {
  function realConversations(h0: { models: any }) {
    const activities = { findOne: async () => ({ startedAt: new Date(Date.now() - 60_000), save: async () => undefined }) };
    const svc = new ConversationService(h0.models.Conversation, h0.models.Chat, activities as any, { emit: () => undefined } as any, {} as any);
    (svc as any).logger = { error: () => undefined, warn: () => undefined, log: () => undefined };
    svc.getConversationById = (async () => ({ chats: [] })) as any;
    return svc;
  }

  it("resolved -> closing message once -> ended in the database -> reload shows Ended_State, reconnect sends no start", async () => {
    const models: any = { Conversation: fakeModel(), Visitor: fakeModel(), Ticket: fakeModel(), Chat: fakeModel(), Bot: fakeModel() };
    const conversationService = realConversations({ models });
    const h = harness({ features: { incidentHandover: true, closurePrompt: true }, models, conversationService });
    h.models.Conversation.docs[0].activities = ["a1"];

    // A failed recording ends at CLOSE_CHAT, a Terminal_Outcome.
    (h.incidents as any).openForHandover = async () => {
      throw new Error("db down");
    };
    const atEnd = await recordRequest(h);
    expect(atEnd.filter((m) => m === DEFAULT_CLOSURE_PROMPT)).toHaveLength(1);
    expect(atEnd.join("\n")).not.toMatch(MAIN_MENU);
    expect(h.models.Conversation.docs[0].awaitingClosure).toMatchObject({ idleMinutes: 10 });

    expect(await h.say("Yes, resolved")).toEqual([DEFAULT_CLOSING_MESSAGE]);
    expect(h.sent.filter((e) => e.event === "conversation-ended")).toHaveLength(1);
    const conv = h.models.Conversation.docs[0];
    expect(conv).toMatchObject({ status: "completed", endCause: "closure_resolved" });
    expect(conv.endedAt).toBeTruthy();
    expect(conv.awaitingClosure).toBeUndefined();
    // Later clicks and messages do nothing.
    expect(await h.say("Yes, resolved")).toEqual([]);
    expect(await h.say("hello?")).toEqual([]);

    // Reload: the widget sends its stored ids; the server reports Ended_State.
    const facts = await conversationService.resumeFacts(h.conversationId);
    expect(facts?.ended).toBe(true);
    const decision = decideResume(
      { visitorId: h.visitorId, conversationId: h.conversationId, newConversation: false },
      { botId: h.botId, visitor: { id: h.visitorId, botId: h.botId }, conversation: facts },
    );
    expect(decision).toEqual({ kind: "ended", visitorId: h.visitorId, conversationId: h.conversationId });
    // "Start new chat" is a new conversation for the same visitor (R14.9).
    expect(
      decideResume(
        { visitorId: h.visitorId, conversationId: h.conversationId, newConversation: true },
        { botId: h.botId, visitor: { id: h.visitorId, botId: h.botId }, conversation: facts },
      ),
    ).toMatchObject({ kind: "new_conversation", visitorId: h.visitorId });

    // A stale tab reconnecting gets the Ended_State again and no "start".
    const handleMessage = jest.spyOn(h.mh, "handleMessage");
    const gw = new JarCubeGateway(
      h.mh,
      { getUserData: (id: string) => h.store.get(id), updateUserData: (id: string, p: any) => h.store.set(id, { ...h.store.get(id), ...p }) } as any,
      conversationService,
      {} as any,
      {} as any,
      { emit: () => undefined } as any,
      {} as any,
    );
    const emit = jest.fn();
    await gw.handleConnection({ auth: { userId: h.visitorId, role: "visitor" }, emit } as any);
    expect(handleMessage).not.toHaveBeenCalled();
    expect(emit).toHaveBeenCalledWith("conversation-ended", expect.objectContaining({ conversationId: h.conversationId }));

    // A disconnect afterwards does not re-end it (ends exactly once).
    await conversationService.endConversation(h.conversationId, "expired" as any, "disconnect");
    expect(h.models.Conversation.docs[0].endCause).toBe("closure_resolved");
  });
});

describe("non-regression: preview mode creates nothing (R15.1)", () => {
  it("a full handover in preview opens no incident, ticket, CRM contact, email or summary", async () => {
    const crmBridge = { ensureAnonymous: jest.fn(async () => "should-not-be-used"), capture: jest.fn() };
    const profileService = { contextForConversation: jest.fn(async () => ({ facts: {} })) };
    const h = harness({
      mode: "preview",
      features: { crmCapture: true, incidentHandover: true, profileSummaries: true, closurePrompt: true, autoLearn: true },
      crmBridge,
      profileService,
    });
    await h.say("start");
    await h.say("talk to agent");
    for (const a of ["Raj Kumar", "raj@example.com", "9876543210", "Lift 2", "The lift door on floor 3 does not close"]) await h.say(a);
    await h.say("what is the warranty on doors?");
    const out = h.texts();
    // The visitor still sees the flow, with a sample reference.
    expect(out.join("\n")).toMatch(/SR_PREVIEW/);
    expect(h.models.Incident.docs).toHaveLength(0);
    expect(h.models.Ticket.docs).toHaveLength(0);
    expect(h.ticketsService.create).not.toHaveBeenCalled();
    expect(crmBridge.ensureAnonymous).not.toHaveBeenCalled();
    expect(h.alerts.raise).not.toHaveBeenCalled();
    expect(profileService.contextForConversation).not.toHaveBeenCalled();
    expect(h.conversationService.setAwaitingClosure).not.toHaveBeenCalled();
    expect(h.conversationService.endConversation).not.toHaveBeenCalled();
    const persisted = h.events.filter((e) => ["create.new.chat", "crm.attribute.captured", "attribute.captured", "visitor.text"].includes(e.name));
    expect(persisted).toEqual([]);
    for (const call of h.http.post.mock.calls) expect(String(call[0])).not.toMatch(/profile|knowledge|extract/);
  });
});
