// Pure helpers for the incident / CRM bot settings (crm-incident-handover 3.5).

export type IncidentFeatureKey =
  | 'crmCapture'
  | 'incidentHandover'
  | 'profileSummaries'
  | 'closurePrompt'
  | 'autoLearn';

/** Only the flags that do something today are shown. */
export const FEATURE_LABELS: Partial<Record<IncidentFeatureKey, { label: string; help: string }>> = {
  // `incidentHandover` has no switch any more: every request for a person
  // opens an incident ticket at once and the visitor gets its number.
  // `crmCapture` has no switch any more: visitor details are always saved to
  // the CRM, and details already given are never asked again
  // (crm-plugins-service-desk R2, R23).
  profileSummaries: {
    label: 'Summarise chats into the visitor profile',
    help: 'After each chat the AI updates one profile per contact and the bot uses it in later answers. The server setting PROFILE_PURGE_MODE decides whether chats are then deleted (live) or kept (dry run, the default).',
  },
  autoLearn: {
    label: 'Learn from agent resolutions',
    help: 'When an agent resolves a request with a note, the AI turns it into a general question and answer (personal data removed), adds it to the Question Bank as approved and uses it in later answers.',
  },
  closurePrompt: {
    label: 'Ask if the query is resolved',
    help: 'When the flow reaches an end, the bot asks the visitor whether they are done instead of restarting the menu, then closes the chat.',
  },
};

// Mirrors the backend closure defaults (keep in sync with message-handler/closure.ts).
export const DEFAULT_CLOSURE_PROMPT = 'Is your query resolved?';
export const DEFAULT_CLOSING_MESSAGE = 'Thank you for contacting us. Have a good day.';
export const CLOSURE_IDLE_DEFAULT = 10;
export const CLOSURE_IDLE_MIN = 1;
export const CLOSURE_IDLE_MAX = 60;

/**
 * Error text for the idle minutes field, or '' when valid or empty
 * (empty = default 10). Whole minutes from 1 to 60 (R14.5).
 */
export function idleMinutesError(value: unknown): string {
  if (value === undefined || value === null || String(value).trim() === '') return '';
  const s = String(value).trim();
  if (!/^\d+$/.test(s)) return 'Use a whole number of minutes.';
  const n = Number(s);
  return n >= CLOSURE_IDLE_MIN && n <= CLOSURE_IDLE_MAX ? '' : `Use ${CLOSURE_IDLE_MIN} to ${CLOSURE_IDLE_MAX} minutes.`;
}


// Mirrors the backend defaults (keep in sync with message-handler / problem-gate).
export const DEFAULT_HANDOVER_TEXT =
  'Thank you for reaching out. Your incident ticket {{ticketId}} has been created and our team will follow up with you on it. Please keep this number for future reference.';
export const DEFAULT_PROBLEM_QUESTION = 'Please describe the problem in a few words.';
export const CONTACT_DEFAULTS = {
  name: 'contact_name',
  email: 'contact_email',
  phone: 'contact_phone',
  problem: 'contact_topic',
} as const;

const ALIAS_RE = /^[A-Za-z0-9_.-]{1,64}$/;

/** Error text for an attribute name, or '' when valid or empty (empty = default). */
export function aliasError(value?: string | null): string {
  const v = (value ?? '').trim();
  if (!v) return '';
  return ALIAS_RE.test(v) ? '' : 'Use letters, numbers, _ . or - (max 64).';
}

/** What the visitor will see, with a sample reference. */
export function handoverPreview(template?: string | null, sampleRef = 'SR_ABC123'): string {
  const t = (template ?? '').trim() || DEFAULT_HANDOVER_TEXT;
  if (/\{\{\s*ticketId\s*\}\}/.test(t)) return t.replace(/\{\{\s*ticketId\s*\}\}/g, sampleRef);
  return `${t} Your reference is ${sampleRef}.`;
}

/** True when any incident/CRM field would be rejected; blocks Save. */
export function hasIncidentSettingErrors(settings: any): boolean {
  const m = settings?.contactMapping || {};
  return (
    [settings?.problemAlias, m.name, m.email, m.phone].some((v) => !!aliasError(v)) ||
    !!idleMinutesError(settings?.closureIdleMinutes)
  );
}
