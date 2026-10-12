import { Global, Module } from "@nestjs/common";
import { AiModule } from "src/ai/ai.module";
import { ContactCaptureService } from "./contact-capture.service";
import { ContactResolverService } from "./contact-resolver.service";
import { CrmBridgeListener } from "./crm-bridge.listener";
import { IdentityPromptService } from "./identity-prompt.service";
import { CrmBridgeController } from "./crm-bridge.controller";
import { CrmBridgeService } from "./crm-bridge.service";
import { CrmLinksService } from "./crm-links.service";

/**
 * Chat -> CRM bridge (crm-incident-handover design §2). @Global so
 * MessageHandler and IncidentService can inject it without import cycles.
 * Uses the global CrmDatabaseModule and CrmOutboxModule.
 */
@Global()
@Module({
  imports: [AiModule],
  controllers: [CrmBridgeController],
  providers: [
    ContactResolverService,
    CrmBridgeService,
    CrmLinksService,
    CrmBridgeListener,
    IdentityPromptService,
    ContactCaptureService,
  ],
  exports: [ContactResolverService, CrmBridgeService, IdentityPromptService, ContactCaptureService],
})
export class CrmBridgeModule {}
