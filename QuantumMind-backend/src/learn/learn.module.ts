import { Module } from "@nestjs/common";
import { AiModule } from "src/ai/ai.module";
import { QuestionsModule } from "src/questions/questions.module";
import { LearnController } from "./learn.controller";
import { LearnService } from "./learn.service";

/**
 * Auto-learn from agent resolutions and the agent-share report
 * (crm-incident-handover Phase 8). IncidentService, CrmOutboxService,
 * CrmPrismaService and TenantScopeService come from global modules.
 */
@Module({
  imports: [AiModule, QuestionsModule],
  controllers: [LearnController],
  providers: [LearnService],
})
export class LearnModule {}
