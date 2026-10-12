import { Provider } from "@nestjs/common";
import { Connection } from "mongoose";
import { DATABASE_PROVIDER } from "src/constants";
import { INCIDENT_PROVIDER } from "./constants";
import { Incident, IncidentDocument, IncidentSchema } from "./entities/incident.entity";

export const incidentProviders: Provider[] = [
  {
    provide: INCIDENT_PROVIDER,
    useFactory: (connection: Connection) =>
      connection.model<IncidentDocument>(Incident.name, IncidentSchema),
    inject: [DATABASE_PROVIDER],
  },
];
