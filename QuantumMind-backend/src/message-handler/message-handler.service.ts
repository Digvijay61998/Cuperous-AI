import { EntitlementService } from "src/billing/entitlement.service";
import { TenantScopeService } from "src/common/tenant/tenant-scope.service";
import { HttpService } from "@nestjs/axios";

import { Injectable, Logger, Optional } from "@nestjs/common";
import { HandoverAlertService } from "src/handover-alert/handover-alert.service";
import { IncidentService } from "src/incident/incident.service";
import { NO_PROBLEM_TEXT } from "src/incident/constants";
import { ProblemFlagEnum } from "src/incident/enums/incident.enum";
import { buildTicketDescription } from "src/incident/ticket-description";
import {
  DEFAULT_PROBLEM_ALIAS,
  DEFAULT_PROBLEM_QUESTION,
  evaluateProblemAnswer,
  GATE_ESCAPE_WORDS,
  isProblemQuestionExpired,
  PROBLEM_REASK_EXAMPLE,
} from "src/incident/problem-gate";
import { isFeatureOn } from "src/common/features";
import {
  ATTRIBUTE_CAPTURED,
  IDENTITY_CONFLICT,
  VISITOR_TEXT,
} from "src/crm-bridge/crm-bridge.listener";
import {
  aliasField,
  contactFieldOf,
  CONFIRM_UPDATE,
  CONFIRM_YES,
  conflictQuestion,
  confirmMessage,
  IDENTITY_CHOICES,
  IDENTITY_PROMPT_MAX_TURNS,
  IdentityPromptService,
  KnownField,
  parseIdentityChoice,
  PendingIdentity,
} from "src/crm-bridge/identity-prompt.service";
import { effectiveMapping } from "src/crm-bridge/identity";
import {
  CaptureSource,
  VISITOR_DETAILS_UPDATED,
  VisitorDetailsUpdated,
} from "src/crm-bridge/contact-capture.service";
import { Interval } from "@nestjs/schedule";
import { ProfileService } from "src/profile/profile.service";
import {
  CLOSURE_IDLE_DEFAULT_MIN,
  ClosureEndCause,
  closingMessageText,
  closureApplies,
  closureIdleMinutes,
  closurePromptMessage,
  CONVERSATION_ENDED_EVENT,
  DEFAULT_CLOSING_MESSAGE,
  ENDED_NOTICE,
  isClosureIdle,
  isClosureLabel,
  isMarkedTerminal,
  parseClosureReply,
  SOMETHING_ELSE_TEXT,
} from "./closure";


/**
 * Default handover text (R19.2, D2): no hours, queues or availability.
 * `{{ticketId}}` is replaced with the Service_Request ref.
 */
export const DEFAULT_HANDOVER_MESSAGE =
  "Thank you for reaching out. Your incident ticket {{ticketId}} has been created and our team will follow up with you on it. Please keep this number for future reference.";

/** Insert the ref; a template without the placeholder gets it appended. */
export function renderHandoverMessage(template: string, ticketRef: string): string {
  if (/\{\{\s*ticketId\s*\}\}/.test(template)) {
    return template.replace(/\{\{\s*ticketId\s*\}\}/g, ticketRef);
  }
  return `${template.trim()} Your reference is ${ticketRef}.`;
}

/** Emitted when an agent takes over a widget conversation (R19.4). */
export const AGENT_TOOK_OVER = "agent.took.over";
import { AGENT_ACCEPT_LIVE, LIVE_CHAT_CONNECTED } from "src/incident/constants";
/** What an agent's live accept of a waiting chat did. */
export type LiveAcceptResult = "connected" | "taken" | "offline";
/** Emitted when an agent releases a widget conversation to the bot (R10.2). */
export const AGENT_RELEASED = "agent.released";

/** Debounce for Conversation.flowPosition writes (design §7). */
const FLOW_POSITION_DEBOUNCE_MS = 2000;

/** Max wait for the Visitor_Profile before an AI call goes without it (R18.8). */
const VISITOR_PROFILE_TIMEOUT_MS = 500;

/** Max wait for CRM-known details before a QUESTIONS node just asks (R16). */
const KNOWN_DETAILS_TIMEOUT_MS = 1500;

/** Used when a TICKET node has no subject configured (D10: product-neutral). */
const DEFAULT_TICKET_SUBJECT = "Service request from chat";
import { AlertReasonEnum, AlertResolutionEnum } from "src/handover-alert/enums/handover-alert.enum";
import { matchesAgentIntent } from "src/handover-alert/agent-intent";
import { ConfigService } from "@nestjs/config";
import { EventEmitter2, OnEvent } from "@nestjs/event-emitter";

import {
  isCreditCard,
  isCurrency,
  isDate,
  isEmail,
  isIP,
  isMACAddress,
  isMobilePhone,
  isString,
  IsUrl,
} from "class-validator";
import { firstValueFrom } from "rxjs";
import { AgentService } from "src/agent/agent.service";
import { BotsService } from "src/bots/bots.service";
import { BotFlowNode } from "src/bots/entities";
import { NodeTypeEnum } from "src/bots/enums/node-type.enum";
import { ConversationService } from "src/conversation/conversation.service";
import { ChatTypeEnum } from "src/conversation/enums/chat-type.enum";
import { PlatformEnum } from "src/conversation/enums/platform.enum";
import { QuestionsService } from "src/questions/questions.service";
import { RedisPropagatorService } from "src/redis-propagate/redis-propagate.service";
import { SegmentsService } from "src/segments/segments.service";
import {
  SocketState,
  SocketStateService,
} from "src/socket/socket-state.service";
import { AuthenticatedSocket } from "src/socket/socket.adaptor";
import { TicketsService } from "src/tickets/tickets.service";
import { UnansweredService } from "src/unanswered/unanswered.service";
import { generateId } from "src/util";
import {
  banner,
  isDebugLogs,
  maskDeep,
  newRequestId,
  preview,
} from "src/util/ai-logger";
import { WebhookStatusEnum } from "src/webhook/enums/webhook-status.enum";
import { WebhookService } from "src/webhook/webhook.service";
import { ModeEnum } from "src/widget/enums/mode.enum";
import { MessagingProviderRegistry } from "src/messaging/messaging-provider.registry";
import { TemplateSessionService } from "src/template-session/template-session.service";
import { TemplateService } from "src/template/template.service";
import { Markup } from "telegraf";
import { MAX_NODE_HOPS, MESSAGE_HANDLER_QUEUE } from "./constants";
import { MessageResponseDto } from "./dto/message-response.dto";
import { BotNodeStateEnum } from "./enums/bot-node-state.enum";
import { UserInputValidationEnum } from "./enums/user-input-validation.enums";

/**
 * Accepted spellings for the yes/no validators. The old check was an exact
 * `["yes", "no"].includes(message)`, so "y", "yeah", "yep", "nope" and every
 * other natural reply was treated as invalid input.
 */
const YES_WORDS = new Set([
  "yes", "y", "yeah", "yeh", "yep", "yup", "ya", "sure", "ok", "okay",
  "correct", "right", "true", "affirmative", "please", "haan", "ha",
]);
const NO_WORDS = new Set([
  "no", "n", "nope", "nah", "never", "false", "negative", "dont", "don't",
  "nahi", "na",
]);

/** A phone number may only contain digits and the usual separators. */
const PHONE_SHAPE = /^\+?[\d\s().-]+$/;
/** E.164 allows 7..15 significant digits. */
const PHONE_MIN_DIGITS = 7;
const PHONE_MAX_DIGITS = 15;

const MONTH_NAME = /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i;
const DMY_DATE = /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/;
const YMD_DATE = /^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})$/;

/**
 * Relative strength of the different ways a USER_INPUT node can match, used to
 * pick a winner when a menu offers several branches. A typed/validated match is
 * always stronger than a keyword hit, which is stronger than a bare capture.
 */
const MATCH_SCORE_ENTITY = 1000;
const MATCH_SCORE_KEYWORD_BASE = 100;
const MATCH_SCORE_CAPTURE_ONLY = 1;

interface UserInputMatch {
  matched: boolean;
  /** Higher wins when several branches match the same message. */
  score: number;
  reason: string;
}

@Injectable()
export class MessageHandlerService {
  private readonly logger = new Logger(MessageHandlerService.name);

  // NOTE: this service is a singleton and every method below runs concurrently
  // for different visitors. Per-conversation values (the visitor, the turn's
  // language, the current chat row, the send-delay baseline, the channel ctx)
  // therefore must NOT be stored on `this` — they live in SocketStateService,
  // keyed by visitor id, or are passed as arguments. They used to be instance
  // fields, which meant a visitor's message arriving during another's `await`
  // overwrote them and the first flow resumed with the second's values: replies
  // addressed to the wrong WhatsApp number, and PII masking applied to the wrong
  // chat row. See SocketState's "per-conversation turn context" block.
  constructor(
    private readonly botsService: BotsService,
    private readonly socketStateService: SocketStateService,
    private readonly segmentsService: SegmentsService,
    private readonly webhookService: WebhookService,
    private readonly ticketsService: TicketsService,
    private readonly conversationService: ConversationService,
    private readonly redisPropagatorService: RedisPropagatorService,
    private readonly agentService: AgentService,
    private readonly unansweredService: UnansweredService,
    private readonly questionsService: QuestionsService,
    private readonly eventEmitter: EventEmitter2,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly messagingRegistry: MessagingProviderRegistry,
    private readonly templateSessionService: TemplateSessionService,
    private readonly templateService: TemplateService,
    private readonly tenantScope: TenantScopeService,
    private readonly entitlementService?: EntitlementService,
    // Optional so a missing provider (or an older test harness) degrades to
    // "no alert" rather than breaking the visitor flow.
    @Optional()
    private readonly handoverAlertService?: HandoverAlertService,
    // Optional for the same reason: no incident service means the TICKET node
    // behaves as a plain Service Request and the problem gate is inert.
    @Optional()
    private readonly incidentService?: IncidentService,
    // Optional: without it nothing is pre-filled and no identity question is asked.
    @Optional()
    private readonly identityPrompt?: IdentityPromptService,
    // Optional: without it AI answers carry no Visitor_Profile (R18.8).
    @Optional()
    private readonly profileService?: ProfileService
  ) {}

  // ------------------------------------- identity questions (R16, R17)

  /** The resolver found a conflict: ask once with three buttons (R17.2). */
  @OnEvent(IDENTITY_CONFLICT, { async: true })
  async onIdentityConflict(p: { userId: string; contactId: string; conflict: any }) {
    const s = this.socketStateService.getUserData(p.userId);
    if (!s || s.mode === ModeEnum.preview || s.pendingIdentity) return;
    const pending: PendingIdentity = {
      field: p.conflict.field,
      newValue: p.conflict.newValue,
      contactId: p.contactId,
      askedAt: Date.now(),
      turns: 0,
    };
    this.socketStateService.updateUserData(p.userId, { pendingIdentity: pending });
    await this.sendBotMessage(p.userId, [
      {
        type: ChatTypeEnum.BUTTONS,
        value: conflictQuestion(p.conflict),
        buttons: Object.values(IDENTITY_CHOICES).map((title) => ({
          type: "text",
          title,
          value: title,
        })),
      },
    ]);
  }

  /**
   * Answer to the identity question. Returns true when the message was the
   * answer (consumed). Any other message counts a turn; after 2 the new value
   * becomes a proposal and the question lapses (R17.5). Never blocks the flow.
   */
  private async consumeIdentityAnswer(userId: string, message: any): Promise<boolean> {
    const s = this.socketStateService.getUserData(userId);
    const pending = s?.pendingIdentity;
    if (!pending || !this.identityPrompt) return false;
    const choice = parseIdentityChoice(message);
    if (choice) {
      this.socketStateService.updateUserData(userId, { pendingIdentity: undefined });
      await this.identityPrompt.settle(String(s.botId), pending, choice);
      await this.sendBotMessage(userId, [{ type: "text", value: "Thanks, noted." }]);
      return true;
    }
    const turns = pending.turns + 1;
    if (turns >= IDENTITY_PROMPT_MAX_TURNS) {
      this.socketStateService.updateUserData(userId, { pendingIdentity: undefined });
      void this.identityPrompt.settle(String(s.botId), pending, "unanswered");
    } else {
      this.socketStateService.updateUserData(userId, { pendingIdentity: { ...pending, turns } });
    }
    return false;
  }

  /**
   * "Ask once" (R16.1, R16.2; crm-plugins-service-desk R23). Called before a
   * QUESTIONS node asks its first question. Always on: whatever the visitor
   * already told us (pre-chat form, an earlier answer, a returning visitor's
   * contact, a WhatsApp number) is not asked again.
   *
   * When any contact field of the node is known, the known ones are filled
   * and the visitor gets one confirm ("We'll follow up with you at …") with
   * Yes / Update details. Yes continues with the node's remaining questions
   * (or past the node when none are left). Returns true when the confirm was
   * sent and nothing more should run.
   */
  private async prefillKnownDetails(userId: string, node: BotFlowNode): Promise<boolean> {
    const s = this.socketStateService.getUserData(userId);
    if (!s?.conversationId || !this.identityPrompt) return false;
    const elements: any[] = node.payload?.elements || [];
    if (!elements.length || elements.some((e) => e?.secure)) return false;

    const mapping = s.botSettings?.contactMapping;
    const contactEls = elements
      .map((e) => ({ alias: e?.alias as string, field: contactFieldOf(e, mapping) }))
      .filter((x) => x.alias && x.field) as { alias: string; field: KnownField }[];
    if (!contactEls.length) return false;

    // Bounded: a slow CRM must not stall the visitor; on timeout we just ask.
    const known = await Promise.race([
      this.identityPrompt
        .known({
          botId: String(s.botId),
          conversationId: String(s.conversationId),
          visitorId: String(userId),
          attributes: s.attributes,
          botSettings: s.botSettings,
        })
        .catch(() => ({})),
      new Promise<Record<string, string>>((r) => setTimeout(() => r({}), KNOWN_DETAILS_TIMEOUT_MS)),
    ]) as Record<string, string | undefined>;
    const filled: Record<string, string> = {};
    for (const { alias, field } of contactEls) {
      const v = known[field];
      if (v && !s.attributes?.[alias]) filled[alias] = v;
    }
    const attrs = { ...(s.attributes || {}), ...filled };
    const knownEls = contactEls.filter(({ alias }) => attrs[alias]);
    if (!knownEls.length) return false;
    this.socketStateService.updateUserData(userId, { attributes: attrs });

    // Known values to show: what the node will use (attributes win).
    const shown: Record<string, string> = {};
    for (const { alias, field } of knownEls) if (!shown[field]) shown[field] = String(attrs[alias]);
    const fields = [...new Set(knownEls.map((x) => x.field))];
    this.socketStateService.updateUserData(userId, {
      pendingConfirm: {
        nodeId: node.id,
        fields,
        values: Object.fromEntries(knownEls.map(({ alias }) => [alias, String(attrs[alias])])),
        resumeAt: this.nextToAsk(userId, elements, 0),
      },
    });
    await this.sendBotMessage(userId, [
      {
        type: ChatTypeEnum.BUTTONS,
        value: confirmMessage(shown, fields),
        buttons: [CONFIRM_YES, CONFIRM_UPDATE].map((title) => ({ type: "text", title, value: title })),
      },
    ]);
    return true;
  }

  /**
   * Index of the next element to ask, from `from`, skipping contact questions
   * whose answer is already known (R16.1). `elements.length` when none left.
   */
  private nextToAsk(userId: string, elements: any[], from: number): number {
    const s = this.socketStateService.getUserData(userId);
    const attrs = s?.attributes || {};
    const mapping = s?.botSettings?.contactMapping;
    let i = from;
    while (i < elements.length && elements[i]?.alias && contactFieldOf(elements[i], mapping) && attrs[elements[i].alias]) i++;
    return i;
  }

  /** Continue a questionnaire at `index`, or leave it on SUCCESS when done. */
  private async resumeQuestions(userId: string, node: BotFlowNode, index: number) {
    const elements: any[] = node.payload?.elements || [];
    if (index < elements.length) {
      this.socketStateService.updateUserData(userId, { currentNode: node });
      this.socketStateService.setQuestionNodeState(userId, node.id, { currentQuestion: index, lifespan: 0 });
      await this.sendBotMessage(userId, [{ type: "text", value: elements[index].prompt }]);
      return true;
    }
    this.socketStateService.setQuestionNodeState(userId, node.id, undefined as any);
    const next = await Promise.all((node.next || []).map((id: string) => this.botsService.getBotNode(id).catch(() => null)));
    const success = next.find((n: any) => n?.nodeType === NodeTypeEnum.SUCCESS) ?? next.find(Boolean);
    if (!success) return false;
    await this.handleNode(success, "", userId);
    return true;
  }

  /**
   * Reply to the confirm message. "Yes" continues as if answered (R16.2).
   * "Update details" re-runs the node asking only the contact fields again
   * (R16.3). Anything else drops the confirm and falls through to the flow,
   * keeping the pre-filled values.
   */
  private async consumeConfirmAnswer(userId: string, message: any): Promise<boolean> {
    const s = this.socketStateService.getUserData(userId);
    const pc = s?.pendingConfirm;
    if (!pc) return false;
    this.socketStateService.updateUserData(userId, { pendingConfirm: undefined });
    const t = typeof message === "string" ? message.trim().toLowerCase() : "";
    const node = await this.botsService.getBotNode(pc.nodeId).catch(() => null);
    if (!node) return false;

    const resumeAt = typeof pc.resumeAt === "number" ? pc.resumeAt : (node.payload?.elements || []).length;
    if (t === CONFIRM_YES.toLowerCase() || t === "yes" || t === "y") {
      this.emitAttributeCaptured(userId, Object.keys(pc.values));
      await this.resumeQuestions(userId, node, resumeAt);
      return true;
    }
    if (t === CONFIRM_UPDATE.toLowerCase() || t === "update" || t === "no") {
      // Forget the pre-filled values for this node so its questions are asked.
      const attrs = { ...(s.attributes || {}) };
      for (const alias of Object.keys(pc.values)) delete attrs[alias];
      this.socketStateService.updateUserData(userId, {
        attributes: attrs,
        currentNode: node,
        skipPrefillFor: node.id,
      });
      this.socketStateService.setQuestionNodeState(userId, node.id, undefined as any);
      await this.handleNode(node, "", userId);
      return true;
    }
    // Any other reply: keep the details on file (implicit yes). New details
    // typed here ("my number is …") still reach the visitor record and CRM.
    this.emitAttributeCaptured(userId, Object.keys(pc.values));
    const raw = typeof message === "string" ? message.trim() : "";
    if (raw && s.mode !== ModeEnum.preview) {
      this.eventEmitter.emit(VISITOR_TEXT, { userId: String(userId), text: raw });
    }
    const elements: any[] = node.payload?.elements || [];
    if (resumeAt < elements.length) {
      // The node still has questions: ask the next one rather than reading
      // this reply as its answer (the visitor has not seen it yet).
      return this.resumeQuestions(userId, node, resumeAt);
    }
    // Nothing left to ask: move past the node, then let the new position
    // handle the message. Without this the node would re-run and repeat the
    // confirm on every message.
    if (!(await this.resumeQuestions(userId, node, resumeAt))) return false;
    const after = this.socketStateService.getUserData(userId)?.currentNode;
    if (after && t) await this.handleNode(after, t, userId);
    return true;
  }

  /**
   * Raise the agent Handover_Alert for this visitor's conversation. Never
   * throws: alerting is a side channel and must not affect the visitor flow.
   */
  private async raiseHandover(
    userId: string,
    reason: AlertReasonEnum,
    extra: { handoverReason?: string } = {}
  ): Promise<void> {
    if (!this.handoverAlertService) return;
    try {
      const s = this.socketStateService.getUserData(userId);
      if (!s?.conversationId || !s?.botId) return;
      await this.handoverAlertService.raise({
        conversationId: String(s.conversationId),
        botId: String(s.botId),
        visitorId: String(userId),
        visitorName: s.visitorName,
        reason,
        handoverReason: extra.handoverReason,
        mode: s.mode,
      });
    } catch (error) {
      this.logger.warn(`Handover alert raise failed: ${error?.message}`);
    }
  }

