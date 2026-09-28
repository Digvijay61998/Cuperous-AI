import { Module } from "@nestjs/common";
import { AgentTaskService } from "./agent-task.service";
import { CrmDispatcherService } from "./crm-dispatcher.service";
import { FactsController } from "./facts.controller";
import { FactsService } from "./facts.service";

/**
 * The CRM intelligence layer (Phase 3+): evidence-scored facts, the durable
 * agent-task queue, and the always-on dispatcher. FactsService is the only write
 * path to a contact's evidence-backed fields. AgentTaskService is exported so
 * feature services (e.g. contacts.enrich) can enqueue work.
 */
@Module({
  controllers: [FactsController],
  providers: [FactsService, AgentTaskService, CrmDispatcherService],
  exports: [FactsService, AgentTaskService, CrmDispatcherService],
})
export class IntelligenceModule {}
