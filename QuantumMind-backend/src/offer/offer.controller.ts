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
import { Public } from 'src/auth/Public/public.decorator';
import { ComparisonDto } from 'src/util/comparison.dto';
import { CurrentUser } from 'src/util';
import { JwtPayload } from 'src/auth/strategy/jwt.strategy';

@Controller('offer')
@ApiTags('Offer')
@ApiSecurity('bearer')
export class OfferController {
  constructor(private readonly offerService: OfferService) {}

  @Post()
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
  async update(
    @Param('id') id: string,
    @Body() updateOfferDto: UpdateOfferDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return await this.offerService.update(id, updateOfferDto, user as any);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return await this.offerService.remove(id, user as any);
  }

  @Get('report/count')
  @Public()
  async offerClickCount() {
    return this.offerService.findOfferClickCount();
  }

  @Get('report/bots-total-clicks')
  @Public()
  async botClicksCountData(@Query() query: SearchParamDto) {
    return this.offerService.findBotClicksCount(query);
  }
  @Get('report/tags-total-clicks')
  async tagsClicksCountData(@Query() query: SearchParamDto) {
    return this.offerService.findTagsClicksCount(query);
  }
  @Get('report/day-wise-performance')
  @Public()
  async offerDateWiseStats(@Query() query: offerQueryParams) {
    return this.offerService.getDayWisePerformance(query);
  }
  @Get('report/date-wise-performance')
  @Public()
  async offerDateSummaryStats(@Query() query: offerQueryParams) {
    return this.offerService.getDateWisePerformance(query);
  }

  @Get('report/date-wise-compare')
  @Public()
  async offerDateWiseCompare(@Query() query: ComparisonDto) {
    return this.offerService.dateWiseComparison(query);
  }
}