  async setNextNode(nodeId: string, userId: string | any) {
    const node = await this.botsService.getBotNode(nodeId);
    this.socketStateService.updateUserData(userId, {
      currentNode: node,
    });
  }

  /**
   * Lightweight, gated step tracer for workflow execution. Enabled by the same
   * flags as the AI logger (NODE_ENV=development, LOG_LEVEL=debug, or
   * AI_DEBUG_LOGS=true). Use it to follow the exact node walk and message
   * delivery for a single inbound message when a flow misbehaves.
   */
  private trace(step: string, detail = ""): void {
    if (!isDebugLogs()) return;
    this.logger.debug(`[FLOW] ${step}${detail ? ` :: ${detail}` : ""}`);
  }

  async handleBlockedContent(userId: string) {
    return await this.sendBotMessage(userId, [
      {
        type: "text",
        value: "Sorry, you are not allowed to send this message",
      },
    ]);
  }

  async handleMessage(
    message: any,
    user: AuthenticatedSocket,
    type = "text",
    language = "english",
    ctx?: any
  ): Promise<any> {
    const userId = user?.auth?.userId;

    console.log(
      `\n>>> [handleMessage] ENTER | userId=${userId} type=${type} message=${JSON.stringify(message).slice(0, 150)}`
    );

    const userData = this.socketStateService.getUserData(userId);
    if (!userData) {
      console.log(`>>> [handleMessage] EXIT early — no userData for ${userId}`);
      return;
    }
    const { mode, conversationId, currentNode } = userData;
    // R14.6: a closed conversation takes no more input (the gateway also
    // refuses it; this covers every other caller).
    if (userData.conversationEnded) return;
    if (!currentNode) {
      console.log(`>>> [handleMessage] EXIT early — currentNode is null/undefined for ${userId}`);
      return;
    }

    console.log(
      `>>> [handleMessage] currentNode=${currentNode.nodeType} id=${currentNode.id} conv=${conversationId}`
    );

    // Fresh node-traversal budget for this inbound message (loop protection),
    // plus this turn's context. Stored per visitor rather than on `this` so
    // concurrent conversations cannot overwrite each other's values (see the
    // note on the class). Written only AFTER the guards above, so a message for
    // an unknown visitor never creates an entry.
    this.socketStateService.updateUserData(userId, {
      nodeHops: 0,
      // A name the visitor told us wins over the widget token's (usually
      // "Anonymous") on every later message (crm-plugins-service-desk R4.3).
      visitorName: userData.nameCaptured
        ? userData.visitorName
        : user?.auth?.name ?? userData.visitorName,
      language,
      // The channel context (how to reply) belongs to the conversation. Only
      // overwrite it when this turn actually carries one — the widget path
      // passes none and must not clear a social channel's ctx.
      ...(ctx ? { ctx } : {}),
    });

    // Reset the per-conversation send-delay baseline for every inbound message.
    // The baseline lives in this visitor's conversation state; sendBotMessage
    // only ever INCREASES it (by ~nodeDelay per call) and it was
    // never zeroed between turns. Left unreset it climbs unbounded, so later
    // bot messages get scheduled (via setTimeout) many seconds into the future
    // and appear to "never arrive" — which is exactly how the static flow broke
    // once AI testing kept the process/conversation alive across many turns.
    // Zeroing here makes each turn schedule from "now" while still staggering
    // multiple messages within the same turn.
    if (conversationId) {
      this.socketStateService.updateUserData(userId, { messageDelay: 0 });
    }

    this.trace(
      "handleMessage:in",
      `type=${type} node=${currentNode.nodeType} conv=${conversationId} msg=${preview(
        message,
        80
      )}`
    );

    if (mode !== ModeEnum.preview && conversationId && message) {
      const chatId = generateId("chat", 10);
      this.socketStateService.updateUserData(userId, { currentChatId: chatId });
      this.eventEmitter.emit("create.new.chat", {
        sender: userId,
        message: message,
        type: type,
        conversationId,
        chatId,
      });
    }

    const blockedContent =
      this.socketStateService.getUserData(userId)?.botSettings
        ?.blockedContent || [];
    const isBlocked = blockedContent.some((content: string) => {
      if (message && message.toLowerCase().includes(content.toLowerCase())) {
        return this.handleBlockedContent(userId);
      }
    });

    if (isBlocked) {
      return;
    }

    // A pending problem question takes the reply before the flow does (R4),
    // and before Agent_Intent, so "agent please" here is not a second alert.
    if (type !== "goto" && (await this.consumeProblemAnswer(userId, message, type))) {
      return;
    }

    // Identity question / details confirm (R16, R17). Answers are consumed;
    // anything else continues into the flow as normal.
    if (type !== "goto") {
      const raw = typeof message === "string" ? message.trim() : "";
      if (await this.consumeIdentityAnswer(userId, raw)) return;
      if (await this.consumeConfirmAnswer(userId, raw)) return;
      // Free text may carry "I'm Raj, raj@x.com" (R16.5). Off the hot path.
      // Not while a question node is collecting an answer: those values are
      // captured through their alias, and a secure answer (PIN, password)
      // must never be read as a phone or email.
      const collecting =
        currentNode.nodeType === NodeTypeEnum.QUESTIONS ||
        currentNode.nodeType === NodeTypeEnum.USER_INPUT;
      if (raw && mode !== ModeEnum.preview && !collecting) {
        this.eventEmitter.emit(VISITOR_TEXT, { userId: String(userId), text: raw });
      }
    }

    // Visitor asked for a human in their own words (Agent_Intent). Only active
    // when the bot has phrases configured; the flow continues unchanged — the
    // alert is a side channel and is deduplicated per open request.
    if (
      type !== "goto" &&
      matchesAgentIntent(
        message,
        this.socketStateService.getUserData(userId)?.botSettings?.agentIntents
      )
    ) {
      await this.raiseHandover(userId, AlertReasonEnum.VISITOR_INTENT);
    }

    if (type === "goto") {
      console.log(`>>> [handleMessage] GOTO branch — looking up node: "${message}"`);
      let step: BotFlowNode | null = null;
      try {
        step = await this.botsService.getBotNode(message);
      } catch (e) {
        console.log(`>>> [handleMessage] GOTO getBotNode threw: ${e.message}`);
        // getBotNode throws HttpException 404 when the id doesn't exist.
      }
      if (!step) {
        console.log(`>>> [handleMessage] GOTO target NOT FOUND — falling back`);
        this.logger.warn(
          `goto target "${message}" not found — sending fallback`
        );
        return this.defaultFallback(
          message,
          this.socketStateService.getUserData(userId)?.defaultFallback,
          userId
        );
      }
      console.log(`>>> [handleMessage] GOTO resolved to: ${step.nodeType} id=${step.id} next=[${(step.next||[]).join(",")}] responses=${(step.responses||[]).length}`);
      // A goto button pressed while a Closure_Prompt waits is that prompt's
      // first response (R14.1): the visitor navigated on, so drop the prompt.
      if (this.socketStateService.getUserData(userId)?.awaitingClosure) {
        this.settleClosure(userId);
      }
      this.socketStateService.updateUserData(userId, {
        currentNode: step,
      });

      return this.handleNode(step, message, userId);
    }
    // Keep the original casing before folding the working copy to lowercase.
    // Matching stays case-insensitive, but captured attributes should read
    // "Digvijay Sharma", not "digvijay sharma", because they flow straight into
    // webhook payloads, tickets and template pre-fills.
    if (typeof message === "string") {
      this.socketStateService.updateUserData(userId, {
        rawMessage: message.trim(),
      });
    }

    message = (message ?? "").trim().toLowerCase();

    // Closure_Prompt (R14): the first reply after it decides what happens.
    // "Start again" falls through to the normal restart below (R14.4).
    const closure = await this.consumeClosureAnswer(userId, message);
    if (closure === "handled") return;
    if (closure === "restart") message = "start";

    if (message === "start" || message === "reset" || message === "restart") {
      const { startNode, botSettings, role } =
        this.socketStateService.getUserData(userId);

      await this.sendBotMessage(userId, [
        {
          type: "text",
          value:
            botSettings?.welcomeMessages ||
            "Welcome to the bot, how can I help you?",
        },
      ]);

      if (startNode) {
        this.socketStateService.updateUserData(userId, {
          currentNode: startNode,
          BotNodeState: {},
          questionNodeState: {},
          attributes: {},
          awaitingProblem: undefined,
          acceptedProblem: undefined,
        });
        return this.handleNode(startNode, message, userId);
      }
    }

    const list: string[] = [NodeTypeEnum.QUESTIONS, NodeTypeEnum.USER_INPUT];
    if (list.includes(currentNode.nodeType)) {
      this.socketStateService.updateUserData(userId, {
        messageDelay: parseInt(this.configService.get("delay.node")),
      });
    }

    await this.handleNode(currentNode, message, userId, language);
  }

  async handleNode(
    currentNode: BotFlowNode,
    message: any,
    userId: string | any,
    language = "english"
  ): Promise<any> {
    try {
      const userdata = this.socketStateService.getUserData(userId);
      if (!userdata) return;
      const { conversationId, defaultFallback } = userdata;

      // ---- Loop protection ----------------------------------------------
      // Every node traversal for a single inbound message is metered here.
      // A cyclic flow (e.g. AI node whose fallback routes back into itself)
      // would otherwise recurse forever and crash the process.
      const hops = (userdata.nodeHops ?? 0) + 1;
      this.socketStateService.updateUserData(userId, { nodeHops: hops });
      if (hops > MAX_NODE_HOPS) {
        banner(
          this.logger,
          "[WORKFLOW LOOP DETECTED]",
          {
            "User ID": userId,
            "Conversation ID": conversationId,
            "Last Node": currentNode
              ? `${currentNode.nodeType} ${currentNode.id}`
              : "(none)",
            Hops: hops,
            Limit: MAX_NODE_HOPS,
          },
          "error"
        );
        await this.sendBotMessage(userId, [
          {
            type: "text",
            value:
              userdata.botSettings?.fallbackMessage ||
              "Sorry, something went wrong. Please try again.",
          },
        ]);
        // Stop the run. Leave nodeHops high so any other concurrently-looping
        // chain for this user also aborts immediately; the next inbound message
        // resets the budget in handleMessage. Reset to startNode so future
        // messages still work (null would silence the bot permanently).
        const sn = this.socketStateService.getUserData(userId)?.startNode;
        this.socketStateService.updateUserData(userId, {
          currentNode: sn || null,
        });
        return;
      }
      // --------------------------------------------------------------------

      if (!currentNode) {
        return this.defaultFallback(message, defaultFallback, userId);
      }
      if (
        currentNode.id !==
        this.socketStateService.getUserData(userId).currentNode.id
      ) {
        this.socketStateService.updateUserData(userId, {
          currentNode,
        });
      }
      this.persistFlowPosition(userId);
      this.logger.verbose(
        `current Node: ${currentNode.nodeType} ${currentNode.id}`
      );
      this.trace(
        "handleNode",
        `type=${currentNode.nodeType} id=${currentNode.id} hop=${hops} next=[${(
          currentNode.next || []
        ).join(",")}] responses=${(currentNode.responses || []).length}`
      );

      switch (currentNode.nodeType) {
        case NodeTypeEnum.START_NODE:
          return await this.handleStartNode(
            currentNode,
            message,
            userId,
            language
          );

        case NodeTypeEnum.BOT_RESPONSE:
          return await this.handleBotResponse(message, currentNode, userId);

        case NodeTypeEnum.AI_RESPONSE:
        case NodeTypeEnum.AI_NODE:
          return await this.handleAiResponse(message, currentNode, userId);

        case NodeTypeEnum.USER_INPUT:
          return await this.handleUserInput(message, currentNode, userId);

        case NodeTypeEnum.FALL_BACK:
          return await this.defaultFallback(message, currentNode, userId);

        case NodeTypeEnum.ADD_TO_SEGMENT:
          return await this.handleAddToSegment(message, currentNode, userId);

        case NodeTypeEnum.REMOVE_FROM_SEGMENT:
          return await this.handleRemoveFromSegment(
            message,
            currentNode,
            userId
          );

        case NodeTypeEnum.WEBHOOK:
          return await this.handleWebHookCall(message, currentNode, userId);

        case NodeTypeEnum.TICKET:
          return await this.handleCreateTicket(message, currentNode, userId);

        case NodeTypeEnum.GO_TO_STEP:
          return await this.handleGoToStep(message, currentNode, userId);

        case NodeTypeEnum.SUCCESS:
          return await this.handleSuccessNode(message, currentNode, userId);

        case NodeTypeEnum.FAILURE:
          return await this.handleFailureNode(message, currentNode, userId);

        case NodeTypeEnum.TIMEOUT:
          return await this.handleTimeoutNode(message, currentNode, userId);

        case NodeTypeEnum.TRANSFER_TO_AGENT:
          return await this.TransferToAgent(message, currentNode, userId);

        case NodeTypeEnum.QUESTIONS:
          return await this.handleQuestion(message, currentNode, userId);

        case NodeTypeEnum.FILE_ATTACHMENT:
          return await this.handleAttachmentInput(message, currentNode, userId);

        case NodeTypeEnum.SET_ATTRIBUTES:
          return await this.handleSetAttributes(message, currentNode, userId);

        case NodeTypeEnum.CLOSE_CHAT:
          return await this.handleCloseChat(message, currentNode, userId);

        case NodeTypeEnum.OPEN_TEMPLATE:
          return await this.handleOpenTemplate(message, currentNode, userId);

        default:
          return await this.defaultFallback(message, currentNode, userId);
      }
    } catch (error) {
      this.logger.error(`Error in Handling Node : ${error.message}`);

      // Never leave the visitor parked on the node that threw: every later
      // message would hit the same error and get this same fallback, forever.
      // Back to the start node so the next message is routed afresh.
      const sn = this.socketStateService.getUserData(userId)?.startNode;
      if (sn) {
        this.socketStateService.updateUserData(userId, { currentNode: sn });
      }

      return await this.sendBotMessage(userId, [
        {
          type: "text",
          value:
            this.socketStateService.getUserData(userId)?.botSettings
              ?.fallbackMessage ||
            "I am sorry, I am not able to understand you",
        },
      ]);
    }
  }

  async handleStartNode(
    currentNode: BotFlowNode,
    message: any,
    userId: string | any,
    language: string
  ) {
    const NextNodes: BotFlowNode[] = await Promise.all(
      currentNode.next.map(async (nodeId: string) => {
        return await this.botsService.getBotNode(nodeId);
      })
    );

    const defaultFallback = NextNodes.find(
      (node: BotFlowNode) => node.nodeType === NodeTypeEnum.FALL_BACK
    );
    this.socketStateService.updateUserData(userId, { defaultFallback });

    const otherNode = NextNodes.find(
      (node: BotFlowNode) => node.nodeType !== NodeTypeEnum.FALL_BACK
    );

    this.trace(
      "handleStartNode",
      `start=${currentNode.id} next=[${(currentNode.next || []).join(
        ","
      )}] resolvedOther=${otherNode?.nodeType ?? "(none)"} fallback=${
        defaultFallback?.id ?? "(none)"
      }`
    );

    const startMessagesList = [
      "start",
      "reset",
      "restart",
      "hi",
      "hello",
      "hey",
      "help",
    ];

    if (
      !startMessagesList.includes(message) &&
      message?.split(" ").length > 1
    ) {
      const response = await this.findAnswerFromQuestionBank(
        message,
        language,
        userId
      );

      if (response) {
        return await this.sendBotMessage(userId, [
          {
            type: "text",
            value: response,
          },
        ]);
      }
    }

    // The start node must connect to at least one non-fallback node for the
    // flow to advance. If the graph has none (misconfigured builder export, or
    // every child is a FALL_BACK), route to the fallback instead of calling
    // handleNode(undefined), which would traverse into nothing and stall the
    // conversation after only the welcome message.
    if (!otherNode) {
      this.trace(
        "handleStartNode:no-other-node",
        `routing to ${defaultFallback ? "defaultFallback" : "terminal fallback"}`
      );
      if (defaultFallback) {
        return this.handleNode(defaultFallback, message, userId);
      }
      return this.defaultFallback(message, undefined, userId);
    }

    return this.handleNode(otherNode, message, userId);
  }

