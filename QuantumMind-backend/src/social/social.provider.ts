import { Provider } from '@nestjs/common';
import { SOCIAL_PROVIDER } from './constants';
import { SocialSchema, SocialDocument, Social } from './entities/social.entity';
import { DATABASE_PROVIDER } from 'src/constants';
import { Connection } from 'mongoose';

export const socialProviders: Provider[] = [
  {
    provide: SOCIAL_PROVIDER,
    useFactory: (connection: Connection) =>
      connection.model<SocialDocument>(Social.name, SocialSchema),
    inject: [DATABASE_PROVIDER],
  },
];
