import { DATABASE_PROVIDER } from 'src/constants';
import { TAG_PROVIDER } from './constant';
import { Tag, TagSchema } from './entities/tag.entity';
import { Connection } from 'mongoose';

export const TagProviders = [
  {
    provide: TAG_PROVIDER,
    useFactory: (connection: Connection) =>
      connection.model(Tag.name, TagSchema),
    inject: [DATABASE_PROVIDER],
  },
];
