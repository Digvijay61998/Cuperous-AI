// Learned Question Bank entries (crm-incident-handover R21.4, R12.8). Pure.

export interface LearnedInfo {
  /** Links to the incidents' service requests, or plain labels when unknown. */
  incidents: { label: string; href: string | null }[];
  /** Knowledge-base sync shown next to the entry; null when all is well. */
  sync: { label: string; color: 'warning' | 'error'; detail?: string } | null;
}

/** Null for a human-written entry. */
export function learnedInfo(item: any): LearnedInfo | null {
  const src = item?.source;
  if (!src || src.kind !== 'incident') return null;
  const listed: any[] = Array.isArray(src.incidents) ? src.incidents : [];
  const ids: string[] = Array.isArray(src.incidentIds) ? src.incidentIds : [];
  const seen = new Set<string>();
  const incidents: LearnedInfo['incidents'] = [];
  for (const i of [...listed, ...ids.map((id) => ({ id }))]) {
    const id = typeof i?.id === 'string' ? i.id : '';
    if (!id || seen.has(id)) continue;
    seen.add(id);
    incidents.push({
      label: typeof i.ticketRef === 'string' && i.ticketRef ? i.ticketRef : `Incident ${id.slice(-6)}`,
      // Requests live in the CRM now (cuid ids); old Mongo ticket ids (24 hex) were not migrated (R9.9).
      href:
        typeof i.ticketId === 'string' && i.ticketId && !/^[a-f0-9]{24}$/i.test(i.ticketId)
          ? `/crm/service-requests/${encodeURIComponent(i.ticketId)}`
          : null,
    });
  }
  const st = src.ingest?.status;
  const sync =
    st === 'failed'
      ? { label: 'Not in the AI knowledge base', color: 'error' as const, detail: src.ingest?.error }
      : st === 'pending'
      ? { label: 'Syncing to the AI knowledge base', color: 'warning' as const, detail: src.ingest?.error }
      : null;
  return { incidents, sync };
}
