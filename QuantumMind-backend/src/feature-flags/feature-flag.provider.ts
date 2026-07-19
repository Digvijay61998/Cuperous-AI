import { Connection } from 'mongoose';
import { DATABASE_PROVIDER } from 'src/constants';
import { FEATURE_FLAG_PROVIDER } from './constant';
import { FeatureFlag, FeatureFlagSchema } from './entities/feature-flag.entity';

export const FeatureFlagProviders = [
  {
    provide: FEATURE_FLAG_PROVIDER,
    useFactory: (connection: Connection) =>
      connection.model(FeatureFlag.name, FeatureFlagSchema),
    inject: [DATABASE_PROVIDER],
  },
];
