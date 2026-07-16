export const SocialStatusEnum = {
  PUBLISHED: 'published',
  DRAFT: 'draft',
} as const;

export const SocialStatusEnumList: string[] = Object.values(SocialStatusEnum);
