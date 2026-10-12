/**
 * "Exactly one tab plays the sound" across Dashboard tabs of one browser.
 *
 * Every tab receives the same socket event. Before playing, a tab claims the
 * event's key in a shared localStorage ledger. The claim uses a write-then-
 * verify step with a per-tab token: two tabs racing both write, but only the
 * tab whose token survives the re-read after a short settle delay plays.
 * BroadcastChannel then tells the other tabs the key is taken, so a later
 * duplicate (socket reconnect, re-send) is refused immediately.
 *
 * Visuals (toast, indicator) are NOT coordinated — every tab shows them.
 */
import type { SoundPrefs } from './types';

export const LEDGER_KEY = 'jarcube.alerts.played';
export const PREFS_KEY = 'jarcube.alerts.prefs';
const CHANNEL = 'jarcube-alerts';
const LEDGER_MAX = 500;
const LEDGER_TTL_MS = 24 * 60 * 60 * 1000;
export const SETTLE_MS = 60;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface ChannelLike {
  postMessage(data: any): void;
  onmessage: ((ev: { data: any }) => void) | null;
  close(): void;
}

type Ledger = Record<string, { t: number; by: string }>;

type CoordinatorMessage =
  | { type: 'claimed'; key: string; by: string; t: number }
  | { type: 'prefs'; prefs: SoundPrefs };

export interface TabCoordinatorDeps {
  storage?: StorageLike | null;
  channel?: ChannelLike | null;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
  tabId?: string;
}

export class TabCoordinator {
  readonly tabId: string;
  private storage: StorageLike | null;
  private channel: ChannelLike | null;
  private now: () => number;
  private sleep: (ms: number) => Promise<void>;
  /** Keys this tab knows are taken (by any tab), even without storage. */
  private taken = new Set<string>();
  private prefsListeners = new Set<(p: SoundPrefs) => void>();

  constructor(deps: TabCoordinatorDeps = {}) {
    this.tabId =
      deps.tabId ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    this.storage = deps.storage === undefined ? safeLocalStorage() : deps.storage;
    this.channel = deps.channel === undefined ? safeChannel() : deps.channel;
    this.now = deps.now ?? (() => Date.now());
    this.sleep = deps.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)));

    if (this.channel) {
      this.channel.onmessage = (ev) => this.onMessage(ev?.data as CoordinatorMessage);
    }
  }

  /** True when this key has already played in any tab. */
  hasPlayed(key: string): boolean {
    if (this.taken.has(key)) return true;
    return !!this.readLedger()[key];
  }

  /**
   * Try to become the one tab that plays `key`. Resolves true at most once per
   * key across all tabs sharing the storage.
   */
  async claim(key: string): Promise<boolean> {
    if (this.hasPlayed(key)) return false;

    if (!this.storage) {
      // No shared storage: fall back to per-tab dedup only.
      this.taken.add(key);
      this.channel?.postMessage({ type: 'claimed', key, by: this.tabId, t: this.now() });
      return true;
    }

    const ledger = this.readLedger();
    ledger[key] = { t: this.now(), by: this.tabId };
    this.writeLedger(ledger);

    // Let a racing tab's write land, then see whose token survived.
    await this.sleep(SETTLE_MS);
    const winner = this.readLedger()[key];
    this.taken.add(key);
    if (winner && winner.by !== this.tabId) return false;
    if (!winner) {
      // Storage was cleared mid-claim; take it rather than drop the alert.
      const again = this.readLedger();
      again[key] = { t: this.now(), by: this.tabId };
      this.writeLedger(again);
    }
    this.channel?.postMessage({ type: 'claimed', key, by: this.tabId, t: this.now() });
    return true;
  }

  /** Mark keys as already handled without playing (e.g. alerts fetched on load). */
  markPlayed(keys: string[]) {
    if (!keys.length) return;
    const ledger = this.readLedger();
    for (const k of keys) {
      this.taken.add(k);
      if (!ledger[k]) ledger[k] = { t: this.now(), by: 'fetch' };
    }
    this.writeLedger(ledger);
  }

  // ------------------------------------------------------------- prefs sync

  broadcastPrefs(prefs: SoundPrefs) {
    try {
      this.storage?.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch {
      /* quota / private mode */
    }
    this.channel?.postMessage({ type: 'prefs', prefs });
  }

  readCachedPrefs(): SoundPrefs | null {
    try {
      const raw = this.storage?.getItem(PREFS_KEY);
      if (!raw) return null;
      const p = JSON.parse(raw);
      return {
        handoverSound: p?.handoverSound !== false,
        messageSound: p?.messageSound !== false,
      };
    } catch {
      return null;
    }
  }

  onPrefs(listener: (p: SoundPrefs) => void): () => void {
    this.prefsListeners.add(listener);
    return () => this.prefsListeners.delete(listener);
  }

  close() {
    this.channel?.close();
    this.prefsListeners.clear();
  }

  // ---------------------------------------------------------------- private

  private onMessage(msg: CoordinatorMessage | undefined) {
    if (!msg) return;
    if (msg.type === 'claimed') this.taken.add(msg.key);
    if (msg.type === 'prefs') this.prefsListeners.forEach((l) => l(msg.prefs));
  }

  private readLedger(): Ledger {
    if (!this.storage) return {};
    try {
      const parsed = JSON.parse(this.storage.getItem(LEDGER_KEY) || '{}');
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }

  private writeLedger(ledger: Ledger) {
    if (!this.storage) return;
    const cutoff = this.now() - LEDGER_TTL_MS;
    const entries = Object.entries(ledger)
      .filter(([, v]) => v && v.t >= cutoff)
      .sort((a, b) => b[1].t - a[1].t)
      .slice(0, LEDGER_MAX);
    try {
      this.storage.setItem(LEDGER_KEY, JSON.stringify(Object.fromEntries(entries)));
    } catch {
      /* quota / private mode: per-tab dedup still applies */
    }
  }
}

function safeLocalStorage(): StorageLike | null {
  try {
    if (typeof window === 'undefined') return null;
    const s = window.localStorage;
    const probe = '__jarcube_probe__';
    s.setItem(probe, '1');
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}

function safeChannel(): ChannelLike | null {
  try {
    if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') {
      return null;
    }
    return new BroadcastChannel(CHANNEL) as unknown as ChannelLike;
  } catch {
    return null;
  }
}
