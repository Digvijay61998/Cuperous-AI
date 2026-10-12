import { Global, Module } from "@nestjs/common";
import { CrmPluginController } from "./crm-plugin.controller";
import { CrmPluginGuard } from "./crm-plugin.guard";
import { CrmPluginService } from "./crm-plugin.service";

/**
 * CRM plugins (crm-plugins-service-desk Phase 2). @Global so any CRM
 * controller can `@UseGuards(CrmPluginGuard)` without importing this module.
 */
@Global()
@Module({
  controllers: [CrmPluginController],
  providers: [CrmPluginService, CrmPluginGuard],
  exports: [CrmPluginService, CrmPluginGuard],
})
export class CrmPluginsModule {}
