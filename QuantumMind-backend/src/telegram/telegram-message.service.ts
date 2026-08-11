import { Injectable, Logger } from "@nestjs/common";
import { Hears, Help, On, Start, Update } from "nestjs-telegraf";

import { MessageHandlerService } from "src/message-handler/message-handler.service";
import { SocketStateService } from "src/socket/socket-state.service";
import { TelegramContext } from "./middlewares/telegram.user";
import { SocialService } from "src/social/social.service";
import { Telegraf, Context, TelegramError } from "telegraf";

import { TelegramUserMiddleware } from "./middlewares/telegram.user";
import { ChatInitializerService } from "src/chat-initializer/chat-initializer.service";
import { ConfigService } from "@nestjs/config";
import fs from "fs";

@Injectable()
export class TelegramMessageService {
  private readonly logger = new Logger(TelegramMessageService.name);
  private botList: Record<
    string,
    {
      jarcubeBotId: string;
      accessToken: string;
    }
  > = {};

  constructor(
    private messageHandlerService: MessageHandlerService,
    private socketStateService: SocketStateService,
    private socialService: SocialService,
    private configService: ConfigService,
    private chatInitializerService: ChatInitializerService
  ) {}

  async handlePostWebhook(body: any, botId: string) {
    try {
      let { accessToken, jarcubeBotId } = this.botList[botId] || {};

      if (!accessToken) {
        const data = await this.socialService.getBotToken(botId);

        accessToken = data?.accessToken;
        jarcubeBotId = data?.jarcubeBotId;
        if (!accessToken) return;
        this.botList[botId] = { accessToken, jarcubeBotId };
      }

      const bot = new Telegraf(accessToken);
      bot.use(TelegramUserMiddleware(this.chatInitializerService, jarcubeBotId));
      bot.use(this.handleSendMessage.bind(this));
      await bot.handleUpdate(body);
    } catch (error) {
      console.log(error);
    }
  }

  async handleSendMessage(ctx: TelegramContext, next: () => Promise<any>) {
    try {
      this.socketStateService.updateUserData(ctx.visitorId, {
        ctx,
      });
      const user: any = {
        auth: {
          userId: ctx.visitorId,
          email: ctx.from.username,
          name: ctx.from.first_name,
          role: "visitor",
        },
      };

      if (ctx.message) {
        // todo: save message to database
        // if (mode !== ModeEnum.preview) {
        //   this.eventEmitter.emit('create.new.chat', {
        //     message: ele.value,
        //     type: ele.type,
        //     sender: botId,
        //     conversationId: conversationId,
        //   });
        // }
        const data = {
          message: "",

          type: "text",
          language: ctx.message.from?.language_code || "en",
        };
        if ("text" in ctx.message) {
          data.message = ctx.message.text;
        }
        if ("photo" in ctx.message) {
          const fileId =
            ctx.message.photo[ctx.message.photo.length - 1].file_id;
          const file = await ctx.telegram.getFile(fileId);

          // todo : save media to local drive

          // save file to local

          //data.type = 'image';
        }

        const { handledByAgent, assignedAgentId } =
          this.socketStateService.getUserData(ctx.visitorId);

        if (handledByAgent && assignedAgentId) {
          this.messageHandlerService.sendMessageToAgent(
            assignedAgentId,
            {
              type: data.type,
              value: data.message,
              from: ctx.visitorId,
            },
            this.socketStateService.getUserData(ctx.visitorId)
          );
        } else
          await this.messageHandlerService.handleMessage(
            data.message,
            user,
            data.type,
            data.language,
            ctx
          );
        await next();
      }
      if (ctx.callbackQuery) {
        if ("data" in ctx.callbackQuery) {
          await this.messageHandlerService.handleMessage(
            ctx.callbackQuery.data,
            user,
            "text",
            "en",
            ctx
          );
        }
      }
    } catch (error) {
      console.log(error);
    }
  }
}
