import { UseInterceptors } from "@nestjs/common";
import {
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Observable, of } from "rxjs";
import { MessageHandlerService } from "src/message-handler/message-handler.service";
import { RedisPropagatorInterceptor } from "src/redis-propagate/redis-propagate.interceptors";
import { SocketStateService } from "src/socket/socket-state.service";
import { AuthenticatedSocket } from "src/socket/socket.adaptor";
import { Server } from "socket.io";
import { ConversationService } from "src/conversation/conversation.service";
import { ModeEnum } from "src/widget/enums/mode.enum";
import { MessageResponseDto } from "src/message-handler/dto/message-response.dto";
import { generateId } from "src/util";
import { FeedbackForEnum } from "src/feedback/enums/feedback-for.enum";
import { FeedbackService } from "src/feedback/feedback.service";
import { JarCubeService } from "./jarcube.service";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { ORG_ROLES } from "src/common/enums/role.enum";
import { AgentService } from "src/agent/agent.service";
import { CONVERSATION_ENDED_EVENT, ENDED_NOTICE } from "src/message-handler/closure";

/** At most one typing signal per agent and visitor per this window (R8.6). */
export const AGENT_TYPING_THROTTLE_MS = 3000;

@UseInterceptors(RedisPropagatorInterceptor)
@WebSocketGateway({
  cors: {
    origin: "*",
  },
  path: "/socket.io/jarcube",
  // transports: ['websocket'],
})
export class JarCubeGateway implements OnGatewayConnection {
  constructor(
    private readonly messageHandlerService: MessageHandlerService,
    private readonly socketStateService: SocketStateService,
    private readonly conversationService: ConversationService,
    private readonly feedbackService: FeedbackService,
    private readonly jarcubeService: JarCubeService,
    private readonly eventEmmitter: EventEmitter2,
    private readonly agentService: AgentService
  ) {}

  @WebSocketServer() server: Server;

  @SubscribeMessage("events")
  async handleEvents(
    client: AuthenticatedSocket,
    data: any
  ): Promise<Observable<any>> {
    const { userId, role } = client.auth;

    console.log(
      `\n>>> [GATEWAY] events received | userId=${userId} role=${role} event=${data?.event} type=${data?.data?.type} message=${JSON.stringify(data?.data?.message).slice(0, 120)}`
    );

    const userData = this.socketStateService.getUserData(userId);
    if (!userData) {
      console.log(`>>> [GATEWAY] NO userData for ${userId} — returning session expired`);
      // Socket state was evicted (conversation ended, disconnect race, etc.)
      // — nothing to do; the client will reconnect and re-initialize.
      return of({ event: "error", data: { message: "Session expired" } });
    }

    const { handledByAgent, assignedAgentId, platform } = userData;

    // crm-incident-handover R14.6: the conversation is closed. Nothing more is
    // processed or stored; the widget is (re)told it is in the Ended_State.
    if (role === "visitor" && userData.conversationEnded) {
      return of({
        event: CONVERSATION_ENDED_EVENT,
        data: { conversationId: userData.conversationId, notice: ENDED_NOTICE },
      });
    }

    if (data.event === "chat-message-bot") {
      if (handledByAgent && assignedAgentId && role === "visitor") {
        this.messageHandlerService.sendMessageToAgent(
          assignedAgentId,
          {
            type: data.data?.type || "text",
            value: data.data.message,
            from: userId,
          },
          this.socketStateService.getUserData(userId)
        );
      } else {
        this.messageHandlerService.handleMessage(
          data.data.message,
          client,
          data.data.type,
          data.data.language
        );
      }
    } else if (data.event === "chat-message-from-agent") {
      // Only org users may speak "as the agent", and only to a visitor whose
      // live conversation belongs to their organization.
      if (!(await this.canControlVisitor(client, data?.data?.to))) {
        return of({ event: "error", data: { message: "Not allowed" } });
      }
      // Owner-only replies (crm-incident-handover R7.2): a visitor handled by
      // another agent gets nothing from this one.
      const target = this.socketStateService.getUserData(data.data.to);
      if (
        target?.handledByAgent &&
        target.assignedAgentId &&
        String(target.assignedAgentId) !== String(userId)
      ) {
        // Named rejection the legacy agent view can show (R8.9). The owner
        // name is a display name only; ids never leave the org (checked above).
        const owner: any = await this.agentService
          .findOne(String(target.assignedAgentId))
          .catch(() => null);
        const ownerName = (owner?.name || "").trim() || owner?.email || "Another agent";
        return of({
          event: "chat-message-rejected",
          data: {
            message: `${ownerName} is handling this chat`,
            reason: "not_thread_owner",
            ownerName,
            visitorId: data.data.to,
            text: data.data.message,
          },
        });
      }
      this.messageHandlerService.emitEventToUser(
        data.data.to,
        "chat-message-bot",
        {
          message: {
            type: data.data?.type || "text",
            value: data.data.message,
            senderId: userId,
            senderRole: "agent",
            time: new Date().toISOString(),
            id: generateId("message", 10),
          },
        }
        // NOTE: the sender's `platform` is deliberately NOT passed here.
        //
        // `platform` above is read from the AGENT's own socket state, but this
        // message is going to the VISITOR — so the transport must be the
        // visitor's, not the agent's. Passing the agent's value meant a reply to
        // a WhatsApp customer could be emitted on the wrong channel (or, for an
        // agent whose state carried no platform, only worked by accident).
        // Omitting it makes emitEventToUser resolve the platform from the
        // recipient's own state, which is correct for every channel.
      );
    }

    const sendResponse: MessageResponseDto = {
      type: data.data?.type || "text",
      value: data.data.message,
      senderId: userId,
      time: new Date().toISOString(),
      id: generateId("message", 10),
    };

    return of({
      event: "chat-message-me",
      data: {
        message: sendResponse,
      },
    });
  }

