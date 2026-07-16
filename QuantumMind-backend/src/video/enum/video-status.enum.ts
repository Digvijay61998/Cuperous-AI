export const VideoStatusEnum = {
  LIVE: 'live',
  DRAFT: 'draft',
} as const;

export const VideoStatusEnumList: string[] = Object.values(VideoStatusEnum);
