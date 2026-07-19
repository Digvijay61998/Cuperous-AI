export enum TemplateSessionStatusEnum {
  CREATED = 'created', // session made, message not yet confirmed sent
  LAUNCHED = 'launched', // CTA delivered to customer
  OPENED = 'opened', // customer opened the template (heartbeat)
  IN_PROGRESS = 'in_progress', // customer interacting
  SUBMITTED = 'submitted', // form submitted, pending validation
  VALIDATED = 'validated', // accepted, workflow resumed
  EXPIRED = 'expired', // launch link expired before it was ever opened
  ABANDONED = 'abandoned', // opened but not completed before timeout
  FAILED = 'failed', // validation or resume failure
}

export const TemplateSessionStatusList: string[] = Object.values(
  TemplateSessionStatusEnum,
);
