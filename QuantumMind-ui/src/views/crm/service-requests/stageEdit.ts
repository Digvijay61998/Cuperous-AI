/**
 * Stage manager helpers (crm-plugins-service-desk R10.2–R10.5). Pure. The
 * backend enforces the rules; these only pre-check so the dialog can say
 * why before a round trip.
 */

export interface StageLike {
  id: string;
  name: string;
  category: string;
  isDefault?: boolean;
  position?: number;
  color?: string | null;
}

export const STAGE_NAME_MAX = 40;
const COLOR_RE = /^#[0-9a-fA-F]{6}$/;

/** Problem with a name or colour for a stage, or null when fine. */
export function stageFieldError(stages: StageLike[], id: string | null, name: string, color?: string | null): string | null {
  const n = name.replace(/\s+/g, ' ').trim();
  if (!n) return 'A stage needs a name.';
  if (n.length > STAGE_NAME_MAX) return `Stage names can have at most ${STAGE_NAME_MAX} characters.`;
  if (stages.some((s) => s.id !== id && s.name.trim().toLowerCase() === n.toLowerCase())) {
    return `There is already a stage called "${n}".`;
  }
  if (color && !COLOR_RE.test(color)) return 'Use a colour like #1A2B3C.';
  return null;
}

/** Why a stage cannot be deleted (the last Open / Done stage, or the default), else null. */
export function deleteBlocker(stages: StageLike[], id: string): string | null {
  const s = stages.find((x) => x.id === id);
  if (!s) return 'No such stage.';
  if (s.isDefault) return 'Make another stage the default first.';
  const rest = stages.filter((x) => x.id !== id);
  if (s.category === 'OPEN' && !rest.some((x) => x.category === 'OPEN')) return 'Keep at least one Open stage.';
  if (s.category === 'DONE' && !rest.some((x) => x.category === 'DONE')) return 'Keep at least one Done stage.';
  return null;
}

/** Why a category change would break the rules, else null. */
export function categoryBlocker(stages: StageLike[], id: string, category: string): string | null {
  const s = stages.find((x) => x.id === id);
  if (!s || s.category === category) return null;
  if (s.isDefault && category !== 'OPEN') return 'The default stage must stay in the Open category.';
  const rest = stages.filter((x) => x.id !== id);
  if (s.category === 'OPEN' && !rest.some((x) => x.category === 'OPEN')) return 'Keep at least one Open stage.';
  if (s.category === 'DONE' && !rest.some((x) => x.category === 'DONE')) return 'Keep at least one Done stage.';
  return null;
}

/** Where a deleted stage's requests go by default: same category, else the default stage. */
export function defaultMoveTarget(stages: StageLike[], id: string): string | null {
  const s = stages.find((x) => x.id === id);
  const rest = stages.filter((x) => x.id !== id);
  if (!rest.length) return null;
  return (rest.find((x) => x.category === s?.category) ?? rest.find((x) => x.isDefault) ?? rest[0]).id;
}

/** Stage ids after moving one up (-1) or down (+1); edges change nothing. */
export function moveStageId(stages: StageLike[], id: string, delta: -1 | 1): string[] {
  const ids = stages.map((s) => s.id);
  const i = ids.indexOf(id);
  const j = i + delta;
  if (i < 0 || j < 0 || j >= ids.length) return ids;
  [ids[i], ids[j]] = [ids[j], ids[i]];
  return ids;
}