  async handleBotResponse(
    message: any,
    node: BotFlowNode,
    userId: string | any
  ) {
    this.trace(
      "handleBotResponse",
      `id=${node.id} next=${node.next.length} responses=${
        (node.responses || []).length
      }`
    );
    // "Terminal" toggle (R14.1): the answer, then the Closure_Prompt instead
    // of the wired continuation. Not on a menu (several options): its
    // buttons and the prompt's would compete.
    if ((node.next?.length ?? 0) <= 1 && this.terminalHere(node, userId)) {
      // Delivered once: the node stays current after the prompt.
      if (this.socketStateService.getNodeState(userId, node.id) !== BotNodeStateEnum.VISITED) {
        await this.sendBotMessage(userId, node.responses);
        this.socketStateService.setNodeState(userId, node.id, BotNodeStateEnum.VISITED);
      }
      return this.sendClosurePrompt(userId, node);
    }
    if (node.next.length === 1) {
      await this.sendBotMessage(userId, node.responses);
      const nextNode = await this.botsService.getBotNode(node.next[0]);

      this.socketStateService.updateUserData(userId, {
        currentNode: nextNode,
      });

      if (
        nextNode.nodeType === NodeTypeEnum.USER_INPUT ||
        nextNode.nodeType === NodeTypeEnum.FILE_ATTACHMENT
      ) {
        return;
      }
      return this.handleNode(nextNode, message, userId);
    }
    if (node.next.length > 1) {
      const nodeState = this.socketStateService.getNodeState(userId, node.id);

      if (nodeState === BotNodeStateEnum.NEW) {
        this.socketStateService.setNodeState(
          userId,
          node.id,
          BotNodeStateEnum.AWAITING_USER_INPUT
        );
        return await this.sendBotMessage(userId, node.responses);
      }
      if (nodeState === BotNodeStateEnum.AWAITING_USER_INPUT) {
        const nextNodes = await Promise.all(
          node.next.map(async (nodeId: string) => {
            return await this.botsService.getBotNode(nodeId);
          })
        );

        this.socketStateService.setNodeState(
          userId,
          node.id,
          BotNodeStateEnum.NEW
        );

        // Score every candidate and take the strongest, rather than the first
        // one in edge order. With first-wins, a branch keyed on the digit "1"
        // captured "i have 1 question about my bill" before the branch keyed on
        // "bill" was ever considered. `allowCaptureOnlyMatch: false` stops a
        // child that only declares an alias from absorbing every reply.
        let matchedNode: BotFlowNode = null;
        let matchedScore = 0;
        let matchedReason = "";
        for (const ele of nextNodes) {
          if (ele?.nodeType !== NodeTypeEnum.USER_INPUT) continue;
          const result = this.evaluateUserInput(message, ele, {
            allowCaptureOnlyMatch: false,
          });
          if (result.matched && result.score > matchedScore) {
            matchedNode = ele;
            matchedScore = result.score;
            matchedReason = result.reason;
          }
        }

        if (matchedNode) {
          this.trace(
            "handleBotResponse:branch",
            `matched=${matchedNode.id} score=${matchedScore} via=${matchedReason}`
          );
          this.captureUserInput(message, matchedNode, userId);
          this.socketStateService.setNodeState(
            userId,
            matchedNode.id,
            BotNodeStateEnum.VISITED
          );
          return this.handleNode(matchedNode, message, userId);
        }
        this.socketStateService.setNodeState(
          userId,
          node.id,
          BotNodeStateEnum.AWAITING_USER_INPUT
        );

        const response = await this.findAnswerFromQuestionBank(
          message,
          this.socketStateService.getUserData(userId)?.language,
          userId
        );
        if (response) {
          return await this.sendBotMessage(userId, [
            {
              type: "text",
              value: response,
            },
          ]);
        }

        // No question bank match — route to the default fallback node (which
        // may be an AI_NODE). This was previously just sending a static
        // fallback message, which meant the AI fallback node was never reached.
        const { defaultFallback } =
          this.socketStateService.getUserData(userId);
        if (defaultFallback) {
          return this.handleNode(defaultFallback, message, userId);
        }

        const { fallbackMessage } =
          this.socketStateService.getUserData(userId)?.botSettings;
        return await this.sendBotMessage(userId, [
          {
            type: "text",
            value:
              fallbackMessage || "I am sorry, I am not able to understand you",
          },
        ]);
      }
    }

    await this.sendBotMessage(userId, node.responses);
    return this.socketStateService.updateUserData(userId, {
      currentNode: null,
    });
  }
  /**
   * AI Response node: answer the user's message using the JarCube AI (RAG)
   * service, grounded in the client's ingested website / knowledge-base data.
   *
   * Routing:
   *  - confident answer  -> send it, then continue to a SUCCESS child (or the
   *    single next node if there is one).
   *  - not confident, or the AI service is unreachable -> take the FAILURE child
   *    if the designer added one, otherwise fall back to the default fallback.
   */
  async handleAiResponse(message: any, node: BotFlowNode, userId: string | any) {
    const userData = this.socketStateService.getUserData(userId);
    if (!userData) return;
    const { botId, botName, defaultFallback, conversationId } = userData;

    // Nothing to ask. This happens when the flow LANDS on an AI node with no
    // inbound message — most importantly when a template submit routes
    // SUCCESS -> AI node via routeTemplateResume(..., ""). Calling the AI with
    // an empty question would hit the RAG "no context" path and emit a spurious
    // "I don't have anything on that" right after the confirmation. Instead,
    // just make this the resting node so the customer's NEXT real message is
    // answered here.
    if (typeof message !== "string" || !message.trim()) {
      this.socketStateService.updateUserData(userId, { currentNode: node });
      this.trace(
        "handleAiResponse:park",
        `node=${node.id} reached with empty message — waiting for next input`
      );
      return;
    }

    // Correlation id shared with the AI service (via x-request-id header).
    const requestId = newRequestId();
    const debug = isDebugLogs();
    const startedAt = Date.now();

    const nextNodes: BotFlowNode[] = await Promise.all(
      (node.next || []).map((nodeId: string) => this.botsService.getBotNode(nodeId))
    );
    const successNode = nextNodes.find(
      (n: BotFlowNode) => n?.nodeType === NodeTypeEnum.SUCCESS
    );
    const failureNode = nextNodes.find(
      (n: BotFlowNode) => n?.nodeType === NodeTypeEnum.FAILURE
    );
    const otherNode = nextNodes.find(
      (n: BotFlowNode) =>
        n &&
        n.nodeType !== NodeTypeEnum.SUCCESS &&
        n.nodeType !== NodeTypeEnum.FAILURE
    );

    // A company can share one knowledge base across many bots via clientId.
    const clientId = node.payload?.clientId || botId;
    const companyName = node.payload?.companyName || botName;

    const chatHistory = await this.getRecentChatHistory(
      conversationId,
      userId,
      message
    );

    banner(this.logger, "[BACKEND] Incoming AI Request", {
      "Request ID": requestId,
      Timestamp: new Date().toISOString(),
      Endpoint: "AI_RESPONSE node",
      "Node ID": node.id,
      "User ID": userId,
      "Conversation ID": conversationId,
      "Client ID": clientId,
      Question: message,
      "History turns": chatHistory.length,
    });

    const aiUrl = this.configService.get("ai.url");
    const timeout = this.configService.get("ai.timeout");
    const visitorProfile = await this.visitorProfileFor(userId);
    const requestBody = {
      client_id: clientId,
      question: message,
      bot_id: botId,
      company_name: companyName,
      chat_history: chatHistory,
      ...(visitorProfile ? { visitor_profile: visitorProfile } : {}),
    };

    banner(this.logger, "[BACKEND -> AI SERVICE]", {
      URL: `${aiUrl}/query/ask`,
      Method: "POST",
      "Request ID": requestId,
      Timeout: `${timeout}ms`,
      Body: debug ? preview(maskDeep(requestBody), 1000) : `(question=${preview(message, 120)})`,
    });

    let aiResult: {
      answer?: string;
      confident?: boolean;
      tokens_used?: number;
      provider?: string;
      model?: string;
      /** Structured AI_Handover_Signal; only a strict `true` escalates. */
      handover?: unknown;
      handover_reason?: unknown;
    } | null = null;

    const callStart = Date.now();
    try {
      const res = await firstValueFrom(
        this.httpService.post(`${aiUrl}/query/ask`, requestBody, {
          timeout,
          headers: { "x-request-id": requestId },
        })
      );
      aiResult = res.data;

      banner(
        this.logger,
        "[AI SERVICE -> BACKEND]",
        {
          "Request ID": requestId,
          Status: res.status,
          "Response Time": `${Date.now() - callStart}ms`,
          Confident: aiResult?.confident,
          "Token Usage": aiResult?.tokens_used ?? 0,
          Model: aiResult?.model,
          Provider: aiResult?.provider,
          "Answer": preview(aiResult?.answer ?? "(none)", 300),
        },
        aiResult?.confident ? "success" : "warn"
      );
    } catch (error) {
      // Never hide exceptions: full context for debugging.
      const status = error?.response?.status;
      const respBody = error?.response?.data;
      banner(
        this.logger,
        "[AI SERVICE -> BACKEND] ERROR",
        {
          "Request ID": requestId,
          Message: error?.message,
          "Status Code": status ?? "(no response)",
          "Response Time": `${Date.now() - callStart}ms`,
          Timeout: error?.code === "ECONNABORTED" ? `exceeded ${timeout}ms` : "no",
          "Response Body": respBody ? preview(respBody, 800) : "(none)",
          "Request Body": preview(maskDeep(requestBody), 500),
        },
        "error"
      );
      if (error?.stack) this.logger.error(error.stack);
    }

    // AI escalation: a structured `handover: true` (never the answer text).
    // Raise the alert, show the AI's own wording if any, then hand over via the
    // FAILURE child when the designer wired one, else transfer directly.
    if (aiResult?.handover === true) {
      const reason =
        typeof aiResult.handover_reason === "string"
          ? aiResult.handover_reason.slice(0, 200)
          : undefined;
      const sNow = this.socketStateService.getUserData(userId);
      const incidentMode =
        !!this.incidentService && isFeatureOn(sNow?.botSettings as any, "incidentHandover");
      // With incidents on, an open incident means the request is already
      // recorded (R4.8, R19.3): answer normally, don't hand over again.
      if (incidentMode && sNow?.conversationId) {
        const open = await this.incidentService
          .findOpenByConversation(String(sNow.conversationId))
          .catch(() => null);
        if (open) {
          const text = typeof aiResult.answer === "string" ? aiResult.answer.trim() : "";
          if (text) await this.sendBotMessage(userId, [{ type: "text", value: text }]);
          return;
        }
      }
      // In incident mode the alert is raised by openForHandover itself.
      if (!incidentMode) {
        await this.raiseHandover(userId, AlertReasonEnum.AI_ESCALATION, {
          handoverReason: reason,
        });
      }
      const text =
        typeof aiResult.answer === "string" ? aiResult.answer.trim() : "";
      if (text) {
        await this.sendBotMessage(userId, [{ type: "text", value: text }]);
      }
      this.trace(
        "handleAiResponse:handover",
        `node=${node.id} route=${failureNode ? "FAILURE" : "TransferToAgent"}`
      );
      if (failureNode) return this.handleNode(failureNode, message, userId);
      return this.TransferToAgent(
        message,
        { ...node, nodeType: NodeTypeEnum.TRANSFER_TO_AGENT, payload: {} } as BotFlowNode,
        userId
      );
    }

    if (aiResult?.confident && aiResult.answer) {
      await this.sendBotMessage(userId, [
        { type: "text", value: aiResult.answer },
      ]);

      // Usage signal for billing / analytics (persisted by a listener).
      this.eventEmitter.emit("ai.response.generated", {
        botId,
        clientId,
        visitorId: userId,
        conversationId,
        question: message,
        tokensUsed: aiResult.tokens_used || 0,
        provider: aiResult.provider,
        model: aiResult.model,
      });

      banner(
        this.logger,
        "[BACKEND -> CLIENT]",
        {
          "Request ID": requestId,
          "Final Response": preview(aiResult.answer, 300),
          "Response Length": aiResult.answer.length,
          "HTTP Status": 200,
          "Total Request Time": `${Date.now() - startedAt}ms`,
        },
        "success"
      );

      if (successNode) return this.handleNode(successNode, message, userId);
      if (otherNode) return this.handleNode(otherNode, message, userId);
      return;
    }

    // Not confident, or the AI service failed -> send fallback and STOP.
    // CRITICAL: Do NOT call this.defaultFallback() here — it recurses into
    // handleNode() which routes back to this AI_NODE, creating an infinite loop.
    // Instead, send one terminal message and clear the node.
    banner(
      this.logger,
      "[BACKEND -> CLIENT] Fallback",
      {
        "Request ID": requestId,
        Reason: aiResult ? "not confident (no relevant knowledge)" : "AI service error",
        Route: failureNode ? "FAILURE node" : "terminal fallback message",
        "Total Request Time": `${Date.now() - startedAt}ms`,
      },
      "warn"
    );

    if (failureNode) return this.handleNode(failureNode, message, userId);

    // Terminal: send one fallback message and reset to start node (NOT null,
    // which would silently drop all future messages from this user).
    //
    // Message selection, most specific first. "Sorry, I did not understand
    // that" is the wrong thing to say when the AI understood perfectly well and
    // simply has no matching knowledge — it blames the customer for our gap,
    // and it invites them to rephrase a question that rephrasing cannot fix.
    // When the AI service returned prose (its own honest "I don't have that,
    // but here is what I can help with"), that prose is strictly better than
    // any generic string, so prefer it.
    const fallbackMsg =
      (typeof aiResult?.answer === "string" && aiResult.answer.trim()) ||
      this.socketStateService.getUserData(userId)?.botSettings?.fallbackMessage ||
      "I don't have anything on that in our help content yet. Could you tell me a bit more about what you're trying to do, and I'll point you the right way?";
    await this.sendBotMessage(userId, [{ type: "text", value: fallbackMsg }]);
    // Reset to start node so the next message re-enters the flow normally.
    const startNode = this.socketStateService.getUserData(userId)?.startNode;
    if (startNode) {
      this.socketStateService.updateUserData(userId, { currentNode: startNode });
    }
    return;
  }

  /**
   * Recent conversation turns passed to the AI service for multi-turn context.
   * Maps each stored chat to a role based on its sender (the visitor => "user",
   * anyone else => "assistant"), drops the just-saved current question, and caps
   * the history to the last few turns to keep prompts small and cheap.
   */
  async getRecentChatHistory(
    conversationId: string,
    userId: string,
    currentMessage: string
  ): Promise<{ role: string; content: string }[]> {
    if (!conversationId) return [];
    try {
      const conversation: any =
        await this.conversationService.getConversationById(conversationId);
      const chats: any[] = conversation?.chats || [];

      let history = chats
        .filter((c: any) => c && c.type === "text" && c.message)
        .map((c: any) => ({
          role: String(c.sender) === String(userId) ? "user" : "assistant",
          content: c.message as string,
        }));

      // The current question is usually persisted just before this runs; drop it
      // so the AI service doesn't see it twice (it appends the question itself).
      if (
        history.length &&
        history[history.length - 1].role === "user" &&
        history[history.length - 1].content === currentMessage
      ) {
        history = history.slice(0, -1);
      }

      return history.slice(-6);
    } catch (error) {
      this.logger.error(`getRecentChatHistory failed: ${error.message}`);
      return [];
    }
  }

  async handleUserInput(message: any, node: BotFlowNode, userId: string | any) {
    const nextNodes = await this.botsService.getBotNode(node.next[0]);
    const nodeState = this.socketStateService.getNodeState(userId, node.id);
    // console.log('userinput nodeState', nodeState);
    if (nodeState === BotNodeStateEnum.VISITED) {
      return this.handleNode(nextNodes, message, userId);
    } else if (this.checkIfUserInputMatching(message, node, userId)) {
      // console.log('mattched node and goig to next node');
      return this.handleNode(nextNodes, message, userId);
    } else {
      return this.handleNode(
        this.socketStateService.getUserData(userId).defaultFallback,
        message,
        userId
      );
    }
  }

  /**
   * The value to persist for a captured answer.
   *
   * handleMessage lowercases the inbound text so keyword matching is
   * case-insensitive, but that lowercased copy is what every capture site was
   * storing — names and cities reached the CRM webhook as "digvijay sharma".
   * Substitute the original only when it is demonstrably the same message, so a
   * stale value from an earlier turn can never leak in.
   */
  private captureValue(message: any, userId: string | any): any {
    if (typeof message !== "string") return message;
    const raw = this.socketStateService.getUserData(userId)?.rawMessage;
    return typeof raw === "string" && raw.toLowerCase() === message
      ? raw
      : message;
  }

  /** Escape a designer-authored keyword so it is safe inside a RegExp. */
  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  /**
   * Whole-word (or whole-phrase) containment.
   *
   * Matching used to be a bare `message.includes(keyword)`, which let a keyword
   * match the middle of an unrelated word: keyword "1" matched "i have 1
   * question about my bill" AND "my 100mbps plan", and utterance "nothing else
   * for now" matched a user simply answering "no". Requiring a non-alphanumeric
   * boundary on both sides means a term only matches when it stands on its own.
   */
  private containsPhrase(haystack: string, needle: string): boolean {
    const term = (needle || "").trim().toLowerCase();
    if (!term || !haystack) return false;
    const boundary = "[^\\p{L}\\p{N}]";
    const pattern = new RegExp(
      `(?:^|${boundary})${this.escapeRegExp(term)}(?:${boundary}|$)`,
      "iu"
    );
    return pattern.test(haystack);
  }

  /**
   * Decide whether a USER_INPUT node accepts this message, and how strongly.
   *
   * PURE: this never writes to session state. Capture is a separate step
   * (`captureUserInput`) because a menu evaluates every candidate branch before
   * choosing one — the old combined version stored the alias of each candidate
   * it tested, and emitted `mask.chat` once per candidate.
   *
   * `allowCaptureOnlyMatch` is the fix for the branch-swallowing bug. A node
   * whose only configuration is an alias legitimately matches anything (that is
   * what a capture step is), but that must not apply while picking between the
   * children of a menu, where the first aliased child would otherwise absorb
   * every reply.
   */
  private evaluateUserInput(
    message: string,
    node: BotFlowNode,
    options: { allowCaptureOnlyMatch?: boolean } = {}
  ): UserInputMatch {
    const { allowCaptureOnlyMatch = true } = options;
    const { alias, entity } = node.payload || {};
    const text = typeof message === "string" ? message : "";
    const keywords = node.keywords || [];
    const utterances = node.utterance || [];

    if (entity && entity !== UserInputValidationEnum.ANY) {
      return this.validationCheck(entity, text)
        ? { matched: true, score: MATCH_SCORE_ENTITY, reason: `entity:${entity}` }
        : { matched: false, score: 0, reason: `entity:${entity}:invalid` };
    }

    // Longest matching term wins, so a specific keyword like "bill" outranks a
    // generic menu digit like "1" no matter which branch the edges list first.
    let best = 0;
    let bestTerm = "";
    for (const term of [...keywords, ...utterances]) {
      if (!term) continue;
      // Utterances are example phrases: match either direction, so both a user
      // typing a fragment of the example and a user wrapping the example in a
      // longer sentence are recognised.
      const hit =
        this.containsPhrase(text, term) || this.containsPhrase(term, text);
      if (hit && term.trim().length > best) {
        best = term.trim().length;
        bestTerm = term;
      }
    }
    if (best > 0) {
      return {
        matched: true,
        score: MATCH_SCORE_KEYWORD_BASE + best,
        reason: `term:${bestTerm}`,
      };
    }

    if (alias && allowCaptureOnlyMatch) {
      return {
        matched: true,
        score: MATCH_SCORE_CAPTURE_ONLY,
        reason: "capture-only",
      };
    }
    return { matched: false, score: 0, reason: "no-match" };
  }

  /**
   * Persist the answer this node was configured to capture. Called only for the
   * node that actually won, never for candidates that were merely tested.
   */
  private captureUserInput(
    message: string,
    node: BotFlowNode,
    userId: string | any
  ): void {
    const { alias, secure, entity } = node.payload || {};
    if (secure) {
      // Mask THIS visitor's current chat row. Read per visitor: a singleton
      // field here masked whichever conversation last ran, leaving the actual
      // secret in plaintext and redacting an unrelated message.
      this.eventEmitter.emit(
        "mask.chat",
        this.socketStateService.getUserData(userId)?.currentChatId
      );
    }
    const value = this.captureValue(message, userId);
    const typed = secure ? {} : this.typedContactAttributes(userId, entity, value, alias);
    if (!alias && !Object.keys(typed).length) return;
    this.socketStateService.updateUserData(userId, {
      attributes: {
        ...this.socketStateService.getUserData(userId)?.attributes,
        ...(alias ? { [alias]: value } : {}),
        ...typed,
      },
    });
    this.emitAttributeCaptured(userId, [...(alias ? [alias] : []), ...Object.keys(typed)]);
  }

  /**
   * crm-plugins-service-desk R3.2: an answer validated as an email or phone
   * IS the visitor's email or phone, whatever the question saved it as. Also
   * store it under the bot's mapped email/phone alias when that is still
   * empty, so the CRM and the "ask once" pre-fill both see it. Never called
   * for secure answers (R3.4).
   */
  private typedContactAttributes(
    userId: string,
    entity: string | undefined,
    value: unknown,
    alias?: string
  ): Record<string, unknown> {
    const field =
      entity === UserInputValidationEnum.EMAIL
        ? "email"
        : entity === UserInputValidationEnum.PHONE
        ? "phone"
        : null;
    if (!field || typeof value !== "string" || !value.trim()) return {};
    const s = this.socketStateService.getUserData(userId);
    const target = effectiveMapping(s?.botSettings?.contactMapping)[field];
    if (!target || target === alias || s?.attributes?.[target]) return {};
    return { [target]: value };
  }

  /** Pending flowPosition writes per visitor (debounce, design §7). */
  private readonly flowWriteTimers = new Map<string, NodeJS.Timeout>();

  /**
   * Persist where the flow is (Conversation.flowPosition) so a widget reload
   * resumes at the same node (R9.3). Debounced 2 s per visitor and skipped
   * when the node did not change, so a busy flow costs one write per pause.
   * Never throws; preview and non-widget channels are skipped.
   */
  private persistFlowPosition(userId: string) {
    const s = this.socketStateService.getUserData(userId);
    const nodeId = s?.currentNode?.id;
    if (!s?.conversationId || !nodeId || s.mode === ModeEnum.preview) return;
    if (s.platform && s.platform !== PlatformEnum.WIDGET) return;
    if (s.persistedNodeId === nodeId) return;
    const prev = this.flowWriteTimers.get(userId);
    if (prev) clearTimeout(prev);
    const timer = setTimeout(() => {
      this.flowWriteTimers.delete(userId);
      const now = this.socketStateService.getUserData(userId);
      const latest = now?.currentNode?.id;
      if (!now?.conversationId || !latest || now.persistedNodeId === latest) return;
      this.socketStateService.updateUserData(userId, { persistedNodeId: latest });
      void this.conversationService.setFlowPosition?.(String(now.conversationId), String(latest));
    }, FLOW_POSITION_DEBOUNCE_MS);
    // Never keep the process alive for this.
    (timer as any).unref?.();
    this.flowWriteTimers.set(userId, timer);
  }

