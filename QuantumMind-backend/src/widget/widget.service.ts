import { HttpException, Injectable, Logger, Optional } from "@nestjs/common";
import { ObjectID } from "bson";
import { CrmBridgeService } from "src/crm-bridge/crm-bridge.service";
import { ContactCaptureService } from "src/crm-bridge/contact-capture.service";
import { cleanDetails, ContactMapping, effectiveMapping } from "src/crm-bridge/identity";
import { Request, Response } from "express";
import { JwtPayload } from "src/auth/strategy/jwt.strategy";
import { BotsService } from "src/bots/bots.service";
import { BotSetting, BotStyles } from "src/bots/entities";
import { ConversationService } from "src/conversation/conversation.service";
import { ConversationTypeEnum } from "src/conversation/enums/conversation-type.enum";
import {
  SocketState,
  SocketStateService,
} from "src/socket/socket-state.service";
import { TokenService } from "src/token/token.service";
import { VisitorService } from "src/visitor/visitor.service";
import { WidgetVisitorDTO } from "./dto/widget-visitor.dto";
import { ModeEnum } from "./enums/mode.enum";
import { OfferService } from "src/offer/offer.service";
import { AdvertisementService } from "src/advertisement/advertisement.service";
import { ClickDto } from "./dto/click.dto";
import { ClickEnum } from "./enums/click.enum";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { ConfigService } from "@nestjs/config";
import { PlatformEnum } from "src/conversation/enums/platform.enum";
import { decideResume, parseResumeRequest, ResumeDecision } from "./resume";

// Widget visitors are not platform users, so `role` is the literal 'visitor'
// and `organizationId` is not applicable — kept separate from the dashboard
// Role enum.
export interface SocketJwtPayload
  extends Omit<JwtPayload, 'role' | 'organizationId'> {
  name: string;
  mode: ModeEnum;
  role: 'visitor';
  organizationId?: string | null;
}

@Injectable()
export class WidgetService {
  private readonly logger = new Logger(WidgetService.name);
  constructor(
    private readonly visitorService: VisitorService,
    private readonly botsService: BotsService,
    private readonly socketStateService: SocketStateService,
    private readonly tokenService: TokenService,
    private readonly conversationService: ConversationService,
    private readonly offerService: OfferService,
    private readonly advertisementService: AdvertisementService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    // Optional: without the CRM bridge a returning visitor is simply not linked.
    @Optional() private readonly crmBridge?: CrmBridgeService,
    // Optional: without it the pre-chat form only fills the Visitor record.
    @Optional() private readonly contactCapture?: ContactCaptureService
  ) {}

  async getWidget(req: Request, botId: string, body: WidgetVisitorDTO) {
    try {
      if (!botId) {
        throw new HttpException("Bot Id is required", 400);
      }
      const bot = await this.botsService.getBotDataForWidget(botId);
      const botSettings = bot.botSetting as BotSetting;
      if (!this.checkRules(botSettings, req)) {
        throw new HttpException(
          "This Bot cannot be accessed from this domain",
          403
        );
      }
      const botStyles = bot.botStyles as BotStyles;

      const accessToken = await this.tokenService.sign(
        {
          _id: bot.id,
          role: body.mode || ModeEnum.live,
        },
        {
          expiresIn: "1h",
        }
      );

      return {
        botSettings: {
          languages: botSettings.languages,
          isLocation: botSettings.isLocation ?? false,
        },
        botStyles,
        accessToken,

        botName: bot.name,
        advertisement: bot.advertisement,
        offer: bot.offer,
      };
    } catch (e) {
      throw new HttpException(e.message, 500);
    }
  }

  checkRules(botsetings: BotSetting, req: Request): boolean {
    const origin = req.headers.origin;
    const domains = botsetings?.domains || [];

    if (domains.includes("all")) return true;

    if (domains.includes(origin)) return true;

    const isDomainMatched = domains.some((domain: string) => {
      if (domain.includes("https://")) {
        domain = domain.replace("https://", "");
      }
      if (domain.includes("http://")) {
        domain = domain.replace("http://", "");
      }
      if (origin.includes(domain)) {
        return true;
      }

      if (domain.includes("*")) {
        domain = domain.replace("*", "");

        if (origin.includes(domain)) {
          return true;
        }

        return false;
      }

      return false;
    });

    return isDomainMatched;
  }

