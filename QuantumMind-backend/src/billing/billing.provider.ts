import { Connection } from 'mongoose';
import {
  DATABASE_PROVIDER,
  PLAN_PROVIDER,
  SUBSCRIPTION_PROVIDER,
} from 'src/constants';
import { Plan, PlanSchema } from './entities/plan.entity';
import {
  Subscription,
  SubscriptionSchema,
} from './entities/subscription.entity';

export const BillingProviders = [
  {
    provide: PLAN_PROVIDER,
    useFactory: (connection: Connection) =>
      connection.model(Plan.name, PlanSchema),
    inject: [DATABASE_PROVIDER],
  },
  {
    provide: SUBSCRIPTION_PROVIDER,
    useFactory: (connection: Connection) =>
      connection.model(Subscription.name, SubscriptionSchema),
    inject: [DATABASE_PROVIDER],
  },
];
