import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { AiController } from "./ai.controller";
import { AiService } from "./ai.service";
import { AiProviders } from "./ai.providers";

@Module({
  imports: [HttpModule.register({})],
  controllers: [AiController],
  providers: [AiService, ...AiProviders],
  exports: [AiService],
})
export class AiModule {}
