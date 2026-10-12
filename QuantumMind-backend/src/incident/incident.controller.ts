import { Body, ConflictException, Controller, Get, NotFoundException, Param, Post, Query } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { AGENT_ACCEPT_LIVE } from "./constants";
import { ApiSecurity, ApiTags } from "@nestjs/swagger";
import { Roles } from "src/common/decorators/roles.decorator";
import { ORG_ROLES } from "src/common/enums/role.enum";
import { CurrentUser } from "src/util/current-user.decorator";
import { EmailReplyDto, IncidentContextDto, ListIncidentsDto, ResolveIncidentDto } from "./dto/incident.dto";
import { IncidentMailService } from "./incident-mail.service";
import { IncidentService } from "./incident.service";

@Controller("incidents")
@ApiTags("Incidents")
@ApiSecurity("bearer")
@Roles(...ORG_ROLES)
export class IncidentController {
  constructor(
    private readonly incidentService: IncidentService,
    private readonly incidentMail: IncidentMailService,
    private readonly events: EventEmitter2,
  ) {}

  /** Agent replies by email when the visitor has left (R19.4). */
  @Post(":id/email-reply")
  async emailReply(@Param("id") id: string, @Body() body: EmailReplyDto, @CurrentUser() user: any) {
    return this.incidentMail.emailReply(id, user, body.body);
  }

  /** Incidents of the caller's org (R10). */
  @Get()
  async list(@Query() query: ListIncidentsDto, @CurrentUser() user: any) {
    return this.incidentService.list(user, query);
  }

  @Get(":id")
  async findOne(@Param("id") id: string, @CurrentUser() user: any) {
    return this.incidentService.findOneScoped(id, user);
  }

  /**
   * Same, keyed by conversation (what the agent views have). Works with or
   * without an incident: history always loads; incident fields are null.
   * Declared before ":id" routes would not matter (different segment count).
   */
  @Get("by-conversation/:conversationId/context")
  async contextByConversation(
    @Param("conversationId") conversationId: string,
    @Query() q: IncidentContextDto,
    @CurrentUser() user: any,
  ) {
    return this.incidentService.contextForConversation(conversationId, user, {
      earlierBefore: q.earlierBefore,
      earlierLimit: q.earlierLimit,
    });
  }

  /**
   * Accept a waiting chat as a live chat: it moves to the caller's Live Chat
   * tab. `connected`, `taken` (another agent has it, 409) or `offline` (the
   * visitor's chat is not live; follow up from the incident).
   */
  @Post("by-conversation/:conversationId/accept-live")
  async acceptLive(@Param("conversationId") conversationId: string, @CurrentUser() user: any) {
    const incident = await this.incidentService.findOpenByConversation(String(conversationId));
    if (!incident) throw new NotFoundException("No open incident for this conversation.");
    // Same org check as the other incident routes (404/403 for another org).
    await this.incidentService.findOneScoped(String(incident._id), user);
    if (!incident.visitorId) return { status: "offline" };
    const [status] = await this.events.emitAsync(AGENT_ACCEPT_LIVE, {
      visitorId: String(incident.visitorId),
      agentId: String(user._id),
      agentName: user?.name,
    });
    if (status === "taken") throw new ConflictException("Another agent is already handling this chat.");
    return { status: status ?? "offline" };
  }

  /** Full history + profile + earlier incidents for the agent view (R9). */
  @Get(":id/context")
  async context(@Param("id") id: string, @Query() q: IncidentContextDto, @CurrentUser() user: any) {
    return this.incidentService.context(id, user, { earlierBefore: q.earlierBefore, earlierLimit: q.earlierLimit });
  }

  /** Owner_Agent resolves with a note (R10.1, R10.6). */
  @Post(":id/resolve")
  async resolve(
    @Param("id") id: string,
    @Body() body: ResolveIncidentDto,
    @CurrentUser() user: any,
  ) {
    return this.incidentService.resolve(id, user, body.note);
  }
}
