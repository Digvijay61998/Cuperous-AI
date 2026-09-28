import { Module } from "@nestjs/common";
import { CrmDatabaseModule } from "./database/crm-database.module";
import { ContactsModule } from "./contacts/contacts.module";
import { CompaniesModule } from "./companies/companies.module";
import { DealsModule } from "./deals/deals.module";
import { ActivitiesModule } from "./activities/activities.module";
import { StatsModule } from "./stats/stats.module";
import { FieldsModule } from "./fields/fields.module";
import { SavedViewsModule } from "./saved-views/saved-views.module";
import { IntelligenceModule } from "./intelligence/intelligence.module";

/**
 * Aggregates the CRM feature modules. Kept as one import in AppModule so the CRM
 * surface grows here rather than in the root module. CrmDatabaseModule is global
 * and provides the Postgres access every CRM service uses.
 */
@Module({
  imports: [
    CrmDatabaseModule,
    ContactsModule,
    CompaniesModule,
    DealsModule,
    ActivitiesModule,
    StatsModule,
    FieldsModule,
    SavedViewsModule,
    IntelligenceModule,
  ],
})
export class CrmModule {}
