export const VideoCategoryEnum = {
  AGENT: 'agent',
  BOT: 'bot',
  VISITOR: 'visitor',
  CONVERSATION: 'conversation',
  SERVICE_REQUEST: 'service-request',
  TELEGRAM: 'telegram',
  FACEBOOK: 'facebook',
  WHATSAPP: 'whatsapp',
  WEBHOOK: 'webhook',
  SEGMENT: 'segment',
  TAG: 'tag',
  ADVERTISEMENT: 'advertisement',
  OFFERS: 'offers',
  QUESTION_BANK: 'question-bank',
} as const;

export const VideoCategoryEnumList: string[] = Object.values(VideoCategoryEnum);
