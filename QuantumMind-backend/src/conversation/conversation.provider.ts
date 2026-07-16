import { Provider } from '@nestjs/common';
import { DATABASE_PROVIDER } from 'src/constants';
import { Chat, ChatSchema } from './entities/chat.entity';
import {
  Conversation,
  ConversationSchema,
} from './entities/conversation.entity';
import {
  ConversationActivities,
  ConversationActivitiesSchema,
} from './entities/conversation-activities.entity';
import { Connection } from 'mongoose';
import {
  CONVERSATION_PROVIDER,
  CHAT_PROVIDER,
  CONVERSATION_ACTIVITIES_PROVIDER,
} from './constant';

export const conversationProvider: Provider[] = [
  {
    provide: CONVERSATION_PROVIDER,
    useFactory: (connection: Connection) =>
      connection.model(Conversation.name, ConversationSchema),
    inject: [DATABASE_PROVIDER],
  },
  {
    provide: CHAT_PROVIDER,
    useFactory: (connection: Connection) =>
      connection.model(Chat.name, ChatSchema),
    inject: [DATABASE_PROVIDER],
  },
  {
    provide: CONVERSATION_ACTIVITIES_PROVIDER,
    useFactory: (connection: Connection) =>
      connection.model(
        ConversationActivities.name,
        ConversationActivitiesSchema,
      ),
    inject: [DATABASE_PROVIDER],
  },
];
