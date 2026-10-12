/** Mirrors QuantumMind-backend/src/handover-alert (HandoverAlertView). */
export type AlertReason =
  | 'flow_transfer'
  | 'visitor_intent'
  | 'ai_escalation'
  | 'emergency';

export type AlertPriority = 'normal' | 'high';

export interface HandoverAlert {
  id: string;
  conversationId: string;
  threadId?: string;
  botId: string;
  visitorName: string;
  reason: AlertReason;
  handoverReason?: string;
  priority: AlertPriority;
  createdAt: string;
  agentAssigned: boolean;
  /** True on the single re-emit that upgrades an open alert to emergency. */
  updated?: boolean;
}

export interface HandoverAcknowledgedEvent {
  id: string;
  conversationId: string;
  threadId?: string;
  resolution: 'opened' | 'taken_over' | 'ended';
  ackBy?: string;
}

export interface HandoverPendingEvent {
  alerts: HandoverAlert[];
  playOnce: true;
}

export interface SoundPrefs {
  handoverSound: boolean;
  messageSound: boolean;
}

export type SenderRole = 'visitor' | 'bot' | 'agent' | 'system';

export type SoundKind = 'handover' | 'emergency' | 'message';

export const REASON_LABEL: Record<AlertReason, string> = {
  flow_transfer: 'asked to talk to an agent',
  visitor_intent: 'asked for a human',
  ai_escalation: 'needs a human (AI escalation)',
  emergency: 'EMERGENCY',
};
