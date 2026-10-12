import { deriveSenderRole } from "./inbox.mapper";

// Side rule (WhatsApp-style): visitor on one side; bot/AI/flow/agent on the other.
describe("deriveSenderRole", () => {
  const ctx = { botId: "bot1", visitorId: "vis1" };

  it("legacy widget rows with no direction: bot vs visitor vs agent by id", () => {
    expect(deriveSenderRole({ sender: "bot1" }, ctx)).toBe("bot");
    expect(deriveSenderRole({ sender: "vis1" }, ctx)).toBe("visitor");
    expect(deriveSenderRole({ sender: "agentX" }, ctx)).toBe("agent");
  });

  it("dashboard reply row (outbound, no ctx) is agent", () => {
    expect(deriveSenderRole({ sender: "agentX", direction: "outbound" })).toBe("agent");
  });

  it("channel inbound is visitor, channel outbound by bot is bot", () => {
    expect(deriveSenderRole({ sender: "x", direction: "inbound" })).toBe("visitor");
    expect(deriveSenderRole({ sender: "bot1", direction: "outbound" }, ctx)).toBe("bot");
  });

  it("unknown stays undefined", () => {
    expect(deriveSenderRole({})).toBeUndefined();
  });
});
