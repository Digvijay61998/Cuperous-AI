import { Controller, Get, Query } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { PlanService } from 'src/billing/plan.service';
import { AuditService } from 'src/audit/audit.service';
import { FEATURE_CATALOG } from 'src/common/constants/feature-catalog';
import { OrganizationAdminService } from './organization-admin.service';

/** Platform-wide super-admin views. */
@Controller('admin')
@ApiTags('Admin')
@ApiSecurity('bearer')
@Roles(Role.SUPER_ADMIN)
export class AdminController {
  constructor(
    private readonly organizationAdminService: OrganizationAdminService,
    private readonly planService: PlanService,
    private readonly auditService: AuditService,
  ) {}

  @Get('overview')
  async overview() {
    return this.organizationAdminService.overview();
  }

  /** Plans available to attach when creating/updating an organization. */
  @Get('plans')
  async plans() {
    return this.planService.findAll();
  }

  /** The fixed feature catalog (drives the console's feature toggles). */
  @Get('features')
  features() {
    return { features: [...FEATURE_CATALOG] };
  }

  /** Audit trail (org create/suspend, limit/feature changes, impersonation). */
  @Get('audit-logs')
  async auditLogs(
    @Query('organizationId') organizationId?: string,
    @Query('action') action?: string,
    @Query('skip') skip?: string,
    @Query('limit') limit?: string,
  ) {
    return this.auditService.list({
      organizationId,
      action,
      skip: Number(skip),
      limit: Number(limit),
    });
  }
}
