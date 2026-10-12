import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
} from "@nestjs/common";
import { ApiSecurity, ApiTags } from "@nestjs/swagger";
import { CreateScrapeDto } from "./dto/create-scraper.dto";
import { SearchParamDto } from "./dto/search-param.dto";
import { ScraperService } from "./scraper.service";
import { CurrentUser } from "src/util/current-user.decorator";
import { TenantContext } from "src/common/tenant/tenant-context";
import { TenantScopeService } from "src/common/tenant/tenant-scope.service";
import { Roles } from "src/common/decorators/roles.decorator";
import { ORG_STAFF } from "src/common/enums/role.enum";

/**
 * Website scraping into a bot's knowledge base. Previously public (anyone could
 * scrape into, or read, any tenant's knowledge base). Now ORG_ADMIN /
 * ORG_MANAGER only; `botId`/`clientId` must be a bot of the caller's org and
 * reads are limited to scrapes of the org's bots.
 */
@Controller("scraper")
@ApiTags("Scraper")
@ApiSecurity("bearer")
@Roles(...ORG_STAFF)
export class ScraperController {
  constructor(
    private readonly ScraperService: ScraperService,
    private readonly tenantScope: TenantScopeService
  ) {}

  /** Forces clientId/botId to a bot the caller owns (canonical _id). */
  private async ownedBot(user: TenantContext, body: any) {
    const ref = body?.botId || body?.clientId;
    const bot = await this.tenantScope.assertBotInOrg(user, ref);
    const id = String(bot._id);
    return { botId: id, clientId: id };
  }

  private async assertScrapeOwned(id: string, user: TenantContext) {
    const scrape: any = await this.ScraperService.findOne(id);
    const ref = scrape?.botId || scrape?.clientId;
    if (!scrape || !ref || !(await this.tenantScope.isBotInOrg(user, ref))) {
      throw new NotFoundException("Scrape not found");
    }
    return scrape;
  }

  @Post()
  async create(
    @Body() dto: CreateScrapeDto,
    @CurrentUser() user: TenantContext
  ) {
    return await this.ScraperService.create({
      ...dto,
      ...(await this.ownedBot(user, dto)),
    } as any);
  }

  @Get()
  async findAll(
    @Query() query: SearchParamDto,
    @CurrentUser() user: TenantContext
  ) {
    const ids = await this.tenantScope.orgBotIdStrings(user);
    return await this.ScraperService.findAll(query, ids);
  }

  @Get("params")
  getParams() {
    return this.ScraperService.getParams();
  }

  @Get(":id")
  async findOne(@Param("id") id: string, @CurrentUser() user: TenantContext) {
    return await this.assertScrapeOwned(id, user);
  }

  /** Push a scraped record's content into the AI knowledge base. */
  @Post(":id/ingest")
  async ingest(
    @Param("id") id: string,
    @Body() body: { clientId?: string; botId?: string; companyName?: string },
    @CurrentUser() user: TenantContext
  ) {
    const scrape = await this.assertScrapeOwned(id, user);
    const target =
      body?.botId || body?.clientId
        ? await this.ownedBot(user, body)
        : { botId: scrape.botId, clientId: scrape.clientId };
    return await this.ScraperService.ingestToKnowledgeBase(id, {
      companyName: body?.companyName,
      ...target,
    });
  }

  @Delete(":id")
  async remove(@Param("id") id: string, @CurrentUser() user: TenantContext) {
    await this.assertScrapeOwned(id, user);
    return this.ScraperService.remove(id);
  }
}
