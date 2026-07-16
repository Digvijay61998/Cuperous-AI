import { Global, Module } from '@nestjs/common';
import { OfferService } from './offer.service';
import { OfferController } from './offer.controller';
import { offerProviders } from './offer.provider';

@Global()
@Module({
  controllers: [OfferController],
  providers: [OfferService, ...offerProviders],
  exports: [OfferService],
})
export class OfferModule {}
