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
import { ActivitiesService } from "./activities.service";
import { CreateActivityDto } from "./dto/create-activity.dto";
import { ListActivitiesDto } from "./dto/list-activities.dto";
import { UpdateActivityDto } from "./dto/update-activity.dto";

@Controller("crm/activities")
@ApiTags("CRM Activities")
@ApiSecurity("bearer")
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get()
  async list(
    @OrgId() orgId: string,
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    query: ListActivitiesDto,
  ) {
    return this.activitiesService.list(orgId, query);
  }

  @Post()
  async create(
    @OrgId() orgId: string,
    @CurrentUser() user: { _id: string },
    @Body() dto: CreateActivityDto,
  ) {
    return this.activitiesService.create(orgId, user?._id, dto);
  }

  @Patch(":id")
  async update(
    @OrgId() orgId: string,
    @Param("id") id: string,
    @Body() dto: UpdateActivityDto,
  ) {
    return this.activitiesService.update(orgId, id, dto);
  }

  @Delete(":id")
  async remove(@OrgId() orgId: string, @Param("id") id: string) {
    return this.activitiesService.remove(orgId, id);
  }
}
