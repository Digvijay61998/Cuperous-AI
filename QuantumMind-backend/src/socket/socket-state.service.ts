import { Injectable } from "@nestjs/common";
import { Socket } from "socket.io";
import { BotFlowNode, BotSetting } from "src/bots/entities";
import { BotNodeStateEnum } from "src/message-handler/enums/bot-node-state.enum";
import { ConversationService } from "src/conversation/conversation.service";
import { AgentService } from "src/agent/agent.service";
import { VisitorService } from "src/visitor/visitor.service";
import { ModeEnum } from "src/widget/enums/mode.enum";
import { AuthenticatedSocket } from "./socket.adaptor";
import { VisitorStatusEnum } from "src/visitor/enums/visitor-status.enum";
import { AgentStatusEnum } from "src/agent/enums/agent-status.enum";
import { ConversationStatusEnum } from "src/conversation/enums/conversation-status.enum";
import { OnEvent } from "@nestjs/event-emitter";

export interface SocketConversation {
  _id: string;
  visitor: {
    _id: string;
    name: string;
  };
  lastMessage?: any;
}

export interface SocketState {
  attributes?: Record<string, unknown>;
  currentNode?: BotFlowNode;
  socket?: Socket[] | any[];
  role?: string;
  botId?: string;
  defaultFallback?: BotFlowNode;
  adminId?: string;
  BotNodeState?: Record<string, unknown>;
  startNode?: BotFlowNode;
  conversationId?: string;
  questionNodeState?: Record<string, unknown>;
  botSettings?: BotSetting;
  mode?: ModeEnum;
  handledByAgent?: boolean;
  assignedAgentId?: string;
  platform?: string;
  botName?: string;
  metadata?: Record<string, unknown>;
  ctx?: any;
}

@Injectable()
export class SocketStateService {
  constructor(
    private conversationService: ConversationService,
    private readonly agentService: AgentService,
    private readonly visitorService: VisitorService
  ) {}
  private socketState = new Map<string, SocketState>();

  public add(userId: string, socket: AuthenticatedSocket): boolean {
    const existingSockets = this.socketState.get(userId)?.socket || [];

    if (!existingSockets || !existingSockets.length) {
      const role = socket.auth.role;

      if (
        role === "visitor" &&
        this.socketState.get(userId)?.mode !== ModeEnum.preview
      )
        this.visitorService.updateStatus(userId, VisitorStatusEnum.ONLINE);
      else this.agentService.updateAgentStatus(userId, AgentStatusEnum.ONLINE);
    }

    const sockets = [...existingSockets, socket];

    this.socketState.set(userId, {
      ...this.socketState.get(userId),
      socket: sockets,
    });

    return true;
  }

  public remove(userId: string, socket: AuthenticatedSocket): boolean {
    const existingSockets = this.socketState.get(userId).socket || [];

    if (!existingSockets) {
      return true;
    }

    const sockets = existingSockets.filter((s) => s.id !== socket.id);

    if (!sockets.length) {
      const role = socket.auth.role;
      if (role === "visitor" && this.socketState.get(userId).handledByAgent) {
        const conversationId = this.socketState.get(userId).conversationId;
        this.visitorService.updateStatus(userId, VisitorStatusEnum.OFFLINE);
        this.conversationService.endConversation(
          conversationId,
          ConversationStatusEnum.EXPIRED
        );
      } else {
        this.agentService.updateAgentStatus(userId, AgentStatusEnum.OFFLINE);
      }

      this.socketState.delete(userId);
    } else {
      this.socketState.set(userId, {
        socket: sockets,
      });
    }

    return true;
  }

  public getSocket(userId: string): Socket[] {
    return this.socketState.get(userId)?.socket || [];
  }

  public getAllSockets(): Socket[] {
    const all = [];

    this.socketState.forEach((sockets) => all.push(sockets.socket));

    return all;
  }

  public getUserData(userId: string): SocketState {
    return this.socketState.get(userId);
  }

  public updateUserData(userId: string, data: SocketState) {
    const user = this.socketState.get(userId);

    this.socketState.set(userId, {
      ...this.socketState.get(userId),
      ...data,
    });

    if (data.attributes) {
      this.conversationService.addattributes(
        data.conversationId,
        data.attributes
      );
    }
  }

  public getNodeState(userId: string, nodeId: string) {
    return (
      this.socketState.get(userId)?.BotNodeState?.[nodeId] ||
      BotNodeStateEnum.NEW
    );
  }

  public setNodeState(userId: string, nodeId: string, state: BotNodeStateEnum) {
    this.socketState.set(userId, {
      ...this.socketState.get(userId),
      BotNodeState: {
        ...this.socketState.get(userId)?.BotNodeState,
        [nodeId]: state,
      },
    });
  }

  public setQuestionNodeState(userId: string, nodeId: string, state: any) {
    this.socketState.set(userId, {
      ...this.socketState.get(userId),
      questionNodeState: {
        ...this.socketState.get(userId)?.questionNodeState,
        [nodeId]: state,
      },
    });
  }

  public getQuestionNodeState(userId: string, nodeId: string): any {
    return this.socketState.get(userId)?.questionNodeState?.[nodeId];
  }

  @OnEvent("end.conversation", { async: true })
  onEndConversation(data: { userId: string }) {
    // remove all data related to this userId
    this.socketState.delete(data.userId);
  }
}
