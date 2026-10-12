import { describe, expect, it } from 'vitest';
import { agentShareView, monthLabel, percent } from '../bots/agentShare';
import { learnedInfo } from './learned';

const TICKET = 'clw0000000000000000000a1';

describe('learned entries (R21.4, R12.8)', () => {
  it('is null for human entries', () => {
    expect(learnedInfo({ question: 'q' })).toBeNull();
    expect(learnedInfo(null)).toBeNull();
  });

  it('links each incident once, by its service request', () => {
    const info = learnedInfo({
      source: {
        kind: 'incident',
        incidentIds: ['inc0000000001', 'inc0000000002'],
        incidents: [{ id: 'inc0000000001', ticketId: TICKET, ticketRef: 'SR_Ab12Cd' }],
      },
    })!;
    expect(info.incidents).toEqual([
      { label: 'SR_Ab12Cd', href: `/crm/service-requests/${TICKET}` },
      { label: 'Incident 000002', href: null },
    ]);
    // an old Mongo ticket id was never moved to the CRM: label only
    const old = learnedInfo({
      source: { kind: 'incident', incidents: [{ id: 'inc0000000003', ticketId: '64c0000000000000000000a1', ticketRef: 'SR_Old' }] },
    })!;
    expect(old.incidents).toEqual([{ label: 'SR_Old', href: null }]);
    expect(info.sync).toBeNull();
  });

  it('shows a failed or pending knowledge-base sync', () => {
    expect(learnedInfo({ source: { kind: 'incident', incidentIds: [], ingest: { status: 'failed', error: 'AI down' } } })!.sync).toEqual({
      label: 'Not in the AI knowledge base',
      color: 'error',
      detail: 'AI down',
    });
    expect(learnedInfo({ source: { kind: 'incident', incidentIds: [], ingest: { status: 'pending' } } })!.sync?.color).toBe('warning');
    expect(learnedInfo({ source: { kind: 'incident', incidentIds: [], ingest: { status: 'ok' } } })!.sync).toBeNull();
  });
});

describe('agent share card (R21.5)', () => {
  it('formats months and percentages', () => {
    expect(monthLabel('2026-10')).toBe('Oct 2026');
    expect(monthLabel('bad')).toBe('bad');
    expect(percent(0.008)).toBe('0.8%');
    expect(percent(0.25)).toBe('25%');
    expect(percent(null)).toBe('No chats');
  });

  it('compares the latest month with the 1% target', () => {
    const v = agentShareView({
      target: 0.01,
      months: [
        { month: '2026-09', conversations: 100, withAgent: 5, share: 0.05 },
        { month: '2026-10', conversations: 400, withAgent: 2, share: 0.005 },
      ],
    });
    expect(v.onTarget).toBe(true);
    expect(v.targetLabel).toBe('1.0%');
    expect(v.scale).toBe(0.05);
    expect(agentShareView({ months: [{ month: '2026-10', conversations: 0, withAgent: 0, share: null }] }).onTarget).toBeNull();
    expect(agentShareView(undefined).rows).toEqual([]);
  });
});
