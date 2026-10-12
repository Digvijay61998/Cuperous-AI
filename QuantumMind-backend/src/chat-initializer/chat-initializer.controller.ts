import { Controller, Get, Param } from '@nestjs/common';
import { ApiSecurity } from '@nestjs/swagger';
import { ChatInitializerService } from './chat-initializer.service';
import { CurrentUser } from 'src/util/current-user.decorator';
import { TenantContext } from 'src/common/tenant/tenant-context';
import { TenantScopeService } from 'src/common/tenant/tenant-scope.service';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ORG_STAFF } from 'src/common/enums/role.enum';

/**
 * Debug endpoint that starts a chat against a bot. Previously public (anyone
 * could spin up conversations on any tenant's bot); now org staff only, for
 * their own bots.
 */
@Controller('chat-initializer')
@ApiSecurity('bearer')
@Roles(...ORG_STAFF)
export class ChatInitializerController {
  constructor(
    private readonly chatInitializerService: ChatInitializerService,
    private readonly tenantScope: TenantScopeService,
  ) {}

  @Get('test/:botId')
  async test(
    @Param('botId') botId: string,
    @CurrentUser() user: TenantContext,
  ) {
    await this.tenantScope.assertBotInOrg(user, botId);
    return this.chatInitializerService.createChat(botId);
  }
}
