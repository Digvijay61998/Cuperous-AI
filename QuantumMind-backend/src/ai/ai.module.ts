import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { AiController } from "./ai.controller";
import { AiService } from "./ai.service";
import { AiProviders } from "./ai.providers";

@Module({
  imports: [
    HttpModule.register({
      // See TrainingDataModule for the full explanation: axios 1.2.1 cannot
      // decode Brotli (it feeds zlib flush constants to createBrotliDecompress
      // and dies with Z_BUF_ERROR), and Cloudflare serves Brotli for any
      // response over ~1KB. This affects /query/ask too, so any AI answer
      // longer than ~1KB would fail the same way.
      headers: { "Accept-Encoding": "gzip, deflate" },
    }),
  ],
  controllers: [AiController],
  providers: [AiService, ...AiProviders],
  exports: [AiService],
})
export class AiModule {}
