/**
 * Reads the runtime context passed by the bot when it opens the template
 * inside a WebView, e.g.
 *   .../index.html?vid=abc&ph=9198...&bid=xyz&cid=conv1&src=whatsapp&tid=tmpl1&lang=en
 *
 * The WhatsApp phone number IS the unique visitor identifier in JarCube,
 * so no login/auth is required. For website (widget) flows the visitor is
 * created/identified upstream and vid is passed through the same way.
 */
export type TemplatePlatform =
  | 'whatsapp'
  | 'facebook'
  | 'telegram'
  | 'instagram'
  | 'widget'
  | string;

export interface TemplateContext {
  visitorId?: string;
  phone?: string;
  name?: string;
  botId?: string;
  conversationId?: string;
  platform?: TemplatePlatform;
  templateId?: string;
  leadId?: string;
  /** Template session id (path param for the session endpoints). */
  sessionId?: string;
  /** Session auth token (validated server-side). */
  sessionToken?: string;
  lang: string;
  /** Any extra query params, exposed untyped for forward compatibility. */
  extra: Record<string, string>;
}

const KNOWN_KEYS = new Set([
  'vid',
  'ph',
  'name',
  'bid',
  'cid',
  'src',
  'tid',
  'sid',
  'stk',
  'lead',
  'lang',
]);

export const getContext = (search: string = window.location.search): TemplateContext => {
  const p = new URLSearchParams(search);

  const extra: Record<string, string> = {};
  p.forEach((value, key) => {
    if (!KNOWN_KEYS.has(key)) extra[key] = value;
  });

  return {
    visitorId: p.get('vid') || undefined,
    phone: p.get('ph') || undefined,
    name: p.get('name') || undefined,
    botId: p.get('bid') || undefined,
    conversationId: p.get('cid') || undefined,
    platform: (p.get('src') as TemplatePlatform) || undefined,
    templateId: p.get('tid') || undefined,
    sessionId: p.get('sid') || undefined,
    sessionToken: p.get('stk') || undefined,
    leadId: p.get('lead') || undefined,
    lang: p.get('lang') || 'en',
    extra,
  };
};

/** Resolve the template id from the URL (?tid=) or from the hosting path. */
export const resolveTemplateId = (): string | undefined => {
  const ctx = getContext();
  if (ctx.templateId) return ctx.templateId;
  // Fallback: /api/file/templates/{templateId}/v{version}/index.html
  const match = window.location.pathname.match(/templates\/([^/]+)\/v[^/]+/);
  return match?.[1];
};
