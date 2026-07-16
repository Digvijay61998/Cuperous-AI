import { SegmentSchema, Segment } from './entities/segments.entity';
import { SEGMENT_PROVIDER } from './constant';
import { DATABASE_PROVIDER } from 'src/constants';
import { Connection } from 'mongoose';

export const SegmentProvider = [
  {
    provide: SEGMENT_PROVIDER,
    useFactory: (connection: Connection) =>
      connection.model(Segment.name, SegmentSchema),
    inject: [DATABASE_PROVIDER],
  },
];
