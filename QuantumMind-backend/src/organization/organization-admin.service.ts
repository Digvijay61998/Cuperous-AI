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
import { OrganizationStatus } from './enums/organization-status.enum';
import { OrganizationService } from './organization.service';

/**
 * Orchestrates super-admin console operations across Organization, Agent,
 * Subscription, Plan, Entitlement and Audit services.
 *
 * Deliberately separate from OrganizationService: it depends on AgentService,
 * and OrganizationService is a dependency of EntitlementService — putting the
 * AgentService dependency here avoids an Organization <-> Entitlement <-> Agent
 * dependency cycle. Nothing injects this service, so it is a safe sink.
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

  /**
   * Creates an organization together with its ORG_ADMIN owner and a
   * subscription, in that order. On failure at any step the already-created
   * documents are compensated (deleted) so no partial org is left behind.
   */
  async createOrganization(dto: CreateOrganizationDto, actor: TenantContext) {
    if (dto.features) assertValidFeatureKeys(Object.keys(dto.features));

    const plan = await this.planService.findById(dto.planId);
    if (!plan) throw new BadRequestException('Invalid plan');

    const org = await this.organizationService.create({
      name: dto.name,
      createdBy: actor._id,
    });

    let owner: any;
    try {
      owner = await this.agentService.create(
        {
          name: dto.owner.name,
          email: dto.owner.email,
          password: dto.owner.password,
          role: Role.ORG_ADMIN,
          organizationId: String(org._id),
        } as any,
        actor,
      );
    } catch (error) {
      await this.organizationService.deleteById(String(org._id));
      throw error;
    }

    try {
      await this.organizationService.setOwner(String(org._id), String(owner._id));
      const subscription = await this.subscriptionService.create({
        organizationId: String(org._id),
        planId: dto.planId,
        overrides: { limits: dto.limits as any, features: dto.features },
      });

      await this.auditService.log({
        actorId: actor._id,
        actorRole: actor.role,
        action: 'organization.create',
        targetType: 'Organization',
        targetId: String(org._id),
        organizationId: String(org._id),
        metadata: { name: dto.name, planId: dto.planId },
      });

      return {
        organization: await this.buildMeta(String(org._id)),
        owner: { _id: owner._id, name: owner.name, email: owner.email },
        subscription,
      };
    } catch (error) {
      // Compensate so a failed create leaves nothing behind. Delete the org
      // first: while it exists, the owner-protection hook would block removing
      // the owner.
      await this.organizationService.deleteById(String(org._id));
      await this.agentService.remove(String(owner._id)).catch(() => undefined);
      throw error;
    }
  }

  async listOrganizations() {
    const orgs = await this.organizationService.findAll();
    return Promise.all(orgs.map((o) => this.buildMeta(String(o._id))));
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
      });
    }

    if (dto.planId || dto.limits || dto.features) {
      if (dto.features) assertValidFeatureKeys(Object.keys(dto.features));
      await this.subscriptionService.update(id, {
        planId: dto.planId,
        overrides: { limits: dto.limits as any, features: dto.features },
      });
      await this.auditService.log({
        actorId: actor._id,
        actorRole: actor.role,
        action: 'subscription.update',
        targetType: 'Subscription',
        targetId: id,
        organizationId: id,
        metadata: {
          planId: dto.planId,
          limits: dto.limits,
          features: dto.features,
        },
      });
    }

    return this.buildMeta(id);
  }

  /**
   * Issues an access token scoped to the target org (as its ORG_ADMIN owner) so
   * a super admin can operate the org's dashboard for support. The action is
   * audit-logged with the acting super admin recorded.
   */
  async impersonate(organizationId: string, actor: TenantContext) {
    const org = await this.organizationService.findById(organizationId);
    if (!org) throw new NotFoundException('Organization not found');
    if (!org.ownerId) {
      throw new BadRequestException('Organization has no owner to act as');
    }

    const owner = await this.agentService.findOne(String(org.ownerId));
    if (!owner) throw new NotFoundException('Organization owner not found');

    const accessToken = await this.tokenService.sign(
      {
        sub: owner._id,
        _id: owner._id,
        role: Role.ORG_ADMIN,
        email: owner.email,
        organizationId: String(organizationId),
        impersonatedBy: actor._id,
      },
      { expiresIn: '1h' },
    );

    await this.auditService.log({
      actorId: actor._id,
      actorRole: actor.role,
      action: 'organization.impersonate',
      targetType: 'Organization',
      targetId: String(organizationId),
      organizationId: String(organizationId),
      metadata: { ownerId: String(org.ownerId) },
    });

    return { accessToken, organizationId: String(organizationId) };
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
      activeSubscriptions,
    };
  }

  /** Operational metadata only — never conversation content. */
  private async buildMeta(organizationId: string) {
    const org = await this.organizationService.findById(organizationId);
    if (!org) return null;

    const [subscription, effective, roleCounts] = await Promise.all([
      this.subscriptionService.findByOrg(organizationId),
      this.entitlementService.getEffective(organizationId),
      this.agentService.countsByOrganization(organizationId),
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
      plan: plan?.name ?? null,
      subscriptionStatus: subscription?.status ?? null,
      limits: effective?.limits ?? null,
      features: effective?.features ?? null,
      usage: {
        bots: org.botCount,
        agents: org.agentCount,
        templates: org.templateCount,
      },
      counts: {
        orgManagers: roleCounts[Role.ORG_MANAGER] ?? 0,
        agents: roleCounts[Role.AGENT] ?? 0,
      },
      createdAt: (org as any).createdAt,
    };
  }
}
