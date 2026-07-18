export const TemplateStatusEnum = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const;

export const TemplateStatusEnumList: string[] = Object.values(
  TemplateStatusEnum,
);
