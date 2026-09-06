export const PlatformEnum = {
  FACEBOOK: 'facebook',
  TELEGRAM: 'telegram',
  WHATSAPP: 'whatsapp',
  WHATSAPP_WEB: 'whatsapp_web',
  WIDGET: 'widget',
} as const;

export const PlatformEnumList = Object.values(PlatformEnum);
