import { TICKET_PROVIDER, TICKET_DETAILS_PROVIDER } from './constant';
import { Connection } from 'mongoose';
import { TicketSchema, Ticket } from './entities/ticket.entity';

import { DATABASE_PROVIDER } from 'src/constants';
import {
  TicketActivities,
  TicketActivitiesSchema,
} from './entities/ticket-activities.entity';

export const TicketProviders = [
  {
    provide: TICKET_PROVIDER,
    useFactory: (connection: Connection) =>
      connection.model(Ticket.name, TicketSchema),
    inject: [DATABASE_PROVIDER],
  },
  {
    provide: TICKET_DETAILS_PROVIDER,
    useFactory: (connection: Connection) =>
      connection.model(TicketActivities.name, TicketActivitiesSchema),
    inject: [DATABASE_PROVIDER],
  },
];
