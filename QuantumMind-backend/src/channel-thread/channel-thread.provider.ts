import { Provider } from '@nestjs/common';
import { Connection } from 'mongoose';
import { DATABASE_PROVIDER } from 'src/constants';
import { CHANNEL_THREAD_PROVIDER } from './constant';
import {
  ChannelThread,
  ChannelThreadDocument,
  ChannelThreadSchema,
} from './entities/channel-thread.entity';

export const channelThreadProvider: Provider[] = [
  {
    provide: CHANNEL_THREAD_PROVIDER,
    useFactory: (connection: Connection) =>
      connection.model<ChannelThreadDocument>(
        ChannelThread.name,
        ChannelThreadSchema,
      ),
    inject: [DATABASE_PROVIDER],
  },
];
