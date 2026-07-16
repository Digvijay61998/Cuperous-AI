import { Injectable, Inject, Logger, HttpException } from "@nestjs/common";
import { CreateWebhookDto } from "./dto/create-webhook.dto";
import { UpdateWebhookDto } from "./dto/update-webhook.dto";
import { WEBHOOK_PROVIDER, WEBHOOK_ACTIVITIES_PROVIDER } from "./constant";
import { WebhookDocument } from "./entities/webhook.entity";
import { WebHookActivitiesDocument } from "./entities/webhook-activities";
import { Model } from "mongoose";

import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { WebhookStatusEnum } from "./enums/webhook-status.enum";
import { getDaySubtitle } from "src/util/get-subtitle";
import { ReportParamsDto } from "src/util/report-params.dto";
import { messageParser } from "src/whatsapp/util/message-parser";

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    @Inject(WEBHOOK_PROVIDER)
    private readonly webhookModel: Model<WebhookDocument>,

    @Inject(WEBHOOK_ACTIVITIES_PROVIDER)
    private readonly webhookActivitiesModel: Model<WebHookActivitiesDocument>,

    private readonly httpService: HttpService
  ) {}

  async create(createWebhookDto: CreateWebhookDto) {
    try {
      const webhook = await this.webhookModel.create({
        ...createWebhookDto,
      });
      return webhook;
    } catch (error) {
      this.logger.error(`Error while creating webhook : ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async webhookList() {
    try {
      return await this.webhookModel.aggregate([
        {
          $project: {
            id: "$_id",
            name: 1,
            _id: 0,
          },
        },
      ]);
    } catch (error) {
      this.logger.error(`Error while getting all webhooks : ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async getAllWebhooks() {
    try {
      const webhooks = await this.webhookModel.find({});

      const count = await this.webhookModel.countDocuments({});

      return { data: webhooks, count };
    } catch (error) {
      this.logger.error(`Error while getting all webhooks : ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async getWebhook(webhookId: string) {
    try {
      const webhook = await this.webhookModel.findById(webhookId);
      return webhook;
    } catch (error) {
      this.logger.error(
        `Error while getting webhook with id ${webhookId} : ${error.message}`
      );
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async update(webhookId: string, updateWebhookDto: UpdateWebhookDto) {
    try {
      const webhook = await this.webhookModel.findByIdAndUpdate(
        webhookId,
        updateWebhookDto,
        { new: true }
      );
      return webhook;
    } catch (error) {
      this.logger.error(
        `Error while updating webhook with id ${webhookId} : ${error.message}`
      );
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async remove(webhookId: string) {
    try {
      const webhook = await this.webhookModel.findByIdAndDelete(webhookId);
      return webhook;
    } catch (error) {
      this.logger.error(
        `Error while deleting webhook with id ${webhookId} : ${error.message}`
      );
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async callWebhook(webhookId: string, data: any, botId?: string) {
    try {
      const webhook = await this.webhookModel.findById(webhookId);
      if (!webhook) {
        throw new HttpException("Webhook not found", 404);
      }
      let response: any;
      let message: any, metadata: any;
      let status: string;
      const headers = {
        "Content-Type": "application/json",
      };

      if (webhook.headersKey && webhook.headersValue) {
        headers[webhook.headersKey] = webhook.headersValue;
      }
      if (webhook.basicAuthUsername && webhook.basicAuthPassword) {
        headers["Authorization"] = `Basic ${Buffer.from(
          `${webhook.basicAuthUsername}:${webhook.basicAuthPassword}`
        ).toString("base64")}`;
      }
      this.logger.log(`Calling webhook ${webhook.url}`);

      try {
        const res = await firstValueFrom(
          this.httpService.get(webhook.url, {
            params: {
              token: webhook.verifyToken,
            },
            headers,
          })
        );

        response = await firstValueFrom(
          this.httpService.post(webhook.url, data, {
            params: {
              token: webhook.verifyToken,
            },
            headers,
          })
        );
        console.log('data', response?.data)
        status = WebhookStatusEnum.SUCCESS;
        metadata = response.data?.metadata || {};
        message = response.data?.response || [];

        webhook.succesRequests += 1;
      } catch (error) {
        status = WebhookStatusEnum.FAILED;
        webhook.failedRequests += 1;
        message = error?.response?.data || [];
        metadata = {};
      }
      const activity = await this.webhookActivitiesModel.create({
        status,
        webhook: webhook._id,
        bot: botId,
      });
      webhook.activities.push(activity._id);
      await webhook.save();
      return {
        status,
        metadata,
        data: message,
      };
    } catch (error) {
      this.logger.error(
        `Error while calling webhook with id ${webhookId} : ${error.message}`
      );
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async getWebhooksListForNode() {
    const webhooks = await this.webhookModel.find();
    return webhooks.map((webhook) => ({
      id: webhook._id,
      name: webhook.name,
    }));
  }

  async testwebhook(webhookId: string) {
    try {
      const webhook = await this.webhookModel.findById(webhookId);
      if (!webhook) {
        throw new HttpException("Webhook not found", 404);
      }

      const headers = {
        "Content-Type": "application/json",
      };
      if (webhook.headersKey && webhook.headersValue) {
        headers[webhook.headersKey] = webhook.headersValue;
      }
      if (webhook.basicAuthUsername && webhook.basicAuthPassword) {
        headers["Authorization"] = `Basic ${Buffer.from(
          `${webhook.basicAuthUsername}:${webhook.basicAuthPassword}`
        ).toString("base64")}`;
      }

      await firstValueFrom(
        this.httpService.get(webhook.url, {
          params: {
            token: webhook.verifyToken,
          },
          headers,
        })
      );
      return {
        status: WebhookStatusEnum.SUCCESS,
        data: "Webhook is working",
      };
    } catch (error) {
      this.logger.error(
        `Error while testing webhook with id ${webhookId} : ${error.message}`
      );
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async getTotalCount(days = 30) {
    const total = await this.webhookModel.countDocuments();
    let percentageChange = 0;
    if (total) {
      const agoCount = await this.webhookModel.countDocuments({
        createdAt: {
          $gte: new Date(new Date().setDate(new Date().getDate() - days)),
        },
      });
      percentageChange = Math.round((agoCount / total) * 100);
    }
    return {
      stats: total,
      trendNumber: percentageChange,
      trend: percentageChange >= 0 ? "positive" : "negative",
      title: "Total Webhooks",
      subtitle: getDaySubtitle(days),
      type: "webhook",
    };
  }

  async getSuccessCount(days = 30) {
    const total = await this.webhookActivitiesModel.countDocuments({
      status: WebhookStatusEnum.SUCCESS,
    });
    let percentageChange = 0;
    if (total) {
      const agoCount = await this.webhookActivitiesModel.countDocuments({
        status: WebhookStatusEnum.SUCCESS,
        createdAt: {
          $gte: new Date(new Date().setDate(new Date().getDate() - days)),
        },
      });

      percentageChange = Math.round((agoCount / total) * 100);
    }

    return {
      stats: total,
      trendNumber: percentageChange,
      trend: percentageChange >= 0 ? "positive" : "negative",
      title: "Success Calls",
      subtitle: getDaySubtitle(days),
      type: "success",
    };
  }

  async getFailedCount(days = 30) {
    const total = await this.webhookActivitiesModel.countDocuments({
      status: WebhookStatusEnum.FAILED,
    });
    let percentageChange = 0;
    if (total) {
      const agoCount = await this.webhookActivitiesModel.countDocuments({
        status: WebhookStatusEnum.FAILED,
        createdAt: {
          $gte: new Date(new Date().setDate(new Date().getDate() - days)),
        },
      });

      percentageChange = Math.round((agoCount / total) * 100);
    }

    return {
      stats: total,
      trendNumber: percentageChange,
      trend: percentageChange >= 0 ? "positive" : "negative",
      title: "Failed Calls",
      subtitle: getDaySubtitle(days),
      type: "failed",
    };
  }

  async totalwebhooksCalls(days = 30) {
    const total = await this.webhookActivitiesModel.countDocuments();
    let percentageChange = 0;
    if (total) {
      const agoCount = await this.webhookActivitiesModel.countDocuments({
        createdAt: {
          $gte: new Date(new Date().setDate(new Date().getDate() - days)),
        },
      });

      percentageChange = Math.round((agoCount / total) * 100);
    }

    return {
      stats: total,
      trendNumber: percentageChange,
      trend: percentageChange >= 0 ? "positive" : "negative",
      title: "Total Calls",
      subtitle: getDaySubtitle(days),
      type: "calls",
    };
  }

  async stats(days = 30) {
    try {
      return Promise.all([
        this.getTotalCount(days),
        this.totalwebhooksCalls(days),
        this.getSuccessCount(days),
        this.getFailedCount(days),
      ]);
    } catch (error) {
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async totalWebhookReport() {
    try {
      const response = await this.webhookModel.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: ["$isActive", 1, 0] } },
            inactive: { $sum: { $cond: ["$isActive", 0, 1] } },
          },
        },
        {
          $project: {
            _id: 0,
          },
        },
      ]);
      return response[0];
    } catch (error) {
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async dayWisePerformance(query: ReportParamsDto) {
    const { startDate, id: webhookId } = query;
    let endDate = query.endDate;
    if (!endDate) {
      endDate = new Date().toISOString();
    }

    const match = {};

    if (startDate) {
      match["createdAt"] = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (webhookId) {
      match["webhookId"] = webhookId;
    }
    try {
      const response = await this.webhookActivitiesModel.aggregate([
        {
          $match: match,
        },
        {
          $group: {
            _id: {
              $isoDayOfWeek: "$createdAt",
            },
            total: { $sum: 1 },
            success: {
              $sum: {
                $cond: [{ $eq: ["$status", WebhookStatusEnum.SUCCESS] }, 1, 0],
              },
            },
            failed: {
              $sum: {
                $cond: [{ $eq: ["$status", WebhookStatusEnum.FAILED] }, 1, 0],
              },
            },
          },
        },
        {
          $sort: {
            _id: 1,
          },
        },
        {
          $project: {
            day: {
              $switch: {
                branches: [
                  { case: { $eq: ["$_id", 1] }, then: "MON" },
                  { case: { $eq: ["$_id", 2] }, then: "TUE" },
                  { case: { $eq: ["$_id", 3] }, then: "WED" },
                  { case: { $eq: ["$_id", 4] }, then: "THU" },
                  { case: { $eq: ["$_id", 5] }, then: "FRI" },
                  { case: { $eq: ["$_id", 6] }, then: "SAT" },
                  { case: { $eq: ["$_id", 7] }, then: "SUN" },
                ],
              },
            },
            total: 1,
            success: 1,
            failed: 1,
            _id: 0,
          },
        },
      ]);

      return response;
    } catch (error) {
      this.logger.error(
        "Error while getting day wise performance : ${error.message}"
      );
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async dateWisePerformance(query: ReportParamsDto) {
    try {
      const { startDate, id: webhookId } = query;
      let endDate = query.endDate;
      if (!endDate) {
        endDate = new Date().toISOString();
      }

      const match = {};

      if (startDate) {
        match["createdAt"] = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }

      if (webhookId) {
        match["webhookId"] = webhookId;
      }

      const response = await this.webhookActivitiesModel.aggregate([
        {
          $match: match,
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
              },
            },
            total: { $sum: 1 },
            success: {
              $sum: {
                $cond: [{ $eq: ["$status", WebhookStatusEnum.SUCCESS] }, 1, 0],
              },
            },
            failed: {
              $sum: {
                $cond: [{ $eq: ["$status", WebhookStatusEnum.FAILED] }, 1, 0],
              },
            },
          },
        },
        {
          $sort: {
            _id: 1,
          },
        },
        {
          $project: {
            date: "$_id",
            total: 1,
            success: 1,
            failed: 1,
            _id: 0,
          },
        },
      ]);

      return response;
    } catch (error) {
      this.logger.error(
        "Error while getting date wise performance : ${error.message}"
      );
      throw new HttpException(error.message, error.status || 500);
    }
  }
}
