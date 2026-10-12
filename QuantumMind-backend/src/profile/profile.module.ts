import { Global, Module } from "@nestjs/common";
import { AiModule } from "src/ai/ai.module";
import { ProfileController } from "./profile.controller";
import { ProfileService } from "./profile.service";
import { SessionLifecycleService } from "./session-lifecycle.service";

/**
 * Visitor_Profile and the session lifecycle (crm-incident-handover Phase 7).
 * @Global so MessageHandler can read the profile context without a cycle.
 * Uses the global CrmDatabaseModule and the shared Mongo connection.
 */
@Global()
@Module({
  imports: [AiModule],
  controllers: [ProfileController],
  providers: [ProfileService, SessionLifecycleService],
  exports: [ProfileService],
})
export class ProfileModule {}
