import { Controller, Get } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { JwtPayload } from 'src/auth/strategy/jwt.strategy';
import { CurrentUser } from 'src/util/current-user.decorator';
import { EntitlementService } from 'src/billing/entitlement.service';
import { OrganizationService } from 'src/organization/organization.service';
import { tabsForRole } from 'src/common/constants/role-tabs';

/**
 * The single payload the dashboard gates on: which tabs the user may see, and
 * (for org users) the org's effective limits, current usage and enabled
 * features. The UI renders from this; the backend still enforces the same rules
 * on each API.
 */
@Controller('me')
@ApiTags('Me')
@ApiSecurity('bearer')
export class MeController {
  constructor(
    private readonly entitlementService: EntitlementService,
    private readonly organizationService: OrganizationService,
  ) {}

  @Get('entitlements')
  async entitlements(@CurrentUser() user: JwtPayload) {
    const organizationId = user.organizationId
      ? String(user.organizationId)
      : null;
    const allowedTabs = tabsForRole(user.role);

    let limits = null;
    let features = null;
    let usage = null;

    if (organizationId) {
      const effective = await this.entitlementService.getEffective(
        organizationId,
      );
      limits = effective?.limits ?? null;
      features = effective?.features ?? null;

      const org = await this.organizationService.findById(organizationId);
      usage = org
        ? { bots: org.botCount, agents: org.agentCount, templates: org.templateCount }
        : null;
    }

    return {
      role: user.role,
      organizationId,
      allowedTabs,
      limits,
      features,
      usage,
    };
  }
}