  async createVisitor(body: any, req: any, jwt: any) {
    try {
      const { _id: botId, role: mode } = jwt;

      const bot = await this.botsService.getBotDataForWidget(botId);
      const botSettings = bot.botSetting as BotSetting;
      if (!this.checkRules(botSettings, req)) {
        throw new HttpException(
          "This Bot cannot be accessed from this domain",
          403
        );
      }
      // crm-incident-handover R9.3/R9.11: a reload with a stored session
      // resumes the same visitor and, when still open, the same conversation.
      const resumeReq = parseResumeRequest(body);
      let decision: ResumeDecision = { kind: "new_visitor", reason: "preview" };
      // Name already on file for a returning visitor (R4.3).
      let knownName: string | undefined;
      if (mode !== ModeEnum.preview) {
        const [visitorFacts, convFacts] = await Promise.all([
          resumeReq.visitorId ? this.visitorService.resumeFacts(resumeReq.visitorId).catch(() => null) : null,
          resumeReq.conversationId
            ? this.conversationService.resumeFacts(resumeReq.conversationId).catch(() => null)
            : null,
        ]);
        decision = decideResume(resumeReq, {
          botId: String(bot.id),
          visitor: visitorFacts,
          conversation: convFacts,
        });
        if (isRealName(visitorFacts?.name)) knownName = String(visitorFacts!.name).trim();
        if (decision.kind === "resume") {
          try {
            return await this.resumeSession(bot, botSettings, mode, decision, visitorFacts, convFacts);
          } catch (error) {
            // Expired in the meantime: same visitor, new conversation (R9.11).
            if (error?.status !== 409) throw error;
            decision = { kind: "new_conversation", visitorId: decision.visitorId, reason: "expired_during_resume" };
          }
        }
        // R14.7: a closed conversation shows the Ended_State on reload. No
        // token, no socket, no new conversation until "Start new chat".
        if (decision.kind === "ended") {
          return {
            visitorId: decision.visitorId,
            conversationId: decision.conversationId,
            ended: true,
            resumed: false,
          };
        }
      }

      let visitorId = "";
      if (mode === ModeEnum.preview) {
        visitorId = new ObjectID().toString();
      } else if (decision.kind === "new_conversation") {
        // Same person, new conversation: no new Visitor_Record (R9.3).
        visitorId = decision.visitorId;
      } else {
        const visitor = await this.visitorService.createVisitor(
          {
            name: body.name,
            email: body.email,
            phone: body.phone,
            bot: botId,
            platform: PlatformEnum.WIDGET,
          },
          req
        );
        visitorId = visitor.id;
      }

      const dataForToken: SocketJwtPayload = {
        email: body.email,
        name: body.name || "Anonymous",
        role: "visitor",
        _id: visitorId,
        mode: mode || ModeEnum.live,
      };

      const accessToken = await this.tokenService.sign(dataForToken, {
        expiresIn: "1h",
      });

      const nodeData = await this.botsService.getBotNode(bot.botFlow.startNode);

      const data: SocketState = {
        botId: bot.id,
        currentNode: nodeData,
        startNode: nodeData,
        botSettings,
        mode: mode || ModeEnum.live,
        botName: bot.name,
        platform: PlatformEnum.WIDGET,
        // A known visitor's entry may still hold the previous conversation
        // ("Start new chat" after the Ended_State, R14.9). The new one starts
        // clean; updateUserData only merges, so every per-conversation key
        // is reset explicitly. The pre-chat form's answers are the first
        // attributes, under the bot's contact aliases, so the flow never asks
        // for them again (crm-plugins-service-desk R23).
        attributes: formAttributes(body, botSettings?.contactMapping),
        BotNodeState: {},
        questionNodeState: {},
        metadata: {},
        handledByAgent: false,
        assignedAgentId: undefined,
        announcedAgentId: undefined,
        // A real name from the form, or one already on file for this visitor,
        // counts as told (R4.3).
        visitorName: isRealName(body.name)
          ? String(body.name).trim()
          : decision.kind === "new_conversation"
          ? knownName
          : undefined,
        nameCaptured:
          isRealName(body.name) || (decision.kind === "new_conversation" && !!knownName),
        awaitingProblem: undefined,
        acceptedProblem: undefined,
        pendingIdentity: undefined,
        pendingConfirm: undefined,
        skipPrefillFor: undefined,
        awaitingClosure: undefined,
        closureAnsweredAt: undefined,
        conversationEnded: false,
        resumed: false,
        hasHistory: false,
        persistedNodeId: undefined,
      };

      if (mode !== ModeEnum.preview) {
        const conversation = await this.conversationService.createConversation(
          {
            bot: bot.id,
            type: ConversationTypeEnum.BOT,
            visitor: visitorId,
            // Anonymous = the visitor gave no way to reach them (R4.6). This
            // was `!!body.email`, the inverse.
            anonymous: !body.email && !body.phone,
            platform: PlatformEnum.WIDGET,
          },
          // A known visitor who could not resume gets a fresh conversation.
          { forceNew: decision.kind === "new_conversation" }
        );
        data.conversationId = conversation.id;
        // Pre-chat form details go to the CRM like any other capture (R1.1).
        // Fire-and-forget: the visitor never waits on the CRM.
        if (this.contactCapture && (body.name || body.email || body.phone)) {
          void this.contactCapture.capture(
            {
              conversationId: String(conversation.id),
              visitorId,
              botId: String(bot.id),
              botName: bot.name,
              channel: PlatformEnum.WIDGET,
              mode,
              botSettings: botSettings as any,
            },
            { name: body.name, email: body.email, phone: body.phone },
            "widget_form"
          );
        }
        // A known visitor's new conversation belongs to their CRM contact
        // (R16.4, R18.8). Fire-and-forget: the visitor never waits on the CRM.
        if (decision.kind === "new_conversation" && this.crmBridge) {
          void this.crmBridge.linkReturning({
            conversationId: String(conversation.id),
            visitorId,
            botId: String(bot.id),
            botName: bot.name,
            channel: PlatformEnum.WIDGET,
            mode,
            botSettings: botSettings as any,
          });
        }
      } else data.conversationId = new ObjectID().toString();

      //this.logger.debug('Visitor Initial State : ' + JSON.stringify(data));
      this.socketStateService.updateUserData(visitorId, data);
      return {
        accessToken,
        visitorId,
        // Stored by the widget per bot so a reload resumes (R9.3).
        conversationId: mode === ModeEnum.preview ? undefined : data.conversationId,
        resumed: false,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message, 500);
    }
  }

