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
  UseGuards,
  ValidationPipe,
} from "@nestjs/common";
import { ApiSecurity, ApiTags } from "@nestjs/swagger";
import { Roles } from "src/common/decorators/roles.decorator";
import { ORG_ROLES, ORG_STAFF } from "src/common/enums/role.enum";
import { CurrentUser } from "src/util/current-user.decorator";
import { OrgId } from "../common/org-id.decorator";
import { CrmPluginGuard } from "../plugins/crm-plugin.guard";
import { RequiresCrmPlugin } from "../plugins/requires-crm-plugin.decorator";
import {
  AssignServiceRequestDto,
  CommentDto,
  CreateServiceRequestDto,
  ListServiceRequestsDto,
  MoveServiceRequestDto,
  StageDto,
  StageOrderDto,
  WrapUpDto,
  WrapUpQueryDto,
} from "./dto/service-request.dto";
import { ServiceRequestWrapUpService } from "./service-request-wrap-up.service";
import { UpdateServiceRequestDto } from "./dto/service-request.dto";
import { ServiceRequestStagesService } from "./service-request-stages.service";
import { ServiceRequestsService } from "./service-requests.service";
import { ServiceRequestSummaryService } from "./service-request-summary.service";
import { ServiceRequestTranscriptService } from "./service-request-transcript.service";

type User = { _id: string; role?: string };

/**
 * The service desk (crm-plugins-service-desk R11–R14, R17.4). Everyone in the
 * org, agents included, works the board; literal routes come before `:id`.
 */
@Controller("crm/service-requests")
@ApiTags("CRM Service Requests")
@ApiSecurity("bearer")
@Roles(...ORG_ROLES)
@UseGuards(CrmPluginGuard)
@RequiresCrmPlugin("service-requests")
export class ServiceRequestsController {
  constructor(
    private readonly requests: ServiceRequestsService,
    private readonly transcripts: ServiceRequestTranscriptService,
    private readonly summaries: ServiceRequestSummaryService,
    private readonly wrapUp: ServiceRequestWrapUpService,
  ) {}

  private actor(orgId: string, user: User) {
    return this.requests.actorFor(orgId, user?._id ? String(user._id) : undefined, user?.role);
  }

  @Get()
  list(
    @OrgId() orgId: string,
    @CurrentUser() user: User,
    @Query(new ValidationPipe({ transform: true, whitelist: true })) q: ListServiceRequestsDto,
  ) {
    const { view, column, sort, dir, skip, take, ...filters } = q;
    return this.requests.list(orgId, user?._id ? String(user._id) : undefined, filters, { view, column, sort, dir, skip, take });
  }

  @Post()
  async create(@OrgId() orgId: string, @CurrentUser() user: User, @Body() dto: CreateServiceRequestDto) {
    return this.requests.create(orgId, await this.actor(orgId, user), dto);
  }

  @Get("assignees")
  assignees(@OrgId() orgId: string) {
    return this.requests.assignees(orgId);
  }

  /** The chat's request and an AI-filled draft, for the close / release dialog. */
  @Get("wrap-up")
  wrapUpView(@OrgId() orgId: string, @Query(new ValidationPipe({ transform: true, whitelist: true })) q: WrapUpQueryDto) {
    return this.wrapUp.view(orgId, q);
  }

  /** Save the confirmed card: updates the chat's request (creates one only if it has none). */
  @Post("wrap-up")
  async wrapUpSave(@OrgId() orgId: string, @CurrentUser() user: User, @Body() dto: WrapUpDto) {
    return this.wrapUp.save(orgId, await this.actor(orgId, user), dto);
  }

  @Get(":id")
  byId(@OrgId() orgId: string, @Param("id") id: string) {
    return this.requests.byId(orgId, id);
  }

  @Patch(":id")
  async update(@OrgId() orgId: string, @CurrentUser() user: User, @Param("id") id: string, @Body() dto: UpdateServiceRequestDto) {
    return this.requests.update(orgId, await this.actor(orgId, user), id, dto);
  }

