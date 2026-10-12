import { describe, expect, it } from 'vitest';
import { categoryBlocker, defaultMoveTarget, deleteBlocker, moveStageId, stageFieldError } from './stageEdit';

const stages = [
  { id: 'o', name: 'Open', category: 'OPEN', isDefault: true },
  { id: 'p', name: 'In Progress', category: 'IN_PROGRESS' },
  { id: 'w', name: 'Waiting', category: 'ON_HOLD' },
  { id: 'd', name: 'Deferred', category: 'ON_HOLD' },
  { id: 'r', name: 'Resolved', category: 'DONE' },
];

describe('stage manager checks (R10.3–R10.5)', () => {
  it('names: required, 40 chars, unique ignoring case and spaces; colours as #RRGGBB', () => {
    expect(stageFieldError(stages, null, '  ')).toMatch(/needs a name/);
    expect(stageFieldError(stages, null, 'x'.repeat(41))).toMatch(/at most 40/);
    expect(stageFieldError(stages, null, ' in  progress ')).toMatch(/already a stage/);
    // renaming a stage to its own name in another case is fine
    expect(stageFieldError(stages, 'p', 'IN PROGRESS')).toBeNull();
    expect(stageFieldError(stages, null, 'Triage', 'red')).toMatch(/#1A2B3C/);
    expect(stageFieldError(stages, null, 'Triage', '#00ff00')).toBeNull();
  });

  it('delete keeps one Open, one Done and the default', () => {
    expect(deleteBlocker(stages, 'o')).toMatch(/default/);
    expect(deleteBlocker(stages, 'r')).toMatch(/Done/);
    expect(deleteBlocker(stages, 'w')).toBeNull();
    expect(deleteBlocker([...stages, { id: 'o2', name: 'New', category: 'OPEN' }], 'o2')).toBeNull();
    expect(deleteBlocker(stages, 'zz')).toBeTruthy();
  });

  it('category changes keep the rules', () => {
    expect(categoryBlocker(stages, 'o', 'IN_PROGRESS')).toMatch(/default/);
    expect(categoryBlocker(stages, 'r', 'ON_HOLD')).toMatch(/Done/);
    expect(categoryBlocker(stages, 'p', 'DONE')).toBeNull();
    expect(categoryBlocker(stages, 'p', 'IN_PROGRESS')).toBeNull();
  });

  it('delete target prefers the same category, then the default', () => {
    expect(defaultMoveTarget(stages, 'w')).toBe('d');
    expect(defaultMoveTarget(stages, 'p')).toBe('o');
    expect(defaultMoveTarget([stages[0]], 'o')).toBeNull();
  });

  it('reorders by one; edges change nothing', () => {
    expect(moveStageId(stages, 'p', -1)).toEqual(['p', 'o', 'w', 'd', 'r']);
    expect(moveStageId(stages, 'o', -1)).toEqual(['o', 'p', 'w', 'd', 'r']);
    expect(moveStageId(stages, 'r', 1)).toEqual(['o', 'p', 'w', 'd', 'r']);
  });
});
