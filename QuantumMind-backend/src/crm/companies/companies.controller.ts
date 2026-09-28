import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  ValidationPipe,
} from "@nestjs/common";
import { ApiSecurity, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "src/util/current-user.decorator";
import { OrgId } from "../common/org-id.decorator";
import { CompaniesService } from "./companies.service";
import {
  BulkAssignCompanyOwnerDto,
  BulkCompanyIdsDto,
} from "./dto/bulk-companies.dto";
import { CreateCompanyDto } from "./dto/create-company.dto";
import { ListCompaniesDto } from "./dto/list-companies.dto";
import { UpdateCompanyDto } from "./dto/update-company.dto";

@Controller("crm/companies")
@ApiTags("CRM Companies")
@ApiSecurity("bearer")
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  async list(
    @OrgId() orgId: string,
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    query: ListCompaniesDto,
  ) {
    return this.companiesService.list(orgId, query);
  }

  @Get(":id")
  async byId(@OrgId() orgId: string, @Param("id") id: string) {
    return this.companiesService.byId(orgId, id);
  }

  @Post()
  async create(
    @OrgId() orgId: string,
    @CurrentUser() user: { _id: string },
    @Body() dto: CreateCompanyDto,
  ) {
    return this.companiesService.create(orgId, user?._id, dto);
  }

  @Patch(":id")
  async update(
    @OrgId() orgId: string,
    @Param("id") id: string,
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.companiesService.update(orgId, id, dto);
  }

  @Post(":id/archive")
  async archive(@OrgId() orgId: string, @Param("id") id: string) {
    return this.companiesService.archive(orgId, id);
  }

  @Post(":id/restore")
  async restore(@OrgId() orgId: string, @Param("id") id: string) {
    return this.companiesService.restore(orgId, id);
  }

  @Delete(":id")
  async purge(@OrgId() orgId: string, @Param("id") id: string) {
    return this.companiesService.purge(orgId, id);
  }

  @Post("bulk-assign-owner")
  async bulkAssignOwner(
    @OrgId() orgId: string,
    @Body() dto: BulkAssignCompanyOwnerDto,
  ) {
    return this.companiesService.bulkAssignOwner(orgId, dto);
  }

  @Post("bulk-archive")
  async bulkArchive(@OrgId() orgId: string, @Body() dto: BulkCompanyIdsDto) {
    return this.companiesService.bulkArchive(orgId, dto.ids);
  }

  @Post("bulk-restore")
  async bulkRestore(@OrgId() orgId: string, @Body() dto: BulkCompanyIdsDto) {
    return this.companiesService.bulkRestore(orgId, dto.ids);
  }

  @Post("bulk-purge")
  async bulkPurge(@OrgId() orgId: string, @Body() dto: BulkCompanyIdsDto) {
    return this.companiesService.bulkPurge(orgId, dto.ids);
  }
}
