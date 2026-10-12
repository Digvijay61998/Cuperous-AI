import { Global, Module } from "@nestjs/common";
import { IncidentController } from "./incident.controller";
import { IncidentListener } from "./incident.listener";
import { IncidentMailService } from "./incident-mail.service";
import { incidentProviders } from "./incident.provider";
import { IncidentService } from "./incident.service";

/**
 * Incidents (crm-incident-handover, design §1). @Global so MessageHandler can
 * inject the service without import cycles, like HandoverAlertModule.
 */
@Global()
@Module({
  controllers: [IncidentController],
  providers: [IncidentService, IncidentMailService, IncidentListener, ...incidentProviders],
  exports: [IncidentService],
})
export class IncidentModule {}
