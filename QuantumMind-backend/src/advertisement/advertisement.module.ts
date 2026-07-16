import { Global, Module } from "@nestjs/common";
import { AdvertisementController } from "./advertisement.controller";
import { advertisementProviders } from "./advertisement.provider";
import { AdvertisementService } from "./advertisement.service";

@Global()
@Module({
  controllers: [AdvertisementController],
  providers: [AdvertisementService, ...advertisementProviders],
  exports: [AdvertisementService],
})
export class AdvertisementModule {}
