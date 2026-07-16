export const SocialPlatformEnum = {
  FACEBOOK: "facebook",
  TELEGRAM: "telegram",
  WHATSAPP: "whatsapp",
  VIBER: "viber",
  WECHAT: "wechat",
  INSTAGRAM: "instagram",
  TWITTER: "twitter",
} as const;

export const SocialPlatformEnumList: string[] =
  Object.values(SocialPlatformEnum);
