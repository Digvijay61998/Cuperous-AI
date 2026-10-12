import type { InboxMessage } from 'src/services/socket.services';

/**
 * True when the org sent this message (right side in the dashboard).
 *
 * WhatsApp-style: the visitor on the left, everything the org sends (bot, AI,
 * flow, agent) on the right.
 *
 * `senderRole` wins: legacy widget rows (bot replies, visitor messages) were
 * stored with no `direction`, so a direction-only check put every bot/AI reply
 * on the visitor's side. `direction` remains the fallback for channel rows — a
 * message the operator typed on their own phone is outbound even though its
 * sender is neither our bot nor an agent. Optimistic replies are always ours.
 */
export function isOrgMessage(
  msg: Pick<InboxMessage, 'senderRole' | 'direction' | 'optimistic'>,
): boolean {
  if (msg.senderRole) return msg.senderRole !== 'visitor';
  if (msg.direction) return msg.direction === 'outbound';
  return msg.optimistic === true;
}
