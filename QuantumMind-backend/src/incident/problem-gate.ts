/**
 * Pure rules for the problem-description gate (R4). No I/O, so the state
 * machine is unit-testable; MessageHandler does the messaging and persistence.
 */
import {
  NO_PROBLEM_TEXT,
  PROBLEM_MAX_LENGTH,
  PROBLEM_MIN_LENGTH,
} from "./constants";
import { ProblemFlagEnum } from "./enums/incident.enum";

/** How long a problem question waits for an answer (R4.7). */
export const PROBLEM_ANSWER_TTL_MS = 10 * 60_000;

/** Default attribute that already holds the problem, and default question. */
export const DEFAULT_PROBLEM_ALIAS = "contact_topic";
export const DEFAULT_PROBLEM_QUESTION = "Please describe the problem in a few words.";
export const PROBLEM_REASK_EXAMPLE =
  'For example: "The door on floor 3 does not close properly."';

export interface NormalizedProblem {
  problem: string;
  flags: ProblemFlagEnum[];
}

const clean = (text: unknown): string =>
  typeof text === "string" ? text.replace(/\s+/g, " ").trim() : "";

/**
 * Trim, collapse whitespace and cap at 1000 characters (R4.6). Never returns
 * an empty problem: an empty value becomes the "No problem description
 * provided" placeholder with the NONE flag (R1.6, R4.5).
 */
export function normalizeProblem(text: unknown, short = false): NormalizedProblem {
  const t = clean(text);
  if (!t) {
    return {
      problem: NO_PROBLEM_TEXT,
      flags: short ? [ProblemFlagEnum.NONE, ProblemFlagEnum.SHORT] : [ProblemFlagEnum.NONE],
    };
  }
  const flags: ProblemFlagEnum[] = [];
  let problem = t;
  if (problem.length > PROBLEM_MAX_LENGTH) {
    // Cut on a code-point boundary so an emoji is not split in half.
    problem = Array.from(problem).slice(0, PROBLEM_MAX_LENGTH).join("").trim();
    flags.push(ProblemFlagEnum.TRUNCATED);
  }
  if (short || problem.length < PROBLEM_MIN_LENGTH) flags.push(ProblemFlagEnum.SHORT);
  return { problem, flags };
}

export type ProblemAnswerResult =
  | { kind: "accept"; problem: string; flags: ProblemFlagEnum[] }
  | { kind: "reask" };

/**
 * Decide what to do with the visitor's reply to the problem question.
 *
 * `attempt` is how many times the question has been sent (1 or 2).
 * `nonDescriptive` marks replies that carry no problem even when long enough,
 * e.g. "I want to talk to an agent" (matches the bot's agent-intent phrases).
 *
 * - Long enough and descriptive: accept (R4.2).
 * - First short reply: ask once more with an example (R4.4).
 * - Second short reply: accept what we have, flagged short (R4.5).
 */
export function evaluateProblemAnswer(
  text: unknown,
  attempt: number,
  nonDescriptive = false,
): ProblemAnswerResult {
  const t = clean(text);
  const good = t.length >= PROBLEM_MIN_LENGTH && !nonDescriptive;
  if (good) return { kind: "accept", ...normalizeProblem(t) };
  if (attempt < 2) return { kind: "reask" };
  // Second miss: keep the text unless it was only an agent request.
  return { kind: "accept", ...normalizeProblem(nonDescriptive ? "" : t, true) };
}

/** True when a pending problem question has gone unanswered too long (R4.7). */
export function isProblemQuestionExpired(
  askedAt: Date | string | number | undefined,
  now: Date = new Date(),
): boolean {
  if (askedAt == null) return true;
  const t = new Date(askedAt).getTime();
  if (Number.isNaN(t)) return true;
  return now.getTime() - t > PROBLEM_ANSWER_TTL_MS;
}

/** Restart words always escape the gate, so a visitor is never stuck in it. */
export const GATE_ESCAPE_WORDS = new Set(["start", "reset", "restart"]);
