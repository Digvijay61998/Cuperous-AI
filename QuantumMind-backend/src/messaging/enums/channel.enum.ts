/**
 * Logical messaging channels. Mirrors PlatformEnum values so the two stay
 * interchangeable, but lives in the messaging module so the provider layer
 * doesn't depend on the conversation module.
 */
export enum ChannelEnum {
  WHATSAPP = 'whatsapp',
  FACEBOOK = 'facebook',
  TELEGRAM = 'telegram',
  INSTAGRAM = 'instagram',
  WIDGET = 'widget',
  SMS = 'sms',
  EMAIL = 'email',
}

export const ChannelEnumList: string[] = Object.values(ChannelEnum);

/**
 * Concrete provider implementations. A single channel (e.g. WhatsApp) can have
 * multiple providers (official Cloud API vs OpenWA) that are swapped via a
 * feature flag without the workflow engine ever knowing which is active.
 */
export enum ProviderIdEnum {
  WHATSAPP_OFFICIAL = 'whatsapp_official',
  WHATSAPP_OPENWA = 'whatsapp_openwa',
  FACEBOOK_OFFICIAL = 'facebook_official',
  TELEGRAM_OFFICIAL = 'telegram_official',
  INSTAGRAM_OFFICIAL = 'instagram_official',
  WIDGET_NATIVE = 'widget_native',
}

/** Default provider per channel, used when no feature flag override exists. */
export const DEFAULT_PROVIDER_BY_CHANNEL: Record<string, string> = {
  [ChannelEnum.WHATSAPP]: ProviderIdEnum.WHATSAPP_OFFICIAL,
  [ChannelEnum.FACEBOOK]: ProviderIdEnum.FACEBOOK_OFFICIAL,
  [ChannelEnum.TELEGRAM]: ProviderIdEnum.TELEGRAM_OFFICIAL,
  [ChannelEnum.INSTAGRAM]: ProviderIdEnum.INSTAGRAM_OFFICIAL,
  [ChannelEnum.WIDGET]: ProviderIdEnum.WIDGET_NATIVE,
};
