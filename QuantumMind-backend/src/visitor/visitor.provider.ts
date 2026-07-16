import { VISITOR_PROVIDER, VISITOR_DETAILS_PROVIDER } from './constant';
import { Connection } from 'mongoose';
import { VisitorSchema, Visitor } from './entities/visitor.entity';
import {
  VisitorDetailsSchema,
  VisitorDetails,
} from './entities/visitor-details.entity';
import { DATABASE_PROVIDER } from 'src/constants';

export const VisitorProviders = [
  {
    provide: VISITOR_PROVIDER,
    useFactory: (connection: Connection) =>
      connection.model(Visitor.name, VisitorSchema),
    inject: [DATABASE_PROVIDER],
  },
  {
    provide: VISITOR_DETAILS_PROVIDER,
    useFactory: (connection: Connection) =>
      connection.model(VisitorDetails.name, VisitorDetailsSchema),
    inject: [DATABASE_PROVIDER],
  },
];
