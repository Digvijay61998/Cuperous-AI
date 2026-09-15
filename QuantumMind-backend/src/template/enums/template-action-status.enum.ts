export const TemplateActionStatusEnum = {
  RECEIVED: 'received',
  PROCESSED: 'processed',
  FAILED: 'failed',
} as const;

export const TemplateActionStatusEnumList: string[] = Object.values(
  TemplateActionStatusEnum,
);
