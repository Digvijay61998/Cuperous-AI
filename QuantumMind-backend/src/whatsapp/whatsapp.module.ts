import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { SocialModule } from "src/social/social.module";
import { WhatsappController } from "./whatsapp.controller";
import { WhatsappService } from "./whatsapp.service";

@Module({
  controllers: [WhatsappController],
  providers: [WhatsappService],
  imports: [SocialModule, HttpModule.register({})],
})
export class WhatsappModule {}
