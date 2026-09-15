export const TemplateActionTypeEnum = {
  APPOINTMENT: 'appointment',
  FORM: 'form',
  LEAD: 'lead',
  SLOT: 'slot',
  UPLOAD: 'upload',
  PAYMENT: 'payment',
  QUOTE: 'quote',
} as const;

export const TemplateActionTypeEnumList: string[] = Object.values(
  TemplateActionTypeEnum,
);
