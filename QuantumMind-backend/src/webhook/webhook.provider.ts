import { Connection } from 'mongoose';
import { DATABASE_PROVIDER } from 'src/constants';
import { WEBHOOK_PROVIDER, WEBHOOK_ACTIVITIES_PROVIDER } from './constant';
import { Webhook, WebhookSchema } from './entities/webhook.entity';
import {
  WebHookActivities,
  WebHookActivitiesSchema,
} from './entities/webhook-activities';

export const webhookProviders = [
  {
    provide: WEBHOOK_PROVIDER,
    useFactory: (connection: Connection) =>
      connection.model(Webhook.name, WebhookSchema),
    inject: [DATABASE_PROVIDER],
  },
  {
    provide: WEBHOOK_ACTIVITIES_PROVIDER,
    useFactory: (connection: Connection) =>
      connection.model(WebHookActivities.name, WebHookActivitiesSchema),
    inject: [DATABASE_PROVIDER],
  },
];
