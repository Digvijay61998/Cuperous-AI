import { Connection } from 'mongoose';
import { DATABASE_PROVIDER } from 'src/constants';
import {
  TEMPLATE_SESSION_PROVIDER,
  TEMPLATE_SUBMISSION_PROVIDER,
} from './constant';
import {
  TemplateSession,
  TemplateSessionSchema,
} from './entities/template-session.entity';
import {
  TemplateSubmission,
  TemplateSubmissionSchema,
} from './entities/template-submission.entity';

export const TemplateSessionProviders = [
  {
    provide: TEMPLATE_SESSION_PROVIDER,
    useFactory: (connection: Connection) =>
      connection.model(TemplateSession.name, TemplateSessionSchema),
    inject: [DATABASE_PROVIDER],
  },
  {
    provide: TEMPLATE_SUBMISSION_PROVIDER,
    useFactory: (connection: Connection) =>
      connection.model(TemplateSubmission.name, TemplateSubmissionSchema),
    inject: [DATABASE_PROVIDER],
  },
];
