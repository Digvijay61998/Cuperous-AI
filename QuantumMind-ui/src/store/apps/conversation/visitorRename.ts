/**
 * crm-plugins-service-desk R4.5: the visitor told the bot their name, so the
 * legacy active-chat list and the open chat stop showing "Anonymous".
 * Pure, so it can be unit-tested and used by the reducer.
 */
export interface VisitorUpdatedEvent {
  conversationId: string;
  visitorId?: string;
  name: string;
}

const idOf = (c: any) => String(c?._id ?? c?.conversationId ?? '');

const matches = (c: any, e: VisitorUpdatedEvent) =>
  idOf(c) === String(e.conversationId) ||
  (!!e.visitorId && String(c?.visitor?._id ?? '') === String(e.visitorId) && idOf(c) === String(e.conversationId));

/** Returns a new conversation with the visitor renamed, or the same object when nothing changes. */
export function renameConversationVisitor<T = any>(conversation: T, e: VisitorUpdatedEvent): T {
  const name = e?.name?.trim();
  if (!conversation || !name || !matches(conversation, e)) return conversation;
  const c: any = conversation;
  if (c.visitor?.name === name) return conversation;
  return { ...c, visitor: { ...(c.visitor || {}), name } };
}

export function renameInList<T = any>(list: T[] | null | undefined, e: VisitorUpdatedEvent): T[] {
  return (list || []).map((c) => renameConversationVisitor(c, e));
}
