/**
 * Wires socket events to alert decisions. The ONLY place in the Dashboard that
 * plays a sound.
 *
 * - `inbox:handover-requested`  -> handover / emergency sound + toast + indicator
 * - `inbox:handover-acknowledged` -> remove from indicator, close toast
 * - `inbox:handover-pending`    -> agent came online: show pending, one sound
 * - `message` / `inbox:message` -> soft Message_Notification, visitor messages
 *   in conversations I own only; never the handover sound
 */
import type { AppDispatch, RootState } from 'src/store';
import {
  alertAcknowledged,
  alertReceived,
  alertsMerged,
  fetchOpenAlerts,
  setPrefs,
  setSoundBlocked,
} from 'src/store/apps/alerts';
import pushNotification from 'src/utils/notification';
import {
  decideHandover,
  decideMessage,
  handoverPlayKey,
  IncomingMessage,
  messageKey,
  pruneSeen,
  timeKey,
} from './alertPolicy';
import { isAtBottom, isOpenHere, tabFocused } from './chatViewport';
import { dismissHandoverToast, showHandoverToast } from './handoverToast';
import { soundPlayer } from './soundPlayer';
import { TabCoordinator } from './tabCoordinator';
import type {
  HandoverAcknowledgedEvent,
  HandoverAlert,
  HandoverPendingEvent,
  SoundPrefs,
} from './types';

type GetState = () => RootState;

export interface AlertSocket {
  onHandoverRequested(): { subscribe(fn: (e: HandoverAlert) => void): unknown };
  onHandoverAcknowledged(): { subscribe(fn: (e: HandoverAcknowledgedEvent) => void): unknown };
  onHandoverPending(): { subscribe(fn: (e: HandoverPendingEvent) => void): unknown };
  onReconnect(): { subscribe(fn: () => void): unknown };
}

export class AlertClient {
  private coordinator = new TabCoordinator();
  private seen = new Map<string, number>();
  private lastNotifiedAt = new Map<string, number>();
  private started = false;
  private unsubscribers: Array<() => void> = [];

  constructor(
    private dispatch: AppDispatch,
    private getState: GetState,
  ) {}

  start(socket: AlertSocket, user: { _id?: string; notificationPrefs?: Partial<SoundPrefs> }) {
    if (this.started) return;
    this.started = true;

    // Prefs: server value from /agent/me wins; cached copy covers first paint.
    const cached = this.coordinator.readCachedPrefs();
    const prefs = { ...cached, ...(user?.notificationPrefs || {}) };
    if (Object.keys(prefs).length) this.dispatch(setPrefs(prefs));
    this.unsubscribers.push(
      this.coordinator.onPrefs((p) => this.dispatch(setPrefs(p))),
      soundPlayer.onBlockedChange((b) => this.dispatch(setSoundBlocked(b))),
    );
    soundPlayer.preload();

    socket.onHandoverRequested().subscribe((a) => void this.onRequested(a));
    socket.onHandoverAcknowledged().subscribe((e) => this.onAcknowledged(e));
    socket.onHandoverPending().subscribe((e) => void this.onPending(e));
    socket.onReconnect().subscribe(() => void this.loadOpen());

    void this.loadOpen();
  }

  stop() {
    this.unsubscribers.forEach((u) => u());
    this.unsubscribers = [];
    this.coordinator.close();
    this.started = false;
    this.seen.clear();
    this.lastNotifiedAt.clear();
    if (instance === this) instance = null;
  }

  /** Called after a successful prefs change so other tabs follow. */
  broadcastPrefs(prefs: SoundPrefs) {
    this.coordinator.broadcastPrefs(prefs);
  }

  // ------------------------------------------------------------ handover

  /** Load/reload: show open alerts silently (they predate this page). */
  private async loadOpen() {
    const result = await this.dispatch(fetchOpenAlerts());
    if (fetchOpenAlerts.fulfilled.match(result)) {
      this.coordinator.markPlayed(result.payload.map((a) => handoverPlayKey(a)));
    }
  }

