import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import configuration from "./config/configuration";
import { ConfigModule, ConfigService } from "@nestjs/config";

import { DatabaseModule } from "./database/database.module";

import { TokenModule } from "./token/token.module";
import { AuthModule } from "./auth/auth.module";
import { APP_GUARD } from "@nestjs/core";
import { JwtAuthGuard } from "./auth/guards/jwt.guards";
import { AgentModule } from "./agent/agent.module";
import { BotsModule } from "./bots/bots.module";
import { VisitorModule } from "./visitor/visitor.module";
import { TagModule } from "./tag/tag.module";
import { EventEmitterModule } from "@nestjs/event-emitter";

import { SegmentsModule } from "./segments/segments.module";
import { TicketsModule } from "./tickets/tickets.module";
import { WebhookModule } from "./webhook/webhook.module";
import { ConversationModule } from "./conversation/conversation.module";
import { RedisModule } from "./redis/redis.module";
import { SocketModule } from "./socket/socket.module";
import { RedisPropagateModule } from "./redis-propagate/redis-propagate.module";
import { EngageGateway } from "./engage/engage.gateway";
import { MessageHandlerModule } from "./message-handler/message-handler.module";
import { WidgetModule } from "./widget/widget.module";
import { UnansweredModule } from "./unanswered/unanswered.module";
import { UploadModule } from "./upload/upload.module";
import { QuestionsModule } from "./questions/questions.module";
import { FeedbackModule } from "./feedback/feedback.module";
import { AdvertisementModule } from "./advertisement/advertisement.module";
import { OfferModule } from "./offer/offer.module";
import { EngageService } from "./engage/engage.service";
import { EngageModule } from "./engage/engage.module";
import { FacebookModule } from "./facebook/facebook.module";
import { TelegramModule } from "./telegram/telegram.module";
import { ChatInitializerModule } from "./chat-initializer/chat-initializer.module";
import { VideoModule } from "./video/video.module";
import { TemplateModule } from "./template/template.module";
import { FeatureFlagsModule } from "./feature-flags/feature-flags.module";
import { MessagingModule } from "./messaging/messaging.module";
import { TemplateSessionModule } from "./template-session/template-session.module";
import { ScheduleModule } from "@nestjs/schedule";
import { WhatsappModule } from "./whatsapp/whatsapp.module";
import { MailsModule } from "./mails/mails.module";
import { SocialModule } from "./social/social.module";
import { ScrapeModule } from "./scraper/scraper.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),

    DatabaseModule,
    ScrapeModule,
    TokenModule,
    AuthModule,
    AgentModule,
    BotsModule,
    VisitorModule,
    TagModule,

    SegmentsModule,
    TicketsModule,
    WebhookModule,
    ConversationModule,
    RedisModule,
    SocketModule,
    RedisPropagateModule,
    MessageHandlerModule,
    WidgetModule,
    UnansweredModule,
    UploadModule,
    QuestionsModule,
    FeedbackModule,
    AdvertisementModule,
    OfferModule,
    EngageModule,
    EventEmitterModule.forRoot(),
    FacebookModule,
    TelegramModule,
    ChatInitializerModule,
    VideoModule,
    TemplateModule,
    FeatureFlagsModule,
    MessagingModule,
    TemplateSessionModule,
    ScheduleModule.forRoot(),
    WhatsappModule,
    MailsModule,
    SocialModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    EngageGateway,
    EngageService,
  ],
})
export class AppModule {}
