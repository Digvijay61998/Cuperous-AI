import { Global, Module } from "@nestjs/common";
import { AiModule } from "src/ai/ai.module";
import { ServiceRequestEventsService } from "./service-request-events.service";
import { ServiceRequestStagesService } from "./service-request-stages.service";
import { ServiceRequestSummaryService } from "./service-request-summary.service";
import { ServiceRequestTranscriptService } from "./service-request-transcript.service";
import { ServiceRequestWrapUpService } from "./service-request-wrap-up.service";
import { ServiceRequestsController, ServiceRequestStagesController } from "./service-requests.controller";
import { ServiceRequestsService } from "./service-requests.service";

/**
 * Service desk (crm-plugins-service-desk Phase 3). @Global so the tickets
 * facade, the incident and CRM bridge code, and the session lifecycle can
 * inject it without import cycles.
 */
@Global()
@Module({
  imports: [AiModule],
  controllers: [ServiceRequestsController, ServiceRequestStagesController],
  providers: [
    ServiceRequestsService,
    ServiceRequestStagesService,
    ServiceRequestTranscriptService,
    ServiceRequestSummaryService,
    ServiceRequestEventsService,
    ServiceRequestWrapUpService,
  ],
  exports: [ServiceRequestsService, ServiceRequestStagesService, ServiceRequestTranscriptService],
})
export class ServiceRequestsModule {}