  private async onRequested(alert: HandoverAlert) {
    if (!alert?.id) return;
    const known = new Set(Object.keys(this.getState().alerts.byId));
    const prefs = this.getState().alerts.prefs;
    const key = handoverPlayKey(alert);
    const played = new Set(this.coordinator.hasPlayed(key) ? [key] : []);
    const decision = decideHandover(alert, prefs, played, known);

    this.dispatch(alertReceived(alert));
    if (decision.showVisual) {
      showHandoverToast(alert, (id) => this.openAlert(id));
      pushNotification(
        `${alert.visitorName} ${alert.priority === 'high' ? 'has an EMERGENCY' : 'needs an agent'}`,
        'Handover request',
        'text',
      );
    }
    if (decision.sound && (await this.coordinator.claim(key))) {
      await soundPlayer.play(decision.sound);
    } else if (!decision.sound) {
      // Muted or repeat: still mark so a later unmute does not replay it.
      this.coordinator.markPlayed([key]);
    }
  }

  private onAcknowledged(event: HandoverAcknowledgedEvent) {
    if (!event?.id) return;
    this.dispatch(alertAcknowledged(event.id));
    dismissHandoverToast(event.id);
  }

  /** Agent came online with pending alerts: show all, ONE sound for the batch. */
  private async onPending(event: HandoverPendingEvent) {
    const alerts = event?.alerts || [];
    if (!alerts.length) return;
    this.dispatch(alertsMerged(alerts));
    const unplayed = alerts.filter((a) => !this.coordinator.hasPlayed(handoverPlayKey(a)));
    const prefs = this.getState().alerts.prefs;
    if (!unplayed.length) return;
    const batchKey = `pending:${unplayed.map((a) => a.id).sort().join(',')}`;
    const kind = unplayed.some((a) => a.priority === 'high') ? 'emergency' : 'handover';
    if (prefs.handoverSound && (await this.coordinator.claim(batchKey))) {
      await soundPlayer.play(kind);
    }
    this.coordinator.markPlayed(unplayed.map((a) => handoverPlayKey(a)));
  }

  /** Navigate hook, set by the UI layer (keeps routing out of this module). */
  openAlert: (id: string) => void = () => undefined;

  // ------------------------------------------------------ message notification

  /**
   * Visitor message on either transport. `ownedByMe` is decided by the caller
   * from the state it holds at receipt time.
   */
  async onMessage(
    msg: IncomingMessage & { preview?: string; visitorName?: string; type?: string },
    ownedByMe: boolean,
  ) {
    const now = Date.now();
    pruneSeen(this.seen, now);
    const convKey = String(msg.conversationId || msg.threadId || '');

    const decision = decideMessage(msg, {
      ownedByMe,
      isOpenHere: isOpenHere(msg.conversationId, msg.threadId),
      tabFocused: tabFocused(),
      atBottom: isAtBottom(),
      lastNotifiedAt: this.lastNotifiedAt.get(convKey),
      seen: this.seen,
      prefs: this.getState().alerts.prefs,
      now,
    });

    // Remember both keys so the twin delivery is recognised whichever arrives first.
    [messageKey(msg), timeKey(msg)].forEach((k) => k && this.seen.set(k, now));
    if (decision === 'none') return;

    this.lastNotifiedAt.set(convKey, now);
    pushNotification(
      String(msg.preview ?? '').slice(0, 100),
      msg.visitorName || 'New Message',
      msg.type || 'text',
    );
    if (decision === 'play') {
      const key = `msg:${messageKey(msg) ?? `${convKey}|${now}`}`;
      if (await this.coordinator.claim(key)) await soundPlayer.play('message');
    }
  }
}

let instance: AlertClient | null = null;

export function getAlertClient(dispatch: AppDispatch, getState: GetState): AlertClient {
  if (!instance) instance = new AlertClient(dispatch, getState);
  return instance;
}

export function currentAlertClient(): AlertClient | null {
  return instance;
}
