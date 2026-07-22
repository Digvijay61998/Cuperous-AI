import { HttpException, Inject, Injectable, Logger } from "@nestjs/common";
import axios from "axios";
import { Model } from "mongoose";
import { SCRAPER_PROVIDER } from "./constant";
import { CreateScrapeDto } from "./dto/create-scraper.dto";
import { SearchParamDto } from "./dto/search-param.dto";
import { HttpService } from "@nestjs/axios";
import { ScraperDocument } from "./entities/scraper.entity";
import {
  ScrapeStatusAllPagesList,
  ScrapeStatusEnumList,
} from "./enum/scrape-status.enum";
import { firstValueFrom } from "rxjs";
import { response } from "express";
// import { Public } from 'src/auth/Public/public.decorator';
// import scraper from 'src/util/scraper'
import { ConfigService } from "@nestjs/config";
import { EventEmitter2, OnEvent } from "@nestjs/event-emitter";

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);
  constructor(
    @Inject(SCRAPER_PROVIDER)
    private readonly scraperModel: Model<ScraperDocument>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  async create(CreateScrapeDto: CreateScrapeDto) {
    const url = this.configService.get("scraper.url");
    try {
      const res = await firstValueFrom(
        this.httpService.post(`${url}/api/scraper`, CreateScrapeDto)
      );
      return res.data;
    } catch (error) {
      this.logger.error(`Error creating tag: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async findAll(query: SearchParamDto) {
    try {
      const { skip, limit, status, tags } = query;
      const queryObj = {};
      if (status) {
        queryObj["status"] = status;
      }
      if (tags) queryObj["tags"] = { $in: tags };
      const scrape = this.scraperModel
        .find(queryObj)
        .skip(skip)
        .sort({ createdAt: -1 });
      if (limit) scrape.limit(limit);
      const count = await this.scraperModel.countDocuments(queryObj);
      const data = await scrape;
      return { data, count };
    } catch (error) {
      this.logger.error(`Error while getting all webhooks : ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  getParams() {
    return {
      status: ScrapeStatusEnumList,
      sync: ScrapeStatusAllPagesList,
    };
  }

  async findOne(scrapeId: string) {
    try {
      const scrape = await this.scraperModel.findById(scrapeId);
      // console.log('scrape', scrape);

      return scrape;
    } catch (error) {
      this.logger.error(
        `Error while getting scrape with id ${scrapeId} : ${error.message}`
      );
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async remove(id: string) {
    try {
      const data = await this.scraperModel.findByIdAndDelete(id);
      return data;
    } catch (error) {
      this.logger.error(
        `Error while deleting webhook with id ${id} : ${error.message}`
      );
      throw new HttpException(error.message, error.status || 500);
    }
  }

  /**
   * Push a scraped record's content into the AI knowledge base so the
   * AI_RESPONSE workflow node can answer questions grounded in it.
   *
   * The whole page's text (all `data` blocks) is sent as a single page keyed by
   * the record URL. Re-ingesting the same URL replaces its prior chunks on the
   * AI side, so re-scrapes stay fresh with no duplicates.
   */
  async ingestToKnowledgeBase(
    scrapeId: string,
    overrides: {
      clientId?: string;
      botId?: string;
      companyName?: string;
    } = {}
  ) {
    const scrape = await this.scraperModel.findById(scrapeId);
    if (!scrape) {
      throw new HttpException("Scrape not found", 404);
    }

    const clientId = overrides.clientId || scrape.clientId;
    if (!clientId) {
      throw new HttpException(
        "clientId is required to ingest into the knowledge base",
        400
      );
    }

    const content = (scrape.data || []).join("\n\n").trim();
    if (!content) {
      this.logger.warn(`Scrape ${scrapeId} has no content to ingest`);
      return { success: false, chunksIngested: 0, message: "No content" };
    }

    const aiUrl = this.configService.get("ai.url");
    const payload = {
      client_id: clientId,
      bot_id: overrides.botId || scrape.botId || null,
      pages: [
        {
          url: scrape.url,
          title: scrape.title || "",
          content,
        },
      ],
    };

    try {
      const res = await firstValueFrom(
        this.httpService.post(`${aiUrl}/ingest/website`, payload)
      );

      // Persist tenant association + sync status for observability.
      scrape.clientId = clientId;
      if (overrides.botId || scrape.botId) {
        scrape.botId = overrides.botId || scrape.botId;
      }
      if (overrides.companyName || scrape.companyName) {
        scrape.companyName = overrides.companyName || scrape.companyName;
      }
      scrape.aiSynced = true;
      scrape.aiSyncedAt = new Date();
      await scrape.save();

      this.logger.log(
        `Ingested scrape ${scrapeId} (url=${scrape.url}) into KB for client=${clientId}`
      );
      return res.data;
    } catch (error) {
      this.logger.error(
        `Failed to ingest scrape ${scrapeId} into KB: ${error.message}`
      );
      throw new HttpException(
        `Knowledge base ingestion failed: ${error.message}`,
        error.status || 500
      );
    }
  }

  /**
   * Auto-ingest when a scrape completes. The external scraper (or any producer)
   * emits `scraper.completed` with the scrape id and the owning tenant.
   */
  @OnEvent("scraper.completed", { async: true })
  async onScrapeCompleted(payload: {
    scrapeId: string;
    clientId?: string;
    botId?: string;
    companyName?: string;
  }) {
    try {
      await this.ingestToKnowledgeBase(payload.scrapeId, {
        clientId: payload.clientId,
        botId: payload.botId,
        companyName: payload.companyName,
      });
    } catch (error) {
      this.logger.error(
        `Auto-ingest on scraper.completed failed: ${error.message}`
      );
    }
  }
}
