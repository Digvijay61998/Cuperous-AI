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
    private readonly eventEmmitter: EventEmitter2
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
      this.messageHandlerService.emitEventToUser(
        data.data.to,
        "chat-message-bot",
        {
          message: {
            type: data.data?.type || "text",
            value: data.data.message,
            senderId: userId,
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

  @SubscribeMessage("end-conversation")
  async handleEndConversation(client: AuthenticatedSocket, data: any) {
    if (data.data.conversationId)
      return await this.jarcubeService.handleEndConversationByAgent(
        data.data.conversationId,
        data.data.visitorId
      );
  }

  @SubscribeMessage("report-conversation")
  async handleReportConversation(client: AuthenticatedSocket, data: any) {
    if (data.data.conversationId) {
      return await this.jarcubeService.ReportConversation(
        data.data.conversationId,
        data.data.visitorId
      );
    }
  }

  @SubscribeMessage("publish")
  async handlePublish(client: AuthenticatedSocket, data: any) {
    return await this.jarcubeService.PublishOfferOrAdvertisement(
      data.data.visitorId,
      data.data
    );
  }

  @SubscribeMessage("send-transcript")
  async handleSendTranscript(client: AuthenticatedSocket, data: any) {
    return await this.jarcubeService.sendTranscriptToVisitor(data.data);
  }

  async handleConnection(client: AuthenticatedSocket, ...args: any[]) {
    const { role } = client.auth;
    if (role === "visitor") {
      return await this.messageHandlerService.handleMessage(
        "start",
        client,
        "text",
        "en"
      );
    }
  }
}
