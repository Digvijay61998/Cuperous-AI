import { Global, Module, Provider } from "@nestjs/common";
import { Connection } from "mongoose";
import { DATABASE_PROVIDER } from "src/constants";
import { CRM_OUTBOX_PROVIDER } from "./constants";
import { CrmOutboxService } from "./crm-outbox.service";
import {
  CrmOutbox,
  CrmOutboxDocument,
  CrmOutboxSchema,
} from "./entities/crm-outbox.entity";

const providers: Provider[] = [
  {
    provide: CRM_OUTBOX_PROVIDER,
    useFactory: (connection: Connection) =>
      connection.model<CrmOutboxDocument>(CrmOutbox.name, CrmOutboxSchema),
    inject: [DATABASE_PROVIDER],
  },
];

/** Durable retry queue for CRM writes (@Global: any feature may enqueue). */
@Global()
@Module({
  providers: [CrmOutboxService, ...providers],
  exports: [CrmOutboxService],
})
export class CrmOutboxModule {}
