import { HttpModule } from "@nestjs/axios";
import { Global, Module } from "@nestjs/common";
import { QuestionsModule } from "src/questions/questions.module";
import { MessageHandlerService } from "./message-handler.service";

@Global()
@Module({
  providers: [MessageHandlerService],
  exports: [MessageHandlerService],
  imports: [QuestionsModule, HttpModule.register({})],
})
export class MessageHandlerModule {}
