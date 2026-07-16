import { Connection } from "mongoose";
import { DATABASE_PROVIDER } from "src/constants";
import { SCRAPER_PROVIDER } from "./constant";
import { Scraper, ScraperSchema } from "./entities/scraper.entity";

export const ScraperProviders = [
  {
    provide: SCRAPER_PROVIDER,
    useFactory: (connection: Connection) =>
      connection.model(Scraper.name, ScraperSchema),
    inject: [DATABASE_PROVIDER],
  },
];
