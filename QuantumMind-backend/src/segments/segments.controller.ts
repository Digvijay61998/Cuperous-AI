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
import { Roles } from 'src/common/decorators/roles.decorator';
import { ORG_STAFF } from 'src/common/enums/role.enum';
import { TenantContext } from 'src/common/tenant/tenant-context';
import { CurrentUser } from 'src/util';
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
  @Roles(...ORG_STAFF)
  async createSegment(
    @Body() createSegmentDto: CreateSegmentDto,
    @CurrentUser() user: any,
  ) {
    return this.segmentsService.create(
      createSegmentDto,
      user as TenantContext,
    );
  }

  @Get()
  async findAll(@CurrentUser() user: any) {
    return this.segmentsService.findAll(user as TenantContext);
  }

  @Get('report/count')
  async segmentSummary(@CurrentUser() user: any) {
    return this.segmentsService.findSegmentsVisitorsCount(
      user as TenantContext,
    );
  }

  @Get('report/day-wise-performance')
  async segmentSummaryStats(
    @Query() query: SegmentQueryParams,
    @CurrentUser() user: any,
  ) {
    return this.segmentsService.getDayWisePerformance(
      query,
      user as TenantContext,
    );
  }

  @Get('report/date-wise-performance')
  async segmentDateWiseStats(
    @Query() query: SegmentQueryParams,
    @CurrentUser() user: any,
  ) {
    return this.segmentsService.getDateWiseSegmentVisitors(
      query,
      user as TenantContext,
    );
  }

  @Get('report/date-wise-compare')
  async segmentDateWiseCompare(
    @Query() query: ComparisonDto,
    @CurrentUser() user: any,
  ) {
    return this.segmentsService.getDateWiseSegmentCompare(
      query,
      user as TenantContext,
    );
  }

  @Get('stats')
  async getStats(@CurrentUser() user: any) {
    return this.segmentsService.getSegmentStats(
      undefined,
      user as TenantContext,
    );
  }

  @Get(':visitorId')
  async getSegmentsByVisitorId(
    @Param('visitorId') visitorId: string,
    @CurrentUser() user: any,
  ) {
    return await this.segmentsService.getAllSegmentsOfVisitor(
      visitorId,
      user as TenantContext,
    );
  }

  @Get(':id/visitors')
  async getVisitors(@Param('id') segmentId: string, @CurrentUser() user: any) {
    return this.segmentsService.getVisitors(segmentId, user as TenantContext);
  }

  @Delete(':id')
  @Roles(...ORG_STAFF)
  async delete(@Param('id') segmentId: string, @CurrentUser() user: any) {
    return this.segmentsService.removeSegment(
      segmentId,
      user as TenantContext,
    );
  }

  @Post(':id/add-visitor')
  @Roles(...ORG_STAFF)
  async addUser(
    @Param('id') segmentId: string,
    @Body() body: AddVisitorToSegmentDto,
    @CurrentUser() user: any,
  ) {
    return this.segmentsService.addVisitor(
      segmentId,
      body.visitorId,
      user as TenantContext,
    );
  }

  @Post(':id/remove-visitor')
  @Roles(...ORG_STAFF)
  async removeUser(
    @Param('id') segmentId: string,
    @Body() body: AddVisitorToSegmentDto,
    @CurrentUser() user: any,
  ) {
    return this.segmentsService.removeVisitor(
      segmentId,
      body.visitorId,
      user as TenantContext,
    );
  }
}
