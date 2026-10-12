import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { JwtPayload } from 'src/auth/strategy/jwt.strategy';
import { CurrentUser } from 'src/util';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { TicketsService } from './tickets.service';
import { ReportParamsDto } from 'src/util/report-params.dto';
import { SearchParamDto } from './dto/search-param.dto';
import { TicketStatusEnum } from './enums/ticket-status.enum';

/**
 * Service Requests tab. All routes authenticated and org-scoped (default roles:
 * ORG_ADMIN, ORG_MANAGER, AGENT). Literal routes are declared BEFORE `:id` so
 * e.g. `/tickets/report/total` is not captured as `:id = "report"`.
 */
@Controller('tickets')
@ApiTags('Tickets')
@ApiSecurity('bearer')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  create(
    @Body() createTicketDto: CreateTicketDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.ticketsService.create(createTicketDto, user as any);
  }

  @Get()
  async findAll(
    @Query() query: SearchParamDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return await this.ticketsService.findAll(query, user as any);
  }

  @Get('assign-to-me')
  async assignToMe(@CurrentUser() user: JwtPayload, @Query('id') id: string) {
    return await this.ticketsService.assignTicketToMe(id, user);
  }

  /** The old "Defer" button called this route, which did not exist (R19.2). */
  @Get('mark-as-deferred')
  async markAsDeferred(
    @Query('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return await this.ticketsService.markAsDeferred(id, user);
  }

  @Get('mark-as-resolved')
  async markAsResolved(
    @Query('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return await this.ticketsService.markAsResolved(id, user);
  }

  @Get('stats')
  async getStats(@CurrentUser() user: JwtPayload) {
    return await this.ticketsService.ticketStats(7, user as any);
  }

  @Get('stats/home')
  async getHomeStats(
    @Query('time') time: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return await this.ticketsService.homeTicketCount(
      time,
      undefined,
      user as any,
    );
  }

  @Get('stats/home/pending')
  async getHomePendiNgStats(
    @Query('time') time: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return await this.ticketsService.homeTicketCount(
      time,
      TicketStatusEnum.OPEN,
      user as any,
    );
  }

  @Get('report/total')
  async getTotalReport(@CurrentUser() user: JwtPayload) {
    return await this.ticketsService.getTotalTicketsReport(user as any);
  }

  @Get('report/day-wise-performance')
  async dayWisePerformanceReport(
    @Query() query: ReportParamsDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return await this.ticketsService.dayWisePerformance(query, user as any);
  }

  @Get('report/date-wise-performance')
  async dateWisePerformanceReport(
    @Query() query: ReportParamsDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return await this.ticketsService.dateWisePerformance(query, user as any);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return await this.ticketsService.findOne(id, user as any);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTicketDto: UpdateTicketDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return await this.ticketsService.update(id, updateTicketDto, user as any);
  }
}
