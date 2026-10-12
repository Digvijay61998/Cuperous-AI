/** crm-incident-handover task 8.5: the PII guard on learned knowledge (R12.2). */
import * as fc from "fast-check";
import { lastMonths, share } from "./agent-share";
import { checkCandidate, knowledgeText, maskForLearning, shouldLearn, unsafeReason } from "./learn-rules";

const S = { names: ["Raj", "Kumar"], ticketRefs: ["SR_Ab12Cd"] };
const ANSWER = "Check the door sill, then press the door-close button. If it still fails, report a fault.";

describe("maskForLearning (input to the AI)", () => {
  it("removes email, phone, the contact's name and ticket refs", () => {
    const out = maskForLearning("Raj Kumar (raj@x.io, +91 98765 43210) says door broken, ref SR_Ab12Cd and SR_zz99yy", S);
    expect(out).toBe("[name] [name] ([email], [phone]) says door broken, ref [ref] and [ref]");
  });

  it("does not mangle words that only contain the name", () => {
    expect(maskForLearning("Rajasthan office, Kumari road", S)).toBe("Rajasthan office, Kumari road");
  });

  it("ignores placeholder and very short names", () => {
    expect(maskForLearning("Al said the anonymous visitor door", { names: ["Al", "Anonymous visitor"] })).toBe("Al said the anonymous visitor door");
  });

  it("property: no email, phone or name survives", () => {
    fc.assert(
      fc.property(fc.emailAddress(), fc.stringMatching(/^[1-9]\d{7,12}$/), fc.stringMatching(/^[A-Z][a-z]{3,9}$/), (email, phone, name) => {
        const out = maskForLearning(`hi I am ${name}, ${email} ${phone}`, { names: [name] });
        return !out.includes(email) && !out.includes(phone) && !new RegExp(`\\b${name}\\b`, "i").test(out);
      }),
    );
  });
});

describe("checkCandidate (output of the AI)", () => {
  const Q = "What should I do if the lift door does not close?";

  it("accepts a clean, generalised Q&A", () => {
    expect(checkCandidate({ question: `  ${Q} `, answer: ANSWER }, S)).toEqual({ ok: true, question: Q, answer: ANSWER });
  });

  it.each([
    ["short question", { question: "Door?", answer: ANSWER }],
    ["long question", { question: "x".repeat(501), answer: ANSWER }],
    ["short answer", { question: Q, answer: "Reset it" }],
    ["long answer", { question: Q, answer: "y".repeat(2001) }],
    ["email", { question: Q, answer: `${ANSWER} Mail help@acme.io.` }],
    ["phone", { question: Q, answer: `${ANSWER} Call 020 7946 0958.` }],
    ["ticket ref", { question: Q, answer: `${ANSWER} See SR_Ab12Cd.` }],
    ["any platform ref", { question: `${Q} (SR_9x9x9x)`, answer: ANSWER }],
    ["contact name", { question: Q, answer: `Raj, ${ANSWER}` }],
    ["placeholder", { question: Q, answer: `${ANSWER} We wrote to [email].` }],
    ["not an object", "junk"],
    ["wrong types", { question: 1, answer: null }],
  ])("rejects %s", (_n, raw) => {
    expect(checkCandidate(raw, S).ok).toBe(false);
  });

  it("allows ordinary numbers and words that start like a ref", () => {
    expect(unsafeReason("Floor 3, lift 2, wait 30 minutes. Srinagar office.", S)).toBeNull();
  });
});

describe("helpers", () => {
  it("learns only from an agent resolution with a 10+ character note (R21.1)", () => {
    expect(shouldLearn({ outcome: "resolved_by_agent", resolutionNote: "Reset the door operator" })).toBe(true);
    expect(shouldLearn({ outcome: "resolved_by_agent", resolutionNote: "  short  " })).toBe(false);
    expect(shouldLearn({ outcome: "resolved_by_agent" })).toBe(false);
    expect(shouldLearn({ outcome: "resolved_by_bot", resolutionNote: "Reset the door operator" })).toBe(false);
    expect(shouldLearn(null)).toBe(false);
  });

  it("formats the ingested text", () => {
    expect(knowledgeText("q?", ["a1", "", "a2"])).toBe("Q: q?\nA: a1\na2");
  });

  it("agent share: calendar months, null with no conversations (R21.5)", () => {
    const m = lastMonths(3, new Date("2026-01-15T10:00:00Z"));
    expect(m.map((x) => x.month)).toEqual(["2025-11", "2025-12", "2026-01"]);
    expect(m[2].from.toISOString()).toBe("2026-01-01T00:00:00.000Z");
    expect(m[2].to.toISOString()).toBe("2026-02-01T00:00:00.000Z");
    expect(lastMonths(99).length).toBe(12);
    expect(share(1, 200)).toBe(0.005);
    expect(share(0, 0)).toBeNull();
    expect(share(5, 2)).toBe(1);
  });
});
