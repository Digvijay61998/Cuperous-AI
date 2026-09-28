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
import {
  CreateSavedViewDto,
  ListSavedViewsDto,
  UpdateSavedViewDto,
} from "./dto/saved-view.dto";
import { SavedViewsService } from "./saved-views.service";

@Controller("crm/saved-views")
@ApiTags("CRM Saved Views")
@ApiSecurity("bearer")
export class SavedViewsController {
  constructor(private readonly savedViewsService: SavedViewsService) {}

  @Get()
  async list(
    @OrgId() orgId: string,
    @CurrentUser() user: { _id: string },
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    query: ListSavedViewsDto,
  ) {
    return this.savedViewsService.list(orgId, user?._id, query);
  }

  @Post()
  async create(
    @OrgId() orgId: string,
    @CurrentUser() user: { _id: string },
    @Body() dto: CreateSavedViewDto,
  ) {
    return this.savedViewsService.create(orgId, user?._id, dto);
  }

  @Patch(":id")
  async update(
    @OrgId() orgId: string,
    @CurrentUser() user: { _id: string },
    @Param("id") id: string,
    @Body() dto: UpdateSavedViewDto,
  ) {
    return this.savedViewsService.update(orgId, user?._id, id, dto);
  }

  @Delete(":id")
  async remove(
    @OrgId() orgId: string,
    @CurrentUser() user: { _id: string },
    @Param("id") id: string,
  ) {
    return this.savedViewsService.remove(orgId, user?._id, id);
  }
}
