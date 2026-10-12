export enum IncidentStatusEnum {
  WAITING = "waiting",
  AGENT_ACTIVE = "agent_active",
  FOLLOW_UP = "follow_up",
  RESOLVED = "resolved",
  CLOSED = "closed",
}

export enum IncidentOutcomeEnum {
  RESOLVED_BY_AGENT = "resolved_by_agent",
  RESOLVED_BY_BOT = "resolved_by_bot",
  FOLLOW_UP_TICKET = "follow_up_ticket",
  ABANDONED = "abandoned",
  CLOSED_UNRESOLVED = "closed_unresolved",
}

/** Why the problem text is not a normal 10–1000 character description (R4). */
export enum ProblemFlagEnum {
  SHORT = "short",
  TRUNCATED = "truncated",
  NONE = "none",
}

/** Statuses in which an incident is still open (unique per conversation). */
export const OPEN_INCIDENT_STATUSES: readonly IncidentStatusEnum[] = [
  IncidentStatusEnum.WAITING,
  IncidentStatusEnum.AGENT_ACTIVE,
  IncidentStatusEnum.FOLLOW_UP,
];

export const TERMINAL_INCIDENT_STATUSES: readonly IncidentStatusEnum[] = [
  IncidentStatusEnum.RESOLVED,
  IncidentStatusEnum.CLOSED,
];
