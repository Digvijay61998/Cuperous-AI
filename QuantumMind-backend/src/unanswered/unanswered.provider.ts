import { Provider } from '@nestjs/common';
import { Connection } from 'mongoose';
import {
  UnansweredSchema,
  UnansweredDocument,
  Unanswered,
} from './entities/unanswered.entity';
import { DATABASE_PROVIDER } from 'src/constants';
import {
  UNANSWERED_PROVIDER_MODEL,
  UNANSWERED_QUESTION_MODEL,
} from './constants';
import {
  UnansweredQuestionSchema,
  UnansweredQuestion,
  UnansweredQuestionDocument,
} from './entities/unanswered-question.entity';

export const UnansweredProvider: Provider[] = [
  {
    provide: UNANSWERED_PROVIDER_MODEL,
    useFactory: (connection: Connection) =>
      connection.model<UnansweredDocument>(Unanswered.name, UnansweredSchema),
    inject: [DATABASE_PROVIDER],
  },
  {
    provide: UNANSWERED_QUESTION_MODEL,
    useFactory: (connection: Connection) =>
      connection.model<UnansweredQuestionDocument>(
        UnansweredQuestion.name,
        UnansweredQuestionSchema,
      ),
    inject: [DATABASE_PROVIDER],
  },
];
