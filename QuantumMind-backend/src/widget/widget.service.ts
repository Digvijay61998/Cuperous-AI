import { HttpException, Injectable, Logger } from "@nestjs/common";
import { ObjectID } from "bson";
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
    private readonly configService: ConfigService
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
      let visitorId = "";
      if (mode === ModeEnum.preview) {
        visitorId = new ObjectID().toString();
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
      };

      if (mode !== ModeEnum.preview) {
        const conversation = await this.conversationService.createConversation({
          bot: bot.id,
          type: ConversationTypeEnum.BOT,
          visitor: visitorId,
          anonymous: body.email ? true : false,
          platform: PlatformEnum.WIDGET,
        });
        data.conversationId = conversation.id;
      } else data.conversationId = new ObjectID().toString();

      //this.logger.debug('Visitor Initial State : ' + JSON.stringify(data));
      this.socketStateService.updateUserData(visitorId, data);
      return {
        accessToken,
        visitorId,
      };
    } catch (error) {
      throw new HttpException(error.message, 500);
    }
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
