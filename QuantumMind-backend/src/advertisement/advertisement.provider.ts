import { Provider } from '@nestjs/common';

import { Connection } from 'mongoose';
import { DATABASE_PROVIDER } from 'src/constants';
import { ADVERTISEMENT_PROVIDER } from './constatnts';
import {
  AdvertisementSchema,
  Advertisement,
  AdvertisementDocument,
} from './entities/advertisement.entity';

export const advertisementProviders: Provider[] = [
  {
    provide: ADVERTISEMENT_PROVIDER,
    useFactory: (connection: Connection) =>
      connection.model<AdvertisementDocument>(
        Advertisement.name,
        AdvertisementSchema,
      ),
    inject: [DATABASE_PROVIDER],
  },
];
