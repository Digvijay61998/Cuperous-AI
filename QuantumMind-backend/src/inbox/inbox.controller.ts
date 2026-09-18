import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { JwtPayload } from 'src/auth/strategy/jwt.strategy';
import { CurrentUser } from 'src/util';
import { BotControlDto } from './dto/bot-control.dto';
import { ListMessagesDto } from './dto/list-messages.dto';
import { ListThreadsDto } from './dto/list-threads.dto';
import { SendInboxMessageDto } from './dto/send-message.dto';
import { InboxService } from './inbox.service';

/**
 * Omnichannel inbox: the read API behind the dashboard's channel tabs.
 *
 * NOTE ON AUTH: every route here is authenticated by the global JwtAuthGuard —
 * deliberately NOT following the `@Public()` pattern used across the social /
 * whatsapp-web controllers. These endpoints expose customer conversation
 * content, so they are scoped to the caller's bots inside InboxService.
 */
@Controller('inbox')
@ApiTags('Inbox')
@ApiSecurity('bearer')
export class InboxController {
  constructor(private readonly inboxService: InboxService) {}

  @Get('channels')
  @ApiOperation({
    summary: 'Channels that have threads, with thread + unread counts',
    description:
      'Drives the dashboard channel tabs. Derived from the data, so a newly ' +
      'integrated platform appears without a frontend change.',
  })
  listChannels(@CurrentUser() user: JwtPayload) {
    return this.inboxService.listChannels(user);
  }

  // Declared before `threads` only for readability — it sits under `channels`,
  // which is a literal segment, so there is no route-shadowing hazard here.
  @Get('channels/:channel/status')
  @ApiOperation({
    summary: 'Whether a channel can send right now, and why not if it cannot',
    description:
      'Drives the connection banner above a channel tab. Necessary because the ' +
      'tab list is derived from threads, which are permanent: a deleted, stopped ' +
      'or logged-out messenger leaves a tab that looks perfectly healthy until a ' +
      'reply fails. States are derived from the live engine runtime, not from a ' +
      'stored column, because "stopped", "logged out" and "reconnecting" all share ' +
      'one persisted status.',
  })
  getChannelStatus(
    @CurrentUser() user: JwtPayload,
    @Param('channel') channel: string,
  ) {
    return this.inboxService.getChannelStatus(user, channel);
  }

  @Get('threads')
  @ApiOperation({
    summary: 'Thread list for one channel, newest activity first',
    description:
      'Cursor-paginated on lastMessageAt: threads reorder as messages arrive, ' +
      'so offset paging would skip or repeat rows between pages.',
  })
  listThreads(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListThreadsDto,
  ) {
    return this.inboxService.listThreads(user, query);
  }

  // Declared before `:id` so the literal segment is never swallowed by the
  // param route.
  @Get('threads/:id/messages')
  @ApiOperation({
    summary: "One thread's messages, oldest-first",
    description:
      'Reads by channelThread rather than by conversation: a channel thread ' +
      'outlives any single Conversation, so conversation-scoped reads truncate ' +
      'the history mid-thread.',
  })
  getThreadMessages(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Query() query: ListMessagesDto,
  ) {
    return this.inboxService.getThreadMessages(user, id, query);
  }

  @Post('threads/:id/messages')
  @ApiOperation({
    summary: 'Send an agent reply on a channel thread',
    description:
      'Responds only after the channel has accepted or rejected the message, so ' +
      'a 2xx means the customer will receive it. A failure leaves the stored row ' +
      'marked failed for the agent to retry.',
  })
  sendMessage(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: SendInboxMessageDto,
  ) {
    return this.inboxService.sendMessage(user, id, dto);
  }

  @Patch('threads/:id/bot')
  @ApiOperation({
    summary: 'Pause/resume the bot, or take the thread over and hand it back',
  })
  setBotControl(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: BotControlDto,
  ) {
    return this.inboxService.setBotControl(user, id, dto);
  }

  @Post('threads/:id/read')
  @ApiOperation({
    summary: 'Clear the unread badge and send read receipts to the customer',
  })
  markThreadRead(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.inboxService.markThreadRead(user, id);
  }

  @Post('threads/:id/history')
  @ApiOperation({
    summary: 'Request an older page of history from the channel',
    description:
      'On-demand and rate-limited. The page arrives asynchronously through the ' +
      "channel's history event and is persisted by the inbound path, so each " +
      'message is fetched from the channel at most once.',
  })
  requestOlderHistory(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.inboxService.requestOlderHistory(user, id);
  }

  @Get('threads/:id')
  @ApiOperation({ summary: 'One thread with its relations' })
  getThread(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.inboxService.getThread(user, id);
  }
}
