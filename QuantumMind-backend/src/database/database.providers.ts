import * as mongoose from "mongoose";
import { DATABASE_PROVIDER } from "src/constants";

import { ConfigService } from "@nestjs/config";

export const databaseProviders = [
  {
    provide: DATABASE_PROVIDER,
    inject: [ConfigService],
    useFactory: async (
      configService: ConfigService
    ): Promise<typeof mongoose> => {
      const uri = configService.get("database.url");
      mongoose.set("strictQuery", false);
      return await mongoose.connect(uri, {
        useUnifiedTopology: true,
      } as mongoose.ConnectOptions);
    },
  },
];
