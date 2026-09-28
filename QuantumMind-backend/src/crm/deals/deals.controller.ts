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
import { DealsService } from "./deals.service";
import { CreateDealDto } from "./dto/create-deal.dto";
import {
  BulkAssignDealOwnerDto,
  BulkDealIdsDto,
  DealContactDto,
  UpdateDealStageDto,
} from "./dto/deal-actions.dto";
import { ListDealsDto } from "./dto/list-deals.dto";
import { UpdateDealDto } from "./dto/update-deal.dto";

@Controller("crm/deals")
@ApiTags("CRM Deals")
@ApiSecurity("bearer")
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Get()
  async list(
    @OrgId() orgId: string,
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    query: ListDealsDto,
  ) {
    return this.dealsService.list(orgId, query);
  }

  @Get("pipeline")
  async pipeline(
    @OrgId() orgId: string,
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    query: ListDealsDto,
  ) {
    return this.dealsService.pipeline(orgId, query);
  }

  @Get(":id")
  async byId(@OrgId() orgId: string, @Param("id") id: string) {
    return this.dealsService.byId(orgId, id);
  }

  @Post()
  async create(
    @OrgId() orgId: string,
    @CurrentUser() user: { _id: string },
    @Body() dto: CreateDealDto,
  ) {
    return this.dealsService.create(orgId, user?._id, dto);
  }

  @Patch(":id")
  async update(
    @OrgId() orgId: string,
    @Param("id") id: string,
    @Body() dto: UpdateDealDto,
  ) {
    return this.dealsService.update(orgId, id, dto);
  }

  @Post(":id/stage")
  async updateStage(
    @OrgId() orgId: string,
    @Param("id") id: string,
    @Body() dto: UpdateDealStageDto,
  ) {
    return this.dealsService.updateStage(orgId, id, dto);
  }

  @Post(":id/contacts")
  async addContact(
    @OrgId() orgId: string,
    @Param("id") id: string,
    @Body() dto: DealContactDto,
  ) {
    return this.dealsService.addContact(orgId, id, dto);
  }

  @Delete(":id/contacts/:contactId")
  async removeContact(
    @OrgId() orgId: string,
    @Param("id") id: string,
    @Param("contactId") contactId: string,
  ) {
    return this.dealsService.removeContact(orgId, id, contactId);
  }

  @Post(":id/archive")
  async archive(@OrgId() orgId: string, @Param("id") id: string) {
    return this.dealsService.archive(orgId, id);
  }

  @Post(":id/restore")
  async restore(@OrgId() orgId: string, @Param("id") id: string) {
    return this.dealsService.restore(orgId, id);
  }

  @Delete(":id")
  async purge(@OrgId() orgId: string, @Param("id") id: string) {
    return this.dealsService.purge(orgId, id);
  }

  @Post("bulk-assign-owner")
  async bulkAssignOwner(
    @OrgId() orgId: string,
    @Body() dto: BulkAssignDealOwnerDto,
  ) {
    return this.dealsService.bulkAssignOwner(orgId, dto);
  }

  @Post("bulk-archive")
  async bulkArchive(@OrgId() orgId: string, @Body() dto: BulkDealIdsDto) {
    return this.dealsService.bulkArchive(orgId, dto.ids);
  }

  @Post("bulk-restore")
  async bulkRestore(@OrgId() orgId: string, @Body() dto: BulkDealIdsDto) {
    return this.dealsService.bulkRestore(orgId, dto.ids);
  }

  @Post("bulk-purge")
  async bulkPurge(@OrgId() orgId: string, @Body() dto: BulkDealIdsDto) {
    return this.dealsService.bulkPurge(orgId, dto.ids);
  }
}
