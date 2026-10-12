import { FeatureKey } from 'src/common/constants/feature-catalog';
import { SocialPlatformEnum } from './enums/social-platform.enum';

/**
 * Which catalog feature gates connecting a given platform. Platforms that are
 * not in the catalog (viber, wechat, instagram, twitter) have no channel
 * integration today and are rejected on connect.
 */
export const PLATFORM_FEATURE: Record<string, FeatureKey> = {
  [SocialPlatformEnum.WHATSAPP]: 'channel.whatsapp_official',
  [SocialPlatformEnum.WHATSAPP_WEB]: 'channel.whatsapp_openwa',
  [SocialPlatformEnum.TELEGRAM]: 'channel.telegram',
  [SocialPlatformEnum.FACEBOOK]: 'channel.facebook',
};
