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

@Controller('offer')
@ApiTags('Offer')
@ApiSecurity('bearer')
export class OfferController {
  constructor(private readonly offerService: OfferService) {}

  @Post()
  async create(@Body() createOfferDto: CreateOfferDto) {
    return await this.offerService.create(createOfferDto);
  }

  @Get()
  async findAll(@Query() query: SearchParamDto) {
    return await this.offerService.findAll(query);
  }

  @Get('stats')
  async getStats() {
    return await this.offerService.stats();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.offerService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateOfferDto: UpdateOfferDto,
  ) {
    return await this.offerService.update(id, updateOfferDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.offerService.remove(id);
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
