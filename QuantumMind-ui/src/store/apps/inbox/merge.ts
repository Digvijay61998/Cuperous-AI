// Pure merge helpers for the omnichannel inbox.
//
// Ported from OpenWA's `dashboard/src/utils/chatMessages.ts`, which its own docs
// classify as portable verbatim ("the pure utils import nothing but types").
// The hooks around it are NOT ported — those are TanStack Query; these functions
// are called from the RTK reducers instead.
//
// What is deliberately NOT ported:
//  - `mergeChatMessages` (the DB + engine-history dual-source merge). OpenWA needs
//    it because its DB may hold nothing for an old chat, so it fetches the same
//    thread from two places with different field shapes. Our inbound path
//    persists everything including history backfill, so our API is the single
//    source and there is nothing to reconcile.
//  - `capMediaPayloads`. We never cache base64 — media is a URL or `omitted` —
//    so there is no unbounded heap growth to bound.

import { InboxMessage } from 'src/services/socket.services';

/**
 * Stable identity of a message.
 *
 * A persisted row has `id` = Mongo id and `externalMessageId` = the WhatsApp id;
 * a live socket echo of that same message may arrive before the client has the
 * persisted copy. Keying on the channel id first is what makes the two dedupe
 * instead of rendering twice.
 */
export const messageKey = (m: InboxMessage): string =>
  m.externalMessageId ?? m.id;

const messageTime = (m: InboxMessage): number =>
  m.time ? Date.parse(m.time as string) || 0 : 0;

/**
 * Delivery ticks ADVANCE ONLY.
 *
 * WhatsApp replays receipts after a reconnect, so a `delivered` can legitimately
 * arrive after `read`. Without a rank comparison a late duplicate visually
 * downgrades a tick the agent already saw. Mirrors the backend's
 * `CHAT_STATUS_RANK` / `allowedPreviousStatuses`, so the two cannot drift.
 */
const DELIVERY_RANK: Record<string, number> = {
  pending: 0,
  sent: 1,
  delivered: 2,
  read: 3,
};

export function mergeDeliveryStatus(
  current: InboxMessage['status'] | undefined,
  incoming: InboxMessage['status'] | undefined,
): InboxMessage['status'] | undefined {
  if (!incoming) return current;
  if (!current) return incoming;
  // `failed` is terminal — nothing advances out of it.
  if (current === 'failed') return 'failed';
  // …and is only reachable from an unconfirmed state: a message already known
  // delivered or read must not be relabelled failed by a late error receipt.
  if (incoming === 'failed') {
    return current === 'pending' || current === 'sent' ? 'failed' : current;
  }
  // An unrecognised status is ignored rather than trusted.
  if (!(incoming in DELIVERY_RANK)) return current;
  if (!(current in DELIVERY_RANK)) return incoming;
  return DELIVERY_RANK[incoming] >= DELIVERY_RANK[current] ? incoming : current;
}

/**
 * Merge media field-by-field, refusing to let an empty marker erase a payload.
 *
 * An incoming copy carrying `omitted: true` and no `url` is a *claim of absence*,
 * and it must not overwrite a copy that already holds a real URL — that would
 * turn a rendered image back into a 📎 with no way to recover it. This is the
 * single most valuable rule in OpenWA's merge and the one every conversational UI
 * gets wrong at least once.
 */
function mergeMedia(
  existing: InboxMessage['media'],
  incoming: InboxMessage['media'],
): InboxMessage['media'] {
  if (!incoming) return existing;
  if (!existing) return incoming;
  if (existing.url && !incoming.url) return existing;
  return incoming;
}

/**
 * Append `incoming`, or fold it into the existing entry with the same identity.
 *
 * Field-by-field rather than a wholesale spread: a socket echo is built with
 * undefined leaves, and `{...existing, ...incoming}` would wipe `authorName`,
 * `quotedMessageId` and the media URL that are only present on the copy already
 * on screen. Absent means "unknown" (`??`), never "cleared".
 *
 * Returns the same array reference when nothing changed, so a no-op event does
 * not re-render the thread.
 */
export function mergeOrAppend(
  list: InboxMessage[],
  incoming: InboxMessage,
): InboxMessage[] {
  const key = messageKey(incoming);
  let idx = list.findIndex((m) => messageKey(m) === key);

  // An echo of our own reply arrives under the channel's id while the optimistic
  // row is still keyed by its temporary id, so the keys differ and the plain
  // identity match above misses. Falling back to the correlation id is what folds
  // the two into one bubble instead of rendering the reply twice.
  if (idx === -1 && incoming.correlationId) {
    idx = list.findIndex(
      (m) => m.correlationId && m.correlationId === incoming.correlationId,
    );
  }

  if (idx === -1) {
    // Insert in time order rather than always pushing: an out-of-order socket
    // event, or one racing a page fetch, must not land at the bottom of the
    // thread out of sequence.
    const next = [...list, incoming];
    next.sort((a, b) => messageTime(a) - messageTime(b));
    return next;
  }

  const existing = list[idx];
  const next = list.slice();
  next[idx] = {
    ...existing,
    ...incoming,
    authorName: incoming.authorName ?? existing.authorName,
    quotedMessageId: incoming.quotedMessageId ?? existing.quotedMessageId,
    direction: incoming.direction ?? existing.direction,
    correlationId: incoming.correlationId ?? existing.correlationId,
    // The echo carries a real identity, so the row stops being optimistic — but
    // only ever in that direction: a later partial event must not make a
    // reconciled row provisional again.
    optimistic: existing.optimistic === true && !incoming.id ? true : false,
    status: mergeDeliveryStatus(existing.status, incoming.status),
    media: mergeMedia(existing.media, incoming.media),
  };
  return next;
}

