import { HttpService } from "@nestjs/axios";
import {
  BadRequestException,
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { firstValueFrom } from "rxjs";
import { ConfigService } from "@nestjs/config";
import { SocialService } from "src/social/social.service";
import { ChatInitializerService } from "src/chat-initializer/chat-initializer.service";
import { PlatformEnum } from "src/conversation/enums/platform.enum";
import { MessageHandlerService } from "src/message-handler/message-handler.service";
import { SocketStateService } from "src/socket/socket-state.service";
import { ChatTypeEnum } from "src/conversation/enums/chat-type.enum";

@Injectable()
export class FacebookService {
  private readonly logger = new Logger(FacebookService.name);
  private botList: Record<
    string,
    {
      engageBotId: string;
      accessToken: string;
    }
  > = {};
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly socialService: SocialService,
    private readonly chatInitializerService: ChatInitializerService,
    private readonly messageHandlerService: MessageHandlerService,
    private readonly socketStateService: SocketStateService
  ) {}

  async getWebhook(query: any) {
    const mode = query["hub.mode"];
    const token = query["hub.verify_token"];
    const challenge = query["hub.challenge"];

    if (mode && token) {
      if (
        mode === "subscribe" &&
        token === this.configService.get("social.verifyToken")
      ) {
        this.logger.debug(`Facebook Webhook verified!`);
        return challenge;
      }
    }
    this.logger.debug(`Facebook Webhook verification failed.`);
    throw new HttpException("Webhook verification failed.", 403);
  }

  async postWebhook(body: any) {
    try {
      // this.logger.log(`Webhook received!`);
      //this.logger.log(body);
      if (body.object !== "page") throw new BadRequestException();
      body.entry.forEach(async (entry: any) => {
        const pageId = entry.id;
        //console.log('pageId', pageId);

        const { accessToken, engageBotId } = this.botList[pageId] || {};
        if (!accessToken || !engageBotId) {
          const { accessToken, engageBotId } =
            await this.socialService.getBotToken(pageId);
          this.botList[pageId] = { accessToken, engageBotId };
        }

        if (entry.changes) {
          const webhook_event = entry.changes[0];
          const sender_psid = webhook_event.value.from.id;
          if (sender_psid === pageId) return;
          if (webhook_event.value.message) {
            // await this.handleMessage(
            //   sender_psid,
            //   webhook_event.value.message,
            //   pageId,
            // );
            const commentId = webhook_event.value.comment_id;
            //console.log('webhook_event', webhook_event);

            if (webhook_event.value.type === "comment") {
              await this.replyToFbComment(
                pageId,
                commentId,
                webhook_event.value.message
              );
            }
          } else if (webhook_event.value.postback) {
            this.handlePostback(
              sender_psid,
              webhook_event.value.postback,
              pageId
            );
          }
        }
        if (entry.messaging) {
          const webhook_event = entry.messaging[0];

          const sender_psid = webhook_event.sender.id;
          if (sender_psid === pageId) return;

          if (webhook_event.message) {
            await this.handleMessage(
              sender_psid,
              webhook_event.message,
              pageId
            );
          } else if (webhook_event.postback) {
            this.handlePostback(sender_psid, webhook_event.postback, pageId);
          }
        }
      });

      return "EVENT_RECEIVED";
    } catch (error) {
      this.logger.error(error.message);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  public async handleMessage(
    sender_psid: any,
    received_message: any,
    pageId: string
  ) {
    this.logger.log(`Received message from ${sender_psid}`);
    //console.log(received_message);
    const { accessToken, engageBotId } = this.botList[pageId] || {};
    const userData = await this.getUserDetails(sender_psid, accessToken);

    const { first_name, last_name, id } = userData;
    const visitor = await this.chatInitializerService.initializeChat(
      {
        name: `${first_name} ${last_name}`,
        username: id,
        bot: engageBotId,
        platform: PlatformEnum.FACEBOOK,
      },
      engageBotId
    );

    const user: any = {
      auth: {
        userId: visitor.visitorId,
        email: "",
        name: `${first_name} ${last_name}`,
        role: "visitor",
      },
    };

    const socketData = this.socketStateService.getUserData(visitor.visitorId);
    if (!socketData) return;

    const { mode, handledByAgent, assignedAgentId, conversationId } =
      socketData;

    this.socketStateService.updateUserData(visitor.visitorId, {
      ctx: { pageId, sender_psid, accessToken },
    });

    const messageData = {
      message: "",
      user,
      type: "text",
      language: "en",
      ctx: { pageId, sender_psid, accessToken },
    };
    if (received_message.text) {
      messageData.message = received_message.text;
      messageData.type = "text";

      // return this.messageHandlerService.handleMessage(
      //   received_message.text,
      //   user,
      //   messageData.type,
      //   "en",
      //   { pageId, sender_psid, accessToken }
      // );
    } else if (received_message.attachments) {
      // Get the URL of the message attachment
      const attachment_url = received_message.attachments[0].payload.url;
      const type = received_message.attachments[0].type;
      messageData.message = attachment_url;
      if (type === ChatTypeEnum.IMAGE) messageData.type = ChatTypeEnum.IMAGE;
      else if (type === ChatTypeEnum.VIDEO)
        messageData.type = ChatTypeEnum.VIDEO;
      else if (type === ChatTypeEnum.FILE) messageData.type = ChatTypeEnum.FILE;
      else if (type === ChatTypeEnum.AUDIO)
        messageData.type = ChatTypeEnum.AUDIO;
      else return;
    }

    if (handledByAgent && assignedAgentId) {
      return this.messageHandlerService.sendMessageToAgent(
        assignedAgentId,
        {
          type: messageData.type,
          value: messageData.message,
          from: visitor.visitorId,
        },
        socketData
      );
    }
    return this.messageHandlerService.handleMessage(
      messageData.message,
      user,
      messageData.type,
      "en",
      messageData.ctx
    );
  }

  async handlePostback(
    sender_psid: string,
    received_postback: any,
    pageId: string
  ) {
    const { accessToken, engageBotId } = this.botList[pageId] || {};
    const userData = await this.getUserDetails(sender_psid, accessToken);

    const { first_name, last_name, id } = userData;
    const visitor = await this.chatInitializerService.initializeChat(
      {
        name: `${first_name} ${last_name}`,
        username: id,
        bot: engageBotId,
        platform: PlatformEnum.FACEBOOK,
      },
      engageBotId
    );

    const user: any = {
      auth: {
        userId: visitor.visitorId,
        email: "",
        name: `${first_name} ${last_name}`,
        role: "visitor",
      },
    };

    const payload = received_postback.payload;

    if (typeof payload === "string") {
      return this.messageHandlerService.handleMessage(
        payload,
        user,
        "text",
        "en",
        { pageId, sender_psid, accessToken }
      );
    }
  }

  async callSendAPI(sender_psid: any, response: any, access_token?: string) {
    this.logger.log(`Sending message to ${sender_psid}`);
    const request_body = {
      recipient: {
        id: sender_psid,
      },
      message: response,
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          "https://graph.facebook.com/v15.0/me/messages",
          request_body,
          {
            params: {
              access_token: access_token,
            },
          }
        )
      );

      this.logger.log(`Message sent! ${JSON.stringify(response.data)}`);
    } catch (error) {
      const errorMessages = error.response?.data?.error?.message;
      this.logger.error(`Unable to send message. ${errorMessages}`);
    }
  }

  async getUserDetails(userId: string, access_token) {
    try {
      if (!userId) throw new BadRequestException("User Id is required");
      const response = await firstValueFrom(
        this.httpService.get(`https://graph.facebook.com/${userId}`, {
          params: {
            access_token: access_token,
            fields: "first_name,last_name",
          },
        })
      );

      return response.data;
    } catch (error) {
      console.log(error.response?.data);
      const errorMessages =
        error.response.data?.error?.message || error.message;
      this.logger.error(errorMessages);
    }
  }

  async replyToFbComment(pageId: string, commentId: string, message: string) {
    console.log("replyToFbComment", pageId, commentId, message);
    const { accessToken } = this.botList[pageId] || {};
    const request_body = {
      message: `We have received your comment. Our team will get back to you shortly. \n\n${message}`,
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `https://graph.facebook.com/v15.0/${commentId}/comments`,
          request_body,
          {
            params: {
              access_token:
                "EAAOch7o5ZBU4BAM0jiK0ln5DM1fw82Dwsma5genR6kNM7VGBK37do6FxjxLr9Cruy2ww5w0Pp7RburO1hCFcjzcMT7o5EwZCsTOZCKAWE5dKP3ZBJEZAW1BtwwkKHQmVZCV4rXUnwZBQF8ZC6lu39mdGHAnwTBY2NBmtOPSgQnL29bPebZC8Fq879RutgrSyU10H4EIhPOuba1pzpcKZBKL5m62I6eYpKO79IZD",
            },
          }
        )
      );

      this.logger.log(`Message sent! ${JSON.stringify(response.data)}`);
    } catch (error) {
      const errorMessages = error.response?.data?.error?.message;
      this.logger.error(`Unable to send message. ${errorMessages}`);
    }
  }
}
