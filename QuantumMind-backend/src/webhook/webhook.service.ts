import {
  Injectable,
  Inject,
  Logger,
  HttpException,
  NotFoundException,
} from "@nestjs/common";
import { CreateWebhookDto } from "./dto/create-webhook.dto";
import { UpdateWebhookDto } from "./dto/update-webhook.dto";
import { WEBHOOK_PROVIDER, WEBHOOK_ACTIVITIES_PROVIDER } from "./constant";
import { WebhookDocument } from "./entities/webhook.entity";
import { WebHookActivitiesDocument } from "./entities/webhook-activities";
import mongoose, { Model } from "mongoose";

import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { WebhookStatusEnum } from "./enums/webhook-status.enum";
import { getDaySubtitle } from "src/util/get-subtitle";
import { ReportParamsDto } from "src/util/report-params.dto";
import { messageParser } from "src/whatsapp/util/message-parser";
import {
  isCrossOrg,
  scopedFilter,
  TenantContext,
} from "src/common/tenant/tenant-context";
import { TenantScopeService } from "src/common/tenant/tenant-scope.service";

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    @Inject(WEBHOOK_PROVIDER)
    private readonly webhookModel: Model<WebhookDocument>,

    @Inject(WEBHOOK_ACTIVITIES_PROVIDER)
    private readonly webhookActivitiesModel: Model<WebHookActivitiesDocument>,

    private readonly httpService: HttpService,

    private readonly tenantScope: TenantScopeService
  ) {}

  /** find/count filter: org-pinned when a user is given, unscoped otherwise. */
  private scope(
    user: TenantContext | undefined,
    filter: Record<string, any> = {}
  ): Record<string, any> {
    return user ? scopedFilter(user, filter) : filter;
  }

  /**
   * Aggregation `$match` fragment for webhooks (aggregate does not auto-cast).
   * Empty for internal callers / SUPER_ADMIN; fail-closed to
   * `{ organizationId: null }` for an org caller without an organization.
   */
  private orgMatch(user: TenantContext | undefined): Record<string, any> {
    if (!user || isCrossOrg(user)) return {};
    const orgId = user.organizationId;
    return {
      organizationId:
        orgId && mongoose.isValidObjectId(orgId)
          ? new mongoose.Types.ObjectId(String(orgId))
          : null,
    };
  }

  /**
   * Webhook activities carry no organizationId; they reference the `bot` that
   * triggered the call, so they are scoped through the org's bots.
   */
  private async activityScope(
    user: TenantContext | undefined
  ): Promise<Record<string, any>> {
    if (!user) return {};
    return this.tenantScope.orgBotMatch(user, "bot");
  }

  /** Loads a webhook by id within the caller's scope, 404 otherwise. */
  private async findScopedWebhook(webhookId: string, user?: TenantContext) {
    if (!mongoose.isValidObjectId(webhookId)) {
      throw new NotFoundException("Webhook not found");
    }
    const webhook = await this.webhookModel.findOne(
      this.scope(user, { _id: webhookId })
    );
    if (!webhook) {
      throw new NotFoundException("Webhook not found");
    }
    return webhook;
  }

  async create(createWebhookDto: CreateWebhookDto, user?: TenantContext) {
    try {
      const webhook = await this.webhookModel.create({
        ...createWebhookDto,
        // Always stamped from the caller, never from the client payload.
        organizationId: user?.organizationId ?? null,
      });
      return webhook;
    } catch (error) {
      this.logger.error(`Error while creating webhook : ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async webhookList(user?: TenantContext) {
    try {
      return await this.webhookModel.aggregate([
        {
          $match: this.orgMatch(user),
        },
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

  async getAllWebhooks(user?: TenantContext) {
    try {
      const webhooks = await this.webhookModel.find(this.scope(user));

      const count = await this.webhookModel.countDocuments(this.scope(user));

      return { data: webhooks, count };
    } catch (error) {
      this.logger.error(`Error while getting all webhooks : ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async getWebhook(webhookId: string, user?: TenantContext) {
    try {
      if (user) {
        return await this.findScopedWebhook(webhookId, user);
      }
      const webhook = await this.webhookModel.findById(webhookId);
      return webhook;
    } catch (error) {
      this.logger.error(
        `Error while getting webhook with id ${webhookId} : ${error.message}`
      );
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async update(
    webhookId: string,
    updateWebhookDto: UpdateWebhookDto,
    user?: TenantContext
  ) {
    try {
      if (user && !mongoose.isValidObjectId(webhookId)) {
        throw new NotFoundException("Webhook not found");
      }
      // Never let a client move a webhook between organizations.
      const { organizationId: _ignored, ...changes } =
        updateWebhookDto as any;
      const webhook = await this.webhookModel.findOneAndUpdate(
        this.scope(user, { _id: webhookId }),
        changes,
        { new: true }
      );
      if (user && !webhook) {
        throw new NotFoundException("Webhook not found");
      }
      return webhook;
    } catch (error) {
      this.logger.error(
        `Error while updating webhook with id ${webhookId} : ${error.message}`
      );
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async remove(webhookId: string, user?: TenantContext) {
    try {
      if (user && !mongoose.isValidObjectId(webhookId)) {
        throw new NotFoundException("Webhook not found");
      }
      const webhook = await this.webhookModel.findOneAndDelete(
        this.scope(user, { _id: webhookId })
      );
      if (user && !webhook) {
        throw new NotFoundException("Webhook not found");
      }
      return webhook;
    } catch (error) {
      this.logger.error(
        `Error while deleting webhook with id ${webhookId} : ${error.message}`
      );
      throw new HttpException(error.message, error.status || 500);
    }
  }

  /**
   * Executes a webhook from the bot runtime. Unscoped by default (internal
   * caller); when `user` is provided it is org-scoped. When the webhook is
   * org-owned and the triggering bot is known, the bot must belong to the same
   * org so one tenant's flow cannot fire another tenant's webhook. Legacy
   * webhooks without an organizationId keep working.
   */
  async callWebhook(
    webhookId: string,
    data: any,
    botId?: string,
    user?: TenantContext
  ) {
    try {
      if (!mongoose.isValidObjectId(webhookId)) {
        throw new HttpException("Webhook not found", 404);
      }
      const webhook = await this.webhookModel.findOne(
        this.scope(user, { _id: webhookId })
      );
      if (!webhook) {
        throw new HttpException("Webhook not found", 404);
      }
      if (botId && webhook.organizationId) {
        const botOrgId = await this.tenantScope.orgIdForBot(botId);
        if (botOrgId && botOrgId !== String(webhook.organizationId)) {
          throw new HttpException("Webhook not found", 404);
        }
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

  async getWebhooksListForNode(user?: TenantContext) {
    const webhooks = await this.webhookModel.find(this.scope(user));
    return webhooks.map((webhook) => ({
      id: webhook._id,
      name: webhook.name,
    }));
  }

  async testwebhook(webhookId: string, user?: TenantContext) {
    try {
      const webhook = user
        ? await this.findScopedWebhook(webhookId, user)
        : await this.webhookModel.findById(webhookId);
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

  async getTotalCount(days = 30, user?: TenantContext) {
    const total = await this.webhookModel.countDocuments(this.scope(user));
    let percentageChange = 0;
    if (total) {
      const agoCount = await this.webhookModel.countDocuments(
        this.scope(user, {
          createdAt: {
            $gte: new Date(new Date().setDate(new Date().getDate() - days)),
          },
        })
      );
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

  async getSuccessCount(days = 30, user?: TenantContext) {
    const scope = await this.activityScope(user);
    const total = await this.webhookActivitiesModel.countDocuments({
      ...scope,
      status: WebhookStatusEnum.SUCCESS,
    });
    let percentageChange = 0;
    if (total) {
      const agoCount = await this.webhookActivitiesModel.countDocuments({
        ...scope,
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

  async getFailedCount(days = 30, user?: TenantContext) {
    const scope = await this.activityScope(user);
    const total = await this.webhookActivitiesModel.countDocuments({
      ...scope,
      status: WebhookStatusEnum.FAILED,
    });
    let percentageChange = 0;
    if (total) {
      const agoCount = await this.webhookActivitiesModel.countDocuments({
        ...scope,
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

  async totalwebhooksCalls(days = 30, user?: TenantContext) {
    const scope = await this.activityScope(user);
    const total = await this.webhookActivitiesModel.countDocuments(scope);
    let percentageChange = 0;
    if (total) {
      const agoCount = await this.webhookActivitiesModel.countDocuments({
        ...scope,
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

  async stats(days = 30, user?: TenantContext) {
    try {
      return Promise.all([
        this.getTotalCount(days, user),
        this.totalwebhooksCalls(days, user),
        this.getSuccessCount(days, user),
        this.getFailedCount(days, user),
      ]);
    } catch (error) {
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async totalWebhookReport(user?: TenantContext) {
    try {
      const response = await this.webhookModel.aggregate([
        {
          $match: this.orgMatch(user),
        },
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

  /**
   * Builds the activity `$match` for performance reports. Returns `null` when
   * the requested webhook is invalid or outside the caller's org, in which
   * case the report is empty.
   */
  private async buildActivityReportMatch(
    query: ReportParamsDto,
    user?: TenantContext
  ): Promise<Record<string, any> | null> {
    const { startDate, id: webhookId } = query;
    let endDate = query.endDate;
    if (!endDate) {
      endDate = new Date().toISOString();
    }

    const match: Record<string, any> = { ...(await this.activityScope(user)) };

    if (startDate) {
      match["createdAt"] = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (webhookId) {
      if (user) {
        if (!mongoose.isValidObjectId(webhookId)) return null;
        const owned = await this.webhookModel.exists(
          this.scope(user, { _id: webhookId })
        );
        if (!owned) return null;
      }
      match["webhookId"] = webhookId;
    }
    return match;
  }

  async dayWisePerformance(query: ReportParamsDto, user?: TenantContext) {
    try {
      const match = await this.buildActivityReportMatch(query, user);
      if (!match) return [];
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

  async dateWisePerformance(query: ReportParamsDto, user?: TenantContext) {
    try {
      const match = await this.buildActivityReportMatch(query, user);
      if (!match) return [];

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
