import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { TrainingDataController } from "./trainingdata.controller";
import { TrainingDataService } from "./trainingdata.service";
import { TrainingDataProviders } from "./trainingdata.providers";

@Module({
  imports: [
    HttpModule.register({
      // Exclude "br" from Accept-Encoding. Cloudflare fronts the AI service
      // (ai.jarcube.com) and picks Brotli whenever the client advertises it,
      // but axios 1.2.1 passes its zlib option set — `finishFlush:
      // Z_SYNC_FLUSH` (value 2) — straight into createBrotliDecompress, where
      // 2 means BROTLI_OPERATION_FINISH. The decoder finishes early and throws
      // `Z_BUF_ERROR: unexpected end of file`, so every /ingest/file call
      // failed on the response even though the AI service had already ingested
      // the document successfully. Upstream axios fixed this with a separate
      // brotliOptions constant; until we upgrade, not offering br avoids it.
      headers: { "Accept-Encoding": "gzip, deflate" },
    }),
  ],
  controllers: [TrainingDataController],
  providers: [TrainingDataService, ...TrainingDataProviders],
  exports: [TrainingDataService],
})
export class TrainingDataModule {}
