import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Patch,
} from '@nestjs/common';
import { UpdateOrgSettingsDto } from 'src/organization/dto/update-org-settings.dto';
import { ORG_ROLES, Role } from 'src/common/enums/role.enum';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { JwtPayload } from 'src/auth/strategy/jwt.strategy';
import { CurrentUser } from 'src/util/current-user.decorator';
import { EntitlementService } from 'src/billing/entitlement.service';
import { OrganizationService } from 'src/organization/organization.service';
import { tabsForRole } from 'src/common/constants/role-tabs';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ALL_ROLES } from 'src/common/enums/role.enum';

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

  @Roles(...ALL_ROLES)
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

      // Real counts (not the denormalized counters) so a drifted counter can
      // never disable the create buttons after resources were deleted.
      usage = await this.organizationService.getUsage(organizationId);
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

  /** The caller's own organization settings (country / time zone). */
  @Roles(...ORG_ROLES)
  @Get('organization/settings')
  async getOrgSettings(@CurrentUser() user: JwtPayload) {
    const settings = await this.organizationService.getSettings(
      this.requireOrgId(user),
    );
    if (!settings) throw new NotFoundException('Organization not found');
    return settings;
  }

  /** Org admins edit their own organization only; the id comes from the token. */
  @Roles(Role.ORG_ADMIN)
  @Patch('organization/settings')
  async updateOrgSettings(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateOrgSettingsDto,
  ) {
    const settings = await this.organizationService.updateSettings(
      this.requireOrgId(user),
      dto,
    );
    if (!settings) throw new NotFoundException('Organization not found');
    return settings;
  }

  private requireOrgId(user: JwtPayload): string {
    if (!user.organizationId) {
      throw new ForbiddenException('No organization on this account');
    }
    return String(user.organizationId);
  }
}
