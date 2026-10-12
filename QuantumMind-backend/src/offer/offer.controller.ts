import { RequiresFeature } from 'src/common/decorators/requires-feature.decorator';
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { OfferService } from './offer.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { SearchParamDto } from './dto/search-param.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { offerQueryParams } from './dto/get-offer.params.dto';
import { ComparisonDto } from 'src/util/comparison.dto';
import { CurrentUser } from 'src/util';
import { JwtPayload } from 'src/auth/strategy/jwt.strategy';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ORG_STAFF } from 'src/common/enums/role.enum';

@Controller('offer')
@RequiresFeature('offers')
@ApiTags('Offer')
@ApiSecurity('bearer')
export class OfferController {
  constructor(private readonly offerService: OfferService) {}

  @Post()
  @Roles(...ORG_STAFF)
  async create(
    @Body() createOfferDto: CreateOfferDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return await this.offerService.create(createOfferDto, user as any);
  }

  @Get()
  async findAll(@Query() query: SearchParamDto, @CurrentUser() user: JwtPayload) {
    return await this.offerService.findAll(query, user as any);
  }

  @Get('stats')
  async getStats(@CurrentUser() user: JwtPayload) {
    return await this.offerService.stats(30, user as any);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return await this.offerService.findOne(id, user as any);
  }

  @Patch(':id')
  @Roles(...ORG_STAFF)
  async update(
    @Param('id') id: string,
    @Body() updateOfferDto: UpdateOfferDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return await this.offerService.update(id, updateOfferDto, user as any);
  }

  @Delete(':id')
  @Roles(...ORG_STAFF)
  async remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return await this.offerService.remove(id, user as any);
  }

  @Get('report/count')
  async offerClickCount(@CurrentUser() user: JwtPayload) {
    return this.offerService.findOfferClickCount(user as any);
  }

  @Get('report/bots-total-clicks')
  async botClicksCountData(
    @Query() query: SearchParamDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.offerService.findBotClicksCount(query, user as any);
  }

  @Get('report/tags-total-clicks')
  async tagsClicksCountData(
    @Query() query: SearchParamDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.offerService.findTagsClicksCount(query, user as any);
  }

  @Get('report/day-wise-performance')
  async offerDateWiseStats(
    @Query() query: offerQueryParams,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.offerService.getDayWisePerformance(query, user as any);
  }

  @Get('report/date-wise-performance')
  async offerDateSummaryStats(
    @Query() query: offerQueryParams,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.offerService.getDateWisePerformance(query, user as any);
  }

  @Get('report/date-wise-compare')
  async offerDateWiseCompare(
    @Query() query: ComparisonDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.offerService.dateWiseComparison(query, user as any);
  }
}
