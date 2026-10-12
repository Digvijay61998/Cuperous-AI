/**
 * Board stage rules (crm-plugins-service-desk R10). Pure, no I/O.
 */

export type StageCategoryKey = "OPEN" | "IN_PROGRESS" | "ON_HOLD" | "DONE";
export const STAGE_CATEGORIES: readonly StageCategoryKey[] = ["OPEN", "IN_PROGRESS", "ON_HOLD", "DONE"];

export const STAGE_NAME_MAX = 40;

/** Created for an org the first time its board is used (R10.1, D5). */
export const DEFAULT_STAGES: readonly {
  name: string;
  category: StageCategoryKey;
  color: string;
  isDefault?: boolean;
}[] = [
  { name: "Open", category: "OPEN", color: "#666CFF", isDefault: true },
  { name: "In Progress", category: "IN_PROGRESS", color: "#26C6F9" },
  { name: "Waiting on Customer", category: "ON_HOLD", color: "#FDB528" },
  { name: "Deferred", category: "ON_HOLD", color: "#8592A3" },
  { name: "Resolved", category: "DONE", color: "#72E128" },
  { name: "Closed", category: "DONE", color: "#4C4E64" },
];

export interface StageRow {
  id: string;
  name: string;
  category: StageCategoryKey;
  position: number;
  isDefault: boolean;
  archivedAt?: Date | null;
}

export class StageRuleError extends Error {}

/** Trimmed, single-spaced name, 1–40 characters (R10.3). */
export function cleanStageName(name: unknown): string {
  const n = typeof name === "string" ? name.replace(/\s+/g, " ").trim() : "";
  if (!n) throw new StageRuleError("A stage needs a name.");
  if (n.length > STAGE_NAME_MAX) throw new StageRuleError(`Stage names can have at most ${STAGE_NAME_MAX} characters.`);
  return n;
}

const COLOR_RE = /^#[0-9a-fA-F]{6}$/;
export function cleanColor(color: unknown): string | null {
  if (color === undefined || color === null || color === "") return null;
  if (typeof color !== "string" || !COLOR_RE.test(color)) throw new StageRuleError("Use a colour like #1A2B3C.");
  return color.toUpperCase();
}

/**
 * Throws when the active stages break an invariant (R10.3, R10.4):
 * unique names (case-insensitive), at least one OPEN and one DONE stage,
 * exactly one default stage, and that stage is OPEN.
 */
export function assertStageInvariants(stages: StageRow[]): void {
  const active = stages.filter((s) => !s.archivedAt);
  const names = new Set<string>();
  for (const s of active) {
    const k = s.name.toLowerCase();
    if (names.has(k)) throw new StageRuleError(`There is already a stage called "${s.name}".`);
    names.add(k);
  }
  if (!active.some((s) => s.category === "OPEN")) {
    throw new StageRuleError("Keep at least one stage for new requests (category Open).");
  }
  if (!active.some((s) => s.category === "DONE")) {
    throw new StageRuleError("Keep at least one stage for finished requests (category Done).");
  }
  const defaults = active.filter((s) => s.isDefault);
  if (defaults.length !== 1) throw new StageRuleError("Exactly one stage must be the default for new requests.");
  if (defaults[0].category !== "OPEN") throw new StageRuleError("The default stage must be in the Open category.");
}

/** First active stage of a category, in board order. */
export function firstOfCategory<T extends StageRow>(stages: T[], category: StageCategoryKey): T | undefined {
  return [...stages]
    .filter((s) => !s.archivedAt && s.category === category)
    .sort((a, b) => a.position - b.position)[0];
}

/** Old Mongo ticket status <-> stage category (R19.2). */
export const STATUS_FOR_CATEGORY: Record<StageCategoryKey, string> = {
  OPEN: "OPEN",
  IN_PROGRESS: "PENDING",
  ON_HOLD: "DEFERRED",
  DONE: "CLOSED",
};
export const CATEGORY_FOR_STATUS: Record<string, StageCategoryKey> = {
  OPEN: "OPEN",
  PENDING: "IN_PROGRESS",
  DEFERRED: "ON_HOLD",
  CLOSED: "DONE",
  RESOLVED: "DONE",
};