  /**
   * Resume an open widget conversation after a reload (R9.3): same visitor,
   * same conversation, fresh token, socket state rebuilt from the persisted
   * flow position. `resumed` tells the gateway not to send "start".
   * A missing / deleted node falls back to the start node (never a dead bot).
   */
  private async resumeSession(
    bot: any,
    botSettings: BotSetting,
    mode: ModeEnum,
    decision: { visitorId: string; conversationId: string },
    visitor: { name?: string; email?: string } | null,
    conv: {
      flowNodeId?: string;
      hasChats: boolean;
      awaitingClosure?: { sentAt: Date; idleMinutes?: number };
    } | null,
  ) {
    // The expiry cron may have run since the decision: re-check right before
    // handing out a token, so a visitor never types into an expired chat.
    const latest = await this.conversationService.getConversationStatus(decision.conversationId).catch(() => null);
    if (latest !== "in_progress") {
      throw new HttpException("Conversation is no longer open", 409);
    }
    const startNode = await this.botsService.getBotNode(bot.botFlow.startNode);
    let currentNode = startNode;
    if (conv?.flowNodeId) {
      currentNode = (await this.botsService.getBotNode(conv.flowNodeId).catch(() => null)) || startNode;
    }
    const existing = this.socketStateService.getUserData(decision.visitorId);
    const name = isRealName(visitor?.name) ? String(visitor!.name).trim() : "Anonymous";
    const accessToken = await this.tokenService.sign(
      {
        email: visitor?.email,
        name,
        role: "visitor",
        _id: decision.visitorId,
        mode: mode || ModeEnum.live,
      } as SocketJwtPayload,
      { expiresIn: "1h" }
    );
    // Keep any live state (another tab, agent ownership); fill what is missing.
    this.socketStateService.updateUserData(decision.visitorId, {
      ...(isRealName(visitor?.name) ? { visitorName: name, nameCaptured: true } : {}),
      botId: bot.id,
      startNode,
      currentNode: existing?.currentNode ?? currentNode,
      botSettings,
      mode: mode || ModeEnum.live,
      botName: bot.name,
      platform: PlatformEnum.WIDGET,
      conversationId: decision.conversationId,
      resumed: true,
      hasHistory: !!conv?.hasChats,
      // Closed in memory a moment ago, database write still in flight: stay
      // ended so the gateway shows the Ended_State, never a live chat.
      conversationEnded:
        !!existing?.conversationEnded &&
        String(existing.conversationId) === String(decision.conversationId),
      // A Closure_Prompt pending before the reload still takes the first
      // reply (R14.1); its idle clock keeps running from when it was sent.
      awaitingClosure:
        existing?.awaitingClosure ??
        (conv?.awaitingClosure?.sentAt
          ? {
              sentAt: new Date(conv.awaitingClosure.sentAt).getTime(),
              idleMinutes: Number(conv.awaitingClosure.idleMinutes) || 10,
            }
          : undefined),
    } as SocketState);
    return {
      accessToken,
      visitorId: decision.visitorId,
      conversationId: decision.conversationId,
      resumed: true,
    };
  }

