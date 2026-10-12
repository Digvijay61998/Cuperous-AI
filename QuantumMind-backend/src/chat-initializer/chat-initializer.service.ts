import { HttpException, Injectable, Logger, Optional } from '@nestjs/common';
import {
  CaptureSource,
  ContactCaptureService,
} from 'src/crm-bridge/contact-capture.service';
import { RawDetails } from 'src/crm-bridge/identity';
import { VisitorService } from 'src/visitor/visitor.service';
import { BotsService } from 'src/bots/bots.service';
import { ConversationService } from 'src/conversation/conversation.service';
import { SocketStateService } from 'src/socket/socket-state.service';
import { ConversationTypeEnum } from 'src/conversation/enums/conversation-type.enum';
import { BotSetting } from 'src/bots/entities';
import { SocketState } from 'src/socket/socket-state.service';
import { ModeEnum } from 'src/widget/enums/mode.enum';
import { PlatformEnum } from 'src/conversation/enums/platform.enum';
import { CreateVisitorDto } from 'src/visitor/dto/create-visitor.dto';
import { ObjectID } from 'bson';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ChatInitializerService {
  private readonly logger = new Logger(ChatInitializerService.name);
  constructor(
    private readonly visitorService: VisitorService,
    private readonly botsService: BotsService,
    private readonly conversationService: ConversationService,
    private readonly socketStateService: SocketStateService,
    private readonly eventEmitter: EventEmitter2,
    @Optional() private readonly contactCapture?: ContactCaptureService,
  ) {}

  /**
   * `capture` carries what the platform tells us about the person (name,
   * phone, platform account id). It is saved to the CRM when a conversation
   * starts (crm-plugins-service-desk R1.4, R1.5, R22), fire-and-forget.
   */
  async initializeChat(
    visitorData: CreateVisitorDto,
    botId: string,
    capture?: { source: CaptureSource; details: RawDetails },
  ) {
    try {
      const visitorId = await this.visitorService.CreateVisitorfromSocialMedia(
        visitorData,
      );

      const userdata = this.socketStateService.getUserData(visitorId);

      if (userdata) {
        return {
          visitorId,
        };
      }

      const bot = await this.botsService.getBotDataForWidget(botId);
      const botSettings = bot.botSetting as BotSetting;
      const nodeData = await this.botsService.getBotNode(bot.botFlow.startNode);

      const data: SocketState = {
        botId: bot.id,
        currentNode: nodeData,
        startNode: nodeData,
        botSettings,
        mode: ModeEnum.live,
        platform: visitorData.platform,
        botName: bot.name,
      };

      const conversation = await this.conversationService.createConversation({
        bot: bot.id,
        type: ConversationTypeEnum.BOT,
        visitor: visitorId,
        platform: visitorData.platform,
      });
      data.conversationId = conversation.id;

      this.socketStateService.updateUserData(visitorId, data);
      if (capture && this.contactCapture) {
        // A platform display name ("Raj 🔥") never replaces a name the person
        // told us; it only names a new or anonymous contact (D11).
        void this.contactCapture.capture(
          {
            conversationId: String(conversation.id),
            visitorId,
            botId: String(bot.id),
            botName: bot.name,
            channel: visitorData.platform,
            mode: ModeEnum.live,
            botSettings: botSettings as any,
          },
          { ...capture.details, weakName: true },
          capture.source,
        );
      }
      return {
        visitorId,
      };
    } catch (error) {
      console.log(error);
    }
  }

  async createChat(botId: string) {
    try {
      const visitorId = new ObjectID().toHexString();
      const conversation = await this.conversationService.createConversation({
        bot: botId,
        type: ConversationTypeEnum.BOT,
        visitor: visitorId,
        platform: PlatformEnum.WIDGET,
      });
      this.eventEmitter.emit('create.new.chat', {
        sender: visitorId,
        message: "Hi, I'm a new visitor, Create a new chat for stress testing",
        type: 'text',
        conversationId: conversation.id,
      });
      return {
        visitorId,
      };
    } catch (error) {
      throw new HttpException(error.message, error.status || 500);
    }
  }
}
