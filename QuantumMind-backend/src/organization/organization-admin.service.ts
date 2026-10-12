import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AgentService } from 'src/agent/agent.service';
import { TokenService } from 'src/token/token.service';
import { AuditService } from 'src/audit/audit.service';
import { EntitlementService } from 'src/billing/entitlement.service';
import { PlanService } from 'src/billing/plan.service';
import { SubscriptionService } from 'src/billing/subscription.service';
import { Role } from 'src/common/enums/role.enum';
import { TenantContext } from 'src/common/tenant/tenant-context';
import { assertValidFeatureKeys } from 'src/common/constants/feature-catalog';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { assertBooleanMap, pickLimits } from './dto/limits.dto';
import { OrganizationStatus } from './enums/organization-status.enum';
import { OrganizationService } from './organization.service';

/** Impersonation tokens are short-lived and never come with a refresh token. */
const IMPERSONATION_TTL = '1h';

/**
 * Orchestrates super-admin console operations across Organization, Agent,
 * Subscription, Plan, Entitlement and Audit services.
 *
 * Deliberately separate from OrganizationService: it depends on AgentService,
 * and OrganizationService is a dependency of EntitlementService — putting the
 * AgentService dependency here avoids an Organization <-> Entitlement <-> Agent
 * dependency cycle. Nothing injects this service, so it is a safe sink.
 *
 * Every response is operational METADATA only (Req 6.6): no conversation,
 * visitor or message content is ever read here.
 */
@Injectable()
export class OrganizationAdminService {
  private readonly logger = new Logger(OrganizationAdminService.name);

  constructor(
    private readonly organizationService: OrganizationService,
    private readonly agentService: AgentService,
    private readonly subscriptionService: SubscriptionService,
    private readonly planService: PlanService,
    private readonly entitlementService: EntitlementService,
    private readonly auditService: AuditService,
    private readonly tokenService: TokenService,
  ) {}

