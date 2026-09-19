import { HttpException, Inject, Injectable, Logger } from "@nestjs/common";
import { Model } from "mongoose";
import {
  BOTS_FLOW_PROVIDER,
  BOTS_NODE_PROVIDER,
  BOTS_PROVIDER,
  BOTS_SETTING_PROVIDER,
  BOTS_STYLE_PROVIDER,
} from "./constant";
import { CreateBotDto } from "./dto/create-bot.dto";
import { UpdateBotFlowDto } from "./dto/update-bot-flow.dto";
import { UpdateBotDto } from "./dto/update-bot.dto";

import { ConfigService } from "@nestjs/config";
import { AgentService } from "src/agent/agent.service";
import { ValidationInputList } from "src/message-handler/enums/user-input-validation.enums";
import { SegmentsService } from "src/segments/segments.service";
import { generateId } from "src/util";
import { WebhookService } from "src/webhook/webhook.service";
import { defaultNodes } from "./defaultNodes";
import { BotQueryParams } from "./dto/search-bot.dto";
import {
  BotDocument,
  BotFlowDocument,
  BotFlowNodeDocument,
  BotSettingDocument,
  BotStylesDocument,
} from "./entities";
import { BotStatusEnum } from "./enums/bot-status.enum";
import { NodeTypeEnum } from "./enums/node-type.enum";
import { TicketsService } from "src/tickets/tickets.service";
import { ConversationService } from "src/conversation/conversation.service";
import { getDaySubtitle } from "src/util/get-subtitle";
import { Public } from "src/auth/Public/public.decorator";
import { ReportParamsDto } from "src/util/report-params.dto";
import { TicketPriorityEnumList } from "src/tickets/enums/ticket-priority";
import { TagService } from "src/tag/tag.service";
import * as mongoose from "mongoose";
import {
  assertOwnership,
  scopedFilter,
  TenantContext,
} from "src/common/tenant/tenant-context";
import { EntitlementService } from "src/billing/entitlement.service";
@Injectable()
export class BotsService {
  private readonly logger = new Logger(BotsService.name);

  constructor(
    @Inject(BOTS_PROVIDER)
    private readonly botModel: Model<BotDocument>,
    @Inject(BOTS_STYLE_PROVIDER)
    private readonly botStyleModel: Model<BotStylesDocument>,
    @Inject(BOTS_SETTING_PROVIDER)
    private readonly botSettingModel: Model<BotSettingDocument>,

    @Inject(BOTS_FLOW_PROVIDER)
    private readonly botFlowModel: Model<BotFlowDocument>,

    @Inject(BOTS_NODE_PROVIDER)
    private readonly botNodeModel: Model<BotFlowNodeDocument>,

    private readonly webhookService: WebhookService,
    private readonly segmentService: SegmentsService,
    private readonly configService: ConfigService,
    private readonly agentService: AgentService,
    private readonly ticketService: TicketsService,
    private readonly conversationService: ConversationService,
    private readonly tagsService: TagService,
    private readonly entitlementService: EntitlementService
  ) {}

  generateNodeAndEdegs() {
    const nodes = defaultNodes.nodes.map((node: any) => {
      return {
        ...node,
        id: generateId("node", 15),
        title: node.data.title,
      };
    });

    const tree = [
      {
        source: nodes[0],
        target: nodes[1],
        children: [],
      },
      {
        source: nodes[0],
        target: nodes[2],
        children: [
          {
            source: nodes[2],
            target: nodes[3],
            children: [],
          },
        ],
      },
    ];

    const edges = this.generateEdges(tree);

    return { nodes, edges };
  }
  generateEdges(tree: any) {
    const edges = [];
    const traverse = (node: any) => {
      node.forEach((child: any) => {
        edges.push({
          id: generateId("edge", 15),
          source: child.source.id,
          target: child.target.id,
        });
        if (child.children.length) {
          traverse(child.children);
        }
      });
    };

    traverse(tree);
    return edges;
  }

