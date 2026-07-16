export const ScrapeStatusEnum = {
  DRAFT: 'draft',
  SUSPENDED: 'suspended',
  DELETED: 'deleted',
} as const;

export const ScrapeStatusPagesEnum = {
  PENDING: 'pending',
  FAILED: 'failed',
  COMPLETED: 'completed',
} as const;

export const ScrapeStatusEnumList: string[] = Object.values(ScrapeStatusEnum);
export const ScrapeStatusAllPagesList: string[] = Object.values(
  ScrapeStatusPagesEnum,
);
