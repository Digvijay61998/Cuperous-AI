/** History events as sentences for the drawer (crm-plugins-service-desk R14.4). Pure. */

export interface SrEvent {
  id: string;
  type: string;
  actorId?: string | null;
  actorName?: string | null;
  from?: any;
  to?: any;
  createdAt: string;
}

const PRIORITY: Record<string, string> = { LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High', CRITICAL: 'Critical' };
const FIELD: Record<string, string> = { subject: 'subject', description: 'description', tags: 'tags', emergency: 'emergency flag' };

export function describeEvent(e: SrEvent): { text: string; icon: string } {
  const who = e.actorName || (e.actorId ? 'Someone' : 'Chat');
  switch (e.type) {
    case 'CREATED':
      return {
        text: e.to?.source === 'chat' ? 'Raised from the chat' : `${who} created this request`,
        icon: 'bx:plus-circle',
      };
    case 'STAGE_CHANGED':
      return {
        text: e.to?.reason === 'stage_deleted'
          ? `Moved to ${e.to?.name} because "${e.from?.name}" was deleted`
          : `${who} moved this from ${e.from?.name ?? '?'} to ${e.to?.name ?? '?'}`,
        icon: 'bx:transfer-alt',
      };
    case 'REOPENED':
      return { text: `${who} reopened this request`, icon: 'bx:revision' };
    case 'ASSIGNED':
      if (!e.to?.assigneeId) return { text: `${who} unassigned ${e.from?.name ?? 'it'}`, icon: 'bx:user-x' };
      if (e.actorId && e.actorId === e.to.assigneeId) return { text: `${who} took this request`, icon: 'bx:user-check' };
      if (!e.actorId) return { text: `Assigned to ${e.to?.name ?? 'someone'}`, icon: 'bx:user-check' };
      return { text: `${who} assigned this to ${e.to?.name ?? 'someone'}`, icon: 'bx:user-check' };
    case 'PRIORITY_CHANGED':
      return {
        text: `${who} changed priority from ${PRIORITY[e.from?.priority] ?? e.from?.priority} to ${PRIORITY[e.to?.priority] ?? e.to?.priority}`,
        icon: 'bx:flag',
      };
    case 'EDITED': {
      const fields = Object.keys(e.to || {}).map((k) => FIELD[k] ?? k);
      return { text: `${who} edited the ${fields.join(', ') || 'details'}`, icon: 'bx:edit' };
    }
    case 'COMMENTED':
      return { text: `${who} added a note`, icon: 'bx:comment' };
    case 'CONTACT_LINKED':
      if (!e.to?.contactId) return { text: `${who} unlinked the contact`, icon: 'bx:unlink' };
      if (who === 'Chat') return { text: 'Contact linked from the chat details', icon: 'bx:link' };
      return { text: e.from?.contactId ? `${who} changed the linked contact` : `${who} linked a contact`, icon: 'bx:link' };
    case 'SUMMARY_GENERATED':
      return { text: 'AI summary updated', icon: 'bx:bot' };
    default:
      return { text: `${who} changed this request`, icon: 'bx:edit' };
  }
}
