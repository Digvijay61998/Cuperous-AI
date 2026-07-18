export const TemplateIndustryEnum = {
  MEDICAL: 'medical',
  REAL_ESTATE: 'real_estate',
  RESTAURANT: 'restaurant',
  RETAIL: 'retail',
  HOTEL: 'hotel',
  EDUCATION: 'education',
  TRAVEL: 'travel',
  FINANCE: 'finance',
  INSURANCE: 'insurance',
  SALON: 'salon',
  SPA: 'spa',
  GYM: 'gym',
  AUTOMOBILE: 'automobile',
  EVENTS: 'events',
  LEAD_GENERATION: 'lead_generation',
  CRM: 'crm',
  ECOMMERCE: 'ecommerce',
  OTHER: 'other',
} as const;

export const TemplateIndustryEnumList: string[] = Object.values(
  TemplateIndustryEnum,
);
