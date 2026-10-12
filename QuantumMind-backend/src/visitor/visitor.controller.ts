import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';

import { CreateVisitorDto } from './dto/create-visitor.dto';
import { VisitorQueryParams } from './dto/visitor-query.params.dto';
import { VisitorService } from './visitor.service';
import { ReportParamsDto } from 'src/util/report-params.dto';
import { CurrentUser } from 'src/util';
import { JwtPayload } from 'src/auth/strategy/jwt.strategy';
import { TenantScopeService } from 'src/common/tenant/tenant-scope.service';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ORG_STAFF } from 'src/common/enums/role.enum';

/**
 * Visitors tab + visitor reports. No route is public any more: every count,
 * report and lookup is pinned to the caller's org bots.
 * (Default roles: ORG_ADMIN, ORG_MANAGER, AGENT.)
 */
@Controller('visitor')
@ApiTags('Visitor')
@ApiSecurity('bearer')
export class VisitorController {
  constructor(
    private readonly visitorService: VisitorService,
    private readonly tenantScope: TenantScopeService,
  ) {}

  @Get()
  async findAll(
    @Query() query: VisitorQueryParams,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.visitorService.getAllVisitors(query, user as any);
  }

  @Get('/stat/home')
  async getHomeVisitorsStats(
    @Query('time') time: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return await this.visitorService.homeVisitorCount(time, user as any);
  }

  @Get('report/month-wise')
  async getMonthWiseReport(@CurrentUser() user: JwtPayload) {
    return await this.visitorService.monthWiseVisitor(user as any);
  }

  @Get('report/total')
  async totalVisitors(@CurrentUser() user: JwtPayload) {
    return await this.visitorService.getVisitorReport(user as any);
  }

  @Get('report/details')
  async visitorDetails(@CurrentUser() user: JwtPayload) {
    return await this.visitorService.getVisiorPattern(user as any);
  }

  @Get('report/total/handel-by-bot')
  async handledByBot(
    @Query() query: ReportParamsDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return await this.visitorService.getHandledByBotReport(query, user as any);
  }

  @Get('report/total/handel-by-agent')
  async handledByAgent(
    @Query() query: ReportParamsDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return await this.visitorService.getHandledByAgentReport(
      query,
      user as any,
    );
  }

  @Get('stats')
  async getStats(@CurrentUser() user: JwtPayload) {
    return await this.visitorService.getStats(30, user as any);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.visitorService.getVisitor(id, user as any);
  }

  /** Manual visitor creation: the target bot must be in the caller's org. */
  @Roles(...ORG_STAFF)
  @Post()
  async create(
    @Body() body: CreateVisitorDto,
    @Req() req: any,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.tenantScope.assertBotInOrg(user as any, (body as any)?.bot);
    return await this.visitorService.createVisitor(body, req);
  }
}