  @SubscribeMessage("submit-feedback")
  async submitFeedback(client: AuthenticatedSocket, data: any) {
    const { userId, role } = client.auth;
    const { rating, comment } = data?.data;

    const dataForFeedback = {
      rating,
      comment,

      visitor: null,
      conversation: null,
      bot: null,
      feedbackFor: FeedbackForEnum.BOT,
    };

    if (role === "visitor") {
      const { assignedAgentId, botId, conversationId } =
        this.socketStateService.getUserData(userId);
      dataForFeedback.visitor = userId;

      dataForFeedback.conversation = conversationId;
      dataForFeedback.bot = botId;

      if (assignedAgentId) {
        dataForFeedback.feedbackFor = FeedbackForEnum.AGENT;
        dataForFeedback["agent"] = assignedAgentId;
      }
    }

    await this.feedbackService.create(dataForFeedback);
  }

  /**
   * Agent-side control events must come from an org user, and the target
   * conversation must belong to one of that user's org bots. Visitors and
   * cross-tenant ids are ignored silently (no existence oracle).
   */
  private async canControlConversation(
    client: AuthenticatedSocket,
    conversationId?: string
  ): Promise<boolean> {
    const auth: any = client?.auth;
    if (!auth || !(ORG_ROLES as string[]).includes(auth.role)) return false;
    if (!conversationId) return false;
    try {
      await this.conversationService.getConversationById(conversationId, {
        _id: auth._id ?? auth.userId,
        role: auth.role,
        organizationId: auth.organizationId ?? null,
      });
      return true;
    } catch {
      return false;
    }
  }

  /** Same check, resolving the conversation from the visitor's live state. */
  private async canControlVisitor(
    client: AuthenticatedSocket,
    visitorId?: string
  ): Promise<boolean> {
    if (!visitorId) return false;
    const state = this.socketStateService.getUserData(visitorId);
    return this.canControlConversation(client, state?.conversationId);
  }

  /** Last typing signal per agent+visitor, for the 3 s throttle (R8.6). */
  private readonly typingAt = new Map<string, number>();

