import { FEEDBACK_PROVIDER } from './constants';
import { Connection } from 'mongoose';

import {
  FeedbackDocument,
  Feedback,
  FeedbackSchema,
} from './entities/feedback.entity';
import { DATABASE_PROVIDER } from 'src/constants';
import { Provider } from '@nestjs/common';

export const feedbackProviders: Provider[] = [
  {
    provide: FEEDBACK_PROVIDER,
    useFactory: (connection: Connection) =>
      connection.model<FeedbackDocument>(Feedback.name, FeedbackSchema),
    inject: [DATABASE_PROVIDER],
  },
];