  async handleOfferOrAdvertisementClick(
    body: ClickDto,
    jwt: any,
    req: Request
  ) {
    try {
      const { _id: botId, role: mode } = jwt;
      if (mode === ModeEnum.preview) return;
      const bot = await this.botsService.getBotDataForWidget(botId);
      const botSettings = bot.botSetting as BotSetting;
      if (!this.checkRules(botSettings, req)) {
        throw new HttpException(
          "This Bot cannot be accessed from this domain",
          403
        );
      }
      const { type, id, tag } = body;

      if (type === ClickEnum.offer) {
        await this.offerService.incrementClicks({
          offerId: id,
          botId,
          tag,
        });
      }
      if (type === ClickEnum.ads) {
        await this.advertisementService.incrementClicks({
          advertisementId: id,
          botId,
          tag,
        });
      }
    } catch (error) {
      throw new HttpException(error.message, 500);
    }
  }

  async googleTranslite(text: string, lang: string) {
    try {
      // text=hello&itc=hi-t-i0-und&num=13&cp=0&cs=1&ie=utf-8&oe=utf-8&app=demopage
      const url = `https://inputtools.google.com/request`;
      const response = await firstValueFrom(
        this.httpService.post(
          url,
          {},
          {
            params: {
              text,
              itc: `${lang}-t-i0-und`,
              num: 13,
              cp: 0,
              cs: 1,
              ie: "utf-8",
              oe: "utf-8",
            },
          }
        )
      );
      return response.data;
    } catch (error) {
      throw new HttpException(error.message, 500);
    }
  }
}

/** Valid pre-chat form values under the bot's contact aliases. */
export function formAttributes(
  body: { name?: unknown; email?: unknown; phone?: unknown } | null | undefined,
  mapping?: ContactMapping | null,
): Record<string, string> {
  const d = cleanDetails({ name: body?.name, email: body?.email, phone: body?.phone });
  const m = effectiveMapping(mapping);
  const out: Record<string, string> = {};
  if (d.name && m.name) out[m.name] = d.name;
  if (d.email && m.email) out[m.email] = d.email;
  if (d.phone && m.phone) out[m.phone] = d.phone;
  return out;
}

/** A name the visitor actually gave: not empty and not the "Anonymous" default. */
function isRealName(name: unknown): boolean {
  if (typeof name !== "string") return false;
  const n = name.trim();
  return !!n && n.toLowerCase() !== "anonymous";
}
