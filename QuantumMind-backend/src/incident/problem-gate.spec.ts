import * as fc from "fast-check";
import { NO_PROBLEM_TEXT } from "./constants";
import { ProblemFlagEnum } from "./enums/incident.enum";
import {
  evaluateProblemAnswer,
  isProblemQuestionExpired,
  normalizeProblem,
  PROBLEM_ANSWER_TTL_MS,
} from "./problem-gate";
import { buildTicketDescription } from "./ticket-description";

describe("problem gate rules (R4)", () => {
  it("accepts a 10+ character answer on the first try", () => {
    expect(evaluateProblemAnswer("  The lift door is stuck  ", 1)).toEqual({
      kind: "accept",
      problem: "The lift door is stuck",
      flags: [],
    });
  });

  it("re-asks once on a short first answer, including an empty one (button/attachment)", () => {
    expect(evaluateProblemAnswer("help", 1)).toEqual({ kind: "reask" });
    expect(evaluateProblemAnswer("", 1)).toEqual({ kind: "reask" });
    expect(evaluateProblemAnswer(undefined, 1)).toEqual({ kind: "reask" });
  });

  it("accepts a second short answer, flagged short (R4.5)", () => {
    expect(evaluateProblemAnswer("help", 2)).toEqual({
      kind: "accept",
      problem: "help",
      flags: [ProblemFlagEnum.SHORT],
    });
    const empty = evaluateProblemAnswer("   ", 2);
    expect(empty).toMatchObject({ kind: "accept", problem: NO_PROBLEM_TEXT });
    expect((empty as any).flags).toEqual([ProblemFlagEnum.NONE, ProblemFlagEnum.SHORT]);
  });

  it("does not take a repeated agent request as the description", () => {
    expect(evaluateProblemAnswer("I want to talk to an agent", 1, true)).toEqual({ kind: "reask" });
    expect(evaluateProblemAnswer("I want to talk to an agent", 2, true)).toMatchObject({
      kind: "accept",
      problem: NO_PROBLEM_TEXT,
    });
  });

  it("truncates past 1000 characters on a code-point boundary (R4.6)", () => {
    const long = "😀".repeat(1200);
    const out = normalizeProblem(long);
    expect(Array.from(out.problem)).toHaveLength(1000);
    expect(out.flags).toContain(ProblemFlagEnum.TRUNCATED);
    expect(out.problem.endsWith("\ud83d")).toBe(false);
  });

  it("collapses whitespace and never returns an empty problem", () => {
    expect(normalizeProblem("a\n\n  b\t c").problem).toBe("a b c");
    fc.assert(
      fc.property(fc.string(), fc.boolean(), (s, short) => {
        const out = normalizeProblem(s, short);
        expect(out.problem.length).toBeGreaterThan(0);
        expect(Array.from(out.problem).length).toBeLessThanOrEqual(1000);
      }),
    );
  });

  it("property: the gate ends within two asks", () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), fc.boolean(), (a, b, nd) => {
        const first = evaluateProblemAnswer(a, 1, nd);
        if (first.kind === "accept") return;
        expect(evaluateProblemAnswer(b, 2, nd).kind).toBe("accept");
      }),
    );
  });

  it("expires after 10 minutes, and treats a missing/invalid time as expired", () => {
    const now = new Date(1_000_000_000_000);
    expect(isProblemQuestionExpired(now.getTime() - PROBLEM_ANSWER_TTL_MS + 1, now)).toBe(false);
    expect(isProblemQuestionExpired(now.getTime() - PROBLEM_ANSWER_TTL_MS - 1, now)).toBe(true);
    expect(isProblemQuestionExpired(undefined, now)).toBe(true);
    expect(isProblemQuestionExpired("garbage", now)).toBe(true);
  });
});

describe("buildTicketDescription (R1.1, R1.6)", () => {
  it("puts the problem first, then configured attributes in order", () => {
    expect(
      buildTicketDescription("Door stuck on 3rd floor", {
        ticket_summary: "Lift 2, Building A",
        ticket_reference: "PO-77",
      }),
    ).toBe("Door stuck on 3rd floor\nLift 2, Building A\nPO-77");
  });

  it("uses the placeholder when there is no problem", () => {
    expect(buildTicketDescription("  ", {})).toBe(NO_PROBLEM_TEXT);
    expect(buildTicketDescription(undefined, undefined)).toBe(NO_PROBLEM_TEXT);
  });

  it("skips empty, duplicate-of-problem, non-text and repeated attributes", () => {
    expect(
      buildTicketDescription(
        "Door stuck",
        { a: " Door stuck ", b: "", c: { file: "x" }, d: 42, e: "note" },
        ["a", "b", "c", "d", "e", "e", " "],
      ),
    ).toBe("Door stuck\n42\nnote");
  });
});
