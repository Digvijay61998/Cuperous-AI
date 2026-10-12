import { Global, Module } from "@nestjs/common";
import { HandoverAlertController } from "./handover-alert.controller";
import { HandoverAlertListener } from "./handover-alert.listener";
import { handoverAlertProviders } from "./handover-alert.provider";
import { HandoverAlertService } from "./handover-alert.service";

/**
 * Handover alerts: the single source of the dashboard's agent alert sound.
 * @Global so MessageHandler / Inbox can inject the service without import
 * cycles (AgentModule, InboxModule, ChannelThreadModule are global too).
 */
@Global()
@Module({
  controllers: [HandoverAlertController],
  providers: [HandoverAlertService, HandoverAlertListener, ...handoverAlertProviders],
  exports: [HandoverAlertService],
})
export class HandoverAlertModule {}