  /** Validates feature overrides: catalog keys only, boolean values only. */
  private validateFeatures(features?: Record<string, unknown>) {
    if (!features) return;
    try {
      assertValidFeatureKeys(Object.keys(features));
      assertBooleanMap(features);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Creates an organization together with its ORG_ADMIN owner and a
   * subscription. All inputs are validated BEFORE anything is written; on a
   * failure at any later step the already-created documents are compensated
   * (deleted) so no partial org is left behind.
   */
  async createOrganization(dto: CreateOrganizationDto, actor: TenantContext) {
    this.validateFeatures(dto.features);

    const plan = await this.planService.findById(dto.planId);
    if (!plan) throw new BadRequestException('Invalid plan');

    const org = await this.organizationService.create({
      name: dto.name,
      createdBy: actor._id,
    });
    const orgId = String(org._id);

    let owner: any;
    try {
      owner = await this.agentService.create(
        {
          name: dto.owner.name,
          email: dto.owner.email,
          password: dto.owner.password,
          role: Role.ORG_ADMIN,
          organizationId: orgId,
        } as any,
        actor,
      );
    } catch (error) {
      await this.organizationService.deleteById(orgId);
      throw error;
    }

    try {
      await this.organizationService.setOwner(orgId, String(owner._id));
      const subscription = await this.subscriptionService.create({
        organizationId: orgId,
        planId: dto.planId,
        overrides: { limits: pickLimits(dto.limits), features: dto.features },
      });

      await this.auditService.log({
        actorId: actor._id,
        actorRole: actor.role,
        action: 'organization.create',
        targetType: 'Organization',
        targetId: orgId,
        organizationId: orgId,
        metadata: {
          name: dto.name,
          planId: dto.planId,
          ownerEmail: owner.email,
          limits: pickLimits(dto.limits),
          features: dto.features,
        },
      });

      return {
        organization: await this.buildMeta(orgId),
        owner: { _id: owner._id, name: owner.name, email: owner.email },
        subscription,
      };
    } catch (error) {
      // Compensate. Delete the org first: while it exists, the owner-protection
      // hook would block removing the owner.
      await this.organizationService.deleteById(orgId);
      await this.agentService.remove(String(owner._id)).catch(() => undefined);
      throw error;
    }
  }

  async listOrganizations() {
    const orgs = await this.organizationService.findAll();
    const metas = await Promise.all(
      orgs.map((o) => this.buildMeta(String(o._id))),
    );
    return metas.filter(Boolean);
  }

  async getOrganization(id: string) {
    const meta = await this.buildMeta(id);
    if (!meta) throw new NotFoundException('Organization not found');
    return meta;
  }

  async updateOrganization(
    id: string,
    dto: UpdateOrganizationDto,
    actor: TenantContext,
  ) {
    const org = await this.organizationService.findById(id);
    if (!org) throw new NotFoundException('Organization not found');

    // Validate everything up front so a bad field cannot leave a half-applied
    // update (e.g. status changed but features rejected).
    this.validateFeatures(dto.features);
    if (dto.planId && !(await this.planService.findById(dto.planId))) {
      throw new BadRequestException('Invalid plan');
    }

    if (dto.name && dto.name.trim() && dto.name.trim() !== org.name) {
      org.name = dto.name.trim();
      await org.save();
      await this.auditService.log({
        actorId: actor._id,
        actorRole: actor.role,
        action: 'organization.rename',
        targetType: 'Organization',
        targetId: id,
        organizationId: id,
        metadata: { name: org.name },
      });
    }

    if (dto.status && dto.status !== org.status) {
      await this.organizationService.setStatus(id, dto.status);
      await this.auditService.log({
        actorId: actor._id,
        actorRole: actor.role,
        action:
          dto.status === OrganizationStatus.SUSPENDED
            ? 'organization.suspend'
            : 'organization.reactivate',
        targetType: 'Organization',
        targetId: id,
        organizationId: id,
        metadata: { from: org.status, to: dto.status },
      });
    }

    const limits = pickLimits(dto.limits);
    const hasLimits = !!limits && Object.keys(limits).length > 0;
    if (dto.planId || hasLimits || dto.features || dto.subscriptionStatus) {
      const before = await this.subscriptionService.findByOrg(id);
      if (!before) {
        throw new BadRequestException(
          'Organization has no subscription; attach a plan first',
        );
      }
      await this.subscriptionService.update(id, {
        planId: dto.planId,
        status: dto.subscriptionStatus,
        overrides:
          hasLimits || dto.features
            ? { limits: hasLimits ? limits : undefined, features: dto.features }
            : undefined,
      });
      await this.auditService.log({
        actorId: actor._id,
        actorRole: actor.role,
        action: 'subscription.update',
        targetType: 'Subscription',
        targetId: id,
        organizationId: id,
        metadata: {
          before: {
            planId: String(before.planId),
            status: before.status,
            overrides: before.overrides,
          },
          planId: dto.planId,
          status: dto.subscriptionStatus,
          limits: hasLimits ? limits : undefined,
          features: dto.features,
        },
      });
    }

    return this.buildMeta(id);
  }

  /**
   * Issues a short-lived access token scoped to the target org (acting as its
   * ORG_ADMIN owner, with `impersonatedBy` set) so a super admin can operate
   * the org's dashboard for support. No refresh token is issued, so the session
   * ends when the token expires. Always audit-logged. Refused for a suspended
   * org (the token would be rejected by the guards anyway).
   */
  async impersonate(organizationId: string, actor: TenantContext) {
    const org = await this.organizationService.findById(organizationId);
    if (!org) throw new NotFoundException('Organization not found');
    if (org.status === OrganizationStatus.SUSPENDED) {
      throw new BadRequestException(
        'Reactivate the organization before managing it',
      );
    }
    if (!org.ownerId) {
      throw new BadRequestException('Organization has no owner to act as');
    }

    const owner = await this.agentService.findOne(String(org.ownerId));
    if (!owner) throw new NotFoundException('Organization owner not found');

    const accessToken = await this.tokenService.sign(
      {
        sub: String(owner._id),
        _id: String(owner._id),
        role: Role.ORG_ADMIN,
        email: owner.email,
        organizationId: String(organizationId),
        impersonatedBy: String(actor._id),
      },
      { expiresIn: IMPERSONATION_TTL },
    );

    await this.auditService.log({
      actorId: actor._id,
      actorRole: actor.role,
      action: 'organization.impersonate',
      targetType: 'Organization',
      targetId: String(organizationId),
      organizationId: String(organizationId),
      metadata: { ownerId: String(org.ownerId), expiresIn: IMPERSONATION_TTL },
    });

    return {
      accessToken,
      organizationId: String(organizationId),
      expiresIn: IMPERSONATION_TTL,
    };
  }

  /** Recomputes the usage counters of one org from the source collections. */
  async reconcile(organizationId: string, actor: TenantContext) {
    const org = await this.organizationService.findById(organizationId);
    if (!org) throw new NotFoundException('Organization not found');
    const counters = await this.organizationService.reconcileCounters(
      organizationId,
    );
    await this.auditService.log({
      actorId: actor._id,
      actorRole: actor.role,
      action: 'organization.reconcile',
      targetType: 'Organization',
      targetId: organizationId,
      organizationId,
      metadata: {
        before: {
          botCount: org.botCount,
          agentCount: org.agentCount,
          platformCount: (org as any).platformCount ?? 0,
        },
        after: counters,
      },
    });
    return this.buildMeta(organizationId);
  }

  async overview() {
    const [organizations, roleCounts, counters, activeSubscriptions] =
      await Promise.all([
        this.organizationService.count(),
        this.agentService.globalRoleCounts(),
        this.organizationService.sumCounters(),
        this.subscriptionService.countActive(),
      ]);

    return {
      organizations,
      orgAdmins: roleCounts[Role.ORG_ADMIN] ?? 0,
      orgManagers: roleCounts[Role.ORG_MANAGER] ?? 0,
      agents: roleCounts[Role.AGENT] ?? 0,
      bots: counters.bots,
      platforms: counters.platforms,
      activeSubscriptions,
    };
  }

  /** Operational metadata only — never conversation content. */
  private async buildMeta(organizationId: string) {
    const org = await this.organizationService.findById(organizationId);
    if (!org) return null;

    const [subscription, effective, roleCounts, owner] = await Promise.all([
      this.subscriptionService.findByOrg(organizationId),
      this.entitlementService.getEffective(organizationId),
      this.agentService.countsByOrganization(organizationId),
      org.ownerId
        ? this.agentService.ownerSummary(String(org.ownerId))
        : Promise.resolve(null),
    ]);

    const plan = subscription
      ? await this.planService.findById(String(subscription.planId))
      : null;

    return {
      id: String(org._id),
      name: org.name,
      slug: org.slug,
      status: org.status,
      ownerId: org.ownerId ? String(org.ownerId) : null,
      owner,
      planId: plan ? String(plan._id) : null,
      plan: plan?.name ?? null,
      subscriptionStatus: subscription?.status ?? null,
      limits: effective?.limits ?? null,
      features: effective?.features ?? null,
      overrides: subscription?.overrides ?? null,
      usage: {
        bots: org.botCount,
        agents: org.agentCount,
        templates: org.templateCount,
        platforms: (org as any).platformCount ?? 0,
      },
      counts: {
        orgManagers: roleCounts[Role.ORG_MANAGER] ?? 0,
        agents: roleCounts[Role.AGENT] ?? 0,
      },
      createdAt: (org as any).createdAt,
    };
  }
}
