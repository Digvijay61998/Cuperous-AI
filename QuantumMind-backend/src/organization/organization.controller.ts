import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { JwtPayload } from 'src/auth/strategy/jwt.strategy';
import { CurrentUser } from 'src/util/current-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { ParseObjectIdPipe } from 'src/common/pipes/parse-object-id.pipe';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrganizationAdminService } from './organization-admin.service';

/**
 * Super-admin console: manage organizations, their subscriptions and limits,
 * suspend/reactivate, and impersonate. Every route is SUPER_ADMIN-only and
 * returns operational metadata only (no conversation content).
 *
 * Impersonation tokens carry `impersonatedBy`; they cannot be used here (they
 * are ORG_ADMIN tokens), so a support session can never escalate back into
 * the console.
 */
@Controller('organizations')
@ApiTags('Organizations')
@ApiSecurity('bearer')
@Roles(Role.SUPER_ADMIN)
export class OrganizationController {
  constructor(
    private readonly organizationAdminService: OrganizationAdminService,
  ) {}

  @Post()
  async create(
    @Body() dto: CreateOrganizationDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.organizationAdminService.createOrganization(dto, actor);
  }

  @Get()
  async list() {
    return this.organizationAdminService.listOrganizations();
  }

  @Get(':id')
  async detail(@Param('id', ParseObjectIdPipe) id: string) {
    return this.organizationAdminService.getOrganization(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateOrganizationDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.organizationAdminService.updateOrganization(id, dto, actor);
  }

  @Post(':id/impersonate')
  async impersonate(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.organizationAdminService.impersonate(id, actor);
  }

  /** Repairs usage-counter drift by recounting from the source collections. */
  @Post(':id/reconcile')
  async reconcile(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.organizationAdminService.reconcile(id, actor);
  }
}
