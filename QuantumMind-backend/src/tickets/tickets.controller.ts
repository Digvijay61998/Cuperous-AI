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
import { Public } from 'src/auth/Public/public.decorator';
import { ReportParamsDto } from 'src/util/report-params.dto';
import { SearchParamDto } from './dto/search-param.dto';
import { TicketStatusEnum } from './enums/ticket-status.enum';

@Controller('tickets')
@ApiTags('Tickets')
@ApiSecurity('bearer')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  create(@Body() createTicketDto: CreateTicketDto) {
    return this.ticketsService.create(createTicketDto);
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
  @Public()
  async getHomeStats(@Query('time') time: string) {
    return await this.ticketsService.homeTicketCount(time);
  }

  @Get('stats/home/pending')
  @Public()
  async getHomePendiNgStats(@Query('time') time: string) {
    return await this.ticketsService.homeTicketCount(
      time,
      TicketStatusEnum.OPEN,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return await this.ticketsService.findOne(id, user as any);
  }

  @Get('report/total')
  async getTotalReport() {
    return await this.ticketsService.getTotalTicketsReport();
  }

  @Get('report/day-wise-performance')
  async dayWisePerformanceReport(@Query() query: ReportParamsDto) {
    return await this.ticketsService.dayWisePerformance(query);
  }

  @Get('report/date-wise-performance')
  async dateWisePerformanceReport(@Query() query: ReportParamsDto) {
    return await this.ticketsService.dateWisePerformance(query);
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
