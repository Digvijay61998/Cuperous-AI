import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/auth/Public/public.decorator';

import { CreateVisitorDto } from './dto/create-visitor.dto';
import { VisitorQueryParams } from './dto/visitor-query.params.dto';
import { VisitorService } from './visitor.service';
import { ReportParamsDto } from 'src/util/report-params.dto';

@Controller('visitor')
@ApiTags('Visitor')
@ApiSecurity('bearer')
export class VisitorController {
  constructor(private readonly visitorService: VisitorService) {}

  @Public()
  @Get()
  async findAll(@Query() query: VisitorQueryParams) {
    return this.visitorService.getAllVisitors(query);
  }

  @Get('/stat/home')
  @Public()
  async getHomeVisitorsStats(@Query('time') time: string) {
    return await this.visitorService.homeVisitorCount(time);
  }

  @Public()
  @Get('report/month-wise')
  async getMonthWiseReport() {
    return await this.visitorService.monthWiseVisitor();
  }

  @Get('report/total')
  async totalVisitors() {
    return await this.visitorService.getVisitorReport();
  }

  @Get('report/details')
  async visitorDetails() {
    return await this.visitorService.getVisiorPattern();
  }

  @Get('report/total/handel-by-bot')
  async handledByBot(@Query() query: ReportParamsDto) {
    return await this.visitorService.getHandledByBotReport(query);
  }

  @Get('report/total/handel-by-agent')
  async handledByAgent(@Query() query: ReportParamsDto) {
    return await this.visitorService.getHandledByAgentReport(query);
  }

  @Get('stats')
  async getStats() {
    return await this.visitorService.getStats();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.visitorService.getVisitor(id);
  }

  @Post()
  async create(@Body() body: CreateVisitorDto, @Req() req: any) {
    return await this.visitorService.createVisitor(body, req);
  }
}
