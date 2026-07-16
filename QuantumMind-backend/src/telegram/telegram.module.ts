import { Module } from '@nestjs/common';
import { TelegramController } from './telegram.controller';
import { TelegramService } from './telegram.service';

import { TelegramMessageService } from './telegram-message.service';
import { telegramProvider } from './telegram.provider';
import { SocialModule } from 'src/social/social.module';

@Module({
  providers: [TelegramService, TelegramMessageService, ...telegramProvider],
  controllers: [TelegramController],
  imports: [SocialModule],
})
export class TelegramModule {}
