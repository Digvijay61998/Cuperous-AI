/** crm-incident-handover Phase 6: pure Closure_Prompt rules (R14). */
import * as fc from "fast-check";
import {
  CLOSURE_CHOICES,
  closingMessageText,
  closureApplies,
  closureIdleMinutes,
  closurePromptMessage,
  DEFAULT_CLOSING_MESSAGE,
  DEFAULT_CLOSURE_PROMPT,
  isClosureIdle,
  isClosureLabel,
  isMarkedTerminal,
  parseClosureReply,
} from "./closure";

const on = { features: { closurePrompt: true } };

describe("parseClosureReply", () => {
  it.each([
    ["Yes, resolved", "resolved"],
    ["  yes,   RESOLVED ", "resolved"],
    ["I need something else", "other"],
    ["Start again", "restart"],
    ["start", "restart"],
    [" RESET ", "restart"],
    ["Restart", "restart"],
  ])("%j -> %s", (text, kind) => {
    expect(parseClosureReply(text).kind).toBe(kind);
  });

  it("free text keeps the visitor's own wording (R14.10)", () => {
    expect(parseClosureReply("  What about my invoice? ")).toEqual({ kind: "free_text", text: "What about my invoice?" });
  });

  it("restart words only match as the whole message (R14.4)", () => {
    expect(parseClosureReply("start the lift").kind).toBe("free_text");
    expect(parseClosureReply("yes").kind).toBe("free_text");
  });

  it("empty and non-text input is not an answer", () => {
    for (const v of ["", "   ", null, undefined, 5, { value: "Yes, resolved" }]) {
      expect(parseClosureReply(v as any).kind).toBe("none");
    }
  });

  it("property: every non-blank string is exactly one of the four answers", () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        const r = parseClosureReply(s);
        if (!s.trim()) return r.kind === "none";
        return ["resolved", "other", "restart", "free_text"].includes(r.kind);
      }),
    );
  });

  it("labels are recognised for ignoring late clicks", () => {
    for (const l of Object.values(CLOSURE_CHOICES)) expect(isClosureLabel(l.toUpperCase())).toBe(true);
    expect(isClosureLabel("start")).toBe(false);
    expect(isClosureLabel(undefined)).toBe(false);
  });
});

describe("idle time (R14.5)", () => {
  it.each([
    [undefined, 10],
    [null, 10],
    ["", 10],
    ["abc", 10],
    [NaN, 10],
    [0, 1],
    [-5, 1],
    [1, 1],
    [7.4, 7],
    ["15", 15],
    [60, 60],
    [600, 60],
  ])("closureIdleMinutes(%j) = %d", (v, expected) => {
    expect(closureIdleMinutes({ closureIdleMinutes: v as any })).toBe(expected);
  });

  it("counts from when the prompt was sent", () => {
    const sent = 1_000_000;
    expect(isClosureIdle(sent, 10, sent + 10 * 60_000 - 1)).toBe(false);
    expect(isClosureIdle(sent, 10, sent + 10 * 60_000)).toBe(true);
    expect(isClosureIdle(new Date(sent), 1, sent + 60_000)).toBe(true);
    expect(isClosureIdle("not a date", 1, sent + 1e9)).toBe(false);
  });

  it("property: never idle before the configured minutes, always after", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 60 }), fc.integer({ min: 0, max: 3_600_000 * 2 }), (mins, elapsed) => {
        const sent = 5_000_000;
        return isClosureIdle(sent, mins, sent + elapsed) === elapsed >= mins * 60_000;
      }),
    );
  });
});

describe("closureApplies", () => {
  it("needs the flag (fail closed)", () => {
    expect(closureApplies({ botSettings: {} })).toBe(false);
    expect(closureApplies({ botSettings: { features: { closurePrompt: "true" } } })).toBe(false);
    expect(closureApplies(null)).toBe(false);
    expect(closureApplies({ botSettings: on })).toBe(true);
  });

  it("widget only: other channels are unchanged (R15.7)", () => {
    expect(closureApplies({ botSettings: on, platform: "widget" })).toBe(true);
    expect(closureApplies({ botSettings: on, platform: "whatsapp" })).toBe(false);
    expect(closureApplies({ botSettings: on, platform: "telegram" })).toBe(false);
  });

  it("never while an agent owns the chat (R14.11)", () => {
    expect(closureApplies({ botSettings: on, handledByAgent: true })).toBe(false);
  });
});

describe("terminal toggle and texts", () => {
  it("is honoured on SUCCESS, FAILURE, TIMEOUT and BOT_RESPONSE only", () => {
    for (const t of ["SUCCESS", "FAILURE", "TIMEOUT", "BOT_RESPONSE"]) {
      expect(isMarkedTerminal({ nodeType: t, payload: { terminal: true } })).toBe(true);
      expect(isMarkedTerminal({ nodeType: t, payload: { terminal: "yes" } })).toBe(false);
      expect(isMarkedTerminal({ nodeType: t, payload: {} })).toBe(false);
    }
    expect(isMarkedTerminal({ nodeType: "WEBHOOK", payload: { terminal: true } })).toBe(false);
    expect(isMarkedTerminal(null)).toBe(false);
  });

  it("prompt has exactly the three buttons and the configured text", () => {
    const m = closurePromptMessage({ closurePromptText: "  Did that help?  " });
    expect(m.value).toBe("Did that help?");
    expect(m.buttons.map((b) => b.title)).toEqual(["Yes, resolved", "I need something else", "Start again"]);
    expect(closurePromptMessage({}).value).toBe(DEFAULT_CLOSURE_PROMPT);
    expect(closingMessageText({ closingMessage: "   " })).toBe(DEFAULT_CLOSING_MESSAGE);
    expect(closingMessageText({ closingMessage: "Bye!" })).toBe("Bye!");
  });
});
