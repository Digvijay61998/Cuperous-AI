export const SocialPlatformEnum = {
  FACEBOOK: "facebook",
  TELEGRAM: "telegram",
  WHATSAPP: "whatsapp",
  // WhatsApp Web (baileys) — QR / phone-number pairing, distinct from the Meta
  // Cloud API "whatsapp" platform above.
  WHATSAPP_WEB: "whatsapp_web",
  VIBER: "viber",
  WECHAT: "wechat",
  INSTAGRAM: "instagram",
  TWITTER: "twitter",
} as const;

export const SocialPlatformEnumList: string[] =
  Object.values(SocialPlatformEnum);