  /**
   * crm-incident-handover R18.8: the contact's Visitor_Profile (facts and the
   * 5 newest entries) for the AI answer prompt. Only with `profileSummaries`
   * on, never in preview, and bounded so a slow CRM never delays an answer.
   */
  private async visitorProfileFor(userId: string): Promise<Record<string, unknown> | null> {
    const s = this.socketStateService.getUserData(userId);
    if (!this.profileService || !s?.conversationId || s.mode === ModeEnum.preview) return null;
    if (!isFeatureOn(s.botSettings as any, "profileSummaries")) return null;
    let timer: NodeJS.Timeout;
    return Promise.race([
      this.profileService.contextForConversation(String(s.conversationId)).catch(() => null),
      new Promise<null>((r) => {
        timer = setTimeout(() => r(null), VISITOR_PROFILE_TIMEOUT_MS);
        (timer as any).unref?.();
      }),
    ]).finally(() => clearTimeout(timer));
  }

  /**
   * crm-incident-handover R2.1: attributes changed, so the CRM bridge may
   * resolve the contact. Fire-and-forget: the visitor never waits on the CRM.
   */
  private emitAttributeCaptured(userId: string, keys: string[], source?: CaptureSource) {
    const s = this.socketStateService.getUserData(userId);
    if (!s?.conversationId || !s.botId || s.mode === ModeEnum.preview || !keys.length) return;
    this.eventEmitter.emit(ATTRIBUTE_CAPTURED, {
      userId: String(userId),
      conversationId: String(s.conversationId),
      botId: String(s.botId),
      keys,
      ...(source ? { source } : {}),
    });
  }

  /**
   * crm-plugins-service-desk R4.4: a legacy active chat shows the visitor's
   * name from the `new-visitor` payload; tell its agent the name changed.
   * The omnichannel inbox is refreshed separately (thread republish).
   */
  @OnEvent(VISITOR_DETAILS_UPDATED, { async: true })
  async onVisitorDetailsUpdated(p: VisitorDetailsUpdated) {
    try {
      if (!p?.name) return;
      const s = this.socketStateService.getUserData(p.visitorId);
      if (!s?.assignedAgentId || String(s.conversationId) !== String(p.conversationId)) return;
      this.emitEventToUser(String(s.assignedAgentId), "visitor-updated", {
        conversationId: p.conversationId,
        visitorId: p.visitorId,
        name: p.name,
      });
    } catch (error) {
      this.logger.warn(`visitor-updated notice failed: ${error?.message}`);
    }
  }

  checkIfUserInputMatching(
    message: string,
    node: BotFlowNode,
    userId: string | any
  ): boolean {
    const result = this.evaluateUserInput(message, node);
    if (!result.matched) return false;
    this.captureUserInput(message, node, userId);
    return true;
  }

  async defaultFallback(message: any, node: BotFlowNode, userId: string | any) {
    const response = await this.findAnswerFromQuestionBank(
      message,
      this.socketStateService.getUserData(userId)?.language,
      userId
    );

    if (response) {
      return await this.sendBotMessage(userId, [
        {
          type: "text",
          value: response,
        },
      ]);
    }
    this.saveUnansweredMessage(message, userId);
    if (node?.next.length > 0) {
      const nextNode = await this.botsService.getBotNode(node.next[0]);
      this.socketStateService.updateUserData(userId, {
        currentNode: nextNode,
      });
      return this.handleNode(nextNode, message, userId);
    }
    return await this.sendBotMessage(userId, [
      {
        type: "text",
        value:
          this.socketStateService.getUserData(userId)?.botSettings
            ?.fallbackMessage || "I am sorry, I am not able to understand you",
      },
    ]);
  }
  async handleAddToSegment(
    message: any,
    node: BotFlowNode,
    userId: string | any
  ) {
    const segmentId = node.payload.segmentId;
    await this.segmentsService.addVisitor(segmentId, userId);
    const nextNode = await this.botsService.getBotNode(node.next[0]);
    return this.handleNode(nextNode, message, userId);
  }

  async handleRemoveFromSegment(
    message: any,
    node: BotFlowNode,
    userId: string | any
  ) {
    const segmentId = node.payload.segmentId;
    await this.segmentsService.removeVisitor(segmentId, userId);
    const nextNode = await this.botsService.getBotNode(node.next[0]);
    return this.handleNode(nextNode, message, userId);
  }

  async handleWebHookCall(
    message: any,
    node: BotFlowNode,
    userId: string | any
  ) {
    const nextNodes = await Promise.all(
      node.next.map(async (nodeId: string) => {
        return await this.botsService.getBotNode(nodeId);
      })
    );
    const successNode = nextNodes.find((ele: BotFlowNode) => {
      return ele.nodeType === NodeTypeEnum.SUCCESS;
    });
    const failureNode = nextNodes.find((ele: BotFlowNode) => {
      return ele.nodeType === NodeTypeEnum.FAILURE;
    });
   const webhookId = node.payload?.webhookId;
if (!webhookId) {
  this.logger.warn(
    `WEBHOOK node ${node.id} has no webhookId configured; routing to failure/fallback.`
  );
  if (failureNode) {
    return this.handleNode(failureNode, message, userId);
  }
  // No failure branch either — fall back gracefully instead of crashing.
  return this.defaultFallback(
    message,
    this.socketStateService.getUserData(userId)?.defaultFallback,
    userId
  );
}
    const { attributes, metadata } =
      this.socketStateService.getUserData(userId);
    const data = {
      attributes: attributes,
      event: node.payload.eventField,
      metadata: metadata,
      // visitor: this.user,
    };
    // callWebhook THROWS for a missing/unknown webhook (e.g. an imported flow
    // still carrying a placeholder id). Uncaught, that escaped to handleNode's
    // catch, which sent the generic fallback AND left the visitor parked on this
    // node — so every later message re-ran the broken webhook and replied
    // "Sorry, I did not understand that". Treat any error as a webhook failure.
    let response: Awaited<ReturnType<WebhookService["callWebhook"]>>;
    try {
      response = await this.webhookService.callWebhook(
        webhookId,
        data,
        this.socketStateService.getUserData(userId).botId
      );
    } catch (error) {
      this.logger.warn(
        `WEBHOOK node ${node.id} failed (${error?.message}); routing to failure/fallback.`
      );
      if (failureNode) return this.handleNode(failureNode, message, userId);
      return this.defaultFallback(
        message,
        this.socketStateService.getUserData(userId)?.defaultFallback,
        userId
      );
    }
    if (response.status === WebhookStatusEnum.SUCCESS) {
      if (Array.isArray(response.data)) {
        await this.sendBotMessage(userId, response.data);
      }
      if (response.metadata) {
        this.socketStateService.updateUserData(userId, {
          metadata: {
            ...this.socketStateService.getUserData(userId).metadata,
            ...response.metadata,
          },
        });
      }

      return this.handleNode(successNode, message, userId);
    } else return this.handleNode(failureNode, message, userId);
  }

  async handleGoToStep(message: any, node: BotFlowNode, userId: string | any) {
    const stepId = node.payload.blockId;

    const step = await this.botsService.getBotNode(stepId);
    this.socketStateService.updateUserData(userId, {
      BotNodeState: {},
      questionNodeState: {},
    });
    return this.handleNode(step, message, userId);
  }

  /**
   * TICKET node (crm-incident-handover R1).
   *
   * - Description: problem first, then the node's attribute lines (R1.1, R1.6).
   * - An open incident that already has a Service_Request reuses it (R1.8);
   *   one without gets this ticket linked (R1.2).
   * - The visitor sees the `SR…` ref, never the record `_id` (R1.3).
   * - On failure: one "could not record" message and the FAILURE branch
   *   (R1.9). With no FAILURE branch the visitor rests here, never stuck.
   */
  async handleCreateTicket(
    message: any,
    node: BotFlowNode,
    userId: string | any
  ) {
    const userData = this.socketStateService.getUserData(userId);
    if (!userData) return;
    const { botId, conversationId, attributes, botSettings } = userData;

    const nextNodes: BotFlowNode[] = (
      await Promise.all(
        (node.next || []).map((id: string) =>
          this.botsService.getBotNode(id).catch(() => null)
        )
      )
    ).filter(Boolean);
    const failureNode = nextNodes.find((n) => n.nodeType === NodeTypeEnum.FAILURE);
    const continueNode = nextNodes.find((n) => n.nodeType !== NodeTypeEnum.FAILURE);

    let ticketRef: string | undefined;
    try {
      const incident =
        this.incidentService && conversationId
          ? await this.incidentService
              .findOpenByConversation(String(conversationId))
              .catch(() => null)
          : null;

      if (incident?.ticketRef) {
        ticketRef = incident.ticketRef;
      } else {
        const alias = botSettings?.problemAlias || DEFAULT_PROBLEM_ALIAS;
        const fromAlias = attributes?.[alias];
        const problem =
          incident?.problem && incident.problem !== NO_PROBLEM_TEXT
            ? incident.problem
            : typeof fromAlias === "string"
            ? fromAlias.trim()
            : "";

        const ticket: any = await this.ticketsService.create({
          subject: node.payload?.ticketSubject?.trim() || DEFAULT_TICKET_SUBJECT,
          description: buildTicketDescription(
            problem,
            attributes,
            node.payload?.ticketAttributes
          ),
          visitor: userId,
          bot: botId,
          conversationId,
          incident: incident ? String(incident._id) : undefined,
          crmContactId: incident?.crmContactId,
          source: "chat",
        } as any);
        ticketRef = ticket?.ticketId;

        if (incident) {
          // A concurrent writer may have linked first; quote its ref.
          ticketRef = await this.incidentService
            .linkTicketIfMissing(String(incident._id), ticket)
            .catch(() => ticketRef);
          if (!problem) await this.incidentService.flagNoProblem(String(incident._id));
        }
      }
      if (!ticketRef) throw new Error("ticket created without a reference");
    } catch (e) {
      this.logger.error(`TICKET node ${node.id} failed: ${e?.message}`);
      await this.sendBotMessage(userId, [
        {
          type: "text",
          value:
            "Sorry, we could not record your request right now. Please try again in a moment.",
          info: "error",
        },
      ]);
      if (failureNode) return this.handleNode(failureNode, message, userId);
      return this.restOnTerminalNode("", node, userId);
    }

    await this.sendBotMessage(userId, [
      {
        type: "text",
        value: `Your service request has been raised. Your reference is ${ticketRef}. Please keep it for future reference.`,
      },
    ]);
    if (continueNode) return this.handleNode(continueNode, message, userId);
    return this.restOnTerminalNode("", node, userId);
  }

  // --------------------------------------------- problem gate (R4)

  /**
   * Make sure the handover has a Problem_Description before an incident is
   * opened (R4). Returns the problem when known, or null after asking the
   * visitor (the handover node is resumed once the answer is accepted).
   *
   * Order: an accepted answer for this node, an already-open incident (never
   * ask twice, R4.8), the problem alias (R4.3), else ask (R4.1).
   */
  async ensureProblemDescription(
    userId: string,
    node: BotFlowNode
  ): Promise<{ problem: string; flags: string[] } | null> {
    const s = this.socketStateService.getUserData(userId);
    if (!s) return null;

    if (s.acceptedProblem && s.acceptedProblem.nodeId === node.id) {
      const { problem, flags } = s.acceptedProblem;
      this.socketStateService.updateUserData(userId, { acceptedProblem: undefined });
      return { problem, flags };
    }

    if (this.incidentService && s.conversationId) {
      const open = await this.incidentService
        .findOpenByConversation(String(s.conversationId))
        .catch(() => null);
      if (open) return { problem: open.problem, flags: open.problemFlags ?? [] };
    }

    const alias = s.botSettings?.problemAlias || DEFAULT_PROBLEM_ALIAS;
    const fromAlias = s.attributes?.[alias];
    if (typeof fromAlias === "string" && fromAlias.trim()) {
      const verdict = evaluateProblemAnswer(fromAlias, 1);
      if (verdict.kind === "accept") return { problem: verdict.problem, flags: verdict.flags };
      // A too-short alias value counts as the first short answer (R4.3 + R4.4).
      await this.askProblemQuestion(userId, node.id, 2);
      return null;
    }

    await this.askProblemQuestion(userId, node.id, 1);
    return null;
  }

  /**
   * The problem as far as it is known, without asking (incident first).
   * `fresh` = the visitor just answered the problem question for this node.
   * An open incident's real description and a long-enough problem alias also
   * count. Null = unknown: the handover opens the incident and asks after.
   */
  async knownProblem(
    userId: string,
    node: BotFlowNode
  ): Promise<{ problem: string; flags: string[]; fresh?: boolean } | null> {
    const s = this.socketStateService.getUserData(userId);
    if (!s) return null;
    if (s.acceptedProblem && s.acceptedProblem.nodeId === node.id) {
      const { problem, flags } = s.acceptedProblem;
      this.socketStateService.updateUserData(userId, { acceptedProblem: undefined });
      return { problem, flags, fresh: true };
    }
    if (this.incidentService && s.conversationId) {
      const open = await this.incidentService
        .findOpenByConversation(String(s.conversationId))
        .catch(() => null);
      if (open && !(open.problemFlags ?? []).includes(ProblemFlagEnum.NONE)) {
        return { problem: open.problem, flags: open.problemFlags ?? [] };
      }
    }
    const alias = s.botSettings?.problemAlias || DEFAULT_PROBLEM_ALIAS;
    const fromAlias = s.attributes?.[alias];
    if (typeof fromAlias === "string" && fromAlias.trim()) {
      const verdict = evaluateProblemAnswer(fromAlias, 1);
      if (verdict.kind === "accept") return { problem: verdict.problem, flags: verdict.flags };
    }
    return null;
  }

  private async askProblemQuestion(userId: string, nodeId: string, attempt: number) {
    const s = this.socketStateService.getUserData(userId);
    const question = s?.botSettings?.problemQuestion?.trim() || DEFAULT_PROBLEM_QUESTION;
    await this.sendBotMessage(userId, [
      {
        type: "text",
        value: attempt > 1 ? `${question} ${PROBLEM_REASK_EXAMPLE}` : question,
      },
    ]);
    const askedAt = Date.now();
    this.socketStateService.updateUserData(userId, {
      awaitingProblem: { attempt, askedAt, nodeId },
      acceptedProblem: undefined,
    });
    if (s?.conversationId && s.mode !== ModeEnum.preview) {
      await this.conversationService.setAwaitingProblem(String(s.conversationId), {
        attempt,
        askedAt: new Date(askedAt),
      });
    }
  }

  private async clearAwaitingProblem(userId: string) {
    const s = this.socketStateService.getUserData(userId);
    this.socketStateService.updateUserData(userId, { awaitingProblem: undefined });
    if (s?.conversationId && s.mode !== ModeEnum.preview) {
      await this.conversationService.setAwaitingProblem(String(s.conversationId), null);
    }
  }

  /**
   * Consume the visitor's reply to a pending problem question. Returns true
   * when the message was handled here and must not reach the flow.
   *
   * Restart words, an expired question (R4.7) or the feature being switched
   * off all drop the pending handover and let the message through normally.
   */
  private async consumeProblemAnswer(
    userId: string,
    message: any,
    type: string
  ): Promise<boolean> {
    const s = this.socketStateService.getUserData(userId);
    const pending = s?.awaitingProblem;
    if (!pending) return false;

    const raw = type === "text" && typeof message === "string" ? message.trim() : "";
    if (
      !isFeatureOn(s.botSettings as any, "incidentHandover") ||
      isProblemQuestionExpired(pending.askedAt) ||
      GATE_ESCAPE_WORDS.has(raw.toLowerCase())
    ) {
      await this.clearAwaitingProblem(userId);
      return false;
    }

    // "I want an agent" again is a request, not a description.
    const nonDescriptive = matchesAgentIntent(raw, s.botSettings?.agentIntents);
    const verdict = evaluateProblemAnswer(raw, pending.attempt, nonDescriptive);
    if (verdict.kind === "reask") {
      await this.askProblemQuestion(userId, pending.nodeId, pending.attempt + 1);
      return true;
    }

    await this.clearAwaitingProblem(userId);
    this.socketStateService.updateUserData(userId, {
      acceptedProblem: { problem: verdict.problem, flags: verdict.flags, nodeId: pending.nodeId },
    });
    const node = await this.botsService.getBotNode(pending.nodeId).catch(() => null);
    if (!node) {
      this.socketStateService.updateUserData(userId, { acceptedProblem: undefined });
      return false;
    }
    this.socketStateService.updateUserData(userId, { currentNode: node });
    await this.handleNode(node, "", userId);
    return true;
  }

  /** Real calendar date check — rejects things like 32/01/2026 or month 15. */
  private isRealDate(year: number, month: number, day: number): boolean {
    if (!(month >= 1 && month <= 12) || !(day >= 1 && day <= 31)) return false;
    const dt = new Date(year, month - 1, day);
    return (
      dt.getFullYear() === year &&
      dt.getMonth() === month - 1 &&
      dt.getDate() === day
    );
  }

  /**
   * Date validation that does not rely on Date.parse alone.
   *
   * `Date.parse("1")` succeeds (it means the year 2001), so the old
   * `!isNaN(Date.parse(message))` check accepted a bare "1" as a valid date.
   * Date.parse also rejects the day-first format most of the world writes, so
   * "15/01/2026" used to fail. Handle the numeric forms explicitly and only fall
   * back to Date.parse for spelled-out months.
   */
  private isValidDate(text: string): boolean {
    const dmy = text.match(DMY_DATE);
    if (dmy) {
      const day = Number(dmy[1]);
      const month = Number(dmy[2]);
      const year = Number(dmy[3]);
      // Accept day-first (common outside the US) or month-first.
      return (
        this.isRealDate(year, month, day) || this.isRealDate(year, day, month)
      );
    }
    const ymd = text.match(YMD_DATE);
    if (ymd) {
      return this.isRealDate(Number(ymd[1]), Number(ymd[2]), Number(ymd[3]));
    }
    if (MONTH_NAME.test(text)) return !isNaN(Date.parse(text));
    return false;
  }

  /** Count of significant digits, for phone-number length checks. */
  private digitCount(text: string): number {
    return (text.match(/\d/g) || []).length;
  }

