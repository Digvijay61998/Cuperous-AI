import { DATABASE_PROVIDER } from 'src/constants';
import { Connection } from 'mongoose';
import { VIDEO_PROVIDER } from './constant';
import { Video, VideoSchema } from './entities/video.entity';
export const VideoProviders = [
  {
    provide: VIDEO_PROVIDER,
    useFactory: (connection: Connection) =>
      connection.model(Video.name, VideoSchema),
    inject: [DATABASE_PROVIDER],
  },
];
