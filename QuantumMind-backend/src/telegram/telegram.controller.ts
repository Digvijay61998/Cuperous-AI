import { CurrentUser } from 'src/util/current-user.decorator';
import { TenantContext } from 'src/common/tenant/tenant-context';
import { TenantScopeService } from 'src/common/tenant/tenant-scope.service';
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { Public } from 'src/auth/Public/public.decorator';
import { CreateTelegramBotDto } from './dto/create-telegram-bot.dto';

import { TelegramMessageService } from './telegram-message.service';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { RequiresFeature } from 'src/common/decorators/requires-feature.decorator';

@Controller('telegram')
@ApiTags('Telegram')
@ApiSecurity('bearer')
export class TelegramController {
  constructor(
    private readonly telegramService: TelegramService,
    private readonly telegramMessageService: TelegramMessageService,
    private readonly tenantScope: TenantScopeService,
  ) {}

  @Roles(Role.ORG_ADMIN, Role.ORG_MANAGER)
  @RequiresFeature('channel.telegram')
  @Post()
  async create(
    @Body() createTelegramBotDto: CreateTelegramBotDto,
    @CurrentUser() user: TenantContext,
  ) {
    // The linked JarCube bot must belong to the caller's org.
    await this.tenantScope.assertBotInOrg(user, createTelegramBotDto.jarcubeBot);
    return await this.telegramService.create(createTelegramBotDto);
  }

  @Public()
  @Post('webhook/:botId')
  async webhook(@Body() body: any, @Param('botId') botId: string) {
    return await this.telegramMessageService.handlePostWebhook(body, botId);
  }
}
