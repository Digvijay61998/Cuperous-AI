import { Connection } from 'mongoose';
import { DATABASE_PROVIDER, ORGANIZATION_PROVIDER } from 'src/constants';
import {
  Organization,
  OrganizationSchema,
} from './entities/organization.entity';

export const OrganizationProviders = [
  {
    provide: ORGANIZATION_PROVIDER,
    useFactory: (connection: Connection) =>
      connection.model(Organization.name, OrganizationSchema),
    inject: [DATABASE_PROVIDER],
  },
];
