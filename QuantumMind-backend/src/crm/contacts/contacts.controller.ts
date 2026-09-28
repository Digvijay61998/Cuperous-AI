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
import { ContactsService } from "./contacts.service";
import {
  BulkAssignOwnerDto,
  BulkContactIdsDto,
  BulkSetCompanyDto,
} from "./dto/bulk-contacts.dto";
import { CreateContactDto } from "./dto/create-contact.dto";
import { ListContactsDto } from "./dto/list-contacts.dto";
import { UpdateContactDto } from "./dto/update-contact.dto";

@Controller("crm/contacts")
@ApiTags("CRM Contacts")
@ApiSecurity("bearer")
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  async list(
    @OrgId() orgId: string,
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    query: ListContactsDto,
  ) {
    return this.contactsService.list(orgId, query);
  }

  @Get(":id")
  async byId(@OrgId() orgId: string, @Param("id") id: string) {
    return this.contactsService.byId(orgId, id);
  }

  @Post()
  async create(
    @OrgId() orgId: string,
    @CurrentUser() user: { _id: string },
    @Body() dto: CreateContactDto,
  ) {
    return this.contactsService.create(orgId, user?._id, dto);
  }

  @Patch(":id")
  async update(
    @OrgId() orgId: string,
    @Param("id") id: string,
    @Body() dto: UpdateContactDto,
  ) {
    return this.contactsService.update(orgId, id, dto);
  }

  @Post(":id/archive")
  async archive(@OrgId() orgId: string, @Param("id") id: string) {
    return this.contactsService.archive(orgId, id);
  }

  @Post(":id/restore")
  async restore(@OrgId() orgId: string, @Param("id") id: string) {
    return this.contactsService.restore(orgId, id);
  }

  @Post(":id/enrich")
  async enrich(@OrgId() orgId: string, @Param("id") id: string) {
    return this.contactsService.enrich(orgId, id);
  }

  @Delete(":id")
  async purge(@OrgId() orgId: string, @Param("id") id: string) {
    return this.contactsService.purge(orgId, id);
  }

  @Post("bulk-assign-owner")
  async bulkAssignOwner(@OrgId() orgId: string, @Body() dto: BulkAssignOwnerDto) {
    return this.contactsService.bulkAssignOwner(orgId, dto);
  }

  @Post("bulk-set-company")
  async bulkSetCompany(@OrgId() orgId: string, @Body() dto: BulkSetCompanyDto) {
    return this.contactsService.bulkSetCompany(orgId, dto);
  }

  @Post("bulk-archive")
  async bulkArchive(@OrgId() orgId: string, @Body() dto: BulkContactIdsDto) {
    return this.contactsService.bulkArchive(orgId, dto.ids);
  }

  @Post("bulk-restore")
  async bulkRestore(@OrgId() orgId: string, @Body() dto: BulkContactIdsDto) {
    return this.contactsService.bulkRestore(orgId, dto.ids);
  }

  @Post("bulk-purge")
  async bulkPurge(@OrgId() orgId: string, @Body() dto: BulkContactIdsDto) {
    return this.contactsService.bulkPurge(orgId, dto.ids);
  }
}
