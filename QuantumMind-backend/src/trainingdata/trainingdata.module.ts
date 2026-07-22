import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { TrainingDataController } from "./trainingdata.controller";
import { TrainingDataService } from "./trainingdata.service";
import { TrainingDataProviders } from "./trainingdata.providers";

@Module({
  imports: [HttpModule.register({})],
  controllers: [TrainingDataController],
  providers: [TrainingDataService, ...TrainingDataProviders],
  exports: [TrainingDataService],
})
export class TrainingDataModule {}
