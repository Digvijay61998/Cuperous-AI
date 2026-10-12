import { BOT_FEATURE_KEYS } from "src/common/features";

/** Max lengths for visitor-facing texts set by admins (crm-incident-handover). */
export const SETTING_TEXT_MAX = 500;
const ALIAS_RE = /^[A-Za-z0-9_.-]{1,64}$/;

const text = (v: unknown): string | undefined => {
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t ? t.slice(0, SETTING_TEXT_MAX) : undefined;
};
const alias = (v: unknown): string | undefined =>
  typeof v === "string" && ALIAS_RE.test(v.trim()) ? v.trim() : undefined;

/**
 * Normalise the crm-incident-handover keys of a BotSetting update so a bad
 * dashboard payload can never break the visitor path. Keys that are absent
 * stay absent (partial update); a present-but-empty text clears the field so
 * the product default applies. Unknown feature flags are dropped and values
 * must be booleans.
 */
export function sanitizeIncidentSettings<T extends Record<string, any>>(body: T): T {
  const out: Record<string, any> = { ...body };

  if ("features" in out) {
    const f = out.features;
    if (!f || typeof f !== "object" || Array.isArray(f)) {
      delete out.features;
    } else {
      out.features = Object.fromEntries(
        BOT_FEATURE_KEYS.filter((k) => k in f).map((k) => [k, f[k] === true]),
      );
    }
  }

  for (const key of ["handoverMessage", "problemQuestion", "closurePromptText", "closingMessage"]) {
    if (key in out) out[key] = text(out[key]) ?? null;
  }

  if ("problemAlias" in out) out.problemAlias = alias(out.problemAlias) ?? null;

  if ("contactMapping" in out) {
    const m = out.contactMapping;
    if (!m || typeof m !== "object" || Array.isArray(m)) {
      out.contactMapping = null;
    } else {
      const clean = { name: alias(m.name), email: alias(m.email), phone: alias(m.phone) };
      out.contactMapping = clean.name || clean.email || clean.phone ? clean : null;
    }
  }

  if ("closureIdleMinutes" in out) {
    // Empty / null means "use the default (10)". Number("") and Number(null)
    // are 0, which used to clamp to 1 minute and close chats almost at once.
    const raw = out.closureIdleMinutes;
    const blank = raw === null || raw === undefined || (typeof raw === "string" && !raw.trim());
    const n = blank || typeof raw === "boolean" ? NaN : Number(raw);
    out.closureIdleMinutes = Number.isFinite(n) ? Math.min(60, Math.max(1, Math.round(n))) : null;
  }

  return out as T;
}
