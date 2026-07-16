import { Provider } from '@nestjs/common';
import { TELEGRAM_PROVIDER } from './constants';
import { DATABASE_PROVIDER } from 'src/constants';
import { Connection } from 'mongoose';
import {
  Telegram,
  TelegramSchema,
  TelegramDocument,
} from './entities/telegram.entity';

export const telegramProvider: Provider[] = [
  {
    provide: TELEGRAM_PROVIDER,
    inject: [DATABASE_PROVIDER],
    useFactory: (connection: Connection) =>
      connection.model<TelegramDocument>(Telegram.name, TelegramSchema),
  },
];
