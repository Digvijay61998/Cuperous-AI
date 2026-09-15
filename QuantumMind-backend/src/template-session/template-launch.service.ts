import { Injectable } from '@nestjs/common';
import { generateId } from 'src/util';

/**
 * Builds and validates the launch URL for a template session. Uses an opaque,
 * unguessable, single-use token (validated server-side against the session
 * record) rather than a self-contained JWT — simpler, and revocation/expiry is
 * enforced by the session row's status + expiresAt, not by the token itself.
 */
@Injectable()
export class TemplateLaunchService {
  /** Generate a fresh launch token. */
  generateToken(): string {
    return generateId('tls', 32);
  }

  /**
   * Compose the customer-facing launch URL. `hostedUrl` is the template's
   * Phase-1 index.html URL; we append the session token + template id so the
   * SDK (getContext) can read them.
   */
  buildUrl(
    hostedUrl: string,
    sessionId: string,
    token: string,
    templateId: string,
    botId?: string,
  ): string {
    if (!hostedUrl) return '';
    const sep = hostedUrl.includes('?') ? '&' : '?';
    // sid = session id (path param), stk = session token (auth), tid = template id
    let url =
      `${hostedUrl}${sep}sid=${encodeURIComponent(sessionId)}` +
      `&stk=${encodeURIComponent(token)}` +
      `&tid=${encodeURIComponent(templateId)}`;
    // bid lets the template load this customer's config overrides rather than
    // the shared catalog defaults.
    if (botId) url += `&bid=${encodeURIComponent(botId)}`;
    return url;
  }
}
