import * as fc from "fast-check";
import { deriveSenderRole } from "src/inbox/inbox.mapper";
import { matchesAgentIntent, normalizeIntentText } from "./agent-intent";

describe("matchesAgentIntent", () => {
  const phrases = ["talk to agent", "human", "talk to kone"];

  it.each([
    ["Talk to KONE", true],
    ["  talk   to   agent!! ", true],
    ["I need a human, please", true],
    ["humanity is great", false],
    ["superhuman", false],
    ["what are your hours?", false],
    ["", false],
  ])("%p -> %p", (msg, expected) => {
    expect(matchesAgentIntent(msg, phrases)).toBe(expected);
  });

  it("is disabled for an empty or invalid phrase list", () => {
    expect(matchesAgentIntent("human", [])).toBe(false);
    expect(matchesAgentIntent("human", undefined)).toBe(false);
    expect(matchesAgentIntent("human", ["", "x".repeat(101)])).toBe(false);
  });

  it("property: a phrase embedded between spaces always matches", () => {
    const word = fc.stringMatching(/^[a-z]{2,10}$/);
    fc.assert(
      fc.property(word, word, word, (pre, phrase, post) => {
        expect(matchesAgentIntent(`${pre} ${phrase} ${post}`, [phrase])).toBe(true);
      }),
    );
  });

  it("property: normalisation is idempotent", () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        const once = normalizeIntentText(s);
        expect(normalizeIntentText(once)).toBe(once);
      }),
    );
  });
});

describe("deriveSenderRole", () => {
  const ctx = { botId: "bot1", visitorId: "vis1" };
  it("classifies widget rows by id", () => {
    expect(deriveSenderRole({ sender: "bot1" }, ctx)).toBe("bot");
    expect(deriveSenderRole({ sender: "vis1" }, ctx)).toBe("visitor");
    expect(deriveSenderRole({ sender: "agent7" }, ctx)).toBe("agent");
  });
  it("uses direction for channel rows", () => {
    expect(deriveSenderRole({ sender: "x", direction: "inbound" })).toBe("visitor");
    expect(deriveSenderRole({ sender: "x", direction: "outbound" })).toBe("agent");
  });
  it("stays undefined when it cannot tell (client then stays silent)", () => {
    expect(deriveSenderRole({ sender: "x" })).toBeUndefined();
  });
});
