import { Context, TelegramError } from 'telegraf';
import { ChatInitializerService } from 'src/chat-initializer/chat-initializer.service';
import { ConfigService } from '@nestjs/config';
import { PlatformEnum } from 'src/conversation/enums/platform.enum';

export type TelegramContext = Context & {
  visitorId: string;
};

export const TelegramUserMiddleware =
  (chatInitializerService: ChatInitializerService, jarcubeBotId: string) =>
  async (ctx: TelegramContext, next: () => Promise<any>) => {
    try {
      if (!ctx.from || !ctx.chat)
        new TelegramError({
          error_code: 400,
          description: 'Bad Request: chat not found',
        });
      const user = await ctx.telegram.getChatMember(ctx.chat.id, ctx.from.id);
      const name = [user.user.first_name, user.user.last_name]
        .filter(Boolean)
        .join(' ');
      // Keyed by the numeric user id: permanent per account, unlike the
      // optional, changeable @username. With `username` undefined every
      // handle-less user matched the same visitor (crm-plugins-service-desk R22).
      const telegramId = String(ctx.from.id);

      const visitor = await chatInitializerService.initializeChat(
        {
          name: name || user.user.username || 'Telegram user',
          username: telegramId,
          platform: PlatformEnum.TELEGRAM,
          bot: jarcubeBotId,
        },
        jarcubeBotId,
        {
          source: 'telegram',
          details: {
            name: name || user.user.username,
            channel: { kind: 'TELEGRAM', value: telegramId },
          },
        },
      );

      ctx.visitorId = visitor.visitorId;
      await next();
    } catch (error) {
      throw new TelegramError({
        error_code: error.error_code || 500,
        description: error.description || 'Internal Server Error',
      });
    }
  };
