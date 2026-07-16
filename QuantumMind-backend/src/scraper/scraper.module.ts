import { Module } from "@nestjs/common";
import { ScraperService } from "./scraper.service";
import { ScraperController } from "./scraper.controller";
import { ScraperProviders } from "./scraper.provider";
import { HttpModule } from "@nestjs/axios";

@Module({
  imports: [HttpModule.register({})],
  controllers: [ScraperController],
  providers: [ScraperService, ...ScraperProviders],
  exports: [ScraperService],
})
export class ScrapeModule {}
