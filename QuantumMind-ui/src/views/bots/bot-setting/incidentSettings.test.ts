import { describe, expect, it } from 'vitest';
import {
  FEATURE_LABELS,
  aliasError,
  handoverPreview,
  hasIncidentSettingErrors,
  idleMinutesError,
} from './incidentSettings';

describe('incident settings helpers', () => {
  it('previews the handover text with the ref, default when empty', () => {
    expect(handoverPreview('Logged as {{ ticketId }}.', 'SR1')).toBe('Logged as SR1.');
    expect(handoverPreview('', 'SR1')).toContain('Your incident ticket SR1 has been created');
    expect(handoverPreview('We got it.', 'SR1')).toBe('We got it. Your reference is SR1.');
  });

  it('validates attribute names; empty means default', () => {
    expect(aliasError('')).toBe('');
    expect(aliasError('contact.email_2')).toBe('');
    expect(aliasError('has space')).not.toBe('');
    expect(aliasError('x'.repeat(65))).not.toBe('');
  });

  it('blocks save on any invalid alias', () => {
    expect(hasIncidentSettingErrors({ contactMapping: { email: 'bad alias' } })).toBe(true);
    expect(hasIncidentSettingErrors({ problemAlias: 'contact_topic', contactMapping: {} })).toBe(false);
    expect(hasIncidentSettingErrors(undefined)).toBe(false);
  });

  it('validates the closure idle minutes: whole 1..60, empty means default (R14.5)', () => {
    for (const ok of ['', '  ', null, undefined, '1', '10', 60, ' 15 ']) expect(idleMinutesError(ok)).toBe('');
    for (const bad of ['0', '61', '-1', '2.5', 'ten', 0, 120]) expect(idleMinutesError(bad)).not.toBe('');
    expect(hasIncidentSettingErrors({ closureIdleMinutes: '0' })).toBe(true);
    expect(hasIncidentSettingErrors({ closureIdleMinutes: '' })).toBe(false);
  });

  it('shows the closure flag in the settings; retired switches are gone', () => {
    expect(FEATURE_LABELS.closurePrompt?.label).toBe('Ask if the query is resolved');
    expect(FEATURE_LABELS.incidentHandover).toBeUndefined();
    expect(FEATURE_LABELS.crmCapture).toBeUndefined();
  });

  it('has no switch for CRM saving or "ask once": both are always on', () => {
    expect(FEATURE_LABELS.crmCapture).toBeUndefined();
  });
});
