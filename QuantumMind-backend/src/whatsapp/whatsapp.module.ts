import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { SocialModule } from "src/social/social.module";
import { UploadModule } from "src/upload/upload.module";
import { WhatsappCloudClient } from "./whatsapp-cloud.client";
import { WhatsappController } from "./whatsapp.controller";
import { WhatsappService } from "./whatsapp.service";

/**
 * WhatsApp Cloud API (Meta official) channel. Conversation, channel-thread,
 * inbox, socket and message-handler services come from their @Global modules.
 */
@Module({
  controllers: [WhatsappController],
  providers: [WhatsappService, WhatsappCloudClient],
  imports: [SocialModule, UploadModule, HttpModule.register({})],
})
export class WhatsappModule {}
