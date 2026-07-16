import { Connection } from 'mongoose';
import { DATABASE_PROVIDER } from 'src/constants';
import { OFFER_PROVIDER } from './constants';
import { Provider } from '@nestjs/common';
import { Offer, OfferDocument, OfferSchema } from './entities/offer.entity';

export const offerProviders: Provider[] = [
  {
    provide: OFFER_PROVIDER,
    useFactory: (connection: Connection) =>
      connection.model<OfferDocument>(Offer.name, OfferSchema),
    inject: [DATABASE_PROVIDER],
  },
];
