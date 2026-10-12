import type { BotFeatureKey } from "src/bots/entities/bot-setting.entity";

export const BOT_FEATURE_KEYS: readonly BotFeatureKey[] = [
  "crmCapture",
  "incidentHandover",
  "profileSummaries",
  "closurePrompt",
  "autoLearn",
] as const;

/**
 * Whether a CRM / incident-handover rollout flag is on for a bot.
 *
 * Fail-closed: a missing settings object, a missing `features` map, or any
 * value other than literal `true` counts as OFF, so a bot saved before the
 * flags existed (or a malformed payload) keeps the old behaviour.
 */
// `crmCapture` is retired (crm-plugins-service-desk R2, R23): capture and
// "ask once" are always on. The key stays in the list so stored bot
// settings keep validating; nothing reads it.

// `incidentHandover` is retired too (owner decision, incident first): every
// request for a person opens an incident and a service request at once, for
// every bot. The stored value is ignored.
const ALWAYS_ON: ReadonlySet<BotFeatureKey> = new Set<BotFeatureKey>(["incidentHandover"]);

export function isFeatureOn(
  botSettings: { features?: Partial<Record<BotFeatureKey, unknown>> } | null | undefined,
  key: BotFeatureKey,
): boolean {
  if (ALWAYS_ON.has(key)) return true;
  return botSettings?.features?.[key] === true;
}
