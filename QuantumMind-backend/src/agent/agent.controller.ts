import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ApiSecurity, ApiTags } from "@nestjs/swagger";
import { JwtPayload } from "src/auth/strategy/jwt.strategy";

import { CurrentUser } from "src/util/current-user.decorator";
import { Roles } from "src/common/decorators/roles.decorator";
import { Role } from "src/common/enums/role.enum";
import { ReportParamsDto } from "src/util/report-params.dto";
import { AgentQueryParams } from "./agent-query.params";
import { AgentService } from "./agent.service";
import { CreateAgentDto } from "./dto/create-agent.dto";
import { UpdateAgentDto } from "./dto/update-agent.dto";

@ApiTags("Agent")
@ApiSecurity("bearer")
@Controller("agent")
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Roles(Role.SUPER_ADMIN, Role.ORG_ADMIN, Role.ORG_MANAGER)
  @Post()
  async create(
    @Body() createAgentDto: CreateAgentDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return await this.agentService.create(createAgentDto, actor);
  }

  @Roles(Role.ORG_ADMIN, Role.ORG_MANAGER)
  @Get()
  async findAll(
    @Query() query: AgentQueryParams,
    @CurrentUser() user: JwtPayload,
  ) {
    return await this.agentService.findAll(query, user);
  }

  @Get("welcome")
  async welcome(@CurrentUser() agent: JwtPayload) {
    return await this.agentService.welcomeToAgent(agent._id);
  }

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
  async dayWisePerformanceReport(@Query() query: ReportParamsDto) {
    return await this.agentService.dayWisePerformance(query);
  }

  @Get("report/date-wise-performance")
  async dateWisePerformanceReport(@Query() query: ReportParamsDto) {
    return await this.agentService.dateWiseConversations(query);
  }

  @Get("me")
  async getMe(@CurrentUser() agent: JwtPayload) {
    return await this.agentService.getMe(agent);
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    return await this.agentService.findOne(id);
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() updateAgentDto: UpdateAgentDto
  ) {
    return await this.agentService.update(id, updateAgentDto);
  }

  @Roles(Role.ORG_ADMIN, Role.ORG_MANAGER)
  @Delete(":id")
  async remove(@Param("id") id: string) {
    return await this.agentService.remove(id);
  }
}