/**
 * Fold a server identity onto the optimistic row that carries `correlationId`.
 *
 * THE ECHO RACE
 * -------------
 * Three copies of one reply can arrive in any order: the optimistic row we
 * appended, the HTTP response, and the socket echo. If the echo lands first it is
 * already in the list under the channel's id, so reconciling the placeholder by id
 * alone would leave two bubbles for one message.
 *
 * The rule OpenWA arrived at, and the reason it is worth copying: fold the
 * placeholder **into** the echo rather than dropping it, because the placeholder
 * may hold fields the echo does not (a staged media URL, the quoted id). Dropping
 * it loses those permanently — there is no refetch coming for a field the server
 * never had.
 *
 * Returns the same array reference when there is nothing to reconcile.
 */
export function reconcileOptimistic(
  list: InboxMessage[],
  correlationId: string,
  server: Partial<InboxMessage> & { id?: string; externalMessageId?: string },
): InboxMessage[] {
  const optimisticIdx = list.findIndex(
    (m) => m.correlationId === correlationId && m.optimistic,
  );

  // Nothing still provisional under this id. The echo already arrived and
  // `mergeOrAppend` folded the placeholder into it, so the row is real and the
  // response has nothing left to reconcile — but its status may still advance.
  if (optimisticIdx === -1) {
    const settledIdx = list.findIndex(
      (m) => m.correlationId === correlationId,
    );
    if (settledIdx === -1) return list;
    const settled = list[settledIdx];
    const status = mergeDeliveryStatus(settled.status, server.status);
    if (status === settled.status) return list;
    const merged = list.slice();
    merged[settledIdx] = { ...settled, status };
    return merged;
  }

  const optimistic = list[optimisticIdx];

  // Did the echo already land under the server's identity?
  const echoIdx = list.findIndex(
    (m, i) =>
      i !== optimisticIdx &&
      ((server.externalMessageId &&
        m.externalMessageId === server.externalMessageId) ||
        (server.id && m.id === server.id)),
  );

  if (echoIdx !== -1) {
    // Fold placeholder-only fields into the echo, then drop the placeholder.
    const echo = list[echoIdx];
    const next = list.filter((_, i) => i !== optimisticIdx);
    const foldedIdx = next.findIndex((m) => m === echo);
    next[foldedIdx] = {
      ...echo,
      media: mergeMedia(optimistic.media, echo.media),
      quotedMessageId: echo.quotedMessageId ?? optimistic.quotedMessageId,
      correlationId: echo.correlationId ?? correlationId,
      status: mergeDeliveryStatus(optimistic.status, echo.status),
    };
    return next;
  }

  // No echo yet: promote the placeholder in place, keeping its list position so
  // the bubble does not jump.
  const next = list.slice();
  next[optimisticIdx] = {
    ...optimistic,
    ...server,
    // Server values win only where present — a response that omits media must not
    // erase the attachment the agent just sent.
    media: mergeMedia(optimistic.media, server.media),
    quotedMessageId: server.quotedMessageId ?? optimistic.quotedMessageId,
    status: mergeDeliveryStatus(optimistic.status, server.status),
    optimistic: false,
  };
  return next;
}

/** Mark an optimistic row failed so the agent can retry it. */
export function failOptimistic(
  list: InboxMessage[],
  correlationId: string,
): InboxMessage[] {
  const idx = list.findIndex(
    (m) => m.correlationId === correlationId && m.optimistic,
  );
  if (idx === -1) return list;
  const next = list.slice();
  next[idx] = { ...next[idx], status: 'failed' };
  return next;
}

/**
 * Fail optimistic rows that have been `pending` too long.
 *
 * A dropped request — a slept tab, a lost network, a server restart mid-send —
 * resolves neither the thunk nor an echo, so the bubble would stay `pending`
 * indefinitely and the agent could not tell "sending" from "lost". After the
 * timeout it becomes `failed`, which is honest and retryable.
 *
 * Deliberately does NOT delete the row: the message may well have been delivered
 * (the timeout says we stopped hearing, not that it failed), so it stays visible
 * and a later echo can still fold onto it and correct the status forward.
 *
 * Returns the same array reference when nothing aged out.
 */
export function expirePendingOptimistic(
  list: InboxMessage[],
  timeoutMs: number,
  now: number = Date.now(),
): InboxMessage[] {
  let next: InboxMessage[] | null = null;
  for (let i = 0; i < list.length; i++) {
    const m = list[i];
    if (!m.optimistic || m.status !== 'pending') continue;
    if (now - messageTime(m) < timeoutMs) continue;
    if (!next) next = list.slice();
    next[i] = { ...m, status: 'failed' };
  }
  return next ?? list;
}

/** Merge a page of messages into a thread's list, deduping by identity. */
export function mergePage(
  list: InboxMessage[],
  page: InboxMessage[],
): InboxMessage[] {
  let out = list;
  for (const m of page) out = mergeOrAppend(out, m);
  return out;
}

/**
 * Apply a delivery receipt, matched by channel-native id.
 *
 * A miss is normal and must be a no-op returning the SAME reference: receipts
 * also arrive for messages sent from the operator's own phone, and for threads
 * the agent has never opened.
 */
export function applyStatus(
  list: InboxMessage[],
  externalMessageId: string,
  status: InboxMessage['status'],
): InboxMessage[] {
  const idx = list.findIndex((m) => m.externalMessageId === externalMessageId);
  if (idx === -1) return list;
  const merged = mergeDeliveryStatus(list[idx].status, status);
  if (merged === list[idx].status) return list;
  const next = list.slice();
  next[idx] = { ...next[idx], status: merged };
  return next;
}
