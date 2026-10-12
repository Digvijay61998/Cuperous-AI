import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import {
  AGENT_ONLINE,
  CONVERSATION_ENDED,
  INBOX_THREAD_ACKNOWLEDGED,
} from "./constants";
import { AlertResolutionEnum } from "./enums/handover-alert.enum";
import { HandoverAlertService } from "./handover-alert.service";

/** Decoupled lifecycle hooks, so emitters never import this module. */
@Injectable()
export class HandoverAlertListener {
  constructor(private readonly handoverAlertService: HandoverAlertService) {}

  @OnEvent(CONVERSATION_ENDED, { async: true })
  async onConversationEnded(payload: { conversationId: string }) {
    await this.handoverAlertService.acknowledgeByConversation(
      payload?.conversationId,
      AlertResolutionEnum.ENDED,
    );
  }

  @OnEvent(INBOX_THREAD_ACKNOWLEDGED, { async: true })
  async onThreadAcknowledged(payload: {
    threadId: string;
    userId: string;
    resolution: "opened" | "taken_over";
  }) {
    if (!payload?.threadId || !payload?.userId) return;
    await this.handoverAlertService.acknowledgeByThread(
      String(payload.threadId),
      String(payload.userId),
      payload.resolution === "taken_over"
        ? AlertResolutionEnum.TAKEN_OVER
        : AlertResolutionEnum.OPENED,
    );
  }

  @OnEvent("handover.thread.bound", { async: true })
  async onThreadBound(payload: { conversationId: string; threadId: string }) {
    if (payload?.conversationId && payload?.threadId) {
      await this.handoverAlertService.setThreadIfMissing(
        payload.conversationId,
        payload.threadId,
      );
    }
  }

  @OnEvent(AGENT_ONLINE, { async: true })
  async onAgentOnline(payload: { agentId: string }) {
    if (payload?.agentId) {
      await this.handoverAlertService.replayForAgentOnline(payload.agentId);
    }
  }
}
