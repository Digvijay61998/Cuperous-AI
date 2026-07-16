import { Injectable, Logger, HttpException, HttpStatus } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SocialService } from "src/social/social.service";
import { WhatsappCloud } from "./util";
import { ChatInitializerService } from "src/chat-initializer/chat-initializer.service";
import { PlatformEnum } from "src/conversation/enums/platform.enum";
import { MessageHandlerService } from "src/message-handler/message-handler.service";
import { messageParser } from "./util/message-parser";
import { SocketStateService } from "src/socket/socket-state.service";
import fs from "fs";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private bots: Record<
    string,
    {
      accessToken: string;
      engageBotId: string;
      whatsappCloud?: WhatsappCloud;
    }
  > = {};

  private messages: string[] = [];

  constructor(
    private readonly configService: ConfigService,
    private readonly socialService: SocialService,
    private readonly chatInitializerService: ChatInitializerService,
    private readonly messageHandlerService: MessageHandlerService,
    private readonly socketStateService: SocketStateService,
    private readonly httpService: HttpService
  ) {}

  async getWebhook(query: any) {
    try {
      const mode = query["hub.mode"];
      const token = query["hub.verify_token"];
      const challenge = query["hub.challenge"];

      if (mode && token) {
        if (
          mode === "subscribe" &&
          token === this.configService.get("social.verifyToken")
        ) {
          this.logger.debug(`Whatsapp Webhook verified!`);
          return challenge;
        }
      }
      this.logger.debug(`Whatsapp Webhook verification failed.`);
      throw new HttpException("Webhook verification failed.", 403);
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(
        "Webhook verification failed.",
        error.status || 500
      );
    }
  }

  async postWebhook(body: any, res: any) {
    try {
      // this.logger.verbose(body);
      res.status(200).send("ok");
      const data = messageParser(body);

      if (data.isMessage) {
        const { businessId, metadata } = data;

        let { accessToken, whatsappCloud } = this.bots[businessId] || {};
        if (!accessToken || whatsappCloud) {
          const bot = await this.socialService.getBotToken(businessId);
          if (!bot) return;
          accessToken = bot.accessToken;
          const engageBotId = bot.engageBotId;
          whatsappCloud = new WhatsappCloud();
          whatsappCloud.initialize({
            accessToken,
            WABA_ID: businessId,
            senderPhoneNumberId: metadata.phone_number_id,
            graphAPIVersion: "v15.0",
          });
          this.bots[businessId] = { accessToken, whatsappCloud, engageBotId };
        }
        // await whatsappCloud.markMessageAsRead({
        //   message_id: data.message.message_id,
        // });
        await this.handleIncomingMessage(data, this.bots[businessId]);
      }
      return;
    } catch (error) {
      this.logger.error(error);
    }
  }

  async handleIncomingMessage(data: any, bot: any) {
    try {
      const { engageBotId, whatsappCloud, accessToken } = bot;
      if (data.isMessage) {
        const { message } = data;
        const { message_id } = message;

        // if (this.messages.includes(message_id)) {
        //   return;
        // } else {
        //   this.messages.push(message_id);
        // }
        // console.log('message', message.text);
        const { from } = message;

        const visitor = await this.chatInitializerService.initializeChat(
          {
            name: from.name,
            username: from.phone,
            phone: from.phone,
            bot: engageBotId,
            platform: PlatformEnum.WHATSAPP,
          },
          engageBotId
        );

        this.socketStateService.updateUserData(visitor.visitorId, {
          ctx: {
            Whatsapp: whatsappCloud,
            message_id,
            recipient: from.phone,
          },
        });

        const user: any = {
          auth: {
            userId: visitor.visitorId,
            email: "",
            name: from.name,
            role: "visitor",
          },
        };

        let type = "text";
        let messageText = "";
        console.log("message", message.text || message.image);
        if (message.image) {
          type = "image";

          const localImageBaseUrl = this.configService.get("server.domain");
          const uploadPath = "uploaded-docs";

          const image = await whatsappCloud.getMediaUrl(message.image.id);
          const writer = fs.createWriteStream(`${uploadPath}/${image.id}.jpg`);
          messageText = `${localImageBaseUrl}/api/file/${image.id}.jpg`;
          console.log("messageText", messageText);
          const response = await firstValueFrom(
            this.httpService.get(image.url, {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
              responseType: "stream",
            })
          );
          const { data } = response;
          data.pipe(writer);
        }
        if (message.text) {
          messageText = message.text.body;
          type = "text";
        }
        if (messageText) {
          const userData = this.socketStateService.getUserData(
            visitor.visitorId
          );
          if (!userData) return;
          const { handledByAgent, assignedAgentId } = userData;
          if (handledByAgent && assignedAgentId) {
            return this.messageHandlerService.sendMessageToAgent(
              assignedAgentId,
              {
                type: type,
                value: messageText,
                from: visitor.visitorId,
              },
              userData
            );
          }
          return this.messageHandlerService.handleMessage(
            messageText,
            user,
            type,
            "en",
            {
              Whatsapp: whatsappCloud,
              message_id: message.message_id,
              recipient: message.from.phone,
            }
          );
        }
      }
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(
        `Error handling whatsapp incoming message. ${error.message}`,
        error.status || 500
      );
    }
  }
}
