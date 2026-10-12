import type { SoundKind } from './types';

const SRC: Record<SoundKind, string> = {
  handover: '/sounds/handover.wav',
  emergency: '/sounds/emergency.wav',
  message: '/sounds/message-soft.wav',
};

type BlockedListener = (blocked: boolean) => void;

/**
 * Plays alert sounds and turns a browser autoplay rejection into UI state
 * instead of an unhandled promise rejection.
 *
 * A rejected sound is NOT queued for later — replaying a stale alarm after the
 * user clicks would be confusing. After the first user gesture the NEXT sound
 * plays normally.
 */
class SoundPlayer {
  private cache: Partial<Record<SoundKind, HTMLAudioElement>> = {};
  private blocked = false;
  private listeners = new Set<BlockedListener>();
  private gestureBound = false;

  private audio(kind: SoundKind): HTMLAudioElement | null {
    if (typeof window === 'undefined' || typeof Audio === 'undefined') return null;
    if (!this.cache[kind]) {
      const a = new Audio(SRC[kind]);
      a.preload = 'auto';
      this.cache[kind] = a;
    }
    return this.cache[kind]!;
  }

  /** Warm the cache so the first alert is not delayed by a fetch. */
  preload() {
    (Object.keys(SRC) as SoundKind[]).forEach((k) => this.audio(k));
  }

  async play(kind: SoundKind): Promise<boolean> {
    const a = this.audio(kind);
    if (!a) return false;
    try {
      a.currentTime = 0;
      await a.play();
      return true;
    } catch (error: any) {
      if (error?.name === 'NotAllowedError') this.setBlocked(true);
      // Any other error (decode, abort) is swallowed: a missing sound must
      // never break message handling.
      return false;
    }
  }

  isBlocked() {
    return this.blocked;
  }

  onBlockedChange(listener: BlockedListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private setBlocked(value: boolean) {
    if (this.blocked === value) return;
    this.blocked = value;
    this.listeners.forEach((l) => l(value));
    if (value) this.bindGesture();
  }

  /** First click/tap/key press unlocks audio for this page. */
  private bindGesture() {
    if (this.gestureBound || typeof window === 'undefined') return;
    this.gestureBound = true;
    const unlock = () => {
      window.removeEventListener('pointerdown', unlock, true);
      window.removeEventListener('keydown', unlock, true);
      this.gestureBound = false;
      // Prime one element silently so later play() calls are allowed.
      const a = this.audio('message');
      if (a) {
        const prevVolume = a.volume;
        a.volume = 0;
        a.play()
          .then(() => {
            a.pause();
            a.currentTime = 0;
          })
          .catch(() => undefined)
          .finally(() => {
            a.volume = prevVolume;
          });
      }
      this.setBlocked(false);
    };
    window.addEventListener('pointerdown', unlock, true);
    window.addEventListener('keydown', unlock, true);
  }
}

export const soundPlayer = new SoundPlayer();
