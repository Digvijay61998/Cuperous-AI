import { Controller, Get } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { PlanService } from 'src/billing/plan.service';
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
}
