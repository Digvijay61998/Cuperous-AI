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
    correlation?: {
      conversationId?: string;
      visitorId?: string;
      platform?: string;
    },
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

    // Conversation correlation the template SDK reads from the URL
    // (getContext: cid/vid/src). The SDK echoes these back on every action
    // submission (createAppointment etc.), which is what lets the backend tie a
    // submission to the conversation that launched it and resume the flow. The
    // session id (sid) is the robust key, but the currently deployed SDK does
    // not read it — so we ALSO pass what it does read, and no template redeploy
    // is needed. When the SDK is updated to send sid, this becomes belt-and-braces.
    if (correlation?.conversationId)
      url += `&cid=${encodeURIComponent(correlation.conversationId)}`;
    if (correlation?.visitorId)
      url += `&vid=${encodeURIComponent(correlation.visitorId)}`;
    if (correlation?.platform)
      url += `&src=${encodeURIComponent(correlation.platform)}`;
    return url;
  }
}