  async createNodes({ nodes, edges }: { nodes: any[]; edges: any[] }) {
    const edgesList = edges.reduce((acc: any, edge: any) => {
      acc[edge.source] = acc[edge.source] || [];
      acc[edge.source].push(edge.target);
      return acc;
    }, {});

    await Promise.all(
      nodes.map(async (node: any) => {
        const checkNode = await this.botNodeModel.findOne({ id: node.id });
        if (!checkNode) {
          await this.botNodeModel.create({
            ...node,
            next: edgesList[node.id] || [],
          });
        } else {
          const lastNodes = checkNode.next;
          checkNode.next = edgesList[node.id] || [];
          checkNode.title = node.data.title;
          await checkNode.save();
          await Promise.all(
            lastNodes.map(async (lastNode: any) => {
              const checkLastNode = await this.botNodeModel.findOne({
                next: { $in: [lastNode] },
              });
              if (!checkLastNode) {
                await this.botNodeModel.deleteOne({ id: lastNode });
              }
            })
          );
        }
      })
    );
  }

  async botlist(user?: TenantContext) {
    // Aggregation does not auto-cast, so build the org match explicitly and
    // convert the id to an ObjectId when the caller is org-scoped.
    const scoped: Record<string, any> = scopedFilter(user, {
      _id: { $ne: null },
    });
    if (scoped.organizationId) {
      scoped.organizationId = new mongoose.Types.ObjectId(
        String(scoped.organizationId),
      );
    }
    return await this.botModel.aggregate([
      { $match: scoped },
      {
        $project: {
          name: 1,
          id: "$_id",
          _id: 0,
        },
      },
    ]);
  }

