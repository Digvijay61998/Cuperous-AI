import { sanitizeIncidentSettings } from "./incident-settings";
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
  isCrossOrg,
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

  /**
   * Upserts flow nodes for ONE bot. Every node is stamped with `botId`, and
   * lookups/orphan-cleanup are confined to that bot, so a flow payload can never
   * rewrite or delete another tenant's nodes by reusing their node ids.
   */
  async createNodes(
    { nodes, edges }: { nodes: any[]; edges: any[] },
    botId?: any
  ) {
    const edgesList = (edges ?? []).reduce((acc: any, edge: any) => {
      acc[edge.source] = acc[edge.source] || [];
      acc[edge.source].push(edge.target);
      return acc;
    }, {});
    const owner = botId ? { botId } : {};

    await Promise.all(
      (nodes ?? []).map(async (node: any) => {
        const existing = await this.botNodeModel.findOne({ id: node.id });
        if (
          existing &&
          botId &&
          existing.botId &&
          String(existing.botId) !== String(botId)
        ) {
          // Node id belongs to another bot: never touch it.
          return;
        }
        if (!existing) {
          await this.botNodeModel.create({
            ...node,
            ...owner,
            next: edgesList[node.id] || [],
          });
        } else {
          const lastNodes = existing.next;
          existing.next = edgesList[node.id] || [];
          existing.title = node?.data?.title;
          if (botId && !existing.botId) existing.botId = botId;
          await existing.save();
          await Promise.all(
            (lastNodes ?? []).map(async (lastNode: any) => {
              const checkLastNode = await this.botNodeModel.findOne({
                ...owner,
                next: { $in: [lastNode] },
              });
              if (!checkLastNode) {
                await this.botNodeModel.deleteOne({ ...owner, id: lastNode });
              }
            })
          );
        }
      })
    );
  }

  /**
   * Asserts the caller's org owns the bot a flow node belongs to. Resolves the
   * bot from the node's `botId`, falling back to the BotFlow that lists the node.
   * Missing and foreign nodes both yield 404.
   */
  private async assertNodeOwnership(nodeId: string, user?: TenantContext) {
    const node = await this.botNodeModel.findOne({ id: nodeId });
    if (!node) throw new HttpException("No Node Found by this Id", 404);
    let botRef: any = node.botId;
    if (!botRef) {
      const flow = await this.botFlowModel
        .findOne({ "nodes.id": nodeId })
        .select("botId")
        .lean();
      botRef = (flow as any)?.botId;
    }
    if (!botRef) throw new HttpException("No Node Found by this Id", 404);
    const bot = await this.botModel.findById(botRef).select("organizationId");
    if (!bot) throw new HttpException("No Node Found by this Id", 404);
    try {
      assertOwnership(user, bot as any);
    } catch {
      throw new HttpException("No Node Found by this Id", 404);
    }
    return { node, botId: bot._id };
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
    // A tenant resource must have a tenant. (Only org roles reach this route.)
    if (!organizationId) {
      throw new HttpException("You are not associated with an organization", 403);
    }
    // Agents must belong to the same org before we spend a quota slot.
    const agents = createBotDto.agents
      ? await this.agentService.assertAgentsInOrg(
          String(organizationId),
          createBotDto.agents
        )
      : undefined;

    // Reserve quota atomically before creating; release if the bot document
    // itself fails to persist so the counter never drifts.
    await this.entitlementService.reserveQuota(organizationId, "bot");
    let bot: BotDocument;
    try {
      bot = await this.botModel.create({
        name: createBotDto.name,
        tags: createBotDto.tags,
        agents,
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

      await this.createNodes({ nodes, edges }, bot._id);

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
      if (agents?.length) {
        await this.agentService.addBotToAgent(bot._id, agents);
      }
      await bot.save();
      return bot;
    } catch (error) {
      // Roll back the half-built bot so it neither lingers nor holds quota.
      await Promise.all([
        this.botStyleModel.deleteMany({ botId: bot._id }),
        this.botSettingModel.deleteMany({ botId: bot._id }),
        this.botFlowModel.deleteMany({ botId: bot._id }),
        this.botNodeModel.deleteMany({ botId: bot._id }),
        this.botModel.deleteOne({ _id: bot._id }),
      ]).catch(() => undefined);
      await this.entitlementService.releaseQuota(organizationId, "bot");
      this.logger.error(`Error in create bot: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async getBotById(id: string, user?: TenantContext) {
    try {
      const or: Record<string, any>[] = [{ botId: String(id) }];
      if (mongoose.isValidObjectId(id)) or.unshift({ _id: id });
      const bot = await this.botModel
        .findOne({ $or: or })
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

  /**
   * Loads a bot by id (or custom botId) and asserts the caller owns it.
   * Throws 404 for a cross-org access so existence cannot be probed. Call this
   * before acting on a bot or any of its sub-resources (setting/style/flow).
   */
  private async assertBotOwnership(id: string, user?: TenantContext) {
    const or: Record<string, any>[] = [{ botId: String(id) }];
    if (mongoose.isValidObjectId(id)) or.unshift({ _id: id });
    const bot = await this.botModel
      .findOne({ $or: or })
      .select("_id organizationId");
    if (!bot) {
      throw new HttpException("No Bot Found by this Id", 404);
    }
    assertOwnership(user, bot as any);
    return bot;
  }

  async update(id: string, updateBotDto: UpdateBotDto, user?: TenantContext) {
    try {
      const owned = await this.assertBotOwnership(id, user);
      const orgId = owned.organizationId ? String(owned.organizationId) : null;
      const changes: Record<string, any> = { ...updateBotDto };
      // Tenant/ownership fields are never client-writable.
      delete changes.organizationId;
      delete changes._id;
      delete changes.botId;
      if (changes.status === BotStatusEnum.DELETED) delete changes.status;
      if (changes.agents) {
        changes.agents = await this.agentService.assertAgentsInOrg(
          orgId,
          changes.agents
        );
      }

      const bot = await this.botModel.findOneAndUpdate(
        { _id: owned._id },
        changes,
        { new: true }
      );

      if (!bot) {
        throw new HttpException("No Bot Found by this Id", 404);
      }
      if (changes.agents) {
        await this.agentService.addBotToAgent(bot._id, changes.agents);
      }
      return bot;
    } catch (error) {
      this.logger.error(`Error in update bot: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async remove(id: string, user?: TenantContext) {
    try {
      if (!mongoose.isValidObjectId(id)) {
        throw new HttpException("No Bot Found by this Id", 404);
      }
      assertOwnership(
        user,
        (await this.botModel.findById(id).select("organizationId")) as any
      );
      // Atomic transition so a double-delete can never release quota twice.
      const bot = await this.botModel.findOneAndUpdate(
        { _id: id, status: { $ne: BotStatusEnum.DELETED } },
        { status: BotStatusEnum.DELETED },
        { new: true }
      );
      if (!bot) {
        return await this.botModel.findById(id);
      }
      // Soft delete frees the quota slot: the bot no longer counts as usage.
      await this.entitlementService.releaseQuota(
        bot.organizationId ? String(bot.organizationId) : null,
        "bot"
      );
      return bot;
    } catch (error) {
      this.logger.error(`Error in delete bot: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  /** Strips keys a client may never set on a bot sub-document. */
  private sanitizeSubDoc(body: any) {
    const clean: Record<string, any> = { ...(body ?? {}) };
    delete clean._id;
    delete clean.botId;
    delete clean.organizationId;
    return sanitizeIncidentSettings(clean);
  }

  async getBotSettingById(id: string, user?: TenantContext) {
    try {
      const bot = await this.assertBotOwnership(id, user);
      const botSetting = await this.botSettingModel.findOne({ botId: bot._id });
      if (!botSetting) {
        throw new HttpException("No Bot setting Found by this Id", 404);
      }
      return botSetting;
    } catch (error) {
      this.logger.error(`Error in get bot setting by id: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async getBotStylesById(id: string, user?: TenantContext) {
    try {
      const bot = await this.assertBotOwnership(id, user);
      const botStyles = await this.botStyleModel.findOne({ botId: bot._id });
      if (!botStyles) {
        throw new HttpException("No Bot Styles Found by this Id", 404);
      }
      return botStyles;
    } catch (error) {
      this.logger.error(`Error in get bot styles by id: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async updateBotSetting(id: string, updateBotSettingDto: any, user?: TenantContext) {
    try {
      const bot = await this.assertBotOwnership(id, user);
      const botSetting = await this.botSettingModel.findOneAndUpdate(
        { botId: bot._id },
        this.sanitizeSubDoc(updateBotSettingDto),
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

  async updateBotStyle(id: string, updateBotStyleDto: any, user?: TenantContext) {
    try {
      const bot = await this.assertBotOwnership(id, user);
      const botStyle = await this.botStyleModel.findOneAndUpdate(
        { botId: bot._id },
        this.sanitizeSubDoc(updateBotStyleDto),
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

  async getBotFlow(id: string, user?: TenantContext) {
    try {
      const bot = await this.assertBotOwnership(id, user);
      const botFlow = await this.botFlowModel.findOne({ botId: bot._id });
      if (!botFlow) {
        throw new HttpException("No Bot Flow Found by this Id", 404);
      }
      return botFlow;
    } catch (error) {
      this.logger.error(`Error in get bot flow by id: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async updateBotFlow(id: string, updateBotFlowDto: UpdateBotFlowDto, user?: TenantContext) {
    try {
      const bot = await this.assertBotOwnership(id, user);
      const botFlow = await this.botFlowModel.findOneAndUpdate(
        { botId: bot._id },
        this.sanitizeSubDoc(updateBotFlowDto),
        { new: true }
      );
      if (!botFlow) {
        throw new HttpException("No Bot Flow Found by this Id", 404);
      }

      await this.createNodes(updateBotFlowDto as any, bot._id);
      return botFlow;
    } catch (error) {
      this.logger.error(`Error in update bot flow: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async updateNode(id: string, updateNodeDto: any, user?: TenantContext) {
    try {
      const { botId } = await this.assertNodeOwnership(id, user);
      const changes = this.sanitizeSubDoc(updateNodeDto);
      delete changes.id;
      const node = await this.botNodeModel.findOneAndUpdate(
        { id },
        { ...changes, botId },
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

  async getBotNodeForApi(id: string, user?: TenantContext) {
    try {
      const { node, botId } = await this.assertNodeOwnership(id, user);
      const tags = await this.tagsService.getTagList(user);

      const botFlow = await this.botFlowModel.findOne({ botId });
      const customAttributes = botFlow?.customAttributes ?? [];

      const embed = {
        attributes: this.configService.get("attributesList"),
        validationList: ValidationInputList,
        customAttributes,
        tags: tags,
      };

      if (node.nodeType === NodeTypeEnum.WEBHOOK) {
        const webhooks = await this.webhookService.getWebhooksListForNode(user);
        embed["webhooks"] = webhooks;
      }
      if (node.nodeType === NodeTypeEnum.TICKET) {
        embed["priorities"] = TicketPriorityEnumList;
      }
      if (
        node.nodeType === NodeTypeEnum.ADD_TO_SEGMENT ||
        node.nodeType === NodeTypeEnum.REMOVE_FROM_SEGMENT
      ) {
        const segments = await this.segmentService.getSegmentsForNode(user);
        embed["segments"] = segments;
      }

      return { node, embed };
    } catch (error) {
      this.logger.error(`Error in get node by id: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  /** Serialises bots (meta, flow, settings, style) into a re-importable file. */
  async exportBots(botIds: string[], user?: TenantContext) {
    if (!Array.isArray(botIds) || botIds.length === 0) {
      throw new HttpException("botIds must be a non-empty array", 400);
    }
    const strip = (doc: any) => {
      if (!doc) return {};
      const { _id, __v, botId, organizationId, createdAt, updatedAt, ...rest } =
        typeof doc.toObject === "function" ? doc.toObject() : doc;
      return rest;
    };
    const bots = [];
    for (const id of botIds) {
      const bot = await this.assertBotOwnership(id, user);
      const [full, flow, setting, style] = await Promise.all([
        this.botModel.findById(bot._id).lean(),
        this.botFlowModel.findOne({ botId: bot._id }).lean(),
        this.botSettingModel.findOne({ botId: bot._id }).lean(),
        this.botStyleModel.findOne({ botId: bot._id }).lean(),
      ]);
      // Export the runtime node documents (which carry payload/responses/
      // keywords) rather than whatever the canvas last saved on the flow.
      const flowNodes: any[] = (flow?.nodes as any[]) ?? [];
      const runtime = await this.botNodeModel
        .find({ id: { $in: flowNodes.map((n: any) => n?.id).filter(Boolean) } })
        .lean();
      const byId = new Map(runtime.map((n: any) => [n.id, n]));
      const nodes = flowNodes.map((n: any) => {
        const rt: any = byId.get(n.id) ?? {};
        const { _id, __v, botId, next, ...rtRest } = rt;
        return { ...n, ...rtRest, data: n.data ?? rtRest.data };
      });
      bots.push({
        name: (full as any)?.name,
        questionBank: (full as any)?.questionBank,
        saveUnansweredQuestions: (full as any)?.saveUnansweredQuestions,
        flow: {
          nodes,
          edges: flow?.edges ?? [],
          customAttributes: flow?.customAttributes ?? [],
        },
        botSetting: strip(setting),
        botStyles: strip(style),
      });
    }
    return { version: 1, exportedAt: new Date().toISOString(), bots };
  }

  /**
   * Imports one or more bots. Accepts:
   *  - an export file `{ bots: [{ name, flow, botSetting, botStyles }] }`
   *  - a single bot `{ name?, flow: { nodes, edges } }`
   *  - a bare flow `{ nodes, edges, customAttributes }`
   * Every bot is created fresh (quota-checked via create()). Node and edge ids
   * are regenerated because BotFlowNode.id is unique across ALL bots.
   */
  async importBots(input: any, fallbackName: string, user?: TenantContext) {
    const entries: any[] = Array.isArray(input?.bots)
      ? input.bots
      : Array.isArray(input)
      ? input
      : input?.flow
      ? [input]
      : Array.isArray(input?.nodes)
      ? [{ name: input.name, flow: input }]
      : [];
    if (!entries.length) {
      throw new HttpException(
        "Unrecognised file: expected an exported bots file or a flow with nodes and edges",
        400
      );
    }
    const imported = [];
    for (const [index, entry] of entries.entries()) {
      const flow = this.remapFlowIds(entry?.flow, index);
      const name =
        (typeof entry?.name === "string" && entry.name.trim()) ||
        (entries.length > 1 ? `${fallbackName} ${index + 1}` : fallbackName);

      const bot = await this.create({ name } as CreateBotDto, user);
      try {
        // Drop the default flow nodes create() generated for this bot.
        await this.botNodeModel.deleteMany({ botId: bot._id });
        await this.createNodes(flow, bot._id);
        await this.botFlowModel.findOneAndUpdate(
          { botId: bot._id },
          {
            nodes: flow.nodes,
            edges: flow.edges,
            customAttributes: flow.customAttributes,
            startNode: flow.startNode,
          }
        );
        if (entry?.botSetting && typeof entry.botSetting === "object") {
          await this.botSettingModel.findOneAndUpdate(
            { botId: bot._id },
            this.sanitizeSubDoc(entry.botSetting)
          );
        }
        if (entry?.botStyles && typeof entry.botStyles === "object") {
          await this.botStyleModel.findOneAndUpdate(
            { botId: bot._id },
            this.sanitizeSubDoc(entry.botStyles)
          );
        }
        const flags: Record<string, boolean> = {};
        if (typeof entry?.questionBank === "boolean") flags.questionBank = entry.questionBank;
        if (typeof entry?.saveUnansweredQuestions === "boolean")
          flags.saveUnansweredQuestions = entry.saveUnansweredQuestions;
        if (Object.keys(flags).length) {
          await this.botModel.updateOne({ _id: bot._id }, flags);
        }
      } catch (error) {
        // Leave nothing half-imported: soft-delete releases the quota slot.
        await this.botNodeModel.deleteMany({ botId: bot._id }).catch(() => undefined);
        await this.remove(String(bot._id), user).catch(() => undefined);
        this.logger.error(`Error importing bot "${name}": ${error.message}`);
        throw new HttpException(
          `Import of "${name}" failed: ${error.message}`,
          error.status || 500
        );
      }
      imported.push({ id: bot._id, name, nodes: flow.nodes.length });
    }
    return { imported };
  }

  /** Validates a flow and gives every node/edge a fresh, globally unique id. */
  private remapFlowIds(flow: any, index: number) {
    const nodes: any[] = Array.isArray(flow?.nodes) ? flow.nodes : [];
    const edges: any[] = Array.isArray(flow?.edges) ? flow.edges : [];
    const where = `bot #${index + 1}`;
    if (!nodes.length) throw new HttpException(`${where}: flow has no nodes`, 400);

    const validTypes = new Set<string>(Object.values(NodeTypeEnum));
    const idMap = new Map<string, string>();
    for (const node of nodes) {
      if (!node?.id || typeof node.id !== "string") {
        throw new HttpException(`${where}: every node needs a string id`, 400);
      }
      if (!validTypes.has(node.nodeType)) {
        throw new HttpException(
          `${where}: node ${node.id} has unknown nodeType "${node.nodeType}"`,
          400
        );
      }
      if (idMap.has(node.id)) {
        throw new HttpException(`${where}: duplicate node id ${node.id}`, 400);
      }
      idMap.set(node.id, generateId("node", 15));
    }
    const starts = nodes.filter((n) => n.nodeType === NodeTypeEnum.START_NODE);
    if (starts.length !== 1) {
      throw new HttpException(`${where}: flow needs exactly one START_NODE`, 400);
    }

    const newNodes = nodes.map((node: any) => {
      const { _id, __v, botId, next, ...rest } = node;
      const payload = { ...(rest.payload ?? {}) };
      if (payload.blockId) {
        if (!idMap.has(payload.blockId)) {
          throw new HttpException(
            `${where}: GO_TO_STEP ${node.id} points to missing node ${payload.blockId}`,
            400
          );
        }
        payload.blockId = idMap.get(payload.blockId);
      }
      return {
        ...rest,
        id: idMap.get(node.id),
        title: rest.title ?? rest.data?.title,
        payload,
        utterance: rest.utterance ?? [],
        keywords: rest.keywords ?? [],
        responses: rest.responses ?? [],
      };
    });
    const newEdges = edges.map((edge: any) => {
      if (!idMap.has(edge?.source) || !idMap.has(edge?.target)) {
        throw new HttpException(
          `${where}: edge ${edge?.id ?? "?"} references a missing node`,
          400
        );
      }
      const { _id, ...rest } = edge;
      return {
        ...rest,
        id: generateId("edge", 15),
        source: idMap.get(edge.source),
        target: idMap.get(edge.target),
      };
    });
    return {
      nodes: newNodes,
      edges: newEdges,
      customAttributes: Array.isArray(flow?.customAttributes) ? flow.customAttributes : [],
      startNode: idMap.get(starts[0].id),
    };
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
  async removeNode(id: string, user?: TenantContext) {
    try {
      await this.assertNodeOwnership(id, user);
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

  /**
   * The org's bot `_id`s, or `null` for a SUPER_ADMIN (no org restriction).
   * Used to scope the conversation/ticket dashboard tiles, which reference a
   * bot but carry no organizationId of their own.
   */
  private async orgBotObjectIds(
    user?: TenantContext,
  ): Promise<mongoose.Types.ObjectId[] | null> {
    if (isCrossOrg(user)) return null;
    const scoped = scopedFilter(user, {});
    const bots = await this.botModel.find(scoped).select("_id").lean();
    return bots.map((b: any) => b._id as mongoose.Types.ObjectId);
  }

  async getTotalCount(user?: TenantContext, days = 30) {
    // Pin the count to the caller's organization (unchanged for SUPER_ADMIN).
    const scoped = scopedFilter(user, {});
    const total = await this.botModel.countDocuments(scoped);

    let percentageChange = 0;

    if (total) {
      const agoCount = await this.botModel.countDocuments({
        ...scoped,
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

  async stats(user?: TenantContext) {
    // Conversations and tickets have no organizationId of their own, so scope
    // them by the bots the org owns.
    const botIds = await this.orgBotObjectIds(user);
    const result = await Promise.all([
      this.getTotalCount(user),
      this.conversationService.getTotalCount(
        30,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        botIds,
      ),
      // Service Requests are org-scoped in the CRM (crm-plugins-service-desk R19.1).
      this.ticketService.getTotalCount(7, user ?? null),
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

  async totalBots(user?: TenantContext) {
    try {
      // Aggregation does not auto-cast; build the org match explicitly and
      // convert the id to an ObjectId when the caller is org-scoped.
      const scoped: Record<string, any> = scopedFilter(user, {});
      if (scoped.organizationId) {
        scoped.organizationId = new mongoose.Types.ObjectId(
          String(scoped.organizationId),
        );
      }
      const result = await this.botModel.aggregate([
        { $match: scoped },
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

  async dayWisePerformance(query: ReportParamsDto, user?: TenantContext) {
    return await this.conversationService.getDayWisePerformance(
      query,
      false,
      await this.orgBotObjectIds(user)
    );
  }

  async dateWiseConversations(query: ReportParamsDto, user?: TenantContext) {
    return await this.conversationService.getDateWiseConversations(
      query,
      false,
      await this.orgBotObjectIds(user)
    );
  }

  async getLanguages() {
    return this.configService.get("languages");
  }
}