  validationCheck(validation: string, message: any) {
    // Callers pass values straight off the wire, and QUESTIONS elements may omit
    // `entity` entirely, so normalise defensively instead of assuming a string.
    const text =
      typeof message === "string"
        ? message.trim()
        : message == null
        ? ""
        : String(message).trim();
    const lower = text.toLowerCase();

    switch (validation) {
      case UserInputValidationEnum.EMAIL:
        return isEmail(text);

      case UserInputValidationEnum.NUMBER:
        // `!isNaN("")` and `!isNaN("   ")` are both true, so an empty answer
        // used to pass as a number.
        return text.length > 0 && !isNaN(Number(text));

      case UserInputValidationEnum.TEXT:
        // `isString()` is true for every string, including "", so this branch
        // never rejected anything at all.
        return text.length > 0;

      case UserInputValidationEnum.ANY:
        return true;

      case UserInputValidationEnum.DATE:
        return this.isValidDate(text);

      case UserInputValidationEnum.ALPHANUMERIC:
        // The quantifier was `*`, which matches the empty string.
        return /^[a-zA-Z0-9]+$/.test(text);

      case UserInputValidationEnum.YES_NO:
        return YES_WORDS.has(lower) || NO_WORDS.has(lower);
      case UserInputValidationEnum.YES:
        return YES_WORDS.has(lower);
      case UserInputValidationEnum.NO:
        return NO_WORDS.has(lower);

      case UserInputValidationEnum.PHONE:
        // Was `!isNaN(message)`, which rejected "+91 98765 43210" (not a
        // number), accepted the single digit "5" as a mobile number, and
        // accepted "" and "   ".
        return (
          PHONE_SHAPE.test(text) &&
          this.digitCount(text) >= PHONE_MIN_DIGITS &&
          this.digitCount(text) <= PHONE_MAX_DIGITS
        );

      case UserInputValidationEnum.COUNTRY:
        // Had no case at all, so it fell through to `default: true` and accepted
        // any input including the empty string.
        return /^[a-zA-Z][a-zA-Z\s.'-]*$/.test(text);

      default:
        return true;
    }
  }

  /** Flow-builder "Terminal" toggle with the closure prompt on (R14.1). */
  private terminalHere(node: BotFlowNode, userId: string): boolean {
    return isMarkedTerminal(node) && closureApplies(this.socketStateService.getUserData(userId));
  }

  async handleFailureNode(
    message: any,
    node: BotFlowNode,
    userId: string | any
  ) {
    if (this.terminalHere(node, userId)) return this.sendClosurePrompt(userId, node);
    if (node.next?.length) {
      const nextNode = await this.botsService.getBotNode(node.next[0]);
      return this.handleNode(nextNode, message, userId);
    }
    // Dead end: keep the conversation alive with the AI assistant instead of
    // going mute. This is exactly the case that stranded customers — a template
    // link expired, routed to an unwired FAILURE branch, and every later message
    // hit a silent node.
    return this.restOnTerminalNode(message, node, userId);
  }

  /**
   * TIMEOUT branch of an OPEN_TEMPLATE node — reached when the form was opened
   * but not completed before the session timed out. Behaves like the FAILURE
   * branch: continue the scripted flow if one is wired, otherwise hand the
   * conversation to the AI assistant rather than dead-ending. (Without this
   * case, TIMEOUT fell through to the default fallback and then went silent.)
   */
  async handleTimeoutNode(
    message: any,
    node: BotFlowNode,
    userId: string | any
  ) {
    if (this.terminalHere(node, userId)) return this.sendClosurePrompt(userId, node);
    if (node.next?.length) {
      const nextNode = await this.botsService.getBotNode(node.next[0]);
      return this.handleNode(nextNode, message, userId);
    }
    return this.restOnTerminalNode(message, node, userId);
  }

  /**
   * The scripted flow has ended on a terminal branch with nothing wired after
   * it. Rather than leaving the customer talking to a dead node, park here and
   * let the AI assistant field further messages. Keeping currentNode on this
   * node means every subsequent message routes back here and is answered.
   *
   * The first landing usually carries an empty message (routeTemplateResume /
   * handleNode pass ""), so there is nothing to answer yet — just take up the
   * resting position and wait for the customer's next real message.
   */
  private async restOnTerminalNode(
    message: any,
    node: BotFlowNode,
    userId: string | any
  ) {
    // Every caller is a Terminal_Outcome (a SUCCESS/FAILURE/TIMEOUT branch,
    // a ticket or handover with nothing wired after it). With the closure
    // prompt on, ask whether the query is resolved instead of parking on
    // the AI (R14.1, design §12). Off: unchanged.
    if (closureApplies(this.socketStateService.getUserData(userId))) {
      return this.sendClosurePrompt(userId, node);
    }
    this.socketStateService.updateUserData(userId, { currentNode: node });
    if (typeof message === "string" && message.trim()) {
      await this.answerWithAiAssistant(message, userId);
    }
  }

  // ------------------------------------------ closure prompt (R14)

  /**
   * Send the Closure_Prompt once and start its idle clock (R14.1, R14.5).
   * The terminal node stays current so a later message has a resting place.
   * Never while Agent_Owned (R14.11, checked by closureApplies).
   */
  private async sendClosurePrompt(userId: string, node: BotFlowNode) {
    const s = this.socketStateService.getUserData(userId);
    if (!s) return;
    this.socketStateService.updateUserData(userId, { currentNode: node });
    // Exactly one prompt: a second terminal in the same wait is not re-asked.
    if (s.awaitingClosure) return;
    const sentAt = Date.now();
    const idleMinutes = closureIdleMinutes(s.botSettings);
    this.socketStateService.updateUserData(userId, {
      awaitingClosure: { sentAt, idleMinutes },
      closureAnsweredAt: undefined,
    });
    this.trace("closure:prompt", `node=${node?.id} idle=${idleMinutes}m`);
    await this.sendBotMessage(userId, [closurePromptMessage(s.botSettings)]);
    if (s.mode !== ModeEnum.preview && s.conversationId) {
      await this.conversationService.setAwaitingClosure?.(String(s.conversationId), {
        sentAt: new Date(sentAt),
        idleMinutes,
        closingMessage: closingMessageText(s.botSettings),
      } as any);
    }
  }

  /**
   * Take the pending prompt off this conversation (memory first, so only the
   * first reply acts on it, R14.1), then clear the persisted copy.
   */
  private settleClosure(userId: string, opts: { answered?: boolean } = { answered: true }) {
    const s = this.socketStateService.getUserData(userId);
    if (!s?.awaitingClosure) return;
    this.socketStateService.updateUserData(userId, {
      awaitingClosure: undefined,
      closureAnsweredAt: opts.answered === false ? s.closureAnsweredAt : Date.now(),
    });
    if (s.mode !== ModeEnum.preview && s.conversationId) {
      void this.conversationService
        .setAwaitingClosure?.(String(s.conversationId), null)
        ?.catch?.(() => undefined);
    }
  }

  /**
   * The first visitor input after a Closure_Prompt (R14.2–R14.4, R14.10).
   * Returns "handled" when nothing else should run, "restart" for the normal
   * restart path, or false to let the message through untouched.
   */
  private async consumeClosureAnswer(
    userId: string,
    message: string
  ): Promise<"handled" | "restart" | false> {
    const s = this.socketStateService.getUserData(userId);
    if (!s) return false;
    const pending = s.awaitingClosure;
    if (!pending) {
      // A second click on an already-answered prompt is ignored (R14.1).
      return s.closureAnsweredAt && isClosureLabel(message) ? "handled" : false;
    }
    // Flag switched off, or an agent owns the chat now: the prompt lapses.
    if (!closureApplies(s)) {
      this.settleClosure(userId, { answered: false });
      return false;
    }
    const reply = parseClosureReply(message);
    if (reply.kind === "none") return "handled";
    // Claimed synchronously, before any await: a concurrent second reply sees
    // no pending prompt and is ignored or routed normally.
    this.settleClosure(userId);
    this.trace("closure:reply", reply.kind);

    if (reply.kind === "restart") return "restart";

    if (reply.kind === "resolved") {
      const conv = s.conversationId ? String(s.conversationId) : "";
      if (this.incidentService && conv && s.mode !== ModeEnum.preview) {
        await this.incidentService
          .resolveByVisitor(conv)
          .catch((e) => this.logger.warn(`Closure incident resolve failed: ${e?.message}`));
      }
      await this.closeConversation(userId, "closure_resolved");
      return "handled";
    }

    if (reply.kind === "other") {
      // R14.3: one question, then the next message is the first input at
      // the start node. Attributes and the CRM link are kept.
      await this.sendBotMessage(userId, [{ type: "text", value: SOMETHING_ELSE_TEXT }]);
      await this.prepareStart(userId);
      return "handled";
    }

    // R14.10: free text is "something else" with the text as the first input.
    const at = await this.prepareStart(userId);
    if (at) await this.handleNode(at, message, userId);
    return "handled";
  }

  /**
   * Position the conversation at the start node without sending anything,
   * so the next input is read as the first input there. The start node's
   * menu (when it is one) is marked as already shown, so the input is
   * matched against its options instead of re-printing it (R14.3, R14.10).
   * Attributes are kept; only node progress is reset.
   */
  private async prepareStart(userId: string): Promise<BotFlowNode | null> {
    const s = this.socketStateService.getUserData(userId);
    const start = s?.startNode;
    if (!start) return null;
    this.socketStateService.updateUserData(userId, {
      BotNodeState: {},
      questionNodeState: {},
      awaitingProblem: undefined,
      acceptedProblem: undefined,
      currentNode: start,
    });
    const kids: BotFlowNode[] = (
      await Promise.all(
        (start.next || []).map((id: string) => this.botsService.getBotNode(id).catch(() => null))
      )
    ).filter(Boolean);
    const fallback = kids.find((n) => n.nodeType === NodeTypeEnum.FALL_BACK);
    const entry = kids.find((n) => n.nodeType !== NodeTypeEnum.FALL_BACK);
    this.socketStateService.updateUserData(userId, { defaultFallback: fallback });
    if (entry?.nodeType === NodeTypeEnum.BOT_RESPONSE && (entry.next?.length ?? 0) > 1) {
      this.socketStateService.setNodeState(userId, entry.id, BotNodeStateEnum.AWAITING_USER_INPUT);
      this.socketStateService.updateUserData(userId, { currentNode: entry });
      return entry;
    }
    return start;
  }

  /**
   * End the conversation with the closing message and put the widget in the
   * Ended_State (R14.2, R14.5, CLOSE_CHAT R14 via 6.4). The state entry is
   * kept (marked ended) so the closing message, which is sent on a delay,
   * still reaches the socket, and so later input is refused, not processed.
   */
  private async closeConversation(
    userId: string,
    cause: ClosureEndCause | "close_chat",
    text?: string
  ) {
    const s = this.socketStateService.getUserData(userId);
    if (!s || s.conversationEnded) return;
    const conversationId = s.conversationId ? String(s.conversationId) : undefined;
    this.socketStateService.updateUserData(userId, {
      conversationEnded: true,
      awaitingClosure: undefined,
      awaitingProblem: undefined,
      pendingIdentity: undefined,
      pendingConfirm: undefined,
    });
    await this.sendBotMessage(userId, [
      { type: "text", value: text ?? closingMessageText(s.botSettings) },
    ]);
    if (s.botSettings?.askForFeedback) {
      this.emitEventToUser(userId, "ask-for-feedback", {});
    }
    // After the closing message: sendBotMessage staggers on this baseline.
    const delay = this.socketStateService.getUserData(userId)?.messageDelay ?? 0;
    const timer = setTimeout(
      () =>
        this.emitEventToUser(userId, CONVERSATION_ENDED_EVENT, {
          conversationId,
          notice: ENDED_NOTICE,
        }),
      delay
    );
    (timer as any).unref?.();
    if (conversationId && s.mode !== ModeEnum.preview) {
      await this.conversationService.endConversation(conversationId, undefined, cause);
    }
  }

  private closureCronRunning = false;

  /**
   * Idle close (R14.5): a Closure_Prompt with no reply within the bot's idle
   * minutes (default 10, 1–60) closes the conversation once. The claim on
   * the persisted prompt makes one instance and one path win; a visitor
   * reply already being handled here wins over the cron.
   */
  @Interval("closure-idle-close", 60_000)
  async closeIdleClosures(now: Date = new Date()): Promise<number> {
    if (this.closureCronRunning) return 0;
    this.closureCronRunning = true;
    let closed = 0;
    try {
      const candidates = (await this.conversationService.findClosureCandidates?.(now)) ?? [];
      for (const c of candidates) {
        try {
          const local = this.socketStateService.getUserData(c.visitorId);
          const mine = local && String(local.conversationId) === c.id ? local : null;
          // R14.11: an agent owns it now; no countdown.
          if (mine?.handledByAgent) {
            this.settleClosure(c.visitorId, { answered: false });
            await this.conversationService.claimClosure(c.id, c.sentAt);
            continue;
          }
          const idle = mine?.awaitingClosure?.idleMinutes ?? c.idleMinutes ?? CLOSURE_IDLE_DEFAULT_MIN;
          if (!isClosureIdle(c.sentAt, idle, now.getTime())) continue;
          // The visitor already answered here (the persisted clear lost a race
          // with the prompt's own write, or is still in flight): the marker
          // is stale. Clear it so it is not re-scanned every minute.
          if (mine && !mine.awaitingClosure) {
            await this.conversationService.claimClosure(c.id, c.sentAt);
            continue;
          }
          if (!(await this.conversationService.claimClosure(c.id, c.sentAt))) continue;
          if (mine) {
            this.socketStateService.updateUserData(c.visitorId, { awaitingClosure: undefined });
            await this.closeConversation(c.visitorId, "idle");
          } else {
            // Visitor gone, or connected to another instance: end it here and
            // let whichever instance holds the socket deliver the notice.
            await this.conversationService.endConversation(c.id, undefined, "idle");
            const value = (c as any).closingMessage || DEFAULT_CLOSING_MESSAGE;
            this.redisPropagatorService.propagateEvent({
              event: "chat-message-bot",
              userId: c.visitorId,
              data: {
                message: {
                  id: generateId("message", 10),
                  type: ChatTypeEnum.TEXT,
                  value,
                  time: new Date(),
                  senderRole: "bot",
                },
              },
            } as any);
            this.redisPropagatorService.propagateEvent({
              event: CONVERSATION_ENDED_EVENT,
              userId: c.visitorId,
              data: { conversationId: c.id, notice: ENDED_NOTICE },
            } as any);
          }
          closed++;
        } catch (error) {
          this.logger.warn(`Idle close of ${c.id} failed: ${error?.message}`);
        }
      }
    } catch (error) {
      this.logger.warn(`Idle close sweep failed: ${error?.message}`);
    } finally {
      this.closureCronRunning = false;
    }
    return closed;
  }

  async handleSuccessNode(
    message: any,
    node: BotFlowNode,
    userId: string | any
  ) {
    // Deliver the SUCCESS node's own message first, if the builder attached one
    // (e.g. a "thank you" after a template submit). This node used to be a pure
    // router that discarded node.responses entirely, so any message configured
    // on it was silently dropped. sendBotMessage interpolates {{attributes}},
    // and a template submit merges the submitted fields into attributes before
    // this runs, so the copy can reference what the customer just entered
    // (e.g. "You're booked for {{slot}}").
    //
    // Delivered ONCE: when this node has no continuation it becomes the resting
    // node (see restOnTerminalNode), so without this guard the thank-you would
    // be re-sent on every subsequent message the AI assistant then handles.
    const alreadyDelivered =
      this.socketStateService.getNodeState(userId, node.id) ===
      BotNodeStateEnum.VISITED;
    if (node.responses?.length && !alreadyDelivered) {
      await this.sendBotMessage(userId, node.responses);
    }
    this.socketStateService.setNodeState(userId, node.id, BotNodeStateEnum.VISITED);

    if (this.terminalHere(node, userId)) return this.sendClosurePrompt(userId, node);
    if (node.next?.length) {
      const nextNode = await this.botsService.getBotNode(node.next[0]);
      return this.handleNode(nextNode, message, userId);
    }
    // No continuation wired: keep answering via the AI assistant instead of
    // dead-ending after the confirmation.
    return this.restOnTerminalNode(message, node, userId);
  }

  /**
   * TRANSFER_TO_AGENT entry point. With `incidentHandover` on, every request
   * for a human becomes an Incident + Service_Request and the visitor is
   * never told about agent availability (R19, D2). With it off, the original
   * behaviour below is kept unchanged.
   */
  async TransferToAgent(message: any, node: BotFlowNode, userId: string | any) {
    const s = this.socketStateService.getUserData(userId);
    if (s && this.incidentService && isFeatureOn(s.botSettings as any, "incidentHandover")) {
      return this.handoverWithIncident(message, node, userId);
    }
    return this.legacyTransferToAgent(message, node, userId);
  }

  /**
   * R19 handover:
   * 1. problem gate (asks and resumes this node when needed, R4)
   * 2. incident + ticket in one operation (contact linked inside, R19.1/R20.1)
   * 3. one handover message with the ticket ref (R19.2)
   * 4. silent agent offer: alert already raised; assign only if someone is online
   * 5. SUCCESS branch (or rest here so flow/AI keep answering, R19.3)
   * FAILURE only when the incident or ticket could not be created (R19.5).
   */
  private async handoverWithIncident(message: any, node: BotFlowNode, userId: string) {
    const s = this.socketStateService.getUserData(userId);
    if (!s) return;
    const { botId, mode, conversationId, visitorName, botSettings, attributes } = s;

    const nextNodes: BotFlowNode[] = (
      await Promise.all((node.next || []).map((id: string) => this.botsService.getBotNode(id).catch(() => null)))
    ).filter(Boolean);
    const successNode = nextNodes.find((n) => n.nodeType === NodeTypeEnum.SUCCESS);
    const failureNode = nextNodes.find((n) => n.nodeType === NodeTypeEnum.FAILURE);

    // Already with an agent: nothing to hand over again. An answer to the
    // problem question that arrives after the takeover is still recorded.
    if (s.handledByAgent) {
      if (s.acceptedProblem?.nodeId === node.id && conversationId && mode !== ModeEnum.preview) {
        const fresh = await this.knownProblem(userId, node);
        const open = await this.incidentService.findOpenByConversation(String(conversationId)).catch(() => null);
        if (fresh?.fresh && open) {
          await this.incidentService.recordProblem(String(open._id), {
            problem: fresh.problem,
            flags: fresh.flags,
            description: buildTicketDescription(fresh.problem, attributes, node.payload?.ticketAttributes),
          });
        }
      }
      return;
    }

    // Incident first (owner decision): the request is recorded the moment the
    // visitor asks for a person, before any question, so nothing is lost when
    // no agent picks it up. A problem we do not know yet is asked afterwards
    // and written onto the incident and its request.
    const known = await this.knownProblem(userId, node);

    let ticketRef: string | undefined;
    let created = false;
    let incident: any = null;
    try {
      const res = await this.incidentService.openForHandover({
        conversationId: String(conversationId),
        botId: String(botId),
        visitorId: String(userId),
        visitorName,
        problem: known?.problem ?? NO_PROBLEM_TEXT,
        flags: (known?.flags ?? [ProblemFlagEnum.NONE]) as any,
        reason: node.payload?.emergency === true ? AlertReasonEnum.EMERGENCY : AlertReasonEnum.FLOW_TRANSFER,
        emergency: node.payload?.emergency === true,
        subject: node.payload?.ticketSubject,
        attributes,
        attributeNames: node.payload?.ticketAttributes,
        mode,
        botSettings,
      });
      // Preview persists nothing; show the message with a sample ref.
      ticketRef = res ? res.ticketRef : "SR_PREVIEW";
      created = res ? res.created : true;
      incident = res?.incident ?? null;
      // A brand-new incident without a ref is a real failure. An existing one
      // whose ref a concurrent trigger is still writing is not: the request IS
      // recorded, so never tell the visitor it failed.
      if (!ticketRef && created) throw new Error("incident opened without a ticket reference");
    } catch (error) {
      this.logger.error(`Handover incident failed for ${conversationId}: ${error?.message}`);
      await this.sendBotMessage(userId, [
        {
          type: "text",
          value: "Sorry, we could not record your request right now. Please try again in a moment.",
          info: "error",
        },
      ]);
      if (failureNode) return this.handleNode(failureNode, message, userId);
      return this.restOnTerminalNode("", node, userId);
    }

    // The visitor's answer to the problem question arrives on an incident
    // that already exists: fill it in, whoever is handling the chat now.
    const missingProblem =
      !incident || (incident.problemFlags ?? []).includes(ProblemFlagEnum.NONE);
    if (known?.fresh && incident && missingProblem && mode !== ModeEnum.preview) {
      await this.incidentService.recordProblem(String(incident._id), {
        problem: known.problem,
        flags: known.flags,
        description: buildTicketDescription(known.problem, attributes, node.payload?.ticketAttributes),
      });
    }

    // An agent took over while we were recording: their "joined" notice
    // already went out; don't follow it with "a specialist will connect".
    if (this.socketStateService.getUserData(userId)?.handledByAgent) return;

    // Exactly one "created" message per incident (R19.2): a repeat request on
    // an open incident quotes the same ref. Sent as a highlighted status
    // message (`info: success`) so the widget shows it as a ticket card.
    const template = botSettings?.handoverMessage?.trim() || DEFAULT_HANDOVER_MESSAGE;
    const ref = ticketRef ? ` ${ticketRef}` : "";
    await this.sendBotMessage(userId, [
      {
        type: "text",
        info: "success",
        value: created
          ? renderHandoverMessage(template, ticketRef)
          : known?.fresh
          ? `Thank you. I have added this to your incident ticket${ref}.`
          : `Your incident ticket${ref} is already recorded.`,
      },
    ]);

    // Live chat (owner decision): an online agent of this bot takes the chat
    // now, so it lands in their Live Chat tab. The problem question is left
    // to the agent; the wrap-up at close fills the ticket from the chat.
    const agent =
      mode === ModeEnum.preview ? null : await this.agentService.assignAgent(String(botId)).catch(() => null);
    if (agent) {
      await this.connectLiveAgent(userId, { id: String(agent.id), name: agent.name }, {
        incidentId: incident?._id ? String(incident._id) : undefined,
        successNode,
      });
      return;
    }

    // Nobody free: say so (no promise of a time) and keep the chat with the
    // bot. The alert stays open; the first agent to accept it takes the chat.
    const waitingFor = !this.socketStateService.getUserData(userId)?.awaitingProblem;
    if (waitingFor && (created || !known?.fresh)) {
      await this.sendBotMessage(userId, [
        {
          type: "text",
          info: "info",
          value: "All our specialists are busy right now. Please stay in this chat and one of them will join you as soon as they are free. If you leave, we will follow up on your ticket.",
        },
      ]);
    }

    // Still no description: ask now, so the ticket is useful even if nobody
    // joins. The answer resumes this node and is added to the same ticket.
    if (!known && missingProblem && waitingFor) {
      await this.askProblemQuestion(userId, node.id, 1);
      return;
    }

    if (successNode) return this.handleNode(successNode, "", userId);
    return this.restOnTerminalNode("", node, userId);
  }

  /**
   * Hand the visitor to an agent as a live chat (the Live Chat tab): the
   * conversation becomes the agent's, the visitor is told who joined, the
   * agent's dashboard gets the chat, the incident becomes agent_active (its
   * service request is assigned and moved to In Progress) and the alert is
   * cleared for everyone else. Used by the handover and by an agent who
   * accepts a waiting alert. Idempotent per agent.
   */
  async connectLiveAgent(
    userId: string,
    agent: { id: string; name?: string },
    opts: { incidentId?: string; successNode?: BotFlowNode | null } = {},
  ): Promise<boolean> {
    const s = this.socketStateService.getUserData(userId);
    if (!s?.conversationId) return false;
    const { botId, botName, conversationId, visitorName, mode } = s;
    if (s.handledByAgent && String(s.assignedAgentId) === String(agent.id)) return true;
    const name = (agent.name || "").trim() || "A specialist";

    this.socketStateService.updateUserData(userId, {
      handledByAgent: true,
      assignedAgentId: agent.id,
      // onAgentTookOver must not announce the same agent a second time.
      announcedAgentId: agent.id,
      awaitingProblem: undefined,
      ...(opts.successNode ? { currentNode: opts.successNode } : {}),
    });
    if (s.awaitingClosure) this.settleClosure(userId, { answered: false });

    if (mode !== ModeEnum.preview) {
      this.eventEmitter.emit("conversation.created.agent", { agentId: agent.id, conversationId });
      this.eventEmitter.emit("agent.added.visitor", { agentId: agent.id, visitorId: userId });
      await this.conversationService.transferConversationToAgent(conversationId, agent.id).catch((e) =>
        this.logger.warn(`Live chat transfer of ${conversationId} failed: ${e?.message}`)
      );
      if (this.handoverAlertService) {
        await this.handoverAlertService.setAssigned(String(conversationId), agent.id).catch(() => undefined);
        await this.handoverAlertService
          .acknowledgeByConversation(String(conversationId), AlertResolutionEnum.TAKEN_OVER, agent.id)
          .catch(() => undefined);
      }
      if (this.incidentService) {
        const incidentId =
          opts.incidentId ??
          (await this.incidentService.findOpenByConversation(String(conversationId)).catch(() => null))?._id;
        if (incidentId) await this.incidentService.accept(String(incidentId), agent.id).catch(() => undefined);
      }
    }

    await this.sendBotMessage(userId, [
      {
        type: "text",
        value: `${name} has joined the chat and will help you from here.`,
        switchToAgent: true,
        agentName: name,
        info: "success",
      },
    ]);

    // The agent's Live Chat tab (R9.2: ids, so the full history loads).
    const threadId = await this.handoverAlertService
      ?.threadIdForConversation?.(String(conversationId))
      .catch(() => undefined);
    // The Web Chat mirror shows the same owner, so nobody else "takes over" it.
    if (threadId && mode !== ModeEnum.preview) {
      this.eventEmitter.emit(LIVE_CHAT_CONNECTED, { threadId: String(threadId), agentId: agent.id });
    }
    this.emitEventToUser(agent.id, "new-visitor", {
      _id: conversationId,
      conversationId,
      threadId: threadId ? String(threadId) : undefined,
      visitor: { _id: userId, name: visitorName },
      bot: { _id: botId, name: botName },
      chats: [],
    });
    return true;
  }

  /**
   * An agent accepted a waiting chat from the alert (Live Chat tab). Refuses
   * when another agent already has it, so two agents never share one chat.
   */
  // Not `async: true`: the caller awaits the result through emitAsync.
  @OnEvent(AGENT_ACCEPT_LIVE)
  async onAgentAcceptLive(p: { visitorId: string; agentId: string; agentName?: string }): Promise<LiveAcceptResult> {
    try {
      const s = this.socketStateService.getUserData(String(p.visitorId));
      // The visitor's chat is not live on this server any more (left, or ended).
      if (!s?.conversationId) return "offline";
      if (s.handledByAgent && String(s.assignedAgentId) !== String(p.agentId)) return "taken";
      let name = p.agentName;
      if (!name) {
        const a: any = await this.agentService.findOne(String(p.agentId)).catch(() => null);
        name = a?.name;
      }
      return (await this.connectLiveAgent(String(p.visitorId), { id: String(p.agentId), name })) ? "connected" : "offline";
    } catch (error) {
      this.logger.warn(`Live accept failed: ${error?.message}`);
      return "offline";
    }
  }

  /**
   * An agent took over the conversation (inbox takeover or incident accept):
   * tell the visitor who they are talking to (R19.4) and mark the incident
   * agent_active (R10). Idempotent per agent.
   */
  @OnEvent(AGENT_TOOK_OVER, { async: true })
  async onAgentTookOver(p: { visitorId: string; conversationId?: string; agentId: string; agentName?: string }) {
    try {
      const s = this.socketStateService.getUserData(p.visitorId);
      if (!s || s.mode === ModeEnum.preview) return;
      const conversationId = p.conversationId ?? s.conversationId;
      // R14.11: Agent_Owned means no Closure_Prompt and no idle countdown.
      if (s.awaitingClosure) this.settleClosure(p.visitorId, { answered: false });
      if (s.announcedAgentId === String(p.agentId)) return;
      this.socketStateService.updateUserData(p.visitorId, { announcedAgentId: String(p.agentId) });

      if (this.incidentService && conversationId) {
        const open = await this.incidentService.findOpenByConversation(String(conversationId)).catch(() => null);
        if (open) await this.incidentService.accept(String(open._id), String(p.agentId)).catch(() => undefined);
      }
      const name = (p.agentName || "").trim() || "A specialist";
      await this.sendBotMessage(p.visitorId, [
        {
          type: "text",
          value: `${name} has joined the chat and will help you from here.`,
          switchToAgent: true,
          agentName: name,
          info: "success",
        },
      ]);
    } catch (error) {
      this.logger.warn(`Agent takeover notice failed: ${error?.message}`);
    }
  }

  /** Agent handed the chat back to the bot (R10.2): incident stays open. */
  @OnEvent(AGENT_RELEASED, { async: true })
  async onAgentReleased(p: { conversationId: string; agentId?: string; visitorId?: string }) {
    try {
      if (p.visitorId && this.socketStateService.getUserData(p.visitorId)) {
        this.socketStateService.updateUserData(p.visitorId, { announcedAgentId: undefined });
      }
      await this.incidentService?.recordRelease(String(p.conversationId), p.agentId);
    } catch (error) {
      this.logger.warn(`Agent release record failed: ${error?.message}`);
    }
  }

  /** The pre-incident behaviour, kept for bots without `incidentHandover`. */
  private async legacyTransferToAgent(message: any, node: BotFlowNode, userId: string | any) {
    const { botId, mode, conversationId, botName, visitorName } =
      this.socketStateService.getUserData(userId);

    if (!node.next.length) {
      return;
    }

    const nextNodes = await Promise.all(
      node.next.map(async (nodeId: string) => {
        return await this.botsService.getBotNode(nodeId);
      })
    );

    const successNode = nextNodes.find((ele: BotFlowNode) => {
      return ele.nodeType === NodeTypeEnum.SUCCESS;
    });

    const failureNode = nextNodes.find((ele: BotFlowNode) => {
      return ele.nodeType === NodeTypeEnum.FAILURE;
    });

    // Raise the agent alert BEFORE assignment, so a request made while no
    // agent is online still reaches the bot's agents and org admins. An
    // emergency node is marked explicitly on the node, never inferred from text.
    await this.raiseHandover(
      userId,
      node.payload?.emergency === true
        ? AlertReasonEnum.EMERGENCY
        : AlertReasonEnum.FLOW_TRANSFER
    );

    const agent = await this.agentService.assignAgent(botId);

    if (!agent) {
      await this.sendBotMessage(userId, [
        {
          value:
            'No agent is available at the moment. Please try again later. Enter "Start" to restart the conversation.',
          type: "text",
          info: "error",
        },
      ]);
      return this.handleNode(failureNode, message, userId);
    }
    this.logger.debug(
      "Chat transfered is being forwarded to agent" + agent.name
    );
    this.eventEmitter.emit("conversation.created.agent", {
      agentId: agent.id,
      conversationId: conversationId,
    });

    this.eventEmitter.emit("agent.added.visitor", {
      agentId: agent.id,
      visitorId: userId,
    });
    const assignedAgentId = agent.id;

    if (this.handoverAlertService && conversationId && mode !== ModeEnum.preview) {
      await this.handoverAlertService
        .setAssigned(String(conversationId), String(assignedAgentId))
        .catch(() => undefined);
    }

    if (mode !== ModeEnum.preview) {
      await this.conversationService.transferConversationToAgent(
        conversationId,
        assignedAgentId
      );
    }
    // crm-incident-handover R9.2: ids so the dashboard loads the full history
    // from the server instead of trusting this (empty) chats array.
    const threadId = await this.handoverAlertService
      ?.threadIdForConversation?.(String(conversationId))
      .catch(() => undefined);
    const conversation = {
      _id: conversationId,
      conversationId,
      threadId: threadId ? String(threadId) : undefined,
      visitor: {
        _id: userId,
        // Per visitor: a singleton field here showed the agent whichever
        // visitor's name last passed through the handler.
        name: visitorName,
      },
      bot: {
        _id: botId,
        name: botName,
      },
      chats: [],
    };

    await this.sendBotMessage(userId, [
      {
        type: "text",
        value: `Welcome to ${botName}. I am ${agent.name}, How may I assist you?`,
        switchToAgent: true,
        agentName: agent.name,
        info: "success",
      },
    ]);
    this.socketStateService.updateUserData(userId, {
      handledByAgent: true,
      assignedAgentId,
    });

    this.emitEventToUser(assignedAgentId, "new-visitor", conversation);
    this.socketStateService.updateUserData(userId, {
      currentNode: successNode,
    });
  }

  async handleAttachmentInput(
    message: any,
    node: BotFlowNode,
    userId: string | any
  ) {
    const nextNode = await this.botsService.getBotNode(node.next[0]);

    if (node.payload.alias) {
      this.socketStateService.updateUserData(userId, {
        attributes: {
          ...this.socketStateService.getUserData(userId)?.attributes,
          [node.payload.alias]: this.captureValue(message, userId),
        },
      });
      this.emitAttributeCaptured(userId, [node.payload.alias]);
    }

    return this.handleNode(nextNode, message, userId);
  }

  async handleQuestion(message: any, node: BotFlowNode, userId: string | any) {
    const questionNodeState = this.socketStateService.getQuestionNodeState(
      userId,
      node.id
    );

    if (!questionNodeState) {
      this.socketStateService.setQuestionNodeState(userId, node.id, {
        currentQuestion: -1,
        lifespan: 0,
      });
    }
    const { currentQuestion, lifespan } =
      this.socketStateService.getQuestionNodeState(userId, node.id);

    const nextNodes = await Promise.all(
      node.next.map(async (nodeId: string) => {
        return await this.botsService.getBotNode(nodeId);
      })
    );
    const successNode = nextNodes.find((ele: BotFlowNode) => {
      return ele.nodeType === NodeTypeEnum.SUCCESS;
    });
    const failureNode = nextNodes.find((ele: BotFlowNode) => {
      return ele.nodeType === NodeTypeEnum.FAILURE;
    });

    const elements = node.payload.elements;

    if (!elements) {
      return this.handleNode(failureNode, message, userId);
    }

    if (currentQuestion === -1) {
      // Ask once (R16): skip or pre-fill known contact details, unless the
      // visitor just chose "Update details" for this node.
      if (this.socketStateService.getUserData(userId)?.skipPrefillFor === node.id) {
        this.socketStateService.updateUserData(userId, { skipPrefillFor: undefined });
      } else if (await this.prefillKnownDetails(userId, node)) {
        this.socketStateService.setQuestionNodeState(userId, node.id, undefined as any);
        return;
      }
      // Skip leading questions whose answers are already known.
      const first = this.nextToAsk(userId, elements, 0);
      if (first >= elements.length) {
        this.socketStateService.setQuestionNodeState(userId, node.id, undefined as any);
        return this.handleNode(successNode, "", userId);
      }
      if (first > 0) {
        await this.sendBotMessage(userId, [{ type: "text", value: elements[first].prompt }]);
        this.socketStateService.setQuestionNodeState(userId, node.id, { currentQuestion: first, lifespan: 0 });
        return;
      }
      const element = elements[0];
      const { prompt } = element;
      await this.sendBotMessage(userId, [
        {
          type: "text",
          value: prompt,
        },
      ]);
      this.socketStateService.setQuestionNodeState(userId, node.id, {
        currentQuestion: 0,
        // `lifespan` was omitted here, so the first question started with
        // lifespan === undefined. The retry test below is `lifespan + 1 <
        // attempt`, and `undefined + 1` is NaN, so every comparison was false:
        // the first question skipped its retries entirely and applied
        // actionOnFailure on the very first invalid answer, unlike every
        // later question.
        lifespan: 0,
      });
    }
    if (currentQuestion !== -1) {
      const element = elements[currentQuestion];

      const {
        entity,
        alias,
        lifespan: attempt,
        actionOnFailure,
        secure,
      } = element;

      if (this.validationCheck(entity, message)) {
        this.socketStateService.setQuestionNodeState(userId, node.id, {
          currentQuestion: currentQuestion + 1,
          lifespan: 0,
        });
        const answer = this.captureValue(message, userId);
        // Secure answers are never contact details (R3.4).
        const typed = secure ? {} : this.typedContactAttributes(userId, entity, answer, alias);
        if (alias || Object.keys(typed).length) {
          // Merge, never replace. updateUserData is only a shallow top-level
          // merge, so passing a bare { [alias]: message } here would discard
          // every attribute captured so far — including the earlier answers of
          // THIS questionnaire. A 4-field form would then reach the downstream
          // webhook / template variable mappings with just the last field.
          this.socketStateService.updateUserData(userId, {
            attributes: {
              ...this.socketStateService.getUserData(userId)?.attributes,
              ...(alias ? { [alias]: answer } : {}),
              ...typed,
            },
          });
          // Secure answers are never contact details; don't route them anywhere.
          if (!secure) {
            this.emitAttributeCaptured(userId, [...(alias ? [alias] : []), ...Object.keys(typed)]);
          }
        }

        if (secure) {
          // Per visitor — see captureUserInput for why.
          this.eventEmitter.emit(
            "mask.chat",
            this.socketStateService.getUserData(userId)?.currentChatId
          );
        }

        // Skip later contact questions already answered (pre-chat form, an
        // earlier node, or this very answer typed as an email/phone).
        const nextIndex = this.nextToAsk(userId, elements, currentQuestion + 1);
        if (nextIndex >= elements.length) {
          return this.handleNode(successNode, message, userId);
        }
        this.socketStateService.setQuestionNodeState(userId, node.id, {
          currentQuestion: nextIndex,
          lifespan: 0,
        });
        const nextElement = elements[nextIndex];
        await this.sendBotMessage(userId, [
          {
            type: "text",
            value: nextElement.prompt,
          },
        ]);
      } else {
        // No retry budget configured means "keep asking". Previously this
        // re-sent the prompt and then FELL THROUGH to actionOnFailure, so the
        // user was asked the same question again and immediately moved past it
        // in the same turn.
        if (!attempt || attempt === -1) {
          return await this.sendBotMessage(userId, [
            {
              type: "text",
              value: element.prompt,
            },
          ]);
        }

        const haveLifespan = (lifespan ?? 0) + 1 < attempt;

        if (haveLifespan && attempt && attempt > 0) {
          this.socketStateService.setQuestionNodeState(userId, node.id, {
            lifespan: (lifespan ?? 0) + 1,
            currentQuestion: currentQuestion,
          });
          return await this.sendBotMessage(userId, [
            {
              type: "text",
              value: element.prompt,
            },
          ]);
        } else {
          if (actionOnFailure === "continue") {
            this.socketStateService.setQuestionNodeState(userId, node.id, {
              lifespan: 0,
              currentQuestion: currentQuestion + 1,
            });
            if (currentQuestion + 1 >= elements.length) {
              this.socketStateService.setQuestionNodeState(userId, node.id, {});
              return this.handleNode(successNode, message, userId);
            }
            const nextElement = elements[currentQuestion + 1];
            await this.sendBotMessage(userId, [
              {
                type: "text",
                value: nextElement.prompt,
              },
            ]);
          }
          if (actionOnFailure === "fallback") {
            this.socketStateService.setQuestionNodeState(userId, node.id, {});
            return this.handleNode(failureNode, message, userId);
          }
        }
      }
    }
  }

  async handleSetAttributes(
    message: any,
    node: BotFlowNode,
    userId: string | any
  ) {
    const nextNode = await this.botsService.getBotNode(node.next[0]);

    const attributes = node.payload.attributes;

    if (attributes.length > 0) {
      const existedAttributes =
        this.socketStateService.getUserData(userId).attributes;
      if (existedAttributes) {
        const mewAttributes = attributes.reduce((acc, ele: any) => {
          return {
            ...acc,
            [ele.to]: existedAttributes[ele.set] || "",
          };
        }, {});

        this.socketStateService.updateUserData(userId, {
          attributes: {
            ...existedAttributes,
            ...mewAttributes,
          },
        });
        this.emitAttributeCaptured(userId, Object.keys(mewAttributes));
      }
    }

    return this.handleNode(nextNode, message, userId);
  }

  /**
   * CLOSE_CHAT node.
   *
   * - Closure prompt on (widget): CLOSE_CHAT is a Terminal_Outcome, so the
   *   visitor is asked first; "Yes, resolved" or the idle time closes (R14.1).
   * - Widget, prompt off: close now with the thank-you and the Ended_State
   *   (task 6.4). The old 'To start again type "start"' line is gone: the
   *   state was deleted right after it, so typing start never worked.
   * - Other channels: unchanged (R15.7); the next inbound message rebuilds
   *   the conversation, so "start" does work there.
   */
  async handleCloseChat(message: any, node: BotFlowNode, userId: string | any) {
    const s0 = this.socketStateService.getUserData(userId);
    if (!s0) return;
    if (closureApplies(s0)) return this.sendClosurePrompt(userId, node);
    if (!s0.platform || s0.platform === PlatformEnum.WIDGET) {
      return this.closeConversation(
        userId,
        "close_chat",
        s0.botSettings?.thankyoumsg || "Thank you for contacting us."
      );
    }
    return this.legacyCloseChat(userId);
  }

  private async legacyCloseChat(userId: string) {
    const { startNode, botSettings, conversationId } =
      this.socketStateService.getUserData(userId);
    this.socketStateService.updateUserData(userId, {
      attributes: {},
      currentNode: startNode,
      BotNodeState: {},
      questionNodeState: {},
    });

    if (botSettings?.askForFeedback) {
      this.emitEventToUser(userId, "ask-for-feedback", {});
    }
    await this.sendBotMessage(userId, [
      {
        type: "text",
        value: botSettings?.thankyoumsg || "Thank you for contacting us.",
      },
      {
        type: "text",
        value: 'To start again type "start"',
      },
    ]);
    this.eventEmitter.emit("end.conversation", { conversationId, userId });
  }

  // ==========================================================================
  // Open Template node (Phase 2)
  // ==========================================================================

  /**
   * Answer a free-form chat message with the assistant, WITHOUT advancing the
   * flow. Two callers:
   *   1. while parked on an OPEN_TEMPLATE node (the customer is filling the form
   *      and still chatting), and
   *   2. when the scripted flow has reached a terminal dead-end (a
   *      SUCCESS/FAILURE/TIMEOUT branch with nothing wired after it) — rather
   *      than going mute, the conversation degrades to a general AI assistant.
   *
   * Question bank first (a curated answer beats a generated one and costs no
   * tokens), then the AI knowledge base, then the bot's fallback message. It is
   * never silent, and it never changes currentNode.
   */
  private async answerWithAiAssistant(message: any, userId: string | any) {
    if (typeof message !== "string" || !message.trim()) return;

    const userData = this.socketStateService.getUserData(userId);
    if (!userData) return;

    // Whatever happens, the customer's message gets a reply. Silence here is
    // what made the assistant look dead: a greeting ("how are you"), a meta
    // question ("what link is this") and anything not in the knowledge base all
    // come back not-confident, and staying quiet on those reads as broken.
    let reply: string | null = null;
    try {
      const qbAnswer = await this.findAnswerFromQuestionBank(
        message,
        undefined,
        userId
      );
      if (qbAnswer) {
        await this.sendBotMessage(userId, [{ type: "text", value: qbAnswer }]);
        return;
      }

      const ai = await this.askAIForAnswer(
        userData.botId,
        userData.botName,
        message,
        userData.conversationId,
        userId
      );
      // Prefer a confident answer; otherwise use the AI service's own honest
      // "I don't have that yet…" wording, which is friendlier and more specific
      // than a generic canned line.
      reply = ai.answer && ai.answer.trim() ? ai.answer : null;
    } catch (error) {
      // AI unreachable/errored — fall through to the configured fallback rather
      // than going silent.
      this.logger.warn(`answerWhileParked AI call failed: ${error?.message}`);
    }

    if (!reply) {
      reply =
        userData.botSettings?.fallbackMessage ||
        "I'm here to help. You can complete the form above, or ask me anything about our products and services.";
    }
    await this.sendBotMessage(userId, [{ type: "text", value: reply }]);
  }

  /**
   * One-shot AI answer used OUTSIDE the AI node's flow control (e.g. answering
   * while parked on a template). Returns both the confidence flag and the
   * answer text — including the service's honest fallback wording when it is
   * not confident (QueryResponse carries `answer` even with confident=false),
   * so the caller can still say something useful. Uses the bot's own knowledge
   * base by default (clientId = botId), matching the AI node's fallback.
   *
   * Distinct from handleAiResponse, which additionally routes to SUCCESS/FAILURE
   * child nodes and advances the flow — neither of which is wanted here.
   */
  private async askAIForAnswer(
    botId: string,
    botName: string,
    message: string,
    conversationId: string,
    userId: string | any
  ): Promise<{ confident: boolean; answer: string | null }> {
    const aiUrl = this.configService.get("ai.url");
    const timeout = this.configService.get("ai.timeout");
    if (!aiUrl) return { confident: false, answer: null };

    const chatHistory = await this.getRecentChatHistory(
      conversationId,
      userId,
      message
    );
    const requestId = newRequestId();
    const visitorProfile = await this.visitorProfileFor(userId);
    const body = {
      client_id: botId,
      question: message,
      bot_id: botId,
      company_name: botName,
      chat_history: chatHistory,
      ...(visitorProfile ? { visitor_profile: visitorProfile } : {}),
    };

    const res = await firstValueFrom(
      this.httpService.post(`${aiUrl}/query/ask`, body, {
        timeout,
        headers: { "x-request-id": requestId },
      })
    );
    const data = res?.data;
    return {
      confident: !!data?.confident,
      answer: typeof data?.answer === "string" ? data.answer : null,
    };
  }

  /** Resolve dynamic variable mappings against the workflow's attributes. */
  private resolveTemplateVariables(
    mappings: any[] = [],
    attributes: Record<string, any> = {}
  ): Record<string, any> {
    const out: Record<string, any> = {};
    for (const m of mappings || []) {
      if (!m?.templateKey) continue;
      out[m.templateKey] =
        m.source === "static" ? m.value : attributes?.[m.value] ?? "";
    }
    return out;
  }

  /**
   * Launches a hosted template: creates a correlation session, sends the CTA
   * button via the active messaging provider, and PAUSES the workflow. Resume
   * happens out-of-band via the template.* events (not the next chat message).
   */
  async handleOpenTemplate(
    message: any,
    node: BotFlowNode,
    userId: string | any
  ) {
    const userData = this.socketStateService.getUserData(userId);
    if (!userData) return;
    const { botId, conversationId, platform, ctx, attributes, mode } = userData;
    const payload = node.payload || {};

    // Resolve the paired child nodes (created alongside this node in the UI).
    const nextNodes = await Promise.all(
      node.next.map((id: string) => this.botsService.getBotNode(id))
    );
    const failureNode = nextNodes.find(
      (n: BotFlowNode) => n?.nodeType === NodeTypeEnum.FAILURE
    );

    // Hoisted so the catch below can mark an already-created session failed if
    // delivery throws after the session row exists.
    let launchedSessionId: string | null = null;

    // ---- Re-entry guard (Fix A) ----------------------------------------
    // This node PAUSES the flow: after the link is sent it stays the current
    // node and only advances when a template.* callback arrives via
    // routeTemplateResume — NOT on the next chat message. Without a guard,
    // every inbound message re-enters this node (handleMessage -> handleNode ->
    // OPEN_TEMPLATE) and mints a fresh session + a fresh launch link, which is
    // the "link on every reply" bug.
    //
    // The mark is deliberately NOT cleared when the session resolves: launching
    // the same order/booking form once per conversation is the intended
    // behaviour, and leaving it VISITED also breaks the flow's cycle
    // (START -> BOT_RESPONSE -> OPEN_TEMPLATE, and an AI branch whose
    // non-confident path resets currentNode to startNode) — a loop back into
    // this node finds it already done and stops instead of relaunching. A
    // genuine restart ("start"/"reset"/CLOSE_CHAT) clears BotNodeState, which
    // re-arms the node.
    //
    // Mirrors handleUserInput's VISITED check exactly.
    if (
      this.socketStateService.getNodeState(userId, node.id) ===
      BotNodeStateEnum.VISITED
    ) {
      this.trace(
        "handleOpenTemplate:parked",
        `node=${node.id} already launched — answering in parallel, no relaunch`
      );
      // The template runs INDEPENDENTLY: the customer is filling the form in the
      // browser while the chat stays live. Answer their message here without
      // touching currentNode (so the flow stays parked and the eventual
      // template.* callback still resumes correctly). Never re-send the link.
      await this.answerWithAiAssistant(message, userId);
      return;
    }
    // --------------------------------------------------------------------

    try {
      if (!payload.templateId) {
        this.logger.error("OPEN_TEMPLATE node missing templateId");
        if (failureNode) return this.handleNode(failureNode, message, userId);
        return;
      }

      const template: any = await this.templateService.findOne(
        payload.templateId
      );
      // A URL typed on the node itself wins over the one stored on the
      // template, so a flow can point at a specific S3/CDN deployment without
      // re-uploading the template.
      const hostedUrl = (payload.templateUrl || "").trim() || template?.hostedUrl;
      if (!template || !hostedUrl) {
        this.logger.error(`Template ${payload.templateId} has no hosted build`);
        if (failureNode) return this.handleNode(failureNode, message, userId);
        return;
      }

      const variables = this.resolveTemplateVariables(
        payload.variableMappings,
        attributes
      );

      const { session, launchUrl, reused } =
        await this.templateSessionService.create({
          templateId: payload.templateId,
          templateVersion: template.currentVersion,
          botId,
          nodeId: node.id,
          visitorId: userId,
          conversationId,
          platform,
          variables,
          hostedUrl,
          expiryMinutes: payload.sessionExpiryMinutes,
        });

      // Durable guard tripped (in-memory node state was lost to eviction/
      // restart, but the session is still live): re-assert the mark and do NOT
      // re-send — the customer already has this link.
      if (reused) {
        this.socketStateService.setNodeState(
          userId,
          node.id,
          BotNodeStateEnum.VISITED
        );
        this.trace(
          "handleOpenTemplate:reused",
          `session ${session.id} still live — not re-sending the link`
        );
        return;
      }

      launchedSessionId = session.id;

      // Persist which session this workflow is now waiting on.
      this.socketStateService.updateUserData(userId, {
        metadata: {
          ...(userData.metadata || {}),
          pendingTemplateSessionId: session.id,
        },
      });

      const buttonText = payload.buttonText || "Open";
      const responses = (node.responses as any[]) || [];
      const bodyText = responses[0]?.value || buttonText;

      // Only a provider with real interactive-button support gets a native CTA.
      // Everything else goes through sendBotMessage — the universal outbound
      // path, which also persists the chat row and announces it to the inbox.
      const provider = await this.messagingRegistry.resolve(platform, botId);
      const useNativeCta =
        mode !== ModeEnum.preview &&
        !!provider &&
        provider.supportsFeature("cta_url");
      const isWidgetPath =
        mode === ModeEnum.preview || platform === PlatformEnum.WIDGET;

      let sendResult: { status: string; error?: string } = { status: "success" };
      if (useNativeCta) {
        const recipient = ctx?.recipient || ctx?.sender_psid || userId;
        sendResult = await provider.sendMessage(
          recipient,
          {
            type: "cta_url",
            text: bodyText,
            cta: { displayText: buttonText, url: launchUrl },
          },
          ctx
        );
      } else {
        // The widget renders a real launch button from `template.url`, so its
        // body text stays clean. Every text-only channel (WhatsApp Web, SMS,
        // ...) must carry the link inside `value` instead — the channel
        // renderers fall through to `message.value`, so a URL left only on
        // `template` would be silently stripped and the customer would receive
        // a bare "Open". A channel that CAN render a native button (WhatsApp
        // Web via cta_url) uses `template.bodyText` to keep the bubble clean.
        await this.sendBotMessage(userId, [
          {
            type: ChatTypeEnum.TEMPLATE,
            value: isWidgetPath
              ? bodyText
              : `${bodyText}\n${buttonText}: ${launchUrl}`,
            template: { url: launchUrl, buttonText, bodyText },
          },
        ]);
      }

      // Don't mark the session launched (or fire analytics) unless the CTA
      // actually reached the customer — otherwise a silent WhatsApp Web send
      // failure would leave the workflow paused forever with no signal.
      if (sendResult.status !== "success") {
        this.logger.error(
          `Failed to deliver template link for session ${session.id}: ${sendResult.error}`
        );
        await this.templateSessionService.markFailed(session.id, sendResult.error);
        if (failureNode) return this.handleNode(failureNode, message, userId);
        return;
      }

      await this.templateSessionService.markLaunched(session.id);
      if (payload.analyticsEnabled !== false) {
        this.eventEmitter.emit("template.launched", {
          sessionId: session.id,
          templateId: payload.templateId,
          visitorId: userId,
          callbackEvent: payload.callbackEvent,
        });
      }

      // PAUSE: stay on this node; do not advance until a callback arrives.
      // Mark VISITED only now that the link actually reached the customer — a
      // delivery failure above routes to FAILURE and must stay re-launchable.
      // This is the guard the re-entry check at the top reads.
      this.socketStateService.setNodeState(
        userId,
        node.id,
        BotNodeStateEnum.VISITED
      );
    } catch (error) {
      this.logger.error(`Error in handleOpenTemplate: ${error.message}`);
      // If a session was already created before delivery threw, mark it failed
      // so it isn't left waiting for a callback that will never come.
      if (launchedSessionId) {
        await this.templateSessionService
          .markFailed(launchedSessionId, error.message)
          .catch(() => undefined);
      }
      if (failureNode) return this.handleNode(failureNode, message, userId);
    }
  }

  /** Drop the "waiting on this template session" marker once it has resolved. */
  private clearPendingTemplateSession(userId: string | any) {
    const metadata = {
      ...(this.socketStateService.getUserData(userId)?.metadata || {}),
    };
    if (metadata.pendingTemplateSessionId) {
      delete metadata.pendingTemplateSessionId;
      this.socketStateService.updateUserData(userId, { metadata });
    }
  }

  /** Rehydrate the minimal socket state needed to resume after a restart. */
  private async rehydrateForResume(session: {
    visitorId: string;
    botId: any;
    conversationId: string;
    platform: string;
    nodeId: string;
  }) {
    const node = await this.botsService.getBotNode(session.nodeId);
    this.socketStateService.updateUserData(session.visitorId, {
      botId: session.botId?.toString(),
      conversationId: session.conversationId,
      platform: session.platform,
      currentNode: node,
    });
  }

  private async routeTemplateResume(
    sessionId: string,
    outcome: "SUCCESS" | "TIMEOUT" | "FAILURE",
    mergeData?: Record<string, any>
  ) {
    const session: any = await this.templateSessionService.findById(sessionId);
    if (!session) return;
    const userId = session.visitorId;

    if (!this.socketStateService.getUserData(userId)) {
      await this.rehydrateForResume(session);
    }

    // Resolve-once guard. A conversation that ran before the launch guard
    // landed can hold several orphan sessions, and the submit/sweep boundary can
    // fire two callbacks; without this, each would route the flow again (e.g.
    // the FAILURE branch several times over — the "repeated reminder" symptom).
    // Only act on the session this conversation is actually waiting on. A
    // rehydrated state (post-restart) has no pending id, so a genuine resume
    // still passes.
    const pendingSessionId =
      this.socketStateService.getUserData(userId)?.metadata
        ?.pendingTemplateSessionId;
    if (pendingSessionId && String(pendingSessionId) !== String(sessionId)) {
      this.logger.debug(
        `Ignoring ${outcome} resume for stale template session ${sessionId}; ` +
          `conversation is waiting on ${pendingSessionId}`
      );
      return;
    }

    const node = await this.botsService.getBotNode(session.nodeId);
    if (!node) return;

    // The wait is over. Clear the pending marker and release the node's VISITED
    // mark is intentionally NOT reset here (see handleOpenTemplate) so a graph
    // cycle cannot relaunch the template; a real restart re-arms it.
    this.clearPendingTemplateSession(userId);
    const nextNodes = await Promise.all(
      node.next.map((id: string) => this.botsService.getBotNode(id))
    );
    const target =
      nextNodes.find((n: BotFlowNode) => n?.nodeType === NodeTypeEnum[outcome]) ||
      nextNodes.find((n: BotFlowNode) => n?.nodeType === NodeTypeEnum.SUCCESS);

    if (mergeData) {
      const existing = this.socketStateService.getUserData(userId)?.attributes || {};
      this.socketStateService.updateUserData(userId, {
        attributes: { ...existing, ...mergeData },
      });
      this.emitAttributeCaptured(userId, Object.keys(mergeData), "template");
    }

    // On a successful submit, confirm the action in chat with an AI-written
    // recap of what the customer entered (deterministic fallback if the AI
    // service is slow or down). Sent BEFORE routing so the customer sees, in
    // order: the recap of their submission, then the SUCCESS node's own
    // thank-you (handleSuccessNode delivers node.responses), then whatever the
    // branch continues into. Independent of whether a branch is wired, so the
    // customer is never left with silence after completing the form.
    if (outcome === "SUCCESS" && mergeData) {
      const summary = await this.buildSubmissionSummary(session, mergeData);
      if (summary) {
        await this.sendBotMessage(userId, [
          { type: ChatTypeEnum.TEXT, value: summary },
        ]);
      }
    }

    if (!target) return;
    this.socketStateService.updateUserData(userId, { currentNode: target });
    return this.handleNode(target, "", userId);
  }

  /**
   * A friendly, one-line recap of a template submission for the chat.
   *
   * Prefers an AI-written confirmation (the /generate/summary endpoint, which
   * bypasses RAG); on any failure or empty result it falls back to the
   * deterministic key/value recap so the customer always gets confirmation.
   * Never throws — a summary is a nicety, not a reason to break the resume.
   */
  private async buildSubmissionSummary(
    session: any,
    data: Record<string, any>
  ): Promise<string> {
    try {
      const answer = await this.summarizeSubmissionViaAI(session, data);
      if (answer && answer.trim()) return answer.trim();
    } catch (error) {
      this.logger.warn(
        `AI submission summary failed, using deterministic recap: ${error?.message}`
      );
    }
    return this.summariseSubmission(data);
  }

  /**
   * Ask the AI service to summarise a submission into a warm confirmation.
   * Returns the text, or null when the service returns nothing usable. Mirrors
   * the HTTP conventions of handleAiResponse (correlation id, configured URL +
   * timeout) but hits the non-RAG /generate/summary endpoint.
   */
  private async summarizeSubmissionViaAI(
    session: any,
    data: Record<string, any>
  ): Promise<string | null> {
    const aiUrl = this.configService.get("ai.url");
    const timeout = this.configService.get("ai.timeout");
    if (!aiUrl) return null;

    const userId = session?.visitorId;
    const companyName =
      this.socketStateService.getUserData(userId)?.botName || undefined;

    // A human label for what was completed, for a more natural confirmation.
    let templateName: string | undefined;
    try {
      const template: any = await this.templateService.findOne(
        session?.templateId?.toString?.() || session?.templateId
      );
      templateName = template?.name;
    } catch {
      // Non-fatal: the summary still works without a template name.
    }

    const requestId = newRequestId();
    const body = {
      data,
      action: templateName,
      company_name: companyName,
      template_name: templateName,
    };

    banner(this.logger, "[BACKEND -> AI SERVICE] Summarise", {
      URL: `${aiUrl}/generate/summary`,
      "Request ID": requestId,
      Fields: Object.keys(data || {}).length,
      Template: templateName || "(unknown)",
    });

    const res = await firstValueFrom(
      this.httpService.post(`${aiUrl}/generate/summary`, body, {
        timeout,
        headers: { "x-request-id": requestId },
      })
    );
    const answer = res?.data?.answer;
    return typeof answer === "string" ? answer : null;
  }

  /**
   * Replaces {{key}} placeholders in an authored message with values collected
   * during the conversation (including data submitted from a hosted template).
   *
   * Keeps the bot's wording fully author-controlled: an appointment flow can say
   * "You're booked for {{slot}}" while a purchase flow says "We'll deliver
   * {{item}} within 24 hours" — same mechanism, different copy per node.
   */
  private interpolateAttributes(
    value: any,
    attributes: Record<string, any> = {}
  ): any {
    if (typeof value !== "string" || !value.includes("{{")) return value;

    return value.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, key: string) => {
      const resolved = attributes?.[key];
      if (resolved === undefined || resolved === null) return "";
      if (Array.isArray(resolved)) return resolved.join(", ");
      if (typeof resolved === "object") return JSON.stringify(resolved);
      return String(resolved);
    });
  }

  /**
   * Human-readable recap of what the customer submitted, used when the flow has
   * no node wired after the template. Without it a local test looks broken: the
   * form submits successfully but nothing ever comes back in the chat.
   */
  private summariseSubmission(data: Record<string, any> = {}): string {
    const lines = Object.entries(data)
      .filter(([, v]) => v !== undefined && v !== null && v !== "")
      .map(([key, v]) => {
        const label = key
          .replace(/[_-]+/g, " ")
          .replace(/([a-z])([A-Z])/g, "$1 $2")
          .replace(/\b\w/g, (c) => c.toUpperCase());
        const shown = Array.isArray(v)
          ? v.join(", ")
          : typeof v === "object"
            ? JSON.stringify(v)
            : String(v);
        return `${label}: ${shown}`;
      });

    if (lines.length === 0) return "Thanks! Your details have been received.";
    return `Thanks! Here's a summary of your details:\n${lines.join("\n")}`;
  }

  @OnEvent("template.submitted", { async: true })
  async onTemplateSubmitted(data: { sessionId: string; data: Record<string, any> }) {
    try {
      await this.routeTemplateResume(data.sessionId, "SUCCESS", data.data);
      await this.templateSessionService.markValidated(data.sessionId);
    } catch (error) {
      this.logger.error(`Error resuming from template submit: ${error.message}`);
    }
  }

  /**
   * Reconnect a hosted-template submission that came through the
   * /template/actions/* path (the path every deployed template actually calls)
   * to the conversation flow.
   *
   * That path stores the submission but carries only a conversationId, not the
   * session id — so we resolve the conversation's live template session here,
   * then reuse the exact same resume machinery as a first-party submit: SUCCESS
   * branch, the node's thank-you, and the AI recap of the submitted data.
   * markValidated closes the session so the timeout sweep can no longer route it
   * to FAILURE/TIMEOUT after the customer has, in fact, completed the form.
   */
  @OnEvent("template.action.submitted", { async: true })
  async onTemplateActionSubmitted(data: {
    conversationId?: string;
    templateId?: string;
    actionType?: string;
    data?: Record<string, any>;
  }) {
    try {
      if (!data?.conversationId) return; // no conversation to resume (preview/standalone)
      const session =
        await this.templateSessionService.findResumableSessionByConversation(
          data.conversationId
        );
      if (!session) {
        this.logger.debug(
          `template.action.submitted for conversation ${data.conversationId} ` +
            `has no resumable session; stored only (already resolved or not bot-launched)`
        );
        return;
      }
      await this.routeTemplateResume(session.id, "SUCCESS", data.data || {});
      await this.templateSessionService.markValidated(session.id);
    } catch (error) {
      this.logger.error(
        `Error resuming from template action submit: ${error.message}`
      );
    }
  }

  @OnEvent("template.abandoned", { async: true })
  async onTemplateAbandoned(data: { sessionId: string }) {
    // Opened but not completed -> TIMEOUT route (#1)
    await this.routeTemplateResume(data.sessionId, "TIMEOUT").catch((e) =>
      this.logger.error(`Error routing abandoned template: ${e.message}`)
    );
  }

  @OnEvent("template.expired", { async: true })
  async onTemplateExpired(data: { sessionId: string }) {
    // Never opened -> FAILURE route (#1)
    await this.routeTemplateResume(data.sessionId, "FAILURE").catch((e) =>
      this.logger.error(`Error routing expired template: ${e.message}`)
    );
  }

  @OnEvent("messaging.widget.send", { async: true })
  async onWidgetSend(data: { userId: string; message: any }) {
    // The widget provider delegates delivery back here so it can use the
    // existing socket propagation path without a circular dependency.
    const { userId, message } = data;
    const value =
      message.type === "cta_url"
        ? `${message.text || ""}\n${message.cta?.displayText}: ${message.cta?.url}`
        : message.text;
    return this.sendBotMessage(userId, [{ type: "text", value }]);
  }

  /**
   * Question-bank lookup for a live conversation. Answers come ONLY from the
   * organization that owns the conversation's bot: without this, one tenant's
   * approved Q&A would answer another tenant's visitors. If the org cannot be
   * resolved the lookup returns nothing (fail closed).
   */
  async findAnswerFromQuestionBank(
    message: string,
    language = "english",
    userId?: string
  ) {
    const botId = userId
      ? this.socketStateService.getUserData(userId)?.botId
      : undefined;
    const organizationId = botId
      ? await this.tenantScope.orgIdForBot(botId).catch(() => null)
      : null;
    if (!organizationId) return null;
    // Plan gate: an org without the question-bank feature gets no QB answers.
    if (
      this.entitlementService &&
      !(await this.entitlementService
        .isFeatureEnabled(organizationId, "question-bank")
        .catch(() => false))
    ) {
      return null;
    }
    const response = await this.questionsService.findAnswer(
      message,
      language,
      undefined,
      organizationId
    );
    if (response) {
      return response;
    }
    return null;
  }

  async sendBotMessage(
    userId: string,
    message: MessageResponseDto[] | any,
    event?: string
  ) {
    const data = {
      event: event || "chat-message-bot",
      userId,
    };

    // Normalize input: a bare string, a single object, undefined, or an array
    // are all acceptable callers. Anything empty is a no-op so a node with no
    // configured responses never throws (.map on undefined) or corrupts the
    // delay accumulator with negative math — either of which would silently
    // break the rest of the flow.
    if (typeof message === "string") {
      message = [{ type: ChatTypeEnum.TEXT, value: message }];
    } else if (message && !Array.isArray(message)) {
      message = [message];
    }
    if (!Array.isArray(message) || message.length === 0) {
      this.trace("sendBotMessage:skip", "no messages to send");
      return;
    }

    const userData = this.socketStateService.getUserData(userId);
    if (!userData) return;
    const { botId, conversationId, mode, platform, handledByAgent } = userData;

    // Per visitor, not a service-level map keyed by conversationId: that map was
    // never cleaned up, so it grew for the life of the process. Held in the
    // conversation state, it is reclaimed with the rest of the entry.
    const messageDelay = userData.messageDelay || 0;

    const nodeDelay = parseInt(this.configService.get("delay.node")) || 1000;
    const message_delay =
      parseInt(this.configService.get("delay.message")) || 750;

    this.trace(
      "sendBotMessage",
      `count=${message.length} baseDelay=${messageDelay}ms conv=${conversationId}`
    );

    message.map((ele: any, index: number) => {
      // Resolve a random variant WITHOUT mutating the node's stored responses —
      // node objects are reused across turns, so overwriting `value` here would
      // permanently collapse a RANDOM_TEXT node to its first drawn variant.
      let value = ele.value;
      let type = ele.type;
      if (type === ChatTypeEnum.RANDOM_TEXT) {
        value =
          ele.values?.length > 0
            ? ele.values[Math.floor(Math.random() * ele.values.length)]
            : "";
        type = ChatTypeEnum.TEXT;
      }

      // Substitute {{attribute}} placeholders so an authored reply can echo
      // back collected values (e.g. a slot the customer just booked in a
      // template). Unknown keys collapse to '' rather than leaking the braces.
      value = this.interpolateAttributes(value, userData.attributes);

      const messageResponse: MessageResponseDto = {
        id: generateId("message", 10),
        senderId: botId,
        type,
        value,
        buttons: ele.buttons,
        time: new Date(),
        delay: 2000,
        switchToAgent: ele.switchToAgent || false,
        agentId: ele.agentId || "",
        location: ele.location,
        info: ele.info,
        handledByAgent: handledByAgent || false,
        template: ele.template,
        senderRole: "bot",
      };

      if (mode !== ModeEnum.preview) {
        this.eventEmitter.emit("create.new.chat", {
          message: value,
          type,
          sender: botId,
          conversationId: conversationId,
          // Correlation handle so a channel delivery handler (WhatsApp Web etc.)
          // can find THIS row afterwards and stamp the channel's own message id
          // and thread onto it. Without it an outbound row cannot be matched to
          // its delivery receipt. Harmless for the widget, which ignores it.
          chatId: messageResponse.id,
        });
      }

      setTimeout(() => {
        this.redisPropagatorService.propagateEvent({
          ...data,
          data: {
            message: messageResponse,
          },
          platform,
        });
      }, messageDelay + index * message_delay);
    });

    // Advance the baseline so the NEXT sendBotMessage in this same turn is
    // staggered after the last message emitted here. Math.max guards against
    // the length===0 case (already returned above, but defensive) producing a
    // negative offset. The baseline is zeroed again at the start of the next
    // inbound message in handleMessage.
    this.socketStateService.updateUserData(userId, {
      messageDelay:
        messageDelay +
        Math.max(0, message.length - 1) * message_delay +
        nodeDelay,
    });
  }

  async sendMessageToAgent(userId: string, message: any, visitor: SocketState) {
    const data = {
      event: "message",
      userId,
    };

    const { mode, conversationId } = visitor;
    if (mode !== ModeEnum.preview && conversationId && message.value) {
      this.eventEmitter.emit("create.new.chat", {
        sender: message.from,
        message: message.value,
        type: message.type,
        conversationId,
      });
    }
    const messageResponse: MessageResponseDto & { senderRole: "visitor" } = {
      id: generateId("message", 10),
      sender: message.from,
      type: message.type,
      value: message.value,
      time: new Date(),
      delay: 2000,
      // Always the visitor on this path; lets the dashboard notify by role.
      senderRole: "visitor",
    };

    return this.redisPropagatorService.propagateEvent({
      ...data,
      data: {
        message: messageResponse,
        conversationId,
      },
    });
  }

  @OnEvent("send-telegram-message", { async: true })
  async onSendTelegramMessage(data: { message: any; ctx: any }) {
    await this.sendMessageToTelegram(data.message, data.ctx);
  }

  @OnEvent("send-facebook-message", { async: true })
  async onSendFacebookMessage(data: { message: any; ctx: any }) {
    await this.sendFacebookMessage(data.message, data.ctx);
  }

  @OnEvent("send-whatsapp-message", { async: true })
  async onSendWhatsappMessage(data: { message: any; ctx: any }) {
    await this.sendWhatsappMessage(data.message, data.ctx);
  }

  async sendMessageToTelegram(
    messageResponse: MessageResponseDto | any,
    ctx?: any
  ) {
    if (!ctx || !messageResponse) return;

    try {
      if (messageResponse.type === ChatTypeEnum.TEXT) {
        return await ctx?.reply(messageResponse.value);
      }
      if (messageResponse.type === ChatTypeEnum.IMAGE) {
        return await ctx?.replyWithPhoto(messageResponse.value);
      }
      if (messageResponse.type === ChatTypeEnum.MAPS) {
        return await ctx?.replyWithLocation(
          messageResponse.location.latitude,
          messageResponse.location.longitude
        );
      }
      if (messageResponse.type === ChatTypeEnum.AUDIO) {
        return await ctx?.replyWithAudio(messageResponse.value);
      }
      if (messageResponse.type === ChatTypeEnum.VIDEO) {
        return await ctx?.replyWithVideo(messageResponse.value);
      }
      if (messageResponse.type === ChatTypeEnum.FILE) {
        return await ctx?.replyWithDocument(messageResponse.value);
      }
      if (messageResponse.type === ChatTypeEnum.BUTTONS) {
        let buttons = messageResponse.buttons.map((ele: any) => {
          return Markup.button.callback(ele.title, ele.value);
        });
        buttons = Markup.inlineKeyboard(buttons);

        return await ctx?.reply(messageResponse.value, {
          ...buttons,
        });
      }
    } catch (error) {
      this.logger.error(`Error sending message to telegram: ${error}`);
    }
  }

  emitEventToUser(userId: string, event: string, data: any, platform?: string) {
    const eventData = {
      event,
      userId,
    };
    const userData = this.socketStateService.getUserData(userId);
    if (!userData) return;

    const { mode, conversationId, ctx } = userData;
    platform = platform || userData.platform;

    if (mode !== ModeEnum.preview && conversationId && data.message?.value) {
      this.eventEmitter.emit("create.new.chat", {
        sender: data.message.senderId || data.message.sender,
        message: data.message.value,
        type: data.message.type,
        conversationId,
        // See sendBotMessage: lets the channel delivery handler stamp the
        // channel message id / thread onto this agent reply.
        chatId: data.message.id,
      });
    }

    // if (platform === PlatformEnum.TELEGRAM) {
    //   return this.sendMessageToTelegram(
    //     {
    //       ...eventData,
    //       ...data.message,
    //     },
    //     ctx
    //   );
    // }
    // if (platform === PlatformEnum.FACEBOOK) {
    //   return this.sendFacebookMessage(
    //     {
    //       ...eventData,
    //       ...data,
    //     },
    //     ctx
    //   );
    // }
    // if (platform === PlatformEnum.WHATSAPP) {
    //   return this.sendWhatsappMessage(
    //     {
    //       ...eventData,
    //       ...data,
    //     },
    //     ctx
    //   );
    // }

    return this.redisPropagatorService.propagateEvent({
      ...eventData,
      data,
      platform,
    });
  }

  async saveUnansweredMessage(message: string, userId: string) {
    // Conversation state can be evicted at any time (disconnect / end);
    // guard so a missing state never crashes the process.
    const userData = this.socketStateService.getUserData(userId);
    if (!userData) return;
    const { botId } = userData;
    if (this.checkIfQuestionIsProper(message)) {
      this.logger.debug(`Adding question to Unanswered Questions: ${message}`);
      await this.unansweredService.create({
        botId,
        questions: {
          question: message,
          askedBy: userId,
          time: new Date(),
        },
      });
    }
  }

  checkIfQuestionIsProper(message: any) {
    this.logger.debug(`Checking if question is proper: ${message}`);
    if (!message) {
      this.logger.debug(`Question is empty`);
      return false;
    }
    message = message.toLowerCase();
    if (typeof message === "string") message = message.trim();

    if (isCreditCard(message)) {
      this.logger.debug(`Question is a credit card`);
      return false;
    }

    if (isDate(message)) {
      this.logger.debug(`Question is a date`);
      return false;
    }
    if (isCurrency(message)) {
      this.logger.debug(`Question is a currency`);
      return false;
    }

    if (IsUrl(message)) {
      this.logger.debug(`Question is a url`);
      return false;
    }

    if (isMACAddress(message)) {
      this.logger.debug(`Question is a MAC Address`);
      return false;
    }

    if (isMobilePhone(message)) {
      this.logger.debug(`Question is a mobile phone`);
      return false;
    }

    if (isIP(message)) {
      this.logger.debug(`Question is an IP`);
      return false;
    }

    if (!isNaN(message)) {
      this.logger.debug(`Question is a number`);
      return false;
    }

    if (isEmail(message)) {
      this.logger.debug(`Question is an email`);
      return false;
    }

    let words = message.split(" ");
    words = [...new Set(words)];

    const filteredWords = words.filter((ele: string) => {
      return ele.length > 2;
    });

    if (filteredWords.length > 2) {
      return true;
    }
    this.logger.debug(`Question is not proper ${message}.Not adding to DB`);
    return false;
  }

  async sendFacebookMessage(
    messageResponse: MessageResponseDto | any,
    ctx?: any
  ) {
    if (!ctx || !ctx.sender_psid) return;
    if (!messageResponse) return;
    const request_body = {
      recipient: {
        // Addressed from the ctx this call was given. Reading a singleton field
        // here meant the recipient could belong to a different conversation than
        // the one being validated two lines above.
        id: ctx.sender_psid,
      },
      message: {},
    };

    if (messageResponse.type === ChatTypeEnum.TEXT) {
      request_body.message = {
        text: messageResponse.value,
      };
    }
    if (messageResponse.type === ChatTypeEnum.IMAGE) {
      request_body.message = {
        attachment: {
          type: "image",
          payload: {
            url: messageResponse.value,
          },
        },
      };
    }
    if (messageResponse.type === ChatTypeEnum.BUTTONS) {
      request_body.message = {
        attachment: {
          type: "template",
          payload: {
            template_type: "generic",
            elements: [
              {
                title: messageResponse.value,
                buttons: messageResponse.buttons.map((ele: any) => {
                  return {
                    type: "postback",
                    title: ele.title,
                    payload: ele.value,
                  };
                }),
              },
            ],
          },
        },
      };
    }
    if (messageResponse.type === ChatTypeEnum.QUICK_REPLY) {
      request_body.message = {
        text: messageResponse.value,
        quick_replies: messageResponse.buttons.map((ele: any) => {
          return {
            content_type: "text",
            title: ele.title,
            payload: ele.value,
          };
        }),
      };
    }
    if (messageResponse.type === ChatTypeEnum.AUDIO) {
      request_body.message = {
        attachment: {
          type: "audio",
          payload: {
            url: messageResponse.value,
          },
        },
      };
    }
    if (messageResponse.type === ChatTypeEnum.VIDEO) {
      request_body.message = {
        attachment: {
          type: "video",
          payload: {
            url: messageResponse.value,
          },
        },
      };
    }

    try {
      await firstValueFrom(
        this.httpService.post(
          "https://graph.facebook.com/v15.0/me/messages",
          request_body,
          {
            params: {
              access_token: ctx.accessToken,
            },
          }
        )
      );

      //this.logger.log(`Message sent! ${JSON.stringify(response.data)}`);
    } catch (error) {
      const errorMessages = error.response?.data?.error?.message;
      this.logger.error(`Unable to send message. ${errorMessages}`);
    }
  }

  async sendWhatsappMessage(messageResponse: any, ctx?: any) {
    try {
      if (!ctx || !ctx.recipient) return;
      if (!messageResponse) return;

      // Every recipientPhone below comes from the ctx passed in. These used to
      // read `this.ctx.recipient` on the singleton — validated against the
      // caller's ctx but SENT to whichever conversation last touched the
      // service, so under concurrency one tenant's reply could be delivered to
      // another tenant's customer.
      if (messageResponse.type === ChatTypeEnum.TEXT) {
        await ctx.Whatsapp.sendText({
          recipientPhone: ctx.recipient,
          message: messageResponse.value,
        });
      }
      if (messageResponse.type === ChatTypeEnum.IMAGE) {
        await ctx.Whatsapp.sendImage({
          recipientPhone: ctx.recipient,
          url: messageResponse.value,
        });
      }
      if (messageResponse.type === ChatTypeEnum.BUTTONS) {
        await ctx.Whatsapp.sendSimpleButtons({
          recipientPhone: ctx.recipient,
          text: messageResponse.value,
          buttons: messageResponse.buttons.map((ele: any) => {
            return {
              type: "postback",
              title: ele.title,
              payload: ele.value,
            };
          }),
        });
      }
    } catch (error) {
      this.logger.error(`Unable to send message. ${error.message}`);
    }
  }

  @OnEvent("end-conversation-by-agent", { async: true })
  async endConversationByAgent(data: { userId: string }) {
    this.logger.debug(`End conversation by agent: ${data.userId}`);
    const userData = this.socketStateService.getUserData(data.userId);
    if (userData) {
      const { currentNode } = userData;
      if (currentNode && currentNode.next.length > 0) {
        const nextNodes = await Promise.all(
          currentNode.next.map(async (nodeId: string) => {
            return await this.botsService.getBotNode(nodeId);
          })
        );

        this.socketStateService.updateUserData(data.userId, {
          currentNode: nextNodes[0],
          handledByAgent: false,
          assignedAgentId: null,
          // A later takeover (even by the same agent) is announced again.
          announcedAgentId: undefined,
        });

        this.sendBotMessage(data.userId, [
          {
            type: "text",
            value:
              "Your conversation has been ended by the agent. Bot will take over now.",
            info: "warning",
          },
        ]);
        return this.handleNode(nextNodes[0], "", data.userId);
      }
    }
  }

  @OnEvent("report-conversation", { async: true })
  async reportConversation(data: { userId: string }) {
    this.logger.debug(`Report conversation: ${data.userId}`);
    await this.sendBotMessage(data.userId, [
      {
        type: "text",
        value:
          "Agent marked this conversation as inappropriate. You will not be able to chat with this agent again.",
        info: "error",
      },
    ]);

    return this.emitEventToUser(data.userId, "conversation-reported", {});
  }

  @OnEvent("publish-events", { async: true })
  async publishEvent(data: { userId: string; event: string; data: any }) {
    this.logger.debug(`Publish event: ${data.userId}`);
    return this.emitEventToUser(data.userId, data.event, data.data);
  }
}
