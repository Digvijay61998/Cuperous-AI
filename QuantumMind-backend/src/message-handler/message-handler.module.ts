import { HttpModule } from "@nestjs/axios";
import { Global, Module } from "@nestjs/common";
import { QuestionsModule } from "src/questions/questions.module";
import { MessagingModule } from "src/messaging/messaging.module";
import { TemplateSessionModule } from "src/template-session/template-session.module";
import { TemplateModule } from "src/template/template.module";
import { MessageHandlerService } from "./message-handler.service";

@Global()
@Module({
  providers: [MessageHandlerService],
  exports: [MessageHandlerService],
  imports: [
    QuestionsModule,
    HttpModule.register({}),
    MessagingModule,
    TemplateSessionModule,
    TemplateModule,
  ],
})
export class MessageHandlerModule {}
