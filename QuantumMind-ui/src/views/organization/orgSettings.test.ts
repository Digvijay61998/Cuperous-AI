import { describe, expect, it } from 'vitest';
import { listCountries, listTimeZones, previewNow, zoneToSave } from './orgSettings';

describe('orgSettings helpers', () => {
  it('saves null when following the country default', () => {
    expect(zoneToSave('Asia/Kolkata', true)).toBeNull();
    expect(zoneToSave('Asia/Kolkata', false)).toBe('Asia/Kolkata');
    expect(zoneToSave('', false)).toBeNull();
  });

  it('lists real countries with names, not unassigned codes', () => {
    const list = listCountries();
    expect(list.find((c) => c.code === 'IN')?.name).toMatch(/India/);
    expect(list.find((c) => c.code === 'FI')?.name).toMatch(/Finland/);
    expect(list.some((c) => c.code === 'AA')).toBe(false);
  });

  it('lists zones including UTC and Asia/Kolkata', () => {
    const zones = listTimeZones();
    expect(zones).toContain('UTC');
    expect(zones.some((z) => z === 'Asia/Kolkata' || z === 'Asia/Calcutta')).toBe(true);
  });

  it('previews a fixed instant in the zone with a label', () => {
    const at = new Date('2026-10-08T08:35:00Z');
    expect(previewNow('Asia/Kolkata', at)).toMatch(/14:05/);
    expect(previewNow('Not/AZone', at)).toBe('');
  });
});
