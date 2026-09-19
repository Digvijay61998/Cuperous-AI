import { SetMetadata } from '@nestjs/common';
import { FeatureKey } from '../constants/feature-catalog';

export const REQUIRES_FEATURE_KEY = 'requiresFeature';

/**
 * Restricts a route to organizations whose effective entitlements enable the
 * given feature. Enforced by {@link FeatureGuard}.
 *
 * @example
 * ```ts
 * @RequiresFeature('channel.telegram')
 * @Post('telegram/connect')
 * connect() {}
 * ```
 */
export const RequiresFeature = (feature: FeatureKey) =>
  SetMetadata(REQUIRES_FEATURE_KEY, feature);
