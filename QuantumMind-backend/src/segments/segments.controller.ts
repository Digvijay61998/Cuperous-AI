import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/auth/Public/public.decorator';
import { AddVisitorToSegmentDto } from './dto/add-visitor-to-segement.dto';

import { CreateSegmentDto } from './dto/create-segment.dto';
import { SegmentsService } from './segments.service';
import { SegmentQueryParams } from './dto/get-segment.params.dto';
import { ComparisonDto } from 'src/util/comparison.dto';

@Controller('segments')
@ApiTags('Segments')
@ApiSecurity('bearer')
export class SegmentsController {
  constructor(private readonly segmentsService: SegmentsService) {}

  @Post()
  async createSegment(@Body() createSegmentDto: CreateSegmentDto) {
    return this.segmentsService.create(createSegmentDto);
  }

  @Get()
  async findAll() {
    return this.segmentsService.findAll();
  }

  @Public()
  @Get('report/count')
  async segmentSummary() {
    return this.segmentsService.findSegmentsVisitorsCount();
  }

  @Get('report/day-wise-performance')
  @Public()
  async segmentSummaryStats(@Query() query: SegmentQueryParams) {
    return this.segmentsService.getDayWisePerformance(query);
  }

  @Public()
  @Get('report/date-wise-performance')
  @Public()
  async segmentDateWiseStats(@Query() query: SegmentQueryParams) {
    return this.segmentsService.getDateWiseSegmentVisitors(query);
  }

  @Public()
  @Get('report/date-wise-compare')
  async segmentDateWiseCompare(@Query() query: ComparisonDto) {
    return this.segmentsService.getDateWiseSegmentCompare(query);
  }

  @Public()
  @Get('stats')
  async getStats() {
    return this.segmentsService.getSegmentStats();
  }

  @Get(':visitorId')
  @Public()
  async getSegmentsByVisitorId(@Param('visitorId') visitorId: string) {
    return await this.segmentsService.getAllSegmentsOfVisitor(visitorId);
  }

  @Get(':id/visitors')
  @Public()
  async getVisitors(@Param('id') segmentId: string) {
    return this.segmentsService.getVisitors(segmentId);
  }

  @Delete(':id')
  async delete(@Param('id') segmentId: string) {
    return this.segmentsService.removeSegment(segmentId);
  }

  @Public()
  @Post(':id/add-visitor')
  async addUser(
    @Param('id') segmentId: string,
    @Body() body: AddVisitorToSegmentDto,
  ) {
    return this.segmentsService.addVisitor(segmentId, body.visitorId);
  }

  @Post(':id/remove-visitor')
  @Public()
  async removeUser(
    @Param('id') segmentId: string,
    @Body() body: AddVisitorToSegmentDto,
  ) {
    return this.segmentsService.removeVisitor(segmentId, body.visitorId);
  }
}
