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
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrganizationAdminService } from './organization-admin.service';

/**
 * Super-admin console: manage organizations, their subscriptions and limits,
 * suspend/reactivate, and impersonate. Every route is SUPER_ADMIN-only and
 * returns operational metadata only (no conversation content).
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
  async detail(@Param('id') id: string) {
    return this.organizationAdminService.getOrganization(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.organizationAdminService.updateOrganization(id, dto, actor);
  }

  @Post(':id/impersonate')
  async impersonate(
    @Param('id') id: string,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.organizationAdminService.impersonate(id, actor);
  }
}
