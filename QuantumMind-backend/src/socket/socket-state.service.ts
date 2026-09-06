import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
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
  // Number of workflow nodes traversed for the current inbound message.
  // Reset per message; used to abort runaway loops. See MAX_NODE_HOPS.
  nodeHops?: number;
  // The current inbound message with its original casing, kept because
  // handleMessage lowercases the working copy for case-insensitive matching.
  // Attribute capture reads this so stored answers are not mangled.
  rawMessage?: string;
  // ---------------------------------------------------------------------------
  // Per-conversation turn context.
  //
  // These four used to live as fields on the MessageHandlerService SINGLETON
  // (this.user / this.language / this.chatId / this.delay). Because
  // handleMessage awaits (DB reads, an AI call with a 20s budget), a second
  // visitor's message would overwrite them mid-flight and the first flow would
  // resume reading the second visitor's values — crossing conversations and,
  // for `chatId`, masking the wrong chat row. Keyed per visitor here, they
  // cannot cross.
  // ---------------------------------------------------------------------------
  /** Display name of the visitor, used when handing a chat to an agent. */
  visitorName?: string;
  /** Language of the current turn, used for question-bank lookups. */
  language?: string;
  /** Id of the chat row created for the current inbound message (PII masking). */
  currentChatId?: string;
  /** Accumulated send-delay baseline for staggering this turn's bot messages. */
  messageDelay?: number;
  /**
   * Last time this entry was read or written, in epoch ms. Drives idle eviction
   * — see the sweep in SocketStateService.
   */
  lastAccessedAt?: number;
}

@Injectable()
export class SocketStateService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SocketStateService.name);

  constructor(
    private conversationService: ConversationService,
    private readonly agentService: AgentService,
    private readonly visitorService: VisitorService,
    private readonly configService: ConfigService
  ) {}
  private socketState = new Map<string, SocketState>();
  private sweepTimer?: ReturnType<typeof setInterval>;

  /**
   * Idle eviction.
   *
   * Every entry holds a bot-settings + node-graph snapshot, so this map is the
   * largest per-visitor allocation in the process. It previously had NO bound:
   * the only two removal paths are a socket `disconnect` and the
   * `end.conversation` event, and neither covers a social-platform visitor
   * (WhatsApp/Telegram/Facebook conversations have no socket, and only a
   * CLOSE_CHAT node emits `end.conversation`). A visitor who messaged once and
   * never finished the flow therefore leaked an entry permanently — an
   * unbounded growth path ending in an OOM that takes every live session with
   * it.
   *
   * Evicting an idle social-platform entry is safe: ChatInitializerService
   * rebuilds the state from the bot's start node on the next inbound message
   * (it already treats a missing entry as "new conversation"). The visitor
   * loses mid-flow progress, which is the same outcome a process restart
   * produces today. Entries that still hold a live socket are NEVER evicted
   * here — those are owned by the connect/disconnect path.
   */
  private get idleTtlMs(): number {
    return (
      this.configService.get<number>('socketState.idleTtlMs') ?? 2 * 60 * 60 * 1000
    );
  }

  private get maxEntries(): number {
    return this.configService.get<number>('socketState.maxEntries') ?? 20000;
  }

  private get sweepIntervalMs(): number {
    return this.configService.get<number>('socketState.sweepIntervalMs') ?? 5 * 60 * 1000;
  }

  onModuleInit(): void {
    this.sweepTimer = setInterval(() => {
      try {
        this.sweep();
      } catch (error) {
        this.logger.error(`Socket-state sweep failed: ${error?.message}`);
      }
    }, this.sweepIntervalMs);
    // Never hold the process open for a housekeeping timer.
    this.sweepTimer.unref?.();
  }

  onModuleDestroy(): void {
    if (this.sweepTimer) clearInterval(this.sweepTimer);
    this.sweepTimer = undefined;
  }

  /** True while this entry still has at least one connected socket. */
  private hasLiveSocket(state: SocketState): boolean {
    return !!state.socket && state.socket.length > 0;
  }

  /**
   * Drop entries idle beyond the TTL, then enforce the hard cap by evicting the
   * least-recently-used. The cap is the backstop: it bounds memory even if a
   * burst arrives faster than the TTL can retire it.
   */
  private sweep(now = Date.now()): number {
    const ttl = this.idleTtlMs;
    let evicted = 0;

    for (const [userId, state] of this.socketState) {
      if (this.hasLiveSocket(state)) continue;
      const last = state.lastAccessedAt ?? 0;
      if (now - last > ttl) {
        this.socketState.delete(userId);
        evicted++;
      }
    }

    const max = this.maxEntries;
    if (this.socketState.size > max) {
      const evictable = [...this.socketState.entries()]
        .filter(([, state]) => !this.hasLiveSocket(state))
        .sort((a, b) => (a[1].lastAccessedAt ?? 0) - (b[1].lastAccessedAt ?? 0));
      const overflow = this.socketState.size - max;
      for (let i = 0; i < Math.min(overflow, evictable.length); i++) {
        this.socketState.delete(evictable[i][0]);
        evicted++;
      }
    }

    if (evicted > 0) {
      this.logger.log(
        `Evicted ${evicted} idle conversation state entr${
          evicted === 1 ? 'y' : 'ies'
        }; ${this.socketState.size} remaining`
      );
    }
    return evicted;
  }

  /** Current number of tracked conversations — for health/metrics endpoints. */
  public size(): number {
    return this.socketState.size;
  }

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
      lastAccessedAt: Date.now(),
    });

    return true;
  }

  public remove(userId: string, socket: AuthenticatedSocket): boolean {
    const entry = this.socketState.get(userId);
    if (!entry) {
      // Already removed (race with end.conversation or duplicate disconnect).
      return true;
    }

    const existingSockets = entry.socket || [];

    if (!existingSockets.length) {
      return true;
    }

    const sockets = existingSockets.filter((s) => s.id !== socket.id);

    if (!sockets.length) {
      const role = socket.auth.role;
      if (role === "visitor" && entry.handledByAgent) {
        const conversationId = entry.conversationId;
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
        ...entry,
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
    const state = this.socketState.get(userId);
    // Touch on read so an actively-used conversation is never evicted mid-flow
    // (the sweep is LRU by this timestamp).
    if (state) state.lastAccessedAt = Date.now();
    return state;
  }

  public updateUserData(userId: string, data: SocketState) {
    this.socketState.set(userId, {
      ...this.socketState.get(userId),
      ...data,
      lastAccessedAt: Date.now(),
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
