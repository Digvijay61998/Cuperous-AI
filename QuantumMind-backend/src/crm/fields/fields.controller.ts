import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  ValidationPipe,
} from "@nestjs/common";
import { ApiSecurity, ApiTags } from "@nestjs/swagger";
import { OrgId } from "../common/org-id.decorator";
import {
  CreateFieldDefinitionDto,
  ListFieldsDto,
  UpdateFieldDefinitionDto,
} from "./dto/field-definition.dto";
import { ApplyFieldValuesDto, GetFieldValuesDto } from "./dto/field-values.dto";
import { FieldsService } from "./fields.service";

@Controller("crm/fields")
@ApiTags("CRM Fields")
@ApiSecurity("bearer")
export class FieldsController {
  constructor(private readonly fieldsService: FieldsService) {}

  @Get()
  async list(
    @OrgId() orgId: string,
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    query: ListFieldsDto,
  ) {
    return this.fieldsService.list(orgId, query);
  }

  @Post()
  async create(@OrgId() orgId: string, @Body() dto: CreateFieldDefinitionDto) {
    return this.fieldsService.create(orgId, dto);
  }

  @Get("values")
  async values(
    @OrgId() orgId: string,
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    query: GetFieldValuesDto,
  ) {
    return this.fieldsService.valuesForRecord(orgId, query);
  }

  @Put("values")
  async applyValues(@OrgId() orgId: string, @Body() dto: ApplyFieldValuesDto) {
    return this.fieldsService.applyValues(orgId, dto);
  }

  @Patch(":id")
  async update(
    @OrgId() orgId: string,
    @Param("id") id: string,
    @Body() dto: UpdateFieldDefinitionDto,
  ) {
    return this.fieldsService.update(orgId, id, dto);
  }

  @Delete(":id")
  async archive(@OrgId() orgId: string, @Param("id") id: string) {
    return this.fieldsService.archive(orgId, id);
  }
}