  /**
   * The owner is typing (crm-incident-handover R8.6–R8.8). Throttled to one
   * signal per 3 s per agent and visitor; only the owner's signal counts.
   * Fans out to the other dashboard viewers and, when the bot's
   * `typingIndicator` is on, to the visitor's widget. Clients clear the
   * indicator 5 s after the last signal or on the next message.
   */
  @SubscribeMessage("agent-typing")
  async handleAgentTyping(client: AuthenticatedSocket, data: any) {
    const auth: any = client?.auth;
    const agentId = String(auth?._id ?? auth?.userId ?? "");
    const visitorId = data?.data?.visitorId ? String(data.data.visitorId) : "";
    if (!agentId || !visitorId) return;
    if (!(await this.canControlVisitor(client, visitorId))) return;
    const s = this.socketStateService.getUserData(visitorId);
    if (!s?.handledByAgent || String(s.assignedAgentId) !== agentId) return;

    const key = `${agentId}:${visitorId}`;
    const now = Date.now();
    if (now - (this.typingAt.get(key) ?? 0) < AGENT_TYPING_THROTTLE_MS) return;
    this.typingAt.set(key, now);
    if (this.typingAt.size > 5000) {
      for (const [k, t] of this.typingAt) if (now - t > 60_000) this.typingAt.delete(k);
    }

    this.eventEmmitter.emit("inbox.agent.typing", {
      visitorId,
      conversationId: s.conversationId ? String(s.conversationId) : undefined,
      threadId: data?.data?.threadId ? String(data.data.threadId) : undefined,
      agentId,
      name: auth?.name || auth?.email || "Agent",
    });
    if ((s.botSettings as any)?.typingIndicator) {
      this.messageHandlerService.emitEventToUser(visitorId, "typing", { typing: true, agentId });
    }
  }

  @SubscribeMessage("end-conversation")
  async handleEndConversation(client: AuthenticatedSocket, data: any) {
    const conversationId = data?.data?.conversationId;
    if (!(await this.canControlConversation(client, conversationId))) return;
    return await this.jarcubeService.handleEndConversationByAgent(
      conversationId,
      data.data.visitorId
    );
  }

  @SubscribeMessage("report-conversation")
  async handleReportConversation(client: AuthenticatedSocket, data: any) {
    const conversationId = data?.data?.conversationId;
    if (!(await this.canControlConversation(client, conversationId))) return;
    return await this.jarcubeService.ReportConversation(
      conversationId,
      data.data.visitorId
    );
  }

  @SubscribeMessage("publish")
  async handlePublish(client: AuthenticatedSocket, data: any) {
    if (!(await this.canControlVisitor(client, data?.data?.visitorId))) return;
    return await this.jarcubeService.PublishOfferOrAdvertisement(
      data.data.visitorId,
      data.data
    );
  }

  @SubscribeMessage("send-transcript")
  async handleSendTranscript(client: AuthenticatedSocket, data: any) {
    if (!(await this.canControlVisitor(client, data?.data?.visitorId))) return;
    return await this.jarcubeService.sendTranscriptToVisitor(data.data);
  }

  async handleConnection(client: AuthenticatedSocket, ...args: any[]) {
    const { role, userId } = client.auth as any;
    if (role !== "visitor") return;
    // crm-incident-handover R9.3, R14.7: a resumed conversation, or one that
    // already has messages, carries on where it was. No automatic "start"
    // (no second welcome, no flow restart). The flag is consumed so a later
    // fresh connection for a new conversation starts normally.
    const s = this.socketStateService.getUserData(userId);
    // R14.7: reconnecting to a closed conversation shows the Ended_State
    // again and never sends "start".
    if (s?.conversationEnded) {
      client.emit(CONVERSATION_ENDED_EVENT, { conversationId: s.conversationId, notice: ENDED_NOTICE });
      return;
    }
    // A plain reconnect (network blip, second tab) of a conversation that is
    // already past its start node also must not restart it.
    const midFlow = !!s?.currentNode && !!s?.startNode && s.currentNode.id !== s.startNode.id;
    if (s?.resumed || s?.hasHistory || midFlow || s?.handledByAgent) {
      this.socketStateService.updateUserData(userId, { resumed: false, hasHistory: false });
      return;
    }
    return await this.messageHandlerService.handleMessage(
      "start",
      client,
      "text",
      "en"
    );
  }
}
