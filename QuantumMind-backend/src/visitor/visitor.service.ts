import { HttpService } from "@nestjs/axios";
import { HttpException, Inject, Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { isIP } from "class-validator";
import { Request } from "express";
import mongoose, { Model } from "mongoose";
import { firstValueFrom } from "rxjs";
import { ConversationStatusEnum } from "src/conversation/enums/conversation-status.enum";

import { generateId, parseUserAgent } from "src/util";
import { getDaySubtitle } from "src/util/get-subtitle";
import { VISITOR_DETAILS_PROVIDER, VISITOR_PROVIDER } from "./constant";
import { CreateVisitorDto } from "./dto/create-visitor.dto";
import { VisitorQueryParams } from "./dto/visitor-query.params.dto";
import { VisitorDetailsDocument } from "./entities/visitor-details.entity";
import { VisitorDocument } from "./entities/visitor.entity";
import {
  VisitorStatusEnum,
  VisitorStatusEnumList,
} from "./enums/visitor-status.enum";
import { ConversationService } from "src/conversation/conversation.service";
import { ReportParamsDto } from "src/util/report-params.dto";
import { pipeline } from "stream";
import moment from "moment";

@Injectable()
export class VisitorService {
  private readonly logger = new Logger(VisitorService.name);
  private userData = new Map<string, any>();
  constructor(
    @Inject(VISITOR_PROVIDER) private visitorModel: Model<VisitorDocument>,
    @Inject(VISITOR_DETAILS_PROVIDER)
    private visitorDetailsModel: Model<VisitorDetailsDocument>,

    private httpService: HttpService,

    private conversationService: ConversationService
  ) {}

  async createVisitor(createVisitorDto: CreateVisitorDto, req: any) {
    if (req) {
    }

    const visitorId = generateId("visitor", 10);
    const email = createVisitorDto.email || `${visitorId}@nomemail.com`;
    const phone = createVisitorDto.phone || "0000000000";
    const name = createVisitorDto.name || "Anonymous";

    let visitor = await this.visitorModel.findOne({
      email,
      bot: createVisitorDto.bot,
    });
    if (!visitor) {
      visitor = await this.visitorModel.create({
        email,
        name,
        phone,

        bot: createVisitorDto.bot,
        visitorId,
      });
    }
    if (req) {
      const ua = req.headers["user-agent"];
      const demographics = await this.getDemographics(req);
      this.logger.debug(`Demographics : ${JSON.stringify(demographics)}`);
      const visitorDetails = await this.visitorDetailsModel.create({
        ua,
        ...demographics,
        visitorId: visitor._id,
      });
      visitor.visitorDetails.push(visitorDetails._id);
    }

    await visitor.save();
    return visitor;
  }

  async getVisitor(visitorId: string) {
    try {
      const visitor = await this.visitorModel
        .findById(visitorId)
        .populate(
          "serviceRequests",
          "subject status priority conversationId description tags"
        )
        .populate("bot", "name")
        .populate("agents", "name email status rating ")
        .populate("feedbacks", "rating comment")
        .populate({
          path: "conversations",
          populate: {
            path: "bot",
            select: "name",
          },
          select: "-chats -activities",
        })
        .populate("visitorDetails");

      return visitor;
    } catch (error) {
      this.logger.error(
        `Error while getting visitor with id ${visitorId} : ${error.message}`
      );

      throw new HttpException(error.message, error.status || 500);
    }
  }

  async getAllVisitors(query: VisitorQueryParams) {
    try {
      const {
        skip: documentsToSkip,
        limit: limitOfDocuments,
        bot,
        status,
        startDate,
        endDate,
        text,
      } = query;

      const queryObject = {};
      if (status) queryObject["status"] = status;
      if (bot) queryObject["bot"] = bot;
      if (startDate) queryObject["createdAt"] = { $gte: startDate };
      if (endDate) queryObject["createdAt"] = { $lte: endDate };
      if (startDate && endDate)
        queryObject["createdAt"] = { $gte: startDate, $lte: endDate };

      //if (text) queryObject["$text"] = { $search: text };

      if (text) {
        const regex = new RegExp(text, "i");
        queryObject["$or"] = [
          { name: { $regex: regex } },
          { email: { $regex: regex } },
          { phone: { $regex: regex } },
        ];
      }

      const visitors = this.visitorModel
        .find(queryObject)
        .populate("bot", "name")
        .populate("visitorDetails")
        .sort({ createdAt: -1 })
        .skip(documentsToSkip);
      if (limitOfDocuments) {
        visitors.limit(limitOfDocuments);
      }

      const data = await visitors;

      const queryObject2 = {};

      if (status) queryObject2["status"] = status;
      if (bot) queryObject2["bot"] = new mongoose.Types.ObjectId(bot);
      if (startDate) queryObject2["createdAt"] = { $gte: startDate };
      if (endDate) queryObject2["createdAt"] = { $lte: endDate };
      if (startDate && endDate)
        queryObject2["createdAt"] = { $gte: startDate, $lte: endDate };

      if (text) {
        const regex = new RegExp(text, "i");
        queryObject2["$or"] = [
          { name: { $regex: regex } },
          { email: { $regex: regex } },
          { phone: { $regex: regex } },
        ];
      }

      const bots = await this.visitorModel.aggregate([
        {
          $match: queryObject2,
        },
        {
          $lookup: {
            from: "bots",
            localField: "bot",
            foreignField: "_id",
            as: "bot",
          },
        },
        {
          $unwind: {
            path: "$bot",
          },
        },
        {
          $group: {
            _id: "$bot._id",
            name: { $first: "$bot.name" },
          },
        },
      ]);

      const count = await this.visitorModel.countDocuments(queryObject);
      return {
        count,
        data,
        search: {
          bots,
          status: VisitorStatusEnumList,
        },
      };
    } catch (error) {
      this.logger.error(`Error while getting all visitors : ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async addServiceRequests(visitorId: string, serviceRequestId: string) {
    try {
      const visitor = await this.visitorModel.findById(visitorId);
      if (visitor && visitor.serviceRequests.indexOf(serviceRequestId) === -1) {
        visitor.serviceRequests.push(serviceRequestId);
        visitor.save();
        return visitor;
      }
    } catch (error) {
      this.logger.error(
        `Error while adding service request to visitor with id ${visitorId} : ${error.message}`
      );

      throw new HttpException(error.message, error.status || 500);
    }
  }

  @OnEvent("conversation.created.visitor", { async: true })
  async addConversations({
    visitorId,
    conversationId,
  }: {
    visitorId: string;
    conversationId: string;
  }) {
    try {
      const visitor = await this.visitorModel.findById(visitorId);
      if (!visitor) return;
      visitor.conversations.push(conversationId);
      visitor.save();
      return visitor;
    } catch (error) {
      this.logger.error(
        `Error while adding conversation to visitor with id ${visitorId} : ${error.message}`
      );

      throw new HttpException(error.message, error.status || 500);
    }
  }

  async getDemographics(req: Request) {
    const ua = req.headers["user-agent"];
    const { browser, os, device } = parseUserAgent(ua);
    let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";

    ip = ip.toString().split(",")[0];

    this.logger.debug(`Visitor IP : ${ip}`);

    let data = this.userData.get(ip) || {};

    if (isIP(ip)) {
      if (!data.country) {
        try {
          const response = await firstValueFrom(
            this.httpService.get(`http://ip-api.com/json/${ip}`)
          );
          this.logger.debug(
            `Visitor IP API Response : ${JSON.stringify(response.data)}`
          );
          data = {
            country: response.data?.country || "Unknown",
            city: response.data?.city || response.data?.regionName || "Unknown",
            lat: response.data?.lat || 0,
            lon: response.data?.lon || 0,
          };
          this.userData.set(ip, data);
        } catch (e) {
          data = {
            country: "Unknown",
            city: "Unknown",
            lat: 0,
            lon: 0,
          };
        }
      }
    }
    return {
      ...data,
      device,
      os,
      browser,
      ip,
    };
  }

  @OnEvent("agent.added.visitor", { async: true })
  async addAgents({
    visitorId,
    agentId,
  }: {
    visitorId: string;
    agentId: string;
  }) {
    const visitor = await this.visitorModel.findById(visitorId);
    if (!visitor) return;
    if (!visitor.agents || !visitor.agents.length) {
      visitor.agents = [agentId];
    } else if (
      visitor.agents &&
      visitor.agents.length > 0 &&
      visitor.agents.indexOf(agentId) === -1
    ) {
      visitor.agents.push(agentId);
    }
    visitor.save();
    return visitor;
  }

  async updateStatus(visitorId: string, status: VisitorStatusEnum) {
    const visitor = await this.visitorModel.findById(visitorId);
    if (visitor) {
      visitor.status = status;
      visitor.save();
      return visitor;
    }
  }

  async updateFeedback(visitorId: string, feedbackId: string) {
    try {
      const visitor = await this.visitorModel.findById(visitorId);
      if (visitor) {
        visitor.feedbacks.push(feedbackId);
        await visitor.save();
      }
    } catch (error) {
      this.logger.error(
        `Error while adding rating and feedback to visitor with id ${visitorId} : ${error.message}`
      );
    }
  }

  async getTotalCount(days = 30) {
    const total = await this.visitorModel.countDocuments();
    let percentageChange = 0;
    if (total) {
      const agoCount = await this.visitorModel.countDocuments({
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
      title: "Total Visitors",
      subtitle: getDaySubtitle(days),
      type: "total",
    };
  }

  async getActiveCount(days = 30) {
    const total = await this.visitorModel.countDocuments({
      status: VisitorStatusEnum.ONLINE,
    });
    let percentageChange = 0;
    if (total) {
      const agoCount = await this.visitorModel.countDocuments({
        status: VisitorStatusEnum.ONLINE,
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
      title: "Active visitors",
      subtitle: getDaySubtitle(days),
      type: "active",
    };
  }

  async getStats(days = 30) {
    try {
      const result = await Promise.all([
        this.getTotalCount(days),
        this.getActiveCount(days),
        this.handledByAgentCount(days),
        this.handledByBotCount(days),
      ]);
      return result;
    } catch (error) {
      this.logger.error(`Error while getting visitor stats : ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async handledByAgentCount(days = 30) {
    const total = await this.visitorModel.countDocuments({
      agents: { $exists: true, $not: { $size: 0 } },
    });
    let percentageChange = 0;
    if (total) {
      const agoCount = await this.visitorModel.countDocuments({
        agents: { $exists: true, $not: { $size: 0 } },
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
      title: "Handled by agent",
      subtitle: getDaySubtitle(days),
      type: "agent",
    };
  }

  async handledByBotCount(days = 30) {
    const total = await this.visitorModel.countDocuments({
      agents: { $size: 0 },
    });

    let percentageChange = 0;
    if (total) {
      const agoCount = await this.visitorModel.countDocuments({
        agents: { $size: 0 },
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
      title: "Handled by bot",
      subtitle: getDaySubtitle(days),
      type: "bot",
    };
  }

  async getVisiorPattern() {
    try {
      const response = await this.visitorDetailsModel.aggregate([
        {
          $facet: {
            countries: [
              {
                $group: {
                  _id: "$country",
                  count: { $sum: 1 },
                },
              },
              {
                $project: {
                  _id: 0,
                  name: "$_id",
                  count: 1,
                },
              },
            ],
            browsers: [
              {
                $group: {
                  _id: "$browser",
                  count: { $sum: 1 },
                },
              },
              {
                $project: {
                  _id: 0,
                  name: "$_id",
                  count: 1,
                },
              },
            ],

            os: [
              {
                $group: {
                  _id: "$os",
                  count: { $sum: 1 },
                },
              },
              {
                $project: {
                  _id: 0,
                  name: "$_id",
                  count: 1,
                },
              },
            ],
          },
        },
      ]);
      return response[0];
    } catch (error) {
      this.logger.error(`Error while getting total visitor : ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async getVisitorReport() {
    try {
      const response = await this.visitorModel.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: {
              $sum: {
                $cond: [{ $eq: ["$status", VisitorStatusEnum.ONLINE] }, 1, 0],
              },
            },
            inactive: {
              $sum: {
                $cond: [{ $eq: ["$status", VisitorStatusEnum.OFFLINE] }, 1, 0],
              },
            },
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
      this.logger.error(`Error while getting total visitor : ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async CreateVisitorfromSocialMedia(
    visitor: CreateVisitorDto
  ): Promise<string> {
    const username = visitor.username;
    const visitorData = await this.visitorModel.findOne({ username, bot: visitor.bot });
    if (visitorData) {
      return visitorData.id;
    }

    try {
      const result = await this.visitorModel.create(visitor);
      return result.id;
    } catch (error) {
      // E11000 = duplicate key from the unique (username, bot) index.
      // Another concurrent request won the race — fetch their result.
      if (error.code === 11000) {
        const existing = await this.visitorModel.findOne({
          username,
          bot: visitor.bot,
        });
        if (existing) return existing.id;
      }
      throw error;
    }
  }
  async getHandledByAgentReport(query: ReportParamsDto) {
    return await this.conversationService.getDateWiseConversations(query, true);
  }
  async getHandledByBotReport(query: ReportParamsDto) {
    return await this.conversationService.getDateWiseConversations(
      query,
      false
    );
  }

  async homeVisitorCount(filter: any) {
    if (!filter) filter = "day";
    try {
      const total = await this.visitorModel.countDocuments({
        createdAt: {
          $gte: new Date(moment().startOf(filter).toISOString()),
        },
      });

      let percentageChange = 0;
      const previousTotal = await this.visitorModel.countDocuments({
        createdAt: {
          $gte: new Date(
            moment().subtract(1, filter).startOf(filter).toISOString()
          ),
        },
      });

      if (previousTotal) {
        percentageChange = Math.round(
          ((total - previousTotal) / previousTotal) * 100
        );
      }

      return {
        stats: total,
        trendNumber: Math.abs(percentageChange),
        trend: percentageChange > 0 ? "positive" : "negative",
        title: "Total Visitors",
        type: "visitor",
      };
    } catch (error) {
      this.logger.error(`Error while getting home conversation count ${error}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async monthWiseVisitor() {
    try {
      const totalVisitor = await this.visitorModel.countDocuments({});
      const chart = await this.visitorModel.aggregate([
        // current year
        {
          $match: {
            createdAt: {
              $gte: new Date(new Date().getFullYear(), 0, 1),
            },
          },
        },
        {
          $group: {
            _id: {
              $month: "$createdAt",
            },
            count: { $sum: 1 },
          },
        },
        {
          $sort: {
            _id: 1,
          },
        },
        {
          $project: {
            _id: 0,
            month: "$_id",
            count: 1,
            years: 1,
          },
        },
      ]);

      const yearWise = await this.visitorModel.aggregate([
        {
          $group: {
            _id: {
              $year: "$createdAt",
            },
            handledByAgent: {
              $sum: {
                $cond: [{ $eq: ["$agents", []] }, 0, 1],
              },
            },
            handledByBot: {
              $sum: {
                $cond: [{ $eq: ["$agents", []] }, 1, 0],
              },
            },
            total: { $sum: 1 },
          },
        },

        {
          $project: {
            year: "$_id",
            handledByAgent: 1,
            handledByBot: 1,
            total: 1,
            _id: 0,
          },
        },
      ]);

      const yearWiseData = yearWise.map((year) => {
        const growth = year.total / totalVisitor;
        return {
          ...year,
          growth: growth > 1 ? 100 : Math.round(growth * 100),
        };
      });

      return { chart, yearWise: yearWiseData };
    } catch (error) {
      this.logger.error(
        `Error while getting total month wise visitor : ${error.message}`
      );
      throw new HttpException(error.message, error.status || 500);
    }
  }
}