  @Post(":id/move")
  async move(@OrgId() orgId: string, @CurrentUser() user: User, @Param("id") id: string, @Body() dto: MoveServiceRequestDto) {
    return this.requests.move(orgId, await this.actor(orgId, user), id, dto);
  }

  @Post(":id/assign")
  async assign(@OrgId() orgId: string, @CurrentUser() user: User, @Param("id") id: string, @Body() dto: AssignServiceRequestDto) {
    return this.requests.assign(orgId, await this.actor(orgId, user), id, dto.assigneeId || null);
  }

  @Post(":id/assign-to-me")
  async assignToMe(@OrgId() orgId: string, @CurrentUser() user: User, @Param("id") id: string) {
    return this.requests.assign(orgId, await this.actor(orgId, user), id, String(user._id));
  }

  @Get(":id/comments")
  comments(@OrgId() orgId: string, @Param("id") id: string) {
    return this.requests.listComments(orgId, id);
  }

  @Post(":id/comments")
  async addComment(@OrgId() orgId: string, @CurrentUser() user: User, @Param("id") id: string, @Body() dto: CommentDto) {
    return this.requests.addComment(orgId, await this.actor(orgId, user), id, dto.body);
  }

  @Patch(":id/comments/:commentId")
  async editComment(
    @OrgId() orgId: string,
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Param("commentId") commentId: string,
    @Body() dto: CommentDto,
  ) {
    return this.requests.editComment(orgId, await this.actor(orgId, user), id, commentId, dto.body);
  }

  @Delete(":id/comments/:commentId")
  async deleteComment(@OrgId() orgId: string, @CurrentUser() user: User, @Param("id") id: string, @Param("commentId") commentId: string) {
    return this.requests.deleteComment(orgId, await this.actor(orgId, user), id, commentId);
  }

  @Get(":id/events")
  events(@OrgId() orgId: string, @Param("id") id: string, @Query("skip") skip?: string, @Query("take") take?: string) {
    return this.requests.listEvents(orgId, id, Number(skip) || 0, Number(take) || 50);
  }

  /** Live chats while they exist, else the stored snapshot (R16.3). */
  @Get(":id/transcript")
  transcript(@OrgId() orgId: string, @Param("id") id: string) {
    return this.transcripts.forRequest(orgId, id);
  }

  /** Regenerate the AI summary (R15.3). */
  @Post(":id/summary")
  async summary(@OrgId() orgId: string, @CurrentUser() user: User, @Param("id") id: string) {
    return this.summaries.regenerate(orgId, id, await this.actor(orgId, user));
  }
}

/** Board columns (R10). Everyone reads; admins and managers change them. */
@Controller("crm/service-request-stages")
@ApiTags("CRM Service Request Stages")
@ApiSecurity("bearer")
@UseGuards(CrmPluginGuard)
@RequiresCrmPlugin("service-requests")
export class ServiceRequestStagesController {
  constructor(
    private readonly stages: ServiceRequestStagesService,
    private readonly requests: ServiceRequestsService,
  ) {}

  @Get()
  @Roles(...ORG_ROLES)
  list(@OrgId() orgId: string) {
    return this.stages.list(orgId);
  }

  @Post()
  @Roles(...ORG_STAFF)
  create(@OrgId() orgId: string, @Body() dto: StageDto) {
    return this.stages.create(orgId, dto);
  }

  @Put("order")
  @Roles(...ORG_STAFF)
  reorder(@OrgId() orgId: string, @Body() dto: StageOrderDto) {
    return this.stages.reorder(orgId, dto.ids);
  }

  @Patch(":id")
  @Roles(...ORG_STAFF)
  update(@OrgId() orgId: string, @Param("id") id: string, @Body() dto: StageDto) {
    return this.stages.update(orgId, id, dto);
  }

  /** `?moveTo=<stageId>` is required while the stage holds requests (R10.5). */
  @Delete(":id")
  @Roles(...ORG_STAFF)
  async remove(@OrgId() orgId: string, @CurrentUser() user: User, @Param("id") id: string, @Query("moveTo") moveTo?: string) {
    const actor = await this.requests.actorFor(orgId, user?._id ? String(user._id) : undefined, user?.role);
    return this.stages.remove(orgId, id, moveTo, actor);
  }
}
