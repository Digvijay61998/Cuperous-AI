export const TemplateCategoryEnum = {
  APPOINTMENT: 'appointment',
  BOOKING: 'booking',
  CHECKOUT: 'checkout',
  FORM: 'form',
  SURVEY: 'survey',
  FEEDBACK: 'feedback',
  REGISTRATION: 'registration',
  CATALOG: 'catalog',
  PAYMENT: 'payment',
  QUOTATION: 'quotation',
  MEMBERSHIP: 'membership',
  LEAD: 'lead',
  ORDER_TRACKING: 'order_tracking',
  OTHER: 'other',
} as const;

export const TemplateCategoryEnumList: string[] = Object.values(
  TemplateCategoryEnum,
);
