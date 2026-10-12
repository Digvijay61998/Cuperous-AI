// Flow-builder "Terminal" toggle (crm-incident-handover 6.6, R14.1).
// Pure helpers so the rules are unit-tested without the editor.

/** Node types whose Terminal toggle the backend honours. */
export const TERMINAL_NODE_TYPES = ['SUCCESS', 'FAILURE', 'TIMEOUT', 'BOT_RESPONSE'] as const;

export function supportsTerminal(nodeType?: string | null): boolean {
  return (TERMINAL_NODE_TYPES as readonly string[]).includes(String(nodeType));
}

/** Only a literal `true` counts, like the backend. */
export function isTerminal(payload: any): boolean {
  return payload?.terminal === true;
}

/**
 * The payload to save. The node save replaces the whole payload, so every
 * existing key is kept and only `terminal` changes.
 */
export function withTerminal(payload: any, on: boolean): Record<string, any> {
  const base = payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {};
  return { ...base, terminal: on === true };
}

export const TERMINAL_HELP =
  'When "Ask if the query is resolved" is on for this bot, the bot asks the visitor whether they are done ' +
  'after this step, instead of continuing. Without that setting this has no effect.';
