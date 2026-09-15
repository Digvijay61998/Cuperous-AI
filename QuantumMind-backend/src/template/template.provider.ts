import { Connection } from 'mongoose';
import { DATABASE_PROVIDER } from 'src/constants';
import {
  TEMPLATE_ACTION_SUBMISSION_PROVIDER,
  TEMPLATE_INSTANCE_PROVIDER,
  TEMPLATE_PROVIDER,
} from './constant';
import {
  TemplateActionSubmission,
  TemplateActionSubmissionSchema,
} from './entities/template-action-submission.entity';
import {
  TemplateInstance,
  TemplateInstanceSchema,
} from './entities/template-instance.entity';
import { Template, TemplateSchema } from './entities/template.entity';

export const TemplateProviders = [
  {
    provide: TEMPLATE_PROVIDER,
    useFactory: (connection: Connection) =>
      connection.model(Template.name, TemplateSchema),
    inject: [DATABASE_PROVIDER],
  },
  {
    provide: TEMPLATE_ACTION_SUBMISSION_PROVIDER,
    useFactory: (connection: Connection) =>
      connection.model(
        TemplateActionSubmission.name,
        TemplateActionSubmissionSchema,
      ),
    inject: [DATABASE_PROVIDER],
  },
  {
    provide: TEMPLATE_INSTANCE_PROVIDER,
    useFactory: (connection: Connection) =>
      connection.model(TemplateInstance.name, TemplateInstanceSchema),
    inject: [DATABASE_PROVIDER],
  },
];
