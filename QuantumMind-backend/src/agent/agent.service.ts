import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
  Optional,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcryptjs";
import { TicketsService } from "src/tickets/tickets.service";
import { AGENT_PROVIDER } from "src/constants";
import { CreateAgentDto } from "./dto/create-agent.dto";
import { UpdateAgentDto } from "./dto/update-agent.dto";
import { AgentDocument } from "./entities/agent.entity";

import mongoose, { Model } from "mongoose";

import { AgentQueryParams } from "./agent-query.params";

import { Role, ROLE_LEVEL } from "src/common/enums/role.enum";
import {
  assertOwnership,
  scopedFilter,
  TenantContext,
} from "src/common/tenant/tenant-context";
import { EntitlementService } from "src/billing/entitlement.service";
import { OrganizationService } from "src/organization/organization.service";
import { BotDocument } from "src/bots/entities";
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
    // Fresh-start bootstrap: seed exactly one SUPER_ADMIN (the platform owner),
    // org-independent (organizationId = null). Idempotent — a restart with the
    // account already present is a no-op. No organization is auto-created;
    // organizations are provisioned by the SUPER_ADMIN (Phase 5).
    const email = String(this.configService.get("admin.email") ?? "")
      .trim()
      .toLowerCase();
    const name = this.configService.get("admin.name");
    const admin = await this.agentModel.findOne({ email });
    if (admin && admin.role !== Role.SUPER_ADMIN) {
      // Never silently promote/demote an existing account; flag it loudly.
      this.logger.error(
        `Configured admin email ${email} belongs to a non-super-admin account (${admin.role}); super admin NOT seeded`
      );
      return;
    }
    if (!admin) {
      const originalPassword = this.configService.get("admin.password");
      const superAdmin = new this.agentModel({
        name,
        email,
        password: await this.encryptPassword(originalPassword),
        role: Role.SUPER_ADMIN,
        organizationId: null,
      });

      try {
        await superAdmin.save();
      } catch (error) {
        // Another instance (e.g. a parallel Lambda cold start) seeded it first.
        if (error?.code === 11000) return;
        throw error;
      }
      // Never log the password.
      this.logger.log(`Super admin seeded with email ${superAdmin.email}`);
      return;
    }
    this.logger.debug("Super admin credentials are already present");
  }

  constructor(
    @Inject(AGENT_PROVIDER)
    private readonly agentModel: Model<AgentDocument>,
    private readonly configService: ConfigService,

    private readonly conversationService: ConversationService,
    private readonly entitlementService: EntitlementService,
    private readonly organizationService: OrganizationService,
    // The agent page lists the requests they own (crm-plugins-service-desk R13.5).
    @Optional() private readonly tickets?: TicketsService
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
    const agent = await this.agentModel.findOne({
      email: String(email ?? "").trim().toLowerCase(),
    });
    if (agent) {
      const isMatch = await this.comparePassword(password, agent.password);
      if (isMatch) {
        // Checked only AFTER the password matches so these states cannot be
        // used to enumerate accounts.
        if (agent.active === false) {
          throw new ForbiddenException("Your account has been deactivated");
        }
        if (
          agent.organizationId &&
          (await this.organizationService.isSuspended(
            String(agent.organizationId)
          ))
        ) {
          throw new ForbiddenException("Your organization has been suspended");
        }
        agent.lastLogin = new Date();
        await agent.save();
        return agent;
      }
    }
    return null;
  }

  /**
   * Loads a user by id and asserts the caller may act on it (same org, or
   * SUPER_ADMIN). Cross-org and missing ids both yield 404 (no existence leak).
   */
  private async loadOwnedAgent(
    agentId: string,
    actor?: TenantContext
  ): Promise<AgentDocument> {
    if (!mongoose.isValidObjectId(agentId)) {
      throw new NotFoundException("Agent not found");
    }
    const agent = await this.agentModel.findById(agentId);
    if (!agent) throw new NotFoundException("Agent not found");
    if (actor) assertOwnership(actor, agent as any);
    return agent;
  }

  /**
   * Only ids of bots inside `organizationId` survive. Used so a client cannot
   * assign another tenant's bot to a user (or vice versa).
   */
  private async filterOrgBots(
    organizationId: string | null,
    botIds: any[] | undefined
  ): Promise<string[]> {
    const ids = (botIds ?? [])
      .map((b) => String(b?._id ?? b))
      .filter((b) => mongoose.isValidObjectId(b));
    if (!ids.length) return [];
    const Bot = mongoose.model<BotDocument>("Bot");
    const bots = await Bot.find({
      _id: { $in: ids },
      organizationId: organizationId ?? null,
    })
      .select("_id")
      .lean();
    return bots.map((b: any) => String(b._id));
  }

  /** Throws 404 unless every id is a user in `organizationId`. */
  async assertAgentsInOrg(
    organizationId: string | null,
    agentIds: any[] | undefined
  ): Promise<string[]> {
    const ids = [...new Set((agentIds ?? []).map((a) => String(a?._id ?? a)))];
    if (!ids.length) return [];
    if (ids.some((id) => !mongoose.isValidObjectId(id))) {
      throw new NotFoundException("Agent not found");
    }
    const count = await this.agentModel.countDocuments({
      _id: { $in: ids },
      organizationId: organizationId ?? null,
    });
    if (count !== ids.length) throw new NotFoundException("Agent not found");
    return ids;
  }

  /**
   * Resolves the role and organization for a new user under delegated
   * administration. The requested role and organization are validated against
   * the creator's role; client-supplied values are never trusted for escalation
   * or cross-org placement.
   *
   *  - SUPER_ADMIN may create an ORG_ADMIN only, into an explicit target org.
   *  - ORG_ADMIN / ORG_MANAGER may create strictly-lower roles, always pinned
   *    to their own organization.
   *  - AGENT may not create anyone.
   */
  private resolveCreation(
    actor: TenantContext | undefined,
    requestedRole: Role,
    targetOrgId?: string
  ): { role: Role; organizationId: string | null } {
    if (!actor?.role) {
      throw new ForbiddenException("Authentication required");
    }

    if (actor.role === Role.SUPER_ADMIN) {
      if (requestedRole !== Role.ORG_ADMIN) {
        throw new ForbiddenException(
          "A super admin can only create organization admins"
        );
      }
      if (!targetOrgId) {
        throw new BadRequestException(
          "organizationId is required when creating an organization admin"
        );
      }
      return { role: Role.ORG_ADMIN, organizationId: String(targetOrgId) };
    }

    if (!actor.organizationId) {
      throw new ForbiddenException(
        "You are not associated with an organization"
      );
    }
    // Delegated rule: you may only create roles strictly below your own.
    if (ROLE_LEVEL[actor.role] <= ROLE_LEVEL[requestedRole]) {
      throw new ForbiddenException(
        `You do not have permission to create a user with role '${requestedRole}'`
      );
    }
    // New user is always pinned to the creator's organization.
    return { role: requestedRole, organizationId: actor.organizationId };
  }

  async create(createAgentDto: CreateAgentDto, actor?: TenantContext) {
    this.logger.log(
      `Creating Agent with name ${createAgentDto.name} and email ${createAgentDto.email}`
    );
    try {
      const requestedRole = createAgentDto.role ?? Role.AGENT;
      const { role, organizationId } = this.resolveCreation(
        actor,
        requestedRole,
        createAgentDto.organizationId
      );

      if (organizationId) {
        const org = await this.organizationService.findById(organizationId);
        if (!org) throw new BadRequestException("Organization not found");
        if (actor?.role !== Role.SUPER_ADMIN) {
          await this.organizationService.assertActive(organizationId);
        }
      }

      const email = String(createAgentDto.email ?? "").trim().toLowerCase();
      if (await this.agentModel.exists({ email })) {
        throw new ConflictException("A user with this email already exists");
      }

      // The org owner (SUPER_ADMIN provisioning an ORG_ADMIN) does not consume
      // the org's agent quota; org-scoped user creation does.
      const consumesQuota = actor?.role !== Role.SUPER_ADMIN;
      if (consumesQuota) {
        await this.entitlementService.reserveQuota(organizationId, "agent");
      }

      try {
        const password = await this.encryptPassword(createAgentDto.password);
        const assignedBots = await this.filterOrgBots(
          organizationId,
          createAgentDto.assignedBots as any
        );

        const agent = await this.agentModel.create({
          ...createAgentDto,
          email: String(createAgentDto.email).trim().toLowerCase(),
          // Server-derived; overrides anything the client sent.
          role,
          organizationId,
          password,
          assignedBots,
        });
        this.logger.log(`Agent created with name ${agent.name}`);
        return agent;
      } catch (error) {
        if (consumesQuota) {
          await this.entitlementService.releaseQuota(organizationId, "agent");
        }
        // Concurrent create with the same email loses the unique-index race.
        if (error?.code === 11000) {
          throw new ConflictException("A user with this email already exists");
        }
        throw error;
      }
    } catch (error) {
      this.logger.error(`Error while creating Agent: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  /** Role -> count for one organization. Used by the super-admin console. */
  async countsByOrganization(
    organizationId: string
  ): Promise<Record<string, number>> {
    const rows = await this.agentModel.aggregate([
      {
        $match: {
          organizationId: new mongoose.Types.ObjectId(String(organizationId)),
        },
      },
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]);
    return rows.reduce((acc: Record<string, number>, r: any) => {
      acc[r._id] = r.count;
      return acc;
    }, {});
  }

  /** Name/email of an org owner for the console (never password/other data). */
  async ownerSummary(
    ownerId: string
  ): Promise<{ _id: string; name: string; email: string } | null> {
    if (!mongoose.isValidObjectId(ownerId)) return null;
    const a: any = await this.agentModel
      .findById(ownerId)
      .select("name email")
      .lean();
    return a ? { _id: String(a._id), name: a.name, email: a.email } : null;
  }

  /** Role -> count across the whole platform. Used by the global overview. */
  async globalRoleCounts(): Promise<Record<string, number>> {
    const rows = await this.agentModel.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]);
    return rows.reduce((acc: Record<string, number>, r: any) => {
      acc[r._id] = r.count;
      return acc;
    }, {});
  }

  async agentList(user?: JwtPayload) {
    // Aggregation does not auto-cast; convert the org id to an ObjectId when
    // the caller is org-scoped.
    const scoped: Record<string, any> = scopedFilter(user, {});
    if (scoped.organizationId) {
      scoped.organizationId = new mongoose.Types.ObjectId(
        String(scoped.organizationId),
      );
    }
    return await this.agentModel.aggregate([
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

  /**
   * Deletes a user.
   *
   * With an `actor` (HTTP path) the delegated rule applies: same org only, the
   * actor must strictly outrank the target, and nobody deletes themselves.
   * Without an actor (internal compensation in the org-create flow) the checks
   * are skipped. The quota slot is released after a successful delete.
   */
  async remove(agentId: string, actor?: TenantContext) {
    this.logger.log(`Removing Agent with id ${agentId}`);
    try {
      const agent = await this.loadOwnedAgent(agentId, actor);

      if (actor) {
        if (String(agent._id) === String(actor._id)) {
          throw new ForbiddenException("You cannot delete your own account");
        }
        if (ROLE_LEVEL[actor.role] <= ROLE_LEVEL[agent.role]) {
          throw new ForbiddenException(
            "You do not have permission to delete this user"
          );
        }
      }

      await agent.remove();

      // Org owners are provisioned by the super admin and never consumed quota
      // (see create); every other org user did.
      if (agent.organizationId && agent.role !== Role.ORG_ADMIN) {
        await this.entitlementService.releaseQuota(
          String(agent.organizationId),
          "agent"
        );
      }
    } catch (error) {
      this.logger.error(`Error while removing Agent: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  /**
   * Updates a user under the delegated-administration rule:
   *  - same org only (404 otherwise);
   *  - editing yourself is allowed for profile fields, but you can never change
   *    your own role or `active` flag;
   *  - editing someone else requires strictly outranking them;
   *  - a role change must stay strictly below the actor's own level, and the
   *    org owner's role can never be changed;
   *  - `organizationId` is never writable (stripped by the DTO + here).
   */
  async update(
    agentId: string,
    updateAgentDto: UpdateAgentDto,
    actor?: TenantContext
  ) {
    this.logger.log(`Updating Agent with id ${agentId}`);
    try {
      const agent = await this.loadOwnedAgent(agentId, actor);
      const changes: Record<string, any> = { ...updateAgentDto };
      delete changes.organizationId;
      delete changes._id;

      if (actor) {
        const isSelf = String(agent._id) === String(actor._id);
        if (isSelf) {
          if (changes.role !== undefined && changes.role !== agent.role) {
            throw new ForbiddenException("You cannot change your own role");
          }
          if (changes.active !== undefined && changes.active !== agent.active) {
            throw new ForbiddenException(
              "You cannot change your own active status"
            );
          }
          delete changes.role;
          delete changes.active;
          // Staff-controlled routing fields: an agent cannot widen their own
          // bot access or change their own capacity/tags.
          if (actor.role === Role.AGENT) {
            delete changes.assignedBots;
            delete changes.tags;
            delete (changes as any).maxConcurrentChats;
          }
        } else if (ROLE_LEVEL[actor.role] <= ROLE_LEVEL[agent.role]) {
          throw new ForbiddenException(
            "You do not have permission to edit this user"
          );
        }

        if (changes.role !== undefined && changes.role !== agent.role) {
          if (ROLE_LEVEL[actor.role] <= ROLE_LEVEL[changes.role as Role]) {
            throw new ForbiddenException(
              `You do not have permission to assign role '${changes.role}'`
            );
          }
          const Organization = mongoose.model("Organization");
          const owns = await Organization.exists({ ownerId: agent._id });
          if (owns) {
            throw new ForbiddenException(
              "The organization owner's role cannot be changed"
            );
          }
        }
      } else {
        delete changes.role;
      }

      if (changes.email) {
        changes.email = String(changes.email).trim().toLowerCase();
      }
      if (changes.assignedBots) {
        changes.assignedBots = await this.filterOrgBots(
          agent.organizationId ? String(agent.organizationId) : null,
          changes.assignedBots
        );
      }
      if (changes.password) {
        changes.password = await this.encryptPassword(changes.password);
      }

      await agent.updateOne(changes);
      return {
        message: "Agent updated successfully",
      };
    } catch (error) {
      this.logger.error(`Error while updating Agent: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async findAll(query: AgentQueryParams, user?: JwtPayload) {
    try {
      const {
        skip: documentsToSkip,
        limit: limitOfDocuments,
        tags,
        status,
        bot,
      } = query;

      const queryObject: Record<string, any> = {};
      if (status) queryObject["status"] = status;
      if (tags) queryObject["tags"] = { $in: tags };
      if (bot) queryObject["assignedBots"] = { $in: [bot] };
      const scoped = scopedFilter(user, queryObject);
      const agents = this.agentModel
        .find(scoped)
        .populate("assignedBots", "name")
        .populate("tags", "name")
        .sort({ createdAt: -1 })
        .skip(documentsToSkip);
      if (limitOfDocuments) {
        agents.limit(limitOfDocuments);
      }
      const data = await agents;
      const count = await this.agentModel.countDocuments(scoped);
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
  /** Org admins/managers of the bot's organization (no agents). */
  async findOrgAdminIds(botId: string): Promise<string[]> {
    try {
      const Bot = mongoose.model<BotDocument>("Bot");
      const bot = mongoose.isValidObjectId(botId)
        ? await Bot.findById(botId).select("organizationId").lean()
        : null;
      const orgId = (bot as any)?.organizationId ?? null;
      if (!orgId) return [];
      const admins = await this.agentModel
        .find({
          role: { $in: [Role.ORG_ADMIN, Role.ORG_MANAGER] },
          organizationId: orgId,
          active: true,
        })
        .select("_id");
      return admins.map((a) => (a._id as any).toString());
    } catch (error) {
      this.logger.error(
        `Failed to resolve org admins for bot ${botId}: ${error.message}`
      );
      return [];
    }
  }

  async findInboxRecipientIds(botId: string): Promise<string[]> {
    try {
      // Tenant boundary: org admins/managers only receive fan-out for bots in
      // THEIR organization. Without this, every org admin on the platform got
      // every tenant's inbound messages over the socket.
      const Bot = mongoose.model<BotDocument>("Bot");
      const bot = mongoose.isValidObjectId(botId)
        ? await Bot.findById(botId).select("organizationId").lean()
        : null;
      const orgId = (bot as any)?.organizationId ?? null;

      const or: Record<string, any>[] = [
        { assignedBots: { $in: [botId] }, organizationId: orgId },
      ];
      if (orgId) {
        or.push({
          role: { $in: [Role.ORG_ADMIN, Role.ORG_MANAGER] },
          organizationId: orgId,
        });
      }
      const agents = await this.agentModel
        .find({ $or: or, active: true })
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

  /**
   * Full user profile. With an `actor`, cross-org ids return 404, and an AGENT
   * may only read their own profile. Without an actor it is an internal lookup
   * (used by the inbox scope resolver).
   */
  async findOne(agentId: string, actor?: TenantContext) {
    try {
      if (actor) {
        await this.loadOwnedAgent(agentId, actor);
        if (
          actor.role === Role.AGENT &&
          String(agentId) !== String(actor._id)
        ) {
          throw new NotFoundException("Agent not found");
        }
      }
      const query = this.agentModel
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
        });
      // Internal callers get the document as before; the agent page (an
      // actor) also gets the requests this agent owns, from the CRM (R19.1).
      if (!actor || !this.tickets) return await query;
      const agent: any = await query;
      if (!agent) return agent;
      const plain = agent.toObject ? agent.toObject({ virtuals: true }) : agent;
      plain.serviceRequests = await this.tickets.listFor(
        { assigneeId: String(agentId) },
        plain.organizationId ? String(plain.organizationId) : null,
      );
      return plain;
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
          active: { $ne: false },
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

  /**
   * Adds `botId` to each agent's assignedBots. Only agents in the bot's own
   * organization are touched; ids from another tenant are silently ignored so a
   * bot can never be attached to a foreign user.
   */
  async addBotToAgent(botId: any, agents: string[]) {
    try {
      const Bot = mongoose.model<BotDocument>("Bot");
      const bot = await Bot.findById(botId).select("organizationId").lean();
      const orgId = (bot as any)?.organizationId ?? null;
      const validIds = (agents ?? []).filter((a) =>
        mongoose.isValidObjectId(a)
      );
      await Promise.all(
        validIds.map(async (agentId: any) => {
          const agent = await this.agentModel.findOne({
            _id: new mongoose.Types.ObjectId(agentId),
            organizationId: orgId,
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
        // Report the role/org the TOKEN carries: under impersonation the super
        // admin acts as ORG_ADMIN of the target org, and the UI must render that
        // context (not the stored account's).
        role: user.role ?? agentData.role,
        organizationId:
          user.organizationId ??
          (agentData.organizationId ? String(agentData.organizationId) : null),
        impersonatedBy: (user as any).impersonatedBy ?? null,
        notificationPrefs: {
          handoverSound: agentData.notificationPrefs?.handoverSound !== false,
          messageSound: agentData.notificationPrefs?.messageSound !== false,
        },
      };
    } catch (error) {
      this.logger.error(`Error while finding Agent: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  /** Update the caller's own sound preferences only. */
  async updateNotificationPrefs(
    user: JwtPayload,
    prefs: { handoverSound?: boolean; messageSound?: boolean }
  ) {
    const $set: Record<string, boolean> = {};
    if (typeof prefs.handoverSound === "boolean")
      $set["notificationPrefs.handoverSound"] = prefs.handoverSound;
    if (typeof prefs.messageSound === "boolean")
      $set["notificationPrefs.messageSound"] = prefs.messageSound;
    const updated = await this.agentModel
      .findOneAndUpdate({ _id: user._id }, Object.keys($set).length ? { $set } : {}, {
        new: true,
      })
      .select("notificationPrefs");
    if (!updated) throw new HttpException("Agent not found", 404);
    return {
      handoverSound: updated.notificationPrefs?.handoverSound !== false,
      messageSound: updated.notificationPrefs?.messageSound !== false,
    };
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

  async getTotalCount(user?: TenantContext, days = 30) {
    const scoped = scopedFilter(user, {});
    const total = await this.agentModel.countDocuments(scoped);
    let percentageChange = 0;

    if (total) {
      const agoCount = await this.agentModel.countDocuments({
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
      title: "Total Agents",
      subtitle: getDaySubtitle(days),
      type: "main",
    };
  }

  async getOnlineAgentsCount(days = 1, user?: TenantContext) {
    const total = await this.agentModel.countDocuments(
      scopedFilter(user, {
        status: AgentStatusEnum.ONLINE,
      })
    );
    let percentageChange = 0;
    if (total) {
      const agoCount = await this.agentModel.countDocuments(
        scopedFilter(user, {
          status: AgentStatusEnum.ONLINE,
          lastSeen: {
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
      title: "Online Agents",
      subtitle: getDaySubtitle(days),
      type: "online_agent",
    };
  }

  async getActiveAgentsCount(days = 30, user?: TenantContext) {
    const total = await this.agentModel.countDocuments(
      scopedFilter(user, {
        active: true,
      })
    );
    let percentageChange = 0;
    if (total) {
      const agoCount = await this.agentModel.countDocuments(
        scopedFilter(user, {
          active: true,
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
      title: "Active Agents",
      subtitle: getDaySubtitle(days),
      type: "active_agent",
    };
  }

  async getStats(user?: TenantContext) {
    try {
      const result = await Promise.all([
        this.getTotalCount(user),
        this.getOnlineAgentsCount(1, user),
        this.getActiveAgentsCount(30, user),
      ]);
      return result;
    } catch (error) {
      this.logger.error(`Error while getting stats: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async getTotalAgent(user?: TenantContext) {
    try {
      // Aggregation does not auto-cast; build the org match explicitly and
      // convert the id to an ObjectId when the caller is org-scoped.
      const scoped: Record<string, any> = scopedFilter(user, {});
      if (scoped.organizationId) {
        scoped.organizationId = new mongoose.Types.ObjectId(
          String(scoped.organizationId)
        );
      }
      const response = await this.agentModel.aggregate([
        { $match: scoped },
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

  async dayWisePerformance(query: ReportParamsDto, user?: TenantContext) {
    query.agentId = query.id;
    delete query.id;
    return await this.conversationService.getDayWisePerformance(
      query,
      true,
      await this.conversationService.reportScope(user)
    );
  }

  async dateWiseConversations(query: ReportParamsDto, user?: TenantContext) {
    query.agentId = query.id;
    delete query.id;
    return await this.conversationService.getDateWiseConversations(
      query,
      true,
      await this.conversationService.reportScope(user)
    );
  }

  // `ticket.assigned.agent` (Agent.serviceRequests[]) is gone: Service
  // Requests live in the CRM and are counted there by assignee
  // (crm-plugins-service-desk R13.5).

  async welcomeToAgent(agentId: any) {
    try {
      const agent = await this.agentModel.findOne({
        _id: agentId,
      });
      if (!agent) {
        throw new HttpException("Not found", 404);
      }
      const requestHandled = this.tickets
        ? await this.tickets.countForAssignee(String(agentId), agent.organizationId ? String(agent.organizationId) : null)
        : 0;

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
