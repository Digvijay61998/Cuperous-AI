import { Provider } from "@nestjs/common";
import { Connection } from "mongoose";
import { DATABASE_PROVIDER } from "src/constants";
import { HANDOVER_ALERT_PROVIDER } from "./constants";
import {
  HandoverAlert,
  HandoverAlertDocument,
  HandoverAlertSchema,
} from "./entities/handover-alert.entity";

export const handoverAlertProviders: Provider[] = [
  {
    provide: HANDOVER_ALERT_PROVIDER,
    useFactory: (connection: Connection) =>
      connection.model<HandoverAlertDocument>(
        HandoverAlert.name,
        HandoverAlertSchema,
      ),
    inject: [DATABASE_PROVIDER],
  },
];
