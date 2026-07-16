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

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);
  constructor(
    @Inject(SCRAPER_PROVIDER)
    private readonly scraperModel: Model<ScraperDocument>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
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
}
