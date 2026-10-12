/**
 * Closure_Prompt and Ended_State rules (crm-incident-handover R14, Phase 6).
 *
 * Pure, so the state machine is unit-tested without the message handler.
 * MessageHandlerService owns the side effects (sending, persisting, ending).
 */
import { NodeTypeEnum } from "src/bots/enums/node-type.enum";
import { PlatformEnum } from "src/conversation/enums/platform.enum";
import { isFeatureOn } from "src/common/features";

/** Button labels (R14.1). The value sent back is the label itself. */
export const CLOSURE_CHOICES = {
  resolved: "Yes, resolved",
  other: "I need something else",
  restart: "Start again",
} as const;

export const DEFAULT_CLOSURE_PROMPT = "Is your query resolved?";
/** R14.2 default closing message. */
export const DEFAULT_CLOSING_MESSAGE = "Thank you for contacting us. Have a good day.";
/** R14.3: the one message sent before continuing from the start node. */
export const SOMETHING_ELSE_TEXT = "Sure. What else can I help you with?";
/** Shown by the widget under the transcript once the chat has ended (R14.6). */
export const ENDED_NOTICE = "This chat has ended.";

/** R14.4: restart keywords, matched after trim and case-fold. */
export const RESTART_WORDS: ReadonlySet<string> = new Set(["start", "reset", "restart"]);

/** R14.5: idle time after the prompt before auto-closing. */
export const CLOSURE_IDLE_DEFAULT_MIN = 10;
export const CLOSURE_IDLE_MIN = 1;
export const CLOSURE_IDLE_MAX = 60;

/** Socket event that puts the widget in the Ended_State (R14.2, R14.5). */
export const CONVERSATION_ENDED_EVENT = "conversation-ended";

/**
 * Why a conversation was closed by this feature. Carried on
 * `conversation.ended`: neither closes an open incident (R10.4 lists only
 * CLOSE_CHAT, expiry and the reconnect grace period). `closure_resolved`
 * resolves it before ending (R10.3); `idle` leaves it for the agent.
 */
export type ClosureEndCause = "closure_resolved" | "idle";

export { ENDED_STATE_CAUSES } from "src/conversation/ended-state";

export type ClosureReply =
  | { kind: "resolved" }
  | { kind: "other" }
  | { kind: "restart" }
  /** Anything else: handled as "I need something else" with the text (R14.10). */
  | { kind: "free_text"; text: string }
  /** Nothing to act on (empty, non-text). The prompt stays pending. */
  | { kind: "none" };

const fold = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();
const LABELS = {
  resolved: fold(CLOSURE_CHOICES.resolved),
  other: fold(CLOSURE_CHOICES.other),
  restart: fold(CLOSURE_CHOICES.restart),
};

/** Classify the first visitor input after a Closure_Prompt. */
export function parseClosureReply(message: unknown): ClosureReply {
  if (typeof message !== "string") return { kind: "none" };
  const t = fold(message);
  if (!t) return { kind: "none" };
  if (t === LABELS.resolved) return { kind: "resolved" };
  if (t === LABELS.other) return { kind: "other" };
  if (t === LABELS.restart || RESTART_WORDS.has(t)) return { kind: "restart" };
  return { kind: "free_text", text: message.trim() };
}

/** True for one of the three button labels (used to ignore late clicks). */
export function isClosureLabel(message: unknown): boolean {
  if (typeof message !== "string") return false;
  const t = fold(message);
  return t === LABELS.resolved || t === LABELS.other || t === LABELS.restart;
}

/** Minutes, clamped to 1..60; anything unusable is the default 10. */
export function closureIdleMinutes(botSettings: { closureIdleMinutes?: unknown } | null | undefined): number {
  const raw = botSettings?.closureIdleMinutes;
  const n = typeof raw === "number" ? raw : typeof raw === "string" && raw.trim() ? Number(raw) : NaN;
  if (!Number.isFinite(n)) return CLOSURE_IDLE_DEFAULT_MIN;
  return Math.min(CLOSURE_IDLE_MAX, Math.max(CLOSURE_IDLE_MIN, Math.round(n)));
}

/** R14.5: measured from when the prompt was sent. */
export function isClosureIdle(sentAt: Date | number | string, idleMinutes: number, now: number = Date.now()): boolean {
  const t = sentAt instanceof Date ? sentAt.getTime() : typeof sentAt === "number" ? sentAt : Date.parse(String(sentAt));
  if (!Number.isFinite(t)) return false;
  const mins = closureIdleMinutes({ closureIdleMinutes: idleMinutes });
  return now - t >= mins * 60_000;
}

/**
 * Whether the closure behaviour applies to this conversation right now:
 * flag on, widget channel only (R15.6/R15.7: other channels unchanged), and
 * not Agent_Owned (R14.11).
 */
export function closureApplies(s: {
  botSettings?: any;
  platform?: string;
  handledByAgent?: boolean;
} | null | undefined): boolean {
  if (!s) return false;
  if (!isFeatureOn(s.botSettings, "closurePrompt")) return false;
  if (s.platform && s.platform !== PlatformEnum.WIDGET) return false;
  return !s.handledByAgent;
}

/** Node types whose flow-builder "Terminal" toggle is honoured (task 6.6). */
export const TERMINAL_TOGGLE_TYPES: ReadonlySet<string> = new Set([
  NodeTypeEnum.SUCCESS,
  NodeTypeEnum.FAILURE,
  NodeTypeEnum.TIMEOUT,
  NodeTypeEnum.BOT_RESPONSE,
]);

/** The node is marked terminal in the flow builder (R14.1). */
export function isMarkedTerminal(node: { nodeType?: string; payload?: any } | null | undefined): boolean {
  return !!node && TERMINAL_TOGGLE_TYPES.has(String(node.nodeType)) && node.payload?.terminal === true;
}

/** The three buttons, in the widget's buttons message shape. */
export function closurePromptMessage(botSettings: { closurePromptText?: unknown } | null | undefined) {
  const text =
    typeof botSettings?.closurePromptText === "string" && botSettings.closurePromptText.trim()
      ? botSettings.closurePromptText.trim()
      : DEFAULT_CLOSURE_PROMPT;
  return {
    type: "buttons",
    value: text,
    buttons: Object.values(CLOSURE_CHOICES).map((title) => ({ type: "text", title, value: title })),
  };
}

export function closingMessageText(botSettings: { closingMessage?: unknown } | null | undefined): string {
  return typeof botSettings?.closingMessage === "string" && botSettings.closingMessage.trim()
    ? botSettings.closingMessage.trim()
    : DEFAULT_CLOSING_MESSAGE;
}
