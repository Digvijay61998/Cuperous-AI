import {
  HttpException,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from "@nestjs/common";
import { ObjectId } from "bson";
import { Model } from "mongoose";
import {
  CHAT_PROVIDER,
  CONVERSATION_ACTIVITIES_PROVIDER,
  CONVERSATION_PROVIDER,
} from "./constant";
import { CreateChatDto } from "./dto/create-chat.dto";
import { CreateConversationDto } from "./dto/create-conversation.dto";
import { ChatDocument } from "./entities/chat.entity";
import { ConversationDocument } from "./entities/conversation.entity";
import { ConversationTypeEnum } from "./enums/conversation-type.enum";

import { EventEmitter2, OnEvent } from "@nestjs/event-emitter";
import { Cron, CronExpression } from "@nestjs/schedule";
import { isCreditCard, isEmail } from "class-validator";
import moment from "moment";
import { JwtPayload } from "src/auth/strategy/jwt.strategy";
import { getDaySubtitle } from "src/util/get-subtitle";
import { ReportParamsDto } from "src/util/report-params.dto";
import { ConversationActivitiesDocument } from "./entities/conversation-activities.entity";
import { ConversationStatusEnum } from "./enums/conversation-status.enum";
import { PlatformEnum } from "./enums/platform.enum";

@Injectable()
export class ConversationService {
  private logger = new Logger("ConversationService");
  constructor(
    @Inject(CONVERSATION_PROVIDER)
    private readonly conversationModel: Model<ConversationDocument>,

    @Inject(CHAT_PROVIDER)
    private readonly chatModel: Model<ChatDocument>,

    @Inject(CONVERSATION_ACTIVITIES_PROVIDER)
    private readonly conversationActivitiesModel: Model<ConversationActivitiesDocument>,

    private readonly eventEmitter: EventEmitter2
  ) {}

  // onModuleInit() {
  //   console.log('ConversationService initialized');
  //   console.log(this.maskMessage('1234567890'));
  //   console.log(this.maskMessage('nitesh'));
  //   console.log(this.maskMessage('4315813084463007'));
  //   console.log(this.maskMessage('4315 8130 8446 3007'));
  //   console.log(this.maskMessage('4315-8130-8446-3007'));
  //   console.log(this.maskMessage('10/12/2020'));
  //   console.log(this.maskMessage('2022/12/20'));

  //   console.log(this.maskMessage(''));
  //   console.log(this.maskMessage('123'));
  //   console.log(this.maskMessage('12345678901234567890'));
  //   console.log(this.maskMessage('123456789012345678901234567890'));
  //   console.log(this.maskMessage('1234567890123456789012345678901234567890'));
  //   console.log(
  //     this.maskMessage('12345678901234567890123456789012345678901234567890'),
  //   );
  //   console.log(
  //     this.maskMessage(
  //       '123456789012345678901234567890123456789012345678901234567890',
  //     ),
  //   );
  //   console.log(
  //     this.maskMessage(
  //       '1234567890123456789012345678901234567890123456789012345678901234567890',
  //     ),
  //   );
  //   console.log(
  //     this.maskMessage(
  //       '12345678901234567890123456789012345678901234567890123456789012345678901234567890',
  //     ),
  //   );
  //   console.log(this.maskMessage('nitesh@mollatech.com'));
  // }

  @OnEvent("create.new.chat", { async: true })
  async createChat(createChatDto: CreateChatDto) {
    try {
      if (!createChatDto.conversationId) return;
      const chat = await this.chatModel.create({
        ...createChatDto,
        time: new Date(),
      });
      await this.pushChatToConversation(createChatDto.conversationId, chat._id);
      return chat;
    } catch (error) {
      this.logger.error(`Error in creating chat ${error.message}`);
      throw error;
    }
  }

  maskMessage(message: string) {
    if (!message || message.length < 1) return message;
    const length = message.length;
    if (isEmail(message)) {
      const [email, domain] = message.split("@");
      return `${email.slice(0, 2)}*****@${domain}`;
    }
    if (isCreditCard(message)) {
      return `****${message.slice(-4)}`;
    }

    if (length < 4) return `${message.slice(0, 1)}${"*".repeat(length - 1)}`;
    if (length < 10)
      return `${message.slice(0, 2)}${"*".repeat(length - 4)}${message.slice(
        -2
      )}`;
    if (length < 16)
      return `${message.slice(0, 4)}${"*".repeat(length - 8)}${message.slice(
        -4
      )}`;
    else
      return `${message.slice(0, 6)}${"*".repeat(length - 12)}${message.slice(
        -6
      )}`;
  }

  @OnEvent("mask.chat", { async: true })
  async maskChat(chatId: string) {
    try {
      const chat = await this.chatModel.findOne({ chatId });
      if (!chat) return;
      chat.message = this.maskMessage(chat.message);
      chat.secured = true;
      await chat.save();
      return chat;
    } catch (error) {
      this.logger.error(`Error in masking chat ${error.message}`);
      throw error;
    }
  }

  async createConversation(createConversationDto: CreateConversationDto) {
    try {
      const query = {
        visitor: createConversationDto.visitor,
        type: createConversationDto.type,
      };

      if (createConversationDto.type === ConversationTypeEnum.REALTIME) {
        query["agent"] = createConversationDto.agent;
      }
      let conversation = await this.conversationModel.findOne(query);

      if (
        !conversation ||
        conversation.status !== ConversationStatusEnum.IN_PROGRESS
      ) {
        conversation = await this.conversationModel.create(
          createConversationDto
        );
      }

      this.eventEmitter.emit("conversation.created.visitor", {
        visitorId: query.visitor,
        conversationId: conversation._id,
      });

      if (createConversationDto.type === ConversationTypeEnum.REALTIME) {
        this.eventEmitter.emit("conversation.created.agent", {
          agentId: conversation.agent,
          conversationId: conversation._id,
        });
      }
      const activity = await this.conversationActivitiesModel.create({
        conversation: conversation._id,
        startedAt: new Date(),
        timeSpent: 0,
      });
      conversation.activities.push(activity._id);
      await conversation.save();
      return conversation;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  @OnEvent("end.conversation", { async: true })
  async closeConversation({ conversationId }: { conversationId: string }) {
    await this.endConversation(conversationId);
  }

  async endConversation(id: string, status?: ConversationStatusEnum) {
    try {
      const conversation = await this.conversationModel.findById(id);
      if (!conversation) {
        throw new Error("Conversation not found");
      }
      const activity = await this.conversationActivitiesModel.findOne({
        _id: conversation.activities[conversation.activities.length - 1],
      });
      activity.endedAt = new Date();
      activity.timeSpent =
        new Date(activity.endedAt).getTime() -
        new Date(activity.startedAt).getTime();
      await activity.save();
      conversation.status = status || ConversationStatusEnum.COMPLETED;
      await conversation.save();
    } catch (error) {
      this.logger.error(error);
    }
  }

  async pushChatToConversation(id: string, chatId: string) {
    try {
      const conversation = await this.conversationModel.findByIdAndUpdate(
        id,
        { $push: { chats: chatId } },
        { new: true }
      );
      return conversation;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async getConversationByAgentId(id: string) {
    try {
      const conversations = await this.conversationModel
        .find({ agent: id })
        .populate("visitor", "name")
        .populate("bot", "name")
        .populate("agent", "name")
        .sort({ updatedAt: -1 });

      return conversations;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async getConversationByVisitorId(id: string) {
    try {
      const conversations = await this.conversationModel
        .find({ visitor: id })
        .populate("visitor", "name")
        .populate("bot", "name")
        .populate("agent", "name")
        .sort({ updatedAt: -1 });
      return conversations;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async getConversationById(id: string) {
    try {
      const conversation = await this.conversationModel
        .findOne({ _id: id })
        .populate("chats", {
          message: 1,
          time: 1,
          sender: 1,
          type: 1,
        })
        .populate("visitor")
        .populate("bot", "name")
        .populate("feedbacks", "rating comment")
        .populate("activities", "attributes", null, {
          sort: { startedAt: -1 },
          $limit: 1,
          $project: { activity: 1 },
        })
        .select("-__v  -updatedAt -createdAt -conversationId")
        .sort({ updatedAt: -1 });

      return conversation;
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async getConversationByBotId(id: string) {
    try {
      const conversations = await this.conversationModel
        .find({
          bot: id,
        })
        .populate("visitor", "name")
        .populate("bot", "name")
        .populate("agent", "name")
        .sort({ updatedAt: -1 });
      return conversations;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async getAllConversations(query?: {
    status?: ConversationStatusEnum;
    type?: ConversationTypeEnum;
  }) {
    try {
      const queryObj = {
        $match: { _id: { $ne: null } },
      };

      if (query.status === ConversationStatusEnum.BLOCKED) {
        queryObj.$match["status"] = query.status;
      } else {
        queryObj.$match["status"] = { $ne: ConversationStatusEnum.IN_PROGRESS };
      }

      if (query.type) {
        queryObj.$match["type"] = query.type;
      }

      const conversations = await this.conversationModel.aggregate([
        queryObj,
        {
          $lookup: {
            from: "visitors",
            localField: "visitor",
            foreignField: "_id",
            as: "visitor",
          },
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
          $lookup: {
            from: "conversationactivities",
            localField: "activities",
            foreignField: "_id",
            as: "activities",
          },
        },
        {
          $lookup: {
            from: "chats",
            localField: "chats",
            foreignField: "_id",
            as: "lastMessage",
            let: { chats: "$chats" },
            pipeline: [
              {
                $match: {
                  _id: { $ne: null },
                },
              },

              {
                $sort: { time: -1 },
              },
              {
                $limit: 1,
              },
              {
                $project: {
                  _id: 1,
                  message: 1,
                  time: 1,
                  type: 1,
                  sender: 1,
                },
              },
            ],
          },
        },
        {
          $unwind: "$visitor",
        },
        {
          $unwind: "$bot",
        },
        {
          $unwind: {
            path: "$lastMessage",
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $sort: { updatedAt: -1 },
        },
        {
          $project: {
            _id: 1,
            type: 1,
            status: 1,
            "visitor._id": 1,
            "visitor.name": 1,
            "bot.name": 1,
            "bot.id": "$bot._id",
            lastMessage: 1,
            activity: { $arrayElemAt: ["$activities", -1] },
          },
        },
      ]);

      return conversations;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async addattributes(id: string, attributes: any) {
    const conversation = await this.conversationActivitiesModel.findOne({
      conversationId: id,
    });
    if (conversation) {
      conversation.attributes = { ...conversation.attributes, ...attributes };
      await conversation.save();
    }
  }

  async getActiveConversations(user: JwtPayload) {
    try {
      const conversations = await this.conversationModel.aggregate([
        {
          $match: {
            status: ConversationStatusEnum.IN_PROGRESS,
            type: ConversationTypeEnum.REALTIME,
            agent: new ObjectId(user._id),
          },
        },
        {
          $lookup: {
            from: "visitors",
            localField: "visitor",
            foreignField: "_id",
            as: "visitor",
          },
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
          $lookup: {
            from: "conversationactivities",
            localField: "activities",
            foreignField: "_id",
            as: "activities",
          },
        },
        {
          $lookup: {
            from: "chats",
            localField: "chats",
            foreignField: "_id",
            as: "chats",
            let: { chats: "$chats" },
            pipeline: [
              {
                $match: {
                  _id: { $ne: null },
                },
              },

              {
                $sort: { time: -1 },
              },
              {
                $limit: 40,
              },
              {
                $sort: { time: 1 },
              },
            ],
          },
        },

        {
          $addFields: {
            lastMessage: {
              $arrayElemAt: ["$chats", -1],
            },
          },
        },

        {
          $unwind: "$visitor",
        },
        {
          $unwind: "$bot",
        },
        {
          $unwind: {
            path: "$lastMessage",
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $sort: { updatedAt: -1 },
        },
        {
          $project: {
            chats: 1,
            _id: 1,
            type: 1,
            status: 1,
            "visitor._id": 1,
            "visitor.name": 1,
            "bot.name": 1,
            "bot.id": "$bot._id",
            lastMessage: 1,
            activity: { $arrayElemAt: ["$activities", -1] },
          },
        },
      ]);
      return conversations;
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async updateConversationFeedback(id: string, feedback: any) {
    try {
      const conversation = await this.conversationModel.findById(id);
      if (conversation) {
        conversation.feedbacks.push(feedback);
        await conversation.save();
      }
    } catch (error) {
      this.logger.error(`Error while updating conversation feedback ${error}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async transferConversationToAgent(conversationId: string, agentId: string) {
    try {
      const conversation = await this.conversationModel.findById(
        conversationId
      );
      if (conversation) {
        conversation.agent = agentId;
        conversation.type = ConversationTypeEnum.REALTIME;
        conversation.transferredToAgent = true;
        conversation.transferredAt = new Date();
        await conversation.save();
      }
    } catch (error) {
      this.logger.error(`Error while updating conversation feedback ${error}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  @Cron(CronExpression.EVERY_2_HOURS)
  async markConversationExpiredAfter2Hours() {
    await this.conversationModel.updateMany(
      {
        status: ConversationStatusEnum.IN_PROGRESS,
        createdAt: {
          $lte: new Date(new Date().setHours(new Date().getHours() - 2)),
        },
      },
      {
        status: ConversationStatusEnum.EXPIRED,
      }
    );
  }

  async getTotalCount(
    days = 30,
    handledByAgent?: boolean,
    title?: string,
    status?: ConversationStatusEnum,
    all?: boolean,
    isHistorical?: boolean
  ) {
    const query = {};

    if (!handledByAgent) {
      query["transferredToAgent"] = { $ne: true };
    } else query["transferredToAgent"] = { $eq: true };

    if (status) {
      query["status"] = status;
    }
    if (all) {
      delete query["transferredToAgent"];
    }
    if (isHistorical) {
      query["status"] = { $ne: ConversationStatusEnum.IN_PROGRESS };
    }

    const total = await this.conversationModel.countDocuments(query);
    let percentageChange = 0;
    if (total) {
      const agoCount = await this.conversationModel.countDocuments({
        ...query,
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
      title: title || "Total Conversations",
      subtitle: getDaySubtitle(days),
      type: "conversation",
    };
  }

  async getDayWisePerformance(params: ReportParamsDto, agent = false) {
    const { id: botId, startDate, agentId } = params;
    let endDate = params.endDate;
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

    if (botId) {
      match["bot"] = new ObjectId(botId);
    }

    if (agentId) {
      match["agent"] = new ObjectId(agentId);
    }

    if (agent) {
      match["transferredToAgent"] = true;
    }

    try {
      const data = await this.conversationModel.aggregate([
        {
          $match: match,
        },
        {
          $group: {
            _id: {
              $isoDayOfWeek: "$createdAt",
            },
            total: { $sum: 1 },
            completed: {
              $sum: {
                $cond: {
                  if: { $eq: ["$status", ConversationStatusEnum.COMPLETED] },
                  then: 1,
                  else: 0,
                },
              },
            },
            expired: {
              $sum: {
                $cond: {
                  if: { $eq: ["$status", ConversationStatusEnum.EXPIRED] },
                  then: 1,
                  else: 0,
                },
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
            completed: 1,
            expired: 1,
            _id: 0,
          },
        },
      ]);
      return data;
    } catch (error) {
      this.logger.error(
        `Error while getting bot conversation performance ${error}`
      );
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async getDateWiseConversations(params: ReportParamsDto, agent = false) {
    const { id: botId, startDate, agentId } = params;
    let endDate = params.endDate;
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

    if (botId) {
      match["bot"] = new ObjectId(botId);
    }

    if (agentId) {
      match["agent"] = new ObjectId(agentId);
    }

    if (agent) {
      match["transferredToAgent"] = true;
    }

    try {
      const data = await this.conversationModel.aggregate([
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
            completed: {
              $sum: {
                $cond: {
                  if: { $eq: ["$status", ConversationStatusEnum.COMPLETED] },
                  then: 1,
                  else: 0,
                },
              },
            },
            expired: {
              $sum: {
                $cond: {
                  if: { $eq: ["$status", ConversationStatusEnum.EXPIRED] },
                  then: 1,
                  else: 0,
                },
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
            completed: 1,
            expired: 1,
            _id: 0,
          },
        },
      ]);
      return data;
    } catch (error) {
      this.logger.error(`Error while getting date wise conversations ${error}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async TotalCountPlatform() {
    try {
      const result = await this.conversationModel.aggregate([
        {
          $facet: {
            total: [
              {
                $count: "total",
              },
            ],
            facebook: [
              {
                $match: {
                  platform: PlatformEnum.FACEBOOK,
                },
              },
              {
                $count: "facebook",
              },
            ],
            whatsapp: [
              {
                $match: {
                  platform: PlatformEnum.WHATSAPP,
                },
              },
              {
                $count: "whatsapp",
              },
            ],
            telegram: [
              {
                $match: {
                  platform: PlatformEnum.TELEGRAM,
                },
              },
              {
                $count: "telegram",
              },
            ],

            widget: [
              {
                $match: {
                  platform: PlatformEnum.WIDGET,
                },
              },
              {
                $count: "widget",
              },
            ],
          },
        },
        {
          $project: {
            facebook: {
              $arrayElemAt: ["$facebook.facebook", 0],
            },

            whatsapp: {
              $arrayElemAt: ["$whatsapp.whatsapp", 0],
            },
            telegram: {
              $arrayElemAt: ["$telegram.telegram", 0],
            },
            widget: {
              $arrayElemAt: ["$widget.widget", 0],
            },
          },
        },
      ]);

      return result[0];
    } catch (err) {
      this.logger.error(`Error in getting platform data count: ${err.message}`);
      throw new HttpException(err.message, err.status || 500);
    }
  }

  async DayWisePlatform(params: ReportParamsDto) {
    const { id: botId, startDate } = params;
    let endDate = params.endDate;
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

    if (botId) {
      match["bot"] = new ObjectId(botId);
    }

    try {
      const data = await this.conversationModel.aggregate([
        {
          $match: match,
        },
        {
          $group: {
            _id: {
              $isoDayOfWeek: "$createdAt",
            },
            total: { $sum: 1 },
            facebook: {
              $sum: {
                $cond: {
                  if: { $eq: ["$platform", PlatformEnum.FACEBOOK] },
                  then: 1,
                  else: 0,
                },
              },
            },
            whatsapp: {
              $sum: {
                $cond: {
                  if: { $eq: ["$platform", PlatformEnum.WHATSAPP] },
                  then: 1,
                  else: 0,
                },
              },
            },

            telegram: {
              $sum: {
                $cond: {
                  if: { $eq: ["$platform", PlatformEnum.TELEGRAM] },
                  then: 1,
                  else: 0,
                },
              },
            },

            widget: {
              $sum: {
                $cond: {
                  if: { $eq: ["$platform", PlatformEnum.WIDGET] },
                  then: 1,
                  else: 0,
                },
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
            facebook: 1,
            whatsapp: 1,
            telegram: 1,
            widget: 1,
            _id: 0,
          },
        },
      ]);
      return data;
    } catch (error) {
      this.logger.error(
        `Error while getting bot conversation performance ${error}`
      );
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async DateWisePlatform(params: ReportParamsDto) {
    const { id: botId, startDate } = params;
    let endDate = params.endDate;
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

    if (botId) {
      match["bot"] = new ObjectId(botId);
    }

    try {
      const data = await this.conversationModel.aggregate([
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
            facebook: {
              $sum: {
                $cond: {
                  if: { $eq: ["$platform", PlatformEnum.FACEBOOK] },
                  then: 1,
                  else: 0,
                },
              },
            },
            whatsapp: {
              $sum: {
                $cond: {
                  if: { $eq: ["$platform", PlatformEnum.WHATSAPP] },
                  then: 1,
                  else: 0,
                },
              },
            },

            telegram: {
              $sum: {
                $cond: {
                  if: { $eq: ["$platform", PlatformEnum.TELEGRAM] },
                  then: 1,
                  else: 0,
                },
              },
            },

            widget: {
              $sum: {
                $cond: {
                  if: { $eq: ["$platform", PlatformEnum.WIDGET] },
                  then: 1,
                  else: 0,
                },
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
            facebook: 1,
            whatsapp: 1,
            telegram: 1,
            widget: 1,
            _id: 0,
          },
        },
      ]);
      return data;
    } catch (error) {
      this.logger.error(`Error while getting date wise conversations ${error}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async getActiveCount(
    query: { agentId?: string; anonymous?: boolean },
    title?: string
  ) {
    const { agentId, anonymous } = query;
    const match = {
      status: ConversationStatusEnum.IN_PROGRESS,
    };
    if (agentId) {
      match["agent"] = agentId;
      match["type"] = ConversationTypeEnum.REALTIME;
    }
    if (anonymous) {
      match["anonymous"] = true;
    }
    const total = await this.conversationModel.countDocuments(match);
    return {
      stats: total,
      trendNumber: 0,
      trend: "positive",
      title: title || "Total Active",
      subtitle: getDaySubtitle(1),
      type: "conversation",
    };
  }

  async getActiveStats(user: JwtPayload) {
    return Promise.all([
      this.getActiveCount({}, "Total Active"),
      this.getActiveCount({ agentId: user._id }, "My Active"),
      this.getActiveCount(
        { agentId: user._id, anonymous: true },
        "My Anonymous"
      ),
      this.getActiveCount({ agentId: user._id, anonymous: false }, "My Named"),
    ]);
  }

  async getHistoryStats() {
    return Promise.all([
      this.getTotalCount(
        30,
        false,
        "Total Conversations",
        ConversationStatusEnum.COMPLETED,
        true,
        true
      ),
      this.getTotalCount(
        30,
        false,
        "Handled By Bot",
        ConversationStatusEnum.COMPLETED,
        false,
        true
      ),
      this.getTotalCount(
        30,
        true,
        "Handled By Agent",
        ConversationStatusEnum.COMPLETED,
        false,
        true
      ),
    ]);
  }

  async getBlockStats() {
    return Promise.all([
      this.getTotalCount(
        30,
        false,
        "Blocked By Bot",
        ConversationStatusEnum.BLOCKED
      ),
      this.getTotalCount(
        30,
        true,
        "Blocked By Agent",
        ConversationStatusEnum.BLOCKED
      ),
      this.getTotalCount(
        30,
        false,
        "Total Blocked Conversations",
        ConversationStatusEnum.COMPLETED,
        true
      ),
    ]);
  }

  @OnEvent("end-conversation-by-agent", { async: true })
  async endConversationByAgent(data: { conversationId: string }) {
    const { conversationId } = data;
    const conversation = await this.conversationModel.findById(conversationId);
    if (conversation) {
      conversation.type = ConversationTypeEnum.BOT;
      conversation.agentCallEndedAt = new Date();
      await conversation.save();
    }
  }

  @OnEvent("report-conversation", { async: true })
  async reportConversation(data: { conversationId: string }) {
    const { conversationId } = data;
    const conversation = await this.conversationModel.findById(conversationId);
    if (conversation) {
      conversation.status = ConversationStatusEnum.BLOCKED;
      await conversation.save();
    }
  }

  async getChats(conversationId: string, visitorId: string) {
    try {
      const conversation = await this.conversationModel
        .findById(conversationId)
        .populate("bot", "name")
        .populate("agent", "name")
        .populate("chats");

      if (!conversation) {
        throw new HttpException("No conversation found by this Id", 404);
      }

      const botId = conversation.bot._id.toHexString();

      // label : You, AgentName, BotName
      const data = conversation.chats.map((chat) => {
        return {
          message: chat.message,
          label:
            chat.sender === visitorId
              ? "You"
              : chat.sender === botId
              ? conversation.bot.name
              : conversation.agent.name,
        };
      });

      return data;
    } catch (err) {
      this.logger.error("error in getting chat", err);
    }
  }
  async homeConversationCount(filter: any, status?: ConversationStatusEnum) {
    if (!filter) filter = "day";
    try {
      const total = await this.conversationModel.countDocuments({
        createdAt: {
          $gte: new Date(moment().startOf(filter).toISOString()),
        },
        status: status || { $ne: "" },
      });

      let percentageChange = 0;
      const previousTotal = await this.conversationModel.countDocuments({
        createdAt: {
          $gte: new Date(
            moment().subtract(1, filter).startOf(filter).toISOString()
          ),
        },
        status: status || { $ne: "" },
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
        title:
          status === ConversationStatusEnum.BLOCKED
            ? "Blocked Conversations"
            : "Total Conversations",
        type: "conversation",
      };
    } catch (error) {
      this.logger.error(`Error while getting home conversation count ${error}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }
}
