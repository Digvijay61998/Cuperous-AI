import { Provider } from '@nestjs/common';
import { Connection } from 'mongoose';
import { DATABASE_PROVIDER } from 'src/constants';
import { WHATSAPP_WEB_SESSION_PROVIDER } from './constants';
import {
  WhatsappWebSession,
  WhatsappWebSessionDocument,
  WhatsappWebSessionSchema,
} from './entities/whatsapp-web-session.entity';

export const whatsappWebProviders: Provider[] = [
  {
    provide: WHATSAPP_WEB_SESSION_PROVIDER,
    useFactory: (connection: Connection) =>
      connection.model<WhatsappWebSessionDocument>(
        WhatsappWebSession.name,
        WhatsappWebSessionSchema,
      ),
    inject: [DATABASE_PROVIDER],
  },
];
