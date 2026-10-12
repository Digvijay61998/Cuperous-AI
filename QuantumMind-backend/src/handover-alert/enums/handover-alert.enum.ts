/** Why a Handover_Alert was raised. Decided from structured signals only. */
export enum AlertReasonEnum {
  FLOW_TRANSFER = "flow_transfer",
  VISITOR_INTENT = "visitor_intent",
  AI_ESCALATION = "ai_escalation",
  EMERGENCY = "emergency",
}

export enum AlertPriorityEnum {
  NORMAL = "normal",
  HIGH = "high",
}

export enum AlertStatusEnum {
  OPEN = "open",
  ACKNOWLEDGED = "acknowledged",
}

export enum AlertResolutionEnum {
  OPENED = "opened",
  TAKEN_OVER = "taken_over",
  ENDED = "ended",
}

export const priorityForReason = (reason: AlertReasonEnum): AlertPriorityEnum =>
  reason === AlertReasonEnum.EMERGENCY
    ? AlertPriorityEnum.HIGH
    : AlertPriorityEnum.NORMAL;
