import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiSecurity, ApiTags } from "@nestjs/swagger";
import { use } from "passport";
import { Public } from "src/auth/Public/public.decorator";
import { JwtPayload } from "src/auth/strategy/jwt.strategy";
import { CurrentUser } from "src/util";
import { ReportParamsDto } from "src/util/report-params.dto";
import { ConversationService } from "./conversation.service";
import { SearchConversationDto } from "./dto/search-conv.dto";
import { ConversationStatusEnum } from "./enums/conversation-status.enum";
import { PlatformEnum } from "./enums/platform.enum";

@Controller("conversation")
@ApiTags("Conversation")
@ApiSecurity("bearer")
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Get()
  async findAll(@Query() query: SearchConversationDto) {
    return await this.conversationService.getAllConversations(query);
  }

  @Get("active-conversations")
  async getActiveConversations(@CurrentUser() user: JwtPayload) {
    return await this.conversationService.getActiveConversations(user);
  }

  @Get("stats/active")
  async getActiveConversationsStats(@CurrentUser() user: JwtPayload) {
    return await this.conversationService.getActiveStats(user);
  }

  @Public()
  @Get("stats/home")
  async getHomeConversationsStats(@Query("time") time: string) {
    return await this.conversationService.homeConversationCount(time);
  }

  @Public()
  @Get("stats/home/blocked")
  async getHomeBlockedConversationsStats(@Query("time") time: string) {
    return await this.conversationService.homeConversationCount(
      time,
      ConversationStatusEnum.BLOCKED
    );
  }

  @Get("stats/history")
  @Public()
  async getHistoryConversationsStats() {
    return await this.conversationService.getHistoryStats();
  }

  @Get("stats/block")
  async getBlockConversationsStats() {
    return await this.conversationService.getBlockStats();
  }

  @Public()
  @Get(":id")
  async findOne(@Param("id") id: string) {
    return await this.conversationService.getConversationById(id);
  }

  @Get("visitor/:visitorId")
  async getConversationByVisitorId(@Param("visitorId") visitorId: string) {
    return await this.conversationService.getConversationByVisitorId(visitorId);
  }

  @Get("agent/:agentId")
  async getConversationByAgentId(@Param("agentId") agentId: string) {
    return await this.conversationService.getConversationByAgentId(agentId);
  }

  @Get("bot/:botId")
  async getConversationByBotId(@Param("botId") botId: string) {
    return await this.conversationService.getConversationByBotId(botId);
  }
}
