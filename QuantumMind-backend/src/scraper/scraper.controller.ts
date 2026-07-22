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
import { Public } from "src/auth/Public/public.decorator";
import { CreateScrapeDto } from "./dto/create-scraper.dto";
import { SearchParamDto } from "./dto/search-param.dto";
import { ScraperService } from "./scraper.service";
import { UpdateScrapeDto } from "./dto/UpdateScraperDto.dto";
@Controller("scraper")
@ApiTags("Scraper")
// @ApiSecurity('bearer')
export class ScraperController {
  constructor(private readonly ScraperService: ScraperService) {}

  @Post()
  @Public()
  async create(@Body() CreateScrapeDto: CreateScrapeDto) {
    return await this.ScraperService.create(CreateScrapeDto);
  }

  @Get()
  @Public()
  async findAll(@Query() query: SearchParamDto) {
    return await this.ScraperService.findAll(query);
  }

  @Get("params")
  // @Public()
  getParams() {
    return this.ScraperService.getParams();
  }

  // @Patch(':id')
  // @Public()
  // async update(
  //   @Param('id') id: string,
  //   @Body() updateScrapeDto: UpdateScrapeDto,
  // ) {
  //   return await this.ScraperService.update(id, updateScrapeDto);
  // }

  // @Patch('/scrape/:id')
  // @Public()
  // async updateScrape(
  //   @Param('id') id: string,
  //   @Body() CreateScrapeDto: CreateScrapeDto,
  // ) {
  //   return await this.ScraperService.updateScrape(id, CreateScrapeDto);
  // }

  @Get(':id')
  @Public()
  async findOne(@Param('id') id: string) {
    return await this.ScraperService.findOne(id);
  }

  // Push a scraped record's content into the AI knowledge base.
  @Post(":id/ingest")
  @Public()
  async ingest(
    @Param("id") id: string,
    @Body()
    body: { clientId?: string; botId?: string; companyName?: string }
  ) {
    return await this.ScraperService.ingestToKnowledgeBase(id, body || {});
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.ScraperService.remove(id);
  }
}
