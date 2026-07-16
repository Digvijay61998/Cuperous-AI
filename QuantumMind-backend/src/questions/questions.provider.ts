import { Provider } from '@nestjs/common';

import { DATABASE_PROVIDER } from 'src/constants';
import { QUESTION_PROVIDER } from './constants';
import {
  Question,
  QuestionDocument,
  QuestionSchema,
} from './entities/question.entity';
import { Connection } from 'mongoose';

export const questionProviders: Provider[] = [
  {
    provide: QUESTION_PROVIDER,
    useFactory: (connection: Connection) =>
      connection.model<QuestionDocument>(Question.name, QuestionSchema),
    inject: [DATABASE_PROVIDER],
  },
];
