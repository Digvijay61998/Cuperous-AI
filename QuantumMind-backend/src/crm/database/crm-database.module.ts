import { Global, Module } from "@nestjs/common";
import { CrmPrismaService } from "./crm-prisma.service";

/**
 * Provides the CRM's Postgres access (via Prisma) to the rest of the CRM
 * feature modules. Global so any CRM service can inject {@link CrmPrismaService}
 * without re-importing. This is the CRM's equivalent of the Mongo
 * DatabaseModule, kept entirely separate from it.
 */
@Global()
@Module({
  providers: [CrmPrismaService],
  exports: [CrmPrismaService],
})
export class CrmDatabaseModule {}
