import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Sliding-window outbound send limiter, per WhatsApp Web session.
 *
 * WHY THIS EXISTS
 * ---------------
 * baileys automates an UNOFFICIAL personal WhatsApp session, and a burst of
 * automated sends is the single biggest trigger for the number being banned. An
 * agent holding Enter, a retry loop, or a misbehaving bot flow can all spray the
 * wire. This caps the rate at the one place every outbound message funnels
 * through — the hub's send call — so no caller can bypass it.
 *
 * In-memory and per-process on purpose. The ban risk is per-session, and a
 * session lives on exactly one process (baileys holds a single socket per auth
 * dir), so a process-local counter is the correct scope — a distributed counter
 * would add Redis round-trips to the hot path for no protection the single owner
 * does not already provide.
 *
 * The window is a plain timestamp ring rather than a token bucket because the
 * quantity that matters to WhatsApp is "messages in the last N seconds", which a
 * timestamp list answers exactly and legibly.
 */
@Injectable()
export class WhatsappWebRateLimiter {
  private readonly logger = new Logger(WhatsappWebRateLimiter.name);

  /** session name -> recent send timestamps (epoch ms), oldest first. */
  private readonly sends = new Map<string, number[]>();

  constructor(private readonly configService: ConfigService) {}

  private get limit(): number {
    return this.configService.get<number>('whatsappWeb.sendRateLimit') ?? 30;
  }

  private get windowMs(): number {
    return (
      this.configService.get<number>('whatsappWeb.sendRateWindowMs') ?? 60_000
    );
  }

  /**
   * Record a send and report whether it is within the limit.
   *
   * Returns `true` when the send is allowed (and counts it), `false` when the
   * window is full. Called immediately before the wire send, so a refused call
   * never reaches WhatsApp.
   *
   * Prunes expired timestamps on every call, so the map cannot grow without
   * bound for an idle session — the array shrinks to empty and the key is dropped.
   */
  tryConsume(sessionName: string): boolean {
    if (!sessionName) return true;
    const now = Date.now();
    const cutoff = now - this.windowMs;

    const recent = (this.sends.get(sessionName) ?? []).filter(
      (t) => t > cutoff,
    );

    if (recent.length >= this.limit) {
      // Keep the pruned list so the window stays accurate; do not record this
      // rejected attempt.
      this.sends.set(sessionName, recent);
      this.logger.warn(
        `Send rate limit hit for session "${sessionName}": ` +
          `${recent.length}/${this.limit} in ${this.windowMs}ms`,
      );
      return false;
    }

    recent.push(now);
    this.sends.set(sessionName, recent);
    return true;
  }

  /** Seconds until the oldest in-window send expires — for a Retry-After hint. */
  retryAfterSeconds(sessionName: string): number {
    const recent = this.sends.get(sessionName);
    if (!recent?.length) return 0;
    const oldest = recent[0];
    const freeAt = oldest + this.windowMs;
    return Math.max(0, Math.ceil((freeAt - Date.now()) / 1000));
  }
}
