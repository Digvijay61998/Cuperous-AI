import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ApiSecurity, ApiTags } from "@nestjs/swagger";
import { JwtPayload } from "src/auth/strategy/jwt.strategy";

import { CurrentUser } from "src/util/current-user.decorator";
import { Roles } from "src/common/decorators/roles.decorator";
import { ALL_ROLES, ORG_STAFF, Role } from "src/common/enums/role.enum";
import { ReportParamsDto } from "src/util/report-params.dto";
import { AgentQueryParams } from "./agent-query.params";
import { AgentService } from "./agent.service";
import { CreateAgentDto } from "./dto/create-agent.dto";
import { UpdateAgentDto } from "./dto/update-agent.dto";
import { UpdateNotificationPrefsDto } from "./dto/update-notification-prefs.dto";

/**
 * Tenant user management (the "Agents" tab). Every read/write is pinned to the
 * caller's organization by AgentService; cross-org ids resolve to 404.
 *
 * SUPER_ADMIN is only allowed on create (org-owner provisioning) and on the
 * identity endpoint `GET /agent/me`; the console uses its own APIs.
 */
@ApiTags("Agent")
@ApiSecurity("bearer")
@Controller("agent")
@Roles(...ORG_STAFF)
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Roles(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.ORG_MANAGER)
  @Post()
  async create(
    @Body() createAgentDto: CreateAgentDto,
    @CurrentUser() actor: JwtPayload
  ) {
    return await this.agentService.create(createAgentDto, actor);
  }

  @Get()
  async findAll(
    @Query() query: AgentQueryParams,
    @CurrentUser() user: JwtPayload
  ) {
    return await this.agentService.findAll(query, user);
  }

  // Agent's own home tile.
  @Roles(Role.ORG_ADMIN, Role.ORG_MANAGER, Role.AGENT)
  @Get("welcome")
  async welcome(@CurrentUser() agent: JwtPayload) {
    return await this.agentService.welcomeToAgent(agent._id);
  }

  // Name/id pairs for pickers (e.g. transfer chat). Needed by agents too.
  @Roles(Role.ORG_ADMIN, Role.ORG_MANAGER, Role.AGENT)
  @Get("list")
  async getAgentList(@CurrentUser() user: JwtPayload) {
    return await this.agentService.agentList(user);
  }

  @Get("stats")
  async getAgentStats(@CurrentUser() user: JwtPayload) {
    return await this.agentService.getStats(user as any);
  }

  @Get("report/total")
  async getAgentReport(@CurrentUser() user: JwtPayload) {
    return await this.agentService.getTotalAgent(user as any);
  }

  @Get("report/day-wise-performance")
  async dayWisePerformanceReport(
    @Query() query: ReportParamsDto,
    @CurrentUser() user: JwtPayload
  ) {
    await this.assertReportTarget(query, user);
    return await this.agentService.dayWisePerformance(query, user);
  }

  @Get("report/date-wise-performance")
  async dateWisePerformanceReport(
    @Query() query: ReportParamsDto,
    @CurrentUser() user: JwtPayload
  ) {
    await this.assertReportTarget(query, user);
    return await this.agentService.dateWiseConversations(query, user);
  }

  /** Every platform role needs its own identity (login bootstrap). */
  @Roles(...ALL_ROLES)
  @Get("me")
  async getMe(@CurrentUser() agent: JwtPayload) {
    return await this.agentService.getMe(agent);
  }

  /** The caller's own dashboard sound preferences. Declared before `:id`. */
  @Roles(...ALL_ROLES)
  @Patch("me/notification-prefs")
  async updateNotificationPrefs(
    @Body() body: UpdateNotificationPrefsDto,
    @CurrentUser() user: JwtPayload
  ) {
    return await this.agentService.updateNotificationPrefs(user, body);
  }

  @Roles(Role.ORG_ADMIN, Role.ORG_MANAGER, Role.AGENT)
  @Get(":id")
  async findOne(@Param("id") id: string, @CurrentUser() user: JwtPayload) {
    return await this.agentService.findOne(id, user);
  }

  @Roles(Role.ORG_ADMIN, Role.ORG_MANAGER, Role.AGENT)
  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() updateAgentDto: UpdateAgentDto,
    @CurrentUser() user: JwtPayload
  ) {
    return await this.agentService.update(id, updateAgentDto, user);
  }

  @Delete(":id")
  async remove(@Param("id") id: string, @CurrentUser() user: JwtPayload) {
    return await this.agentService.remove(id, user);
  }

  /** Per-agent reports require the agent to be in the caller's org. */
  private async assertReportTarget(query: ReportParamsDto, user: JwtPayload) {
    if (!query?.id) throw new NotFoundException("Agent not found");
    await this.agentService.findOne(query.id, user);
  }
}
