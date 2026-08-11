import { getContext, TemplatePlatform } from './context';

/**
 * Standardised "you're done, go back to the chat" success screen, baked into
 * the SDK so every template presents the same clear exit rather than each
 * author reinventing it (Phase 2 improvement #5).
 *
 * Since a WhatsApp CTA opens the template in an external browser tab (not a
 * true embedded WebView), the customer must be told explicitly to return to
 * the conversation — there is no automatic hand-back.
 */
export interface ReturnToChatOptions {
  title?: string;
  message?: string;
  /** Override the platform label (defaults to the value from getContext). */
  platform?: TemplatePlatform;
  /** Primary brand color for the check badge/button. */
  color?: string;
}

const platformLabel = (platform?: TemplatePlatform): string => {
  switch (platform) {
    case 'whatsapp':
      return 'WhatsApp';
    case 'telegram':
      return 'Telegram';
    case 'facebook':
      return 'Messenger';
    case 'instagram':
      return 'Instagram';
    default:
      return 'the chat';
  }
};

/**
 * Renders a full-screen success overlay. Plain DOM (no framework dependency) so
 * it works in any template regardless of its stack.
 */
export const showReturnToChatScreen = (options: ReturnToChatOptions = {}) => {
  const ctx = getContext();
  const platform = options.platform || ctx.platform;
  const label = platformLabel(platform);
  const color = options.color || '#8A00FF';
  const title = options.title || 'All done!';
  const message =
    options.message ||
    `Your details have been submitted. You can close this window and return to ${label}.`;

  // Remove any prior overlay
  document.getElementById('qt-return-overlay')?.remove();

  const overlay = document.createElement('div');
  overlay.id = 'qt-return-overlay';
  overlay.setAttribute(
    'style',
    [
      'position:fixed',
      'inset:0',
      'z-index:2147483647',
      'display:flex',
      'flex-direction:column',
      'align-items:center',
      'justify-content:center',
      'gap:16px',
      'padding:32px',
      'text-align:center',
      'background:#ffffff',
      "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
    ].join(';'),
  );

  overlay.innerHTML = `
    <div style="width:84px;height:84px;border-radius:50%;background:${color}1a;color:${color};
      display:flex;align-items:center;justify-content:center;font-size:44px;font-weight:700;">&#10003;</div>
    <h1 style="margin:0;font-size:22px;color:#1a1d29;">${title}</h1>
    <p style="margin:0;max-width:340px;color:#6b7280;font-size:15px;line-height:1.5;">${message}</p>
    <button id="qt-return-btn" style="margin-top:8px;padding:14px 28px;border:none;border-radius:12px;
      background:${color};color:#fff;font-size:15px;font-weight:700;cursor:pointer;">
      Return to ${label}
    </button>
  `;

  document.body.appendChild(overlay);

  const btn = document.getElementById('qt-return-btn');
  btn?.addEventListener('click', () => {
    // Best-effort: try to close the tab (works when opened via CTA in some
    // in-app browsers); otherwise attempt a WhatsApp deep link, else no-op.
    if (platform === 'whatsapp' && ctx.phone) {
      window.location.href = 'https://wa.me/';
    }
    window.close();
  });

  return () => overlay.remove();
};
