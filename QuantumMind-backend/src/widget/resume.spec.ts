import { decideResume, parseResumeRequest } from "./resume";

const BOT = "64b0000000000000000000b1";
const V = "64c0000000000000000000a1";
const C = "64c0000000000000000000c1";
const visitor = { id: V, botId: BOT };
const conv = (p: any = {}) => ({ id: C, botId: BOT, visitorId: V, status: "in_progress", ...p });

describe("widget resume decision (R9.3, R9.11)", () => {
  it("resumes the visitor's open conversation on the same bot", () => {
    expect(decideResume({ visitorId: V, conversationId: C, newConversation: false }, { botId: BOT, visitor, conversation: conv() })).toEqual({
      kind: "resume",
      visitorId: V,
      conversationId: C,
    });
  });

  it("an ended conversation reports the Ended_State and creates nothing (R14.7)", () => {
    // Closed by the closure flow: status is completed and endedAt is set.
    expect(
      decideResume({ visitorId: V, conversationId: C, newConversation: false }, { botId: BOT, visitor, conversation: conv({ ended: true, status: "completed" }) }),
    ).toEqual({ kind: "ended", visitorId: V, conversationId: C });
  });
  it("Start new chat from the Ended_State gets a new conversation for the same visitor (R14.9)", () => {
    expect(
      decideResume({ visitorId: V, conversationId: C, newConversation: true }, { botId: BOT, visitor, conversation: conv({ ended: true, status: "completed" }) }),
    ).toEqual({ kind: "new_conversation", visitorId: V, reason: "requested" });
  });
  it.each([
    ["expired", conv({ status: "expired" }), "status_expired"],
    ["completed", conv({ status: "completed" }), "status_completed"],
    ["missing", null, "no_conversation"],
    ["someone else's", conv({ visitorId: "64c0000000000000000000ff" }), "conversation_not_visitors"],
    ["another bot's", conv({ botId: "64b0000000000000000000ff" }), "conversation_not_visitors"],
  ])("a %s conversation starts a new one for the same visitor", (_n, c, reason) => {
    expect(decideResume({ visitorId: V, conversationId: C, newConversation: false }, { botId: BOT, visitor, conversation: c as any })).toEqual({
      kind: "new_conversation",
      visitorId: V,
      reason,
    });
  });

  it("Start new chat never resumes", () => {
    expect(decideResume({ visitorId: V, conversationId: C, newConversation: true }, { botId: BOT, visitor, conversation: conv() }).kind).toBe(
      "new_conversation",
    );
  });

  it("an unknown or other-bot visitor is a fresh visitor", () => {
    expect(decideResume({ visitorId: V, newConversation: false }, { botId: BOT, visitor: null, conversation: null }).kind).toBe("new_visitor");
    expect(
      decideResume({ visitorId: V, newConversation: false }, { botId: BOT, visitor: { id: V, botId: "64b0000000000000000000ff" }, conversation: null })
        .kind,
    ).toBe("new_visitor");
    expect(decideResume({ newConversation: false }, { botId: BOT, visitor, conversation: conv() }).kind).toBe("new_visitor");
  });

  it("ignores malformed ids from the client", () => {
    expect(parseResumeRequest({ resume: { visitorId: { $ne: null }, conversationId: "x" } })).toEqual({
      visitorId: undefined,
      conversationId: undefined,
      newConversation: false,
    });
    expect(parseResumeRequest({ newConversation: true, resume: { visitorId: V } })).toEqual({
      visitorId: V,
      conversationId: undefined,
      newConversation: true,
    });
    expect(parseResumeRequest(undefined)).toEqual({ visitorId: undefined, conversationId: undefined, newConversation: false });
  });
});
