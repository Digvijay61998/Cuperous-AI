import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiSecurity, ApiTags } from "@nestjs/swagger";
import { JwtPayload } from "src/auth/strategy/jwt.strategy";
import { CurrentUser } from "src/util";
import { ConversationService } from "./conversation.service";
import { SearchConversationDto } from "./dto/search-conv.dto";
import { ConversationStatusEnum } from "./enums/conversation-status.enum";

/**
 * Conversation reads for the tenant dashboard. No route here is public: they
 * expose customer transcripts. Everything is pinned to the caller's bots.
 * (Default roles via RolesGuard: ORG_ADMIN, ORG_MANAGER, AGENT.)
 */
@Controller("conversation")
@ApiTags("Conversation")
@ApiSecurity("bearer")
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Get()
  async findAll(
    @Query() query: SearchConversationDto,
    @CurrentUser() user: JwtPayload
  ) {
    return await this.conversationService.getAllConversations(
      query,
      user as any
    );
  }

  @Get("active-conversations")
  async getActiveConversations(@CurrentUser() user: JwtPayload) {
    return await this.conversationService.getActiveConversations(user);
  }

  @Get("stats/active")
  async getActiveConversationsStats(@CurrentUser() user: JwtPayload) {
    return await this.conversationService.getActiveStats(user);
  }

  @Get("stats/home")
  async getHomeConversationsStats(
    @Query("time") time: string,
    @CurrentUser() user: JwtPayload
  ) {
    return await this.conversationService.homeConversationCount(
      time,
      undefined,
      user as any
    );
  }

  @Get("stats/home/blocked")
  async getHomeBlockedConversationsStats(
    @Query("time") time: string,
    @CurrentUser() user: JwtPayload
  ) {
    return await this.conversationService.homeConversationCount(
      time,
      ConversationStatusEnum.BLOCKED,
      user as any
    );
  }

  @Get("stats/history")
  async getHistoryConversationsStats(@CurrentUser() user: JwtPayload) {
    return await this.conversationService.getHistoryStats(user as any);
  }

  @Get("stats/block")
  async getBlockConversationsStats(@CurrentUser() user: JwtPayload) {
    return await this.conversationService.getBlockStats(user as any);
  }

  @Get(":id")
  async findOne(@Param("id") id: string, @CurrentUser() user: JwtPayload) {
    return await this.conversationService.getConversationById(id, user as any);
  }

  @Get("visitor/:visitorId")
  async getConversationByVisitorId(
    @Param("visitorId") visitorId: string,
    @CurrentUser() user: JwtPayload
  ) {
    return await this.conversationService.getConversationByVisitorId(
      visitorId,
      user as any
    );
  }

  @Get("agent/:agentId")
  async getConversationByAgentId(
    @Param("agentId") agentId: string,
    @CurrentUser() user: JwtPayload
  ) {
    return await this.conversationService.getConversationByAgentId(
      agentId,
      user as any
    );
  }

  @Get("bot/:botId")
  async getConversationByBotId(
    @Param("botId") botId: string,
    @CurrentUser() user: JwtPayload
  ) {
    return await this.conversationService.getConversationByBotId(
      botId,
      user as any
    );
  }
}
