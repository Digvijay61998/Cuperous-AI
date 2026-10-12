/**
 * Pure decision logic for agent alerts. No DOM, no Redux, no timers — every
 * input is passed in, so these functions are exhaustively testable.
 *
 * The one rule this file exists to enforce: ordinary chat traffic NEVER plays
 * the handover sound. Only an explicit `inbox:handover-requested` does.
 */
import type {
  HandoverAlert,
  SenderRole,
  SoundKind,
  SoundPrefs,
} from './types';

export const MESSAGE_THROTTLE_MS = 5000;
export const MESSAGE_DEDUP_WINDOW_MS = 10000;

const KNOWN_ROLES: SenderRole[] = ['visitor', 'bot', 'agent', 'system'];

export function normaliseRole(role: unknown): SenderRole | undefined {
  return KNOWN_ROLES.includes(role as SenderRole)
    ? (role as SenderRole)
    : undefined;
}

// ------------------------------------------------------------- handover alert

export interface HandoverDecision {
  /** Which sound to play, or null for none. */
  sound: Extract<SoundKind, 'handover' | 'emergency'> | null;
  /** Always true for a new id or an emergency upgrade: visuals never depend on mute. */
  showVisual: boolean;
  /** Add to the indicator (false for a repeat of a known id). */
  addToIndicator: boolean;
}

/**
 * Decide what an `inbox:handover-requested` event does in this tab.
 *
 * `playedIds` is the set of alert ids that already played a sound in ANY tab
 * of this browser; `knownIds` is what this tab's indicator already holds.
 * Cross-tab "only one tab plays" is the tab coordinator's job — this returns
 * the sound the claimant should play.
 */
export function decideHandover(
  alert: HandoverAlert,
  prefs: SoundPrefs,
  playedIds: ReadonlySet<string>,
  knownIds: ReadonlySet<string>,
): HandoverDecision {
  const isUpgrade = alert.updated === true && alert.priority === 'high';
  const known = knownIds.has(alert.id);
  // An upgrade re-plays once as an emergency even though the id was played.
  const playKey = isUpgrade ? upgradeKey(alert.id) : alert.id;
  const alreadyPlayed = playedIds.has(playKey);

  const sound =
    prefs.handoverSound && !alreadyPlayed
      ? alert.priority === 'high'
        ? 'emergency'
        : 'handover'
      : null;

  return {
    sound,
    showVisual: !known || isUpgrade,
    addToIndicator: !known,
  };
}

/** Separate play key so the emergency upgrade can sound once after the normal alert. */
export const upgradeKey = (alertId: string) => `${alertId}:high`;

/** The key the coordinator claims for this event. */
export const handoverPlayKey = (alert: HandoverAlert) =>
  alert.updated === true && alert.priority === 'high'
    ? upgradeKey(alert.id)
    : alert.id;

/** Indicator order: high priority first, then oldest first. */
export function sortAlerts(alerts: HandoverAlert[]): HandoverAlert[] {
  return [...alerts].sort(
    (a, b) =>
      Number(b.priority === 'high') - Number(a.priority === 'high') ||
      a.createdAt.localeCompare(b.createdAt) ||
      a.id.localeCompare(b.id),
  );
}

/** Merge a fetched list into the indicator by id (fetched wins on fields). */
export function mergeAlerts(
  current: Record<string, HandoverAlert>,
  incoming: HandoverAlert[],
): Record<string, HandoverAlert> {
  const next = { ...current };
  for (const a of incoming) next[a.id] = { ...next[a.id], ...a };
  return next;
}

// ------------------------------------------------------ message notification

export interface IncomingMessage {
  id?: string | number;
  conversationId?: string;
  threadId?: string;
  time?: string;
  senderRole?: unknown;
}

export interface MessageContext {
  myUserId?: string;
  /** Who owns the conversation/thread right now, from the client's own state. */
  ownedByMe: boolean;
  /** The conversation or thread currently open in this tab. */
  isOpenHere: boolean;
  tabFocused: boolean;
  atBottom: boolean;
  /** Last time a Message_Notification sounded for this conversation (ms). */
  lastNotifiedAt?: number;
  /** Dedup keys seen in the last window, with the time they were seen. */
  seen: ReadonlyMap<string, number>;
  prefs: SoundPrefs;
  now: number;
}

export type MessageDecision = 'play' | 'visualOnly' | 'none';

/**
 * One delivery can arrive on both `message` and `inbox:message`. Prefer the
 * message id; fall back to conversation + timestamp when either side lacks it.
 */
export function messageKey(msg: IncomingMessage): string | null {
  if (msg.id !== undefined && msg.id !== null && String(msg.id) !== '') {
    return `id:${String(msg.id)}`;
  }
  const conv = msg.conversationId || msg.threadId;
  if (conv && msg.time) return `ct:${conv}|${new Date(msg.time).getTime()}`;
  return null;
}

/** Secondary key used to match an id-less delivery against an id-carrying one. */
export function timeKey(msg: IncomingMessage): string | null {
  const conv = msg.conversationId || msg.threadId;
  return conv && msg.time ? `ct:${conv}|${new Date(msg.time).getTime()}` : null;
}

export function decideMessage(
  msg: IncomingMessage,
  ctx: MessageContext,
): MessageDecision {
  // Only a visitor's message can notify. Bot, agent, system and unknown roles
  // are silent whatever `direction` says — the original bug.
  if (normaliseRole(msg.senderRole) !== 'visitor') return 'none';
  if (!ctx.ownedByMe) return 'none';

  const keys = [messageKey(msg), timeKey(msg)].filter(Boolean) as string[];
  if (
    keys.some((k) => {
      const t = ctx.seen.get(k);
      return t !== undefined && ctx.now - t <= MESSAGE_DEDUP_WINDOW_MS;
    })
  ) {
    return 'none';
  }

  // Looking right at it: no notification at all.
  if (ctx.isOpenHere && ctx.tabFocused && ctx.atBottom) return 'none';

  if (
    ctx.lastNotifiedAt !== undefined &&
    ctx.now - ctx.lastNotifiedAt < MESSAGE_THROTTLE_MS
  ) {
    return 'none';
  }

  return ctx.prefs.messageSound ? 'play' : 'visualOnly';
}

/** Drop dedup entries older than the window (keeps the map bounded). */
export function pruneSeen(
  seen: Map<string, number>,
  now: number,
  windowMs = MESSAGE_DEDUP_WINDOW_MS,
): void {
  for (const [k, t] of seen) if (now - t > windowMs) seen.delete(k);
}