  async create(createBotDto: CreateBotDto, actor?: TenantContext) {
    this.logger.log(`Creating bot ${createBotDto.name}`);
    const organizationId = (actor?.organizationId as any) ?? null;

    // Reserve quota atomically before creating; release if the bot document
    // itself fails to persist so the counter never drifts.
    await this.entitlementService.reserveQuota(organizationId, "bot");
    let bot: BotDocument;
    try {
      bot = await this.botModel.create({
        ...createBotDto,
        organizationId,
      });
    } catch (error) {
      await this.entitlementService.releaseQuota(organizationId, "bot");
      this.logger.error(`Error in create bot: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }

    try {
      const botStyle = await this.botStyleModel.create({
        botId: bot._id,
        primaryColor: createBotDto.primaryColor,
      });

      const botSetting = await this.botSettingModel.create({
        botId: bot._id,
      });

      const { nodes, edges } = this.generateNodeAndEdegs();

      await this.createNodes({ nodes, edges });

      const botFlow = await this.botFlowModel.create({
        botId: bot._id,
        nodes,
        edges,
        startNode: nodes.filter(
          (node: any) => node.nodeType === NodeTypeEnum.START_NODE
        )[0].id,
      });

      bot.botFlow = botFlow._id;
      bot.botStyles = botStyle._id;
      bot.botSetting = botSetting._id;
      if (createBotDto.agents) {
        await this.agentService.addBotToAgent(bot._id, createBotDto.agents);
      }
      await bot.save();
      return bot;
    } catch (error) {
      this.logger.error(`Error in create bot: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async getBotById(id: string, user?: TenantContext) {
    try {
      const bot = await this.botModel
        .findOne({
          $or: [{ _id: id }, { botId: id }],
        })
        .populate("agents", "name")
        .populate("botStyles")
        .populate("botFlow")
        .populate("botSetting");

      if (!bot) {
        throw new HttpException("No Bot Found by this Id", 404);
      }
      // Cross-org access returns 404 (no existence leak) for non-super-admins.
      assertOwnership(user, bot as any);
      return bot;
    } catch (error) {
      this.logger.error(`Error in get bot by id: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async getAllBots(query?: BotQueryParams, user?: TenantContext) {
    try {
      const {
        skip: documentsToSkip,
        limit: limitOfDocuments,
        tags,
        status,
      } = query;

      const queryObject: Record<string, any> = {};
      // `remove()` is a SOFT delete — it only flips `status` to `deleted`, and the
      // row stays in the collection. So an unfiltered read returns bots the
      // operator has already deleted, which is how they kept appearing in the
      // "Select JarCube Bot" dropdown on the Social Messengers form. Absent an
      // explicit status the default is therefore "everything that still exists",
      // not "every document". Asking for `status=deleted` explicitly still works,
      // which is what the Bots list's own Deleted filter relies on.
      if (status) {
        queryObject["status"] = status;
      } else {
        queryObject["status"] = { $ne: BotStatusEnum.DELETED };
      }
      if (tags) queryObject["tags"] = { $in: tags };

      const agents = this.botModel
        .find(scopedFilter(user, queryObject))

        .populate("tags", "name")
        .populate("agents", "name")
        .sort({ createdAt: -1 })
        .skip(documentsToSkip);
      if (limitOfDocuments) {
        agents.limit(limitOfDocuments);
      }
      const data = await agents;

      return data;
    } catch (error) {
      this.logger.error(`Error in get all bots: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async update(id: string, updateBotDto: UpdateBotDto) {
    try {
      const bot = await this.botModel.findOneAndUpdate(
        { _id: id },
        updateBotDto,
        { new: true }
      );

      if (updateBotDto.agents) {
        await this.agentService.addBotToAgent(bot._id, updateBotDto.agents);
      }

      if (!bot) {
        throw new HttpException("No Bot Found by this Id", 404);
      }
      return bot;
    } catch (error) {
      this.logger.error(`Error in update bot: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async remove(id: string) {
    try {
      const bot = await this.botModel.findOne({
        _id: id,
      });
      if (!bot) {
        throw new HttpException("No Bot Found by this Id", 404);
      }
      bot.status = BotStatusEnum.DELETED;
      await bot.save();
      return bot;
    } catch (error) {
      this.logger.error(`Error in delete bot: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async getBotSettingById(id: string) {
    try {
      const botSetting = await this.botSettingModel.findOne({ botId: id });
      if (!botSetting) {
        throw new HttpException("No Bot setting Found by this Id", 404);
      }
      return botSetting;
    } catch (error) {
      this.logger.error(`Error in get bot setting by id: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async getBotStylesById(id: string) {
    try {
      const botStyles = await this.botStyleModel.findOne({ botId: id });
      if (!botStyles) {
        throw new HttpException("No Bot Styles Found by this Id", 404);
      }
      return botStyles;
    } catch (error) {
      this.logger.error(`Error in get bot styles by id: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async updateBotSetting(id: string, updateBotSettingDto: any) {
    try {
      const botSetting = await this.botSettingModel.findOneAndUpdate(
        { botId: id },
        updateBotSettingDto,
        { new: true }
      );
      if (!botSetting) {
        throw new HttpException("No Bot setting Found by this Id", 404);
      }
      return botSetting;
    } catch (error) {
      this.logger.error(`Error in update bot setting: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async updateBotStyle(id: string, updateBotStyleDto: any) {
    try {
      const botStyle = await this.botStyleModel.findOneAndUpdate(
        { botId: id },
        updateBotStyleDto,
        { new: true }
      );
      if (!botStyle) {
        throw new HttpException("No Bot style Found by this Id", 404);
      }
      return botStyle;
    } catch (error) {
      this.logger.error(`Error in update bot style: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async getBotFlow(id: string) {
    try {
      const botFlow = await this.botFlowModel.findOne({ botId: id });
      if (!botFlow) {
        throw new HttpException("No Bot Flow Found by this Id", 404);
      }
      return botFlow;
    } catch (error) {
      this.logger.error(`Error in get bot flow by id: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async updateBotFlow(id: string, updateBotFlowDto: UpdateBotFlowDto) {
    try {
      const botFlow = await this.botFlowModel.findOneAndUpdate(
        { botId: id },
        updateBotFlowDto,
        { new: true }
      );
      if (!botFlow) {
        throw new HttpException("No Bot Flow Found by this Id", 404);
      }

      await this.createNodes(updateBotFlowDto);
      return botFlow;
    } catch (error) {
      this.logger.error(`Error in update bot flow: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async updateNode(id: string, updateNodeDto: any) {
    try {
      const node = await this.botNodeModel.findOneAndUpdate(
        {
          id,
        },
        updateNodeDto,
        { new: true }
      );
      if (!node) {
        throw new HttpException("No Node Found by this Id", 404);
      }

      return node;
    } catch (error) {
      this.logger.error(`Error in update node: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async getBotNodeForApi(id: string) {
    try {
      const node = await this.botNodeModel.findOne({ id });
      if (!node) {
        throw new HttpException("No Node Found by this Id", 404);
      }
      const tags = await this.tagsService.getTagList();

      let customAttributes = [];
      if (node.botId) {
        const botFlow = await this.botFlowModel.findOne({ botId: node.botId });
        customAttributes = botFlow.customAttributes;
      }

      const embed = {
        attributes: this.configService.get("attributesList"),
        validationList: ValidationInputList,
        customAttributes,
        tags: tags,
      };

      if (node.nodeType === NodeTypeEnum.WEBHOOK) {
        const webhooks = await this.webhookService.getWebhooksListForNode();
        embed["webhooks"] = webhooks;
      }
      if (node.nodeType === NodeTypeEnum.TICKET) {
        embed["priorities"] = TicketPriorityEnumList;
      }
      if (
        node.nodeType === NodeTypeEnum.ADD_TO_SEGMENT ||
        node.nodeType === NodeTypeEnum.REMOVE_FROM_SEGMENT
      ) {
        const segments = await this.segmentService.getSegmentsForNode();
        embed["segments"] = segments;
      }

      return { node, embed };
    } catch (error) {
      this.logger.error(`Error in get node by id: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async getBotNode(id: string) {
    if (!id) {
      return;
    }
    const node = await this.botNodeModel.findOne({ id });
    if (!node) {
      throw new HttpException("No Node Found by this Id", 404);
    }
    return node;
  }

  async assignAdvertisementToBots(
    bots: string[],
    advertisementId: string
  ): Promise<any[]> {
    const error = [];
    await Promise.all(
      bots.map(async (botId) => {
        const bot = await this.botModel.findOne({ id: botId });
        if (bot) {
          if (bot.advertisement !== advertisementId) {
            error.push({
              botId,
              name: bot.name,
            });
          } else {
            bot.advertisement = advertisementId;
            await bot.save();
          }
        }
      })
    );
    return error;
  }

  async unassignAdvertisementFromBots(bots: string[]) {
    try {
      await this.botModel.updateMany(
        { id: { $in: bots } },
        { $unset: { advertisement: "" } }
      );
    } catch (error) {
      this.logger.error(
        `Error in unassign advertisement from bots: ${error.message}`
      );
      throw new HttpException(error.message, error.status || 500);
    }
  }
  async removeNode(id: string) {
    try {
      const node = await this.botNodeModel.findOneAndDelete({ id });
      if (!node) {
        throw new HttpException("No Node Found by this Id", 404);
      }
      return node;
    } catch (error) {
      this.logger.error(`Error in delete node: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async getTotalCount(days = 30) {
    const total = await this.botModel.countDocuments();

    let percentageChange = 0;

    if (total) {
      const agoCount = await this.botFlowModel.countDocuments({
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
      title: "Total Bots",
      subtitle: getDaySubtitle(days),
      type: "bot",
    };
  }

  async stats() {
    const result = await Promise.all([
      this.getTotalCount(),
      this.conversationService.getTotalCount(),
      this.ticketService.getTotalCount(),
    ]);

    return result;
  }

  async getBotDataForWidget(id: string) {
    try {
      const bot = await this.botModel
        .findOne({ _id: id })
        .populate("botSetting", "-_id -botId -createdAt -updatedAt -__v")
        .populate("botStyles", "-_id -botId -createdAt -updatedAt -__v")
        .populate("advertisement", "title posters")
        .populate("offer", "title cards")
        .populate("botFlow", "startNode")
        .select(" -createdAt -updatedAt -__v ");
      if (!bot) {
        throw new HttpException("No Bot Found by this Id", 404);
      }
      return bot;
    } catch (error) {
      this.logger.error(`Error in get bot data for widget: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async totalBots() {
    try {
      const result = await this.botModel.aggregate([
        {
          $facet: {
            total: [
              {
                $count: "total",
              },
            ],
            active: [
              {
                $match: {
                  status: BotStatusEnum.ACTIVE,
                },
              },

              {
                $count: "active",
              },
            ],
            suspended: [
              {
                $match: {
                  status: BotStatusEnum.SUSPENDED,
                },
              },
              {
                $count: "suspended",
              },
            ],
            deleted: [
              {
                $match: {
                  status: BotStatusEnum.DELETED,
                },
              },
              {
                $count: "deleted",
              },
            ],
          },
        },
        {
          $project: {
            total: {
              $arrayElemAt: ["$total.total", 0],
            },
            active: {
              $arrayElemAt: ["$active.active", 0],
            },
            suspended: {
              $arrayElemAt: ["$suspended.suspended", 0] || 0,
            },
            deleted: {
              $arrayElemAt: ["$deleted.deleted", 0],
            },
          },
        },
      ]);

      return result[0];
    } catch (error) {
      this.logger.error(`Error in get bot data for widget: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async dayWisePerformance(query: ReportParamsDto) {
    return await this.conversationService.getDayWisePerformance(query);
  }

  async dateWiseConversations(query: ReportParamsDto) {
    return await this.conversationService.getDateWiseConversations(query);
  }

  async getLanguages() {
    return this.configService.get("languages");
  }
}
