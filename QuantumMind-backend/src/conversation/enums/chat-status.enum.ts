/**
 * Delivery state of an OUTBOUND channel message — the double-tick ladder.
 *
 *   pending    queued locally, the channel has not acknowledged it yet
 *   sent       the channel accepted it            (single tick)
 *   delivered  it reached the recipient's device   (double tick)
 *   read       the recipient opened it            (blue double tick)
 *   failed     the channel rejected it            (terminal)
 */
export enum ChatStatusEnum {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}

/**
 * Rank used to keep delivery state monotonic.
 *
 * Receipts arrive out of order and are replayed after a reconnect, so a
 * `delivered` receipt can land after `read`. Comparing ranks lets the write be
 * refused rather than downgrading a tick the user already saw.
 */
export const CHAT_STATUS_RANK: Record<string, number> = {
  [ChatStatusEnum.PENDING]: 0,
  [ChatStatusEnum.SENT]: 1,
  [ChatStatusEnum.DELIVERED]: 2,
  [ChatStatusEnum.READ]: 3,
};

/**
 * The statuses a transition into `target` is allowed to advance FROM. Used as a
 * guard in the update query so the write is race-safe at the database level
 * rather than relying on read-then-write.
 *
 * `failed` is reachable only from pending/sent: a message already confirmed
 * delivered or read must not be relabelled as failed by a late error receipt.
 */
export function allowedPreviousStatuses(target: string): string[] {
  switch (target) {
    case ChatStatusEnum.SENT:
      return [ChatStatusEnum.PENDING];
    case ChatStatusEnum.DELIVERED:
      return [ChatStatusEnum.PENDING, ChatStatusEnum.SENT];
    case ChatStatusEnum.READ:
      return [
        ChatStatusEnum.PENDING,
        ChatStatusEnum.SENT,
        ChatStatusEnum.DELIVERED,
      ];
    case ChatStatusEnum.FAILED:
      return [ChatStatusEnum.PENDING, ChatStatusEnum.SENT];
    default:
      return [];
  }
}
