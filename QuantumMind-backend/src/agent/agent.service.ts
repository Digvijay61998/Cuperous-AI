import {
  HttpException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcryptjs";
import { AGENT_PROVIDER } from "src/constants";
import { CreateAgentDto } from "./dto/create-agent.dto";
import { UpdateAgentDto } from "./dto/update-agent.dto";
import { AgentDocument } from "./entities/agent.entity";

import mongoose, { Model } from "mongoose";

import { AgentQueryParams } from "./agent-query.params";

import { RoleEnum } from "./enums/agent-role.enum";
import { AgentStatusEnum } from "./enums/agent-status.enum";
import { JwtPayload } from "src/auth/strategy/jwt.strategy";
import { getDaySubtitle } from "src/util/get-subtitle";
import { ConversationService } from "src/conversation/conversation.service";
import { OnEvent } from "@nestjs/event-emitter";
import { ReportParamsDto } from "src/util/report-params.dto";
import { VisitorDocument } from "src/visitor/entities/visitor.entity";

@Injectable()
export class AgentService implements OnModuleInit {
  private readonly logger = new Logger(AgentService.name);

  async onModuleInit() {
    const email = this.configService.get("admin.email");
    const name = this.configService.get("admin.name");
    const admin = await this.agentModel.findOne({ email });
    if (!admin) {
      const originalPassword = this.configService.get("admin.password");
      const admin = new this.agentModel({
        name,
        email,
        password: await this.encryptPassword(originalPassword),
        role: RoleEnum.ADMIN,
      });

      await admin.save();
      this.logger.debug(
        `Admin created with Email ${admin.email} and password: ${originalPassword}`
      );
    }
    this.logger.debug("Admin Credentials are already present");
  }

  constructor(
    @Inject(AGENT_PROVIDER)
    private readonly agentModel: Model<AgentDocument>,
    private readonly configService: ConfigService,

    private readonly conversationService: ConversationService
  ) {}

  async encryptPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(
      this.configService.get("bcrypt.saltOrRounds")
    );

    return await bcrypt.hash(password, salt);
  }

  async comparePassword(
    password: string,
    receivedPassword: string
  ): Promise<boolean> {
    return await bcrypt.compare(password, receivedPassword);
  }

  async authenticateAgent(
    email: string,
    password: string
  ): Promise<AgentDocument> {
    const agent = await this.agentModel.findOne({ email });
    if (agent) {
      const isMatch = await this.comparePassword(password, agent.password);
      if (isMatch) {
        agent.lastLogin = new Date();
        await agent.save();
        return agent;
      }
    }
    return null;
  }

  async create(createAgentDto: CreateAgentDto) {
    this.logger.log(
      `Creating Agent with name ${createAgentDto.name} and email ${createAgentDto.email}`
    );
    try {
      const password = await this.encryptPassword(createAgentDto.password);

      const agent = await this.agentModel.create({
        ...createAgentDto,
        password,
      });
      this.logger.log(`Agent created with name ${agent.name}`);
      return agent;
    } catch (error) {
      this.logger.error(`Error while creating Agent: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async agentList() {
    return await this.agentModel.aggregate([
      {
        $project: {
          name: 1,
          id: "$_id",
          _id: 0,
        },
      },
    ]);
  }

  async remove(agentId: string) {
    this.logger.log(`Removing Agent with id ${agentId}`);
    try {
      const agent = await this.agentModel.findOne({
        _id: agentId,
      });
      if (!agent) {
        this.logger.error(`Agent not found with id ${agentId}`);
        throw new UnauthorizedException("Agent not found");
      }

      await agent.remove();
    } catch (error) {
      this.logger.error(`Error while removing Agent: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async update(agentId: string, updateAgentDto: UpdateAgentDto) {
    this.logger.log(`Updating Agent with id ${agentId}`);
    try {
      const agent = await this.agentModel.findOne({
        _id: agentId,
      });
      if (!agent) {
        this.logger.error(`Agent not found with id ${agentId}`);
        throw new UnauthorizedException("Agent not found");
      }

      if (updateAgentDto.password) {
        updateAgentDto.password = await this.encryptPassword(
          updateAgentDto.password
        );
      }

      await agent.updateOne({ ...updateAgentDto });
      return {
        message: "Agent updated successfully",
      };
    } catch (error) {
      this.logger.error(`Error while updating Agent: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async findAll(query: AgentQueryParams) {
    try {
      const {
        skip: documentsToSkip,
        limit: limitOfDocuments,
        tags,
        status,
        bot,
      } = query;

      const queryObject = {};
      if (status) queryObject["status"] = status;
      if (tags) queryObject["tags"] = { $in: tags };
      if (bot) queryObject["assignedBots"] = { $in: [bot] };
      const agents = this.agentModel
        .find(queryObject)
        .populate("assignedBots", "name")
        .populate("tags", "name")
        .sort({ createdAt: -1 })
        .skip(documentsToSkip);
      if (limitOfDocuments) {
        agents.limit(limitOfDocuments);
      }
      const data = await agents;
      const count = await this.agentModel.count();
      return { data, count };
    } catch (error) {
      this.logger.error(`Error while finding Agents: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  /**
   * Ids of every dashboard user who should see activity on `botId`.
   *
   * Used by the omnichannel inbox to fan a channel message out to the agents
   * watching that bot. Two rules matter:
   *
   *  - **Admins are always included, with no bot filter.** An admin has no
   *    `assignedBots` (the field is for routing agents), so filtering on it
   *    would silently exclude exactly the users most likely to be watching the
   *    inbox.
   *  - **Status is NOT filtered.** `assignAgent` filters to ONLINE because it is
   *    picking someone to hand a conversation to; this is a passive broadcast, so
   *    the only question that matters is whether a socket is connected — and
   *    that is answered downstream by the socket registry. Filtering on a stale
   *    `status` row here would drop messages for a connected agent.
   *
   * Projection is `_id` only: this runs on every inbound channel message, so it
   * must stay a covered, index-only read.
   */
  async findInboxRecipientIds(botId: string): Promise<string[]> {
    try {
      const agents = await this.agentModel
        .find({
          $or: [
            { assignedBots: { $in: [botId] } },
            { role: RoleEnum.ADMIN },
          ],
          active: true,
        })
        .select("_id");
      return agents.map((a) => (a._id as any).toString());
    } catch (error) {
      this.logger.error(
        `Failed to resolve inbox recipients for bot ${botId}: ${error.message}`
      );
      // Fan-out is best-effort: a lookup failure must not break the inbound
      // message pipeline that persisted the message.
      return [];
    }
  }

  async findOne(agentId: string) {
    try {
      return await this.agentModel
        .findOne({
          _id: agentId,
        })
        .populate("tags", "name")
        .populate("assignedBots", "name status createdAt")
        .populate({
          path: "conversations",
          populate: [
            {
              path: "visitor",
              select: "name email",
            },
            {
              path: "bot",
              select: "name",
            },
            {
              path: "feedbacks",
              select: "rating comment",
            },
          ],

          select: "visitor status createdAt platform ",
        })
        .populate(
          "serviceRequests",
          "priority status createdAt subject description ticketId"
        );
    } catch (error) {
      this.logger.error(`Error while finding Agent: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async assignAgent(botId: string): Promise<AgentDocument> {
    try {
      this.logger.log(`Assigning Agent to bot with id ${botId}`);
      const agents = await this.agentModel
        .find({
          assignedBots: { $in: [botId] },
          status: AgentStatusEnum.ONLINE,
        })
        .sort({
          activeConversations: 1,
          maxConcurrentChats: 1,
        })
        .select("_id maxConcurrentChats activeConversations name")
        .limit(1);

      if (agents.length) {
        const agent = agents[0];

        if (agent.maxConcurrentChats > agent.activeConversations) {
          agent.activeConversations += 1;

          await agent.save();
          return agent;
        }

        return agent;
      }
      return null;
    } catch (error) {
      this.logger.error(`Error in assign agent: ${error.message}`);
      throw new Error(error.message);
    }
  }

  async addBotToAgent(botId: any, agents: string[]) {
    try {
      await Promise.all(
        agents.map(async (agentId: any) => {
          const agent = await this.agentModel.findOne({
            _id: new mongoose.Types.ObjectId(agentId),
          });

          if (agent) {
            const uniqueBots = new Set(
              agent.assignedBots.map((bot: any) => bot.toHexString())
            );
            uniqueBots.add(botId.toHexString());

            agent.assignedBots = [...uniqueBots];
            await agent.save();
          }
        })
      );
    } catch (error) {
      this.logger.error(`Error in addBotToAgent: ${error.message}`);
      throw new Error(error.message);
    }
  }

  async updateAgentStatus(agentId: string, status: AgentStatusEnum) {
    const agent = await this.agentModel.findOne({
      _id: agentId,
    });

    if (agent) {
      agent.status = status;

      if (status === AgentStatusEnum.OFFLINE) {
        agent.activeConversations = 0;
        agent.lastSeen = new Date();
      }

      if (status === AgentStatusEnum.ONLINE) {
        agent.lastSeen = new Date();
      }
      await agent.save();
    }
  }

  async getMe(user: JwtPayload) {
    try {
      const agentData = await this.agentModel.findOne({ _id: user._id });
      if (!agentData) {
        throw new HttpException("Agent not found", 401);
      }
      return {
        email: agentData.email,
        username: agentData.email,
        _id: agentData._id,
        fullName: agentData.name,
        role: agentData.role,
      };
    } catch (error) {
      this.logger.error(`Error while finding Agent: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  @OnEvent("conversation.created.agent", { async: true })
  async addConversations({
    agentId,
    conversationId,
  }: {
    agentId: string;
    conversationId: string;
  }) {
    try {
      const agent = await this.agentModel.findById(agentId);
      if (!agent) return;
      agent.conversations.push(conversationId);
      agent.save();
      return agent;
    } catch (error) {
      this.logger.error(
        `Error while adding conversation to visitor with id ${agentId} : ${error.message}`
      );

      throw new HttpException(error.message, error.status || 500);
    }
  }

  async updateRatingAndFeedback(
    agentId: string,
    rating: number,
    feedbackId: string
  ) {
    try {
      const agent = await this.agentModel.findById(agentId);
      if (agent) {
        agent.totalRating = agent.totalRating + rating;
        agent.totalRatingCount += 1;
        agent.rating =
          Math.round((agent.totalRating / agent.totalRatingCount) * 10) / 10;
        agent.feedbacks.push(feedbackId);
        await agent.save();
      }
    } catch (error) {
      this.logger.error(
        `Error while adding rating and feedback to agent with id ${agentId} : ${error.message}`
      );
    }
  }

  async getTotalCount(days = 30) {
    const total = await this.agentModel.countDocuments();
    let percentageChange = 0;

    if (total) {
      const agoCount = await this.agentModel.countDocuments({
        createdAt: {
          $gte: new Date(new Date().setDate(new Date().getDate() - 60)),
        },
      });
      percentageChange = Math.round((agoCount / total) * 100);
    }
    return {
      stats: total,
      trendNumber: percentageChange,
      trend: percentageChange >= 0 ? "positive" : "negative",
      title: "Total Agents",
      subtitle: getDaySubtitle(days),
      type: "main",
    };
  }

  async getOnlineAgentsCount(days = 1) {
    const total = await this.agentModel.countDocuments({
      status: AgentStatusEnum.ONLINE,
    });
    let percentageChange = 0;
    if (total) {
      const agoCount = await this.agentModel.countDocuments({
        status: AgentStatusEnum.ONLINE,
        lastSeen: {
          $gte: new Date(new Date().setDate(new Date().getDate() - days)),
        },
      });
      percentageChange = Math.round((agoCount / total) * 100);
    }
    return {
      stats: total,
      trendNumber: percentageChange,
      trend: percentageChange >= 0 ? "positive" : "negative",
      title: "Online Agents",
      subtitle: getDaySubtitle(days),
      type: "online_agent",
    };
  }

  async getActiveAgentsCount(days = 30) {
    const total = await this.agentModel.countDocuments({
      active: true,
    });
    let percentageChange = 0;
    if (total) {
      const agoCount = await this.agentModel.countDocuments({
        active: true,
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
      title: "Active Agents",
      subtitle: getDaySubtitle(days),
      type: "active_agent",
    };
  }

  async getStats() {
    try {
      const result = await Promise.all([
        this.getTotalCount(),
        this.getOnlineAgentsCount(1),
        this.getActiveAgentsCount(),
      ]);
      return result;
    } catch (error) {
      this.logger.error(`Error while getting stats: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async getTotalAgent() {
    try {
      const response = await this.agentModel.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: [{ $eq: ["$active", true] }, 1, 0] } },
            inactive: { $sum: { $cond: [{ $eq: ["$active", false] }, 1, 0] } },
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
      this.logger.error(`Error while getting total agent: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async dayWisePerformance(query: ReportParamsDto) {
    query.agentId = query.id;
    delete query.id;
    return await this.conversationService.getDayWisePerformance(query, true);
  }

  async dateWiseConversations(query: ReportParamsDto) {
    query.agentId = query.id;
    delete query.id;
    return await this.conversationService.getDateWiseConversations(query, true);
  }

  @OnEvent("ticket.assigned.agent", { async: true })
  async addServiceRequest(data: { agentId: string; ticketId: string }) {
    const { agentId, ticketId } = data;
    try {
      const agent = await this.agentModel.findById(agentId);
      if (agent) {
        agent.serviceRequests = [
          ...new Set([...agent.serviceRequests, ticketId]),
        ];
        await agent.save();
      }
    } catch (error) {
      this.logger.error(
        `Error while adding service request to agent with id ${agentId} : ${error.message}`
      );
    }
  }

  async welcomeToAgent(agentId: any) {
    try {
      const agent = await this.agentModel.findOne({
        _id: agentId,
      });
      if (!agent) {
        throw new HttpException("Not found", 404);
      }
      const requestHandled = agent.serviceRequests.length;

      const rating = agent.rating;
      const days = Math.round(
        (new Date().getTime() - agent.createdAt.getTime()) / (1000 * 3600 * 24)
      );
      const visitorModel = mongoose.model<VisitorDocument>("Visitor");
      const visitorCount = await visitorModel.countDocuments({
        agents: {
          $in: [agentId],
        },
      });

      return {
        requestHandled,

        days,
        visitorCount,
      };
    } catch (error) {
      throw new HttpException(error.message, error.status || 500);
    }
  }
}
