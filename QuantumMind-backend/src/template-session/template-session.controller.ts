import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from 'src/auth/Public/public.decorator';
import { TemplateSessionService } from './template-session.service';

/**
 * Endpoints called by the hosted template running in the customer's browser.
 * All @Public() — the template has no admin JWT; it authenticates with the
 * per-session launch token (?token=) instead.
 */
@Controller('template-session')
@ApiTags('TemplateSession')
export class TemplateSessionController {
  constructor(private readonly sessionService: TemplateSessionService) {}

  @Get(':id')
  @Public()
  async getForRuntime(
    @Param('id') id: string,
    @Query('token') token: string,
  ) {
    return this.sessionService.getForRuntime(id, token);
  }

  @Post(':id/heartbeat')
  @Public()
  async heartbeat(
    @Param('id') id: string,
    @Query('token') token: string,
    @Body() body: { phase?: 'opened' | 'in_progress' },
  ) {
    return this.sessionService.heartbeat(id, token, body?.phase || 'opened');
  }

  @Post(':id/submit')
  @Public()
  async submit(
    @Param('id') id: string,
    @Query('token') token: string,
    @Body()
    body: {
      idempotencyKey?: string;
      data: Record<string, any>;
      attachments?: { url: string; type: string; filename: string }[];
      category?: string;
      industry?: string;
      primaryDate?: Date;
      primaryAmount?: number;
    },
  ) {
    return this.sessionService.submit(id, token, body);
  }
}
