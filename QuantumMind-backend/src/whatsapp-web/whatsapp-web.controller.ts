import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/util/current-user.decorator';
import { TenantContext } from 'src/common/tenant/tenant-context';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RequiresFeature } from 'src/common/decorators/requires-feature.decorator';
import { ORG_STAFF } from 'src/common/enums/role.enum';
import { WhatsappWebService } from './whatsapp-web.service';
import { CreateWhatsappWebSessionDto } from './dto/create-session.dto';
import { RequestPairingCodeDto } from './dto/request-pairing-code.dto';

/**
 * WhatsApp Web (OpenWA/baileys) session management.
 *
 * Previously every route here was `@Public()`, which let anyone create, read
 * the QR of (i.e. hijack), stop, or delete any tenant's WhatsApp session. All
 * routes now require an ORG_ADMIN / ORG_MANAGER token, are org-scoped, and are
 * gated by the `channel.whatsapp_openwa` feature. Creating a session consumes
 * a `maxPlatforms` slot.
 */
@Controller('whatsapp-web/sessions')
@ApiTags('WhatsApp Web')
@ApiSecurity('bearer')
@Roles(...ORG_STAFF)
@RequiresFeature('channel.whatsapp_openwa')
export class WhatsappWebController {
  constructor(private readonly whatsappWebService: WhatsappWebService) {}

  @Post()
  create(
    @Body() dto: CreateWhatsappWebSessionDto,
    @CurrentUser() user: TenantContext,
  ) {
    return this.whatsappWebService.create(dto, user);
  }

  @Get()
  findAll(@CurrentUser() user: TenantContext) {
    return this.whatsappWebService.findAll(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: TenantContext) {
    return this.whatsappWebService.findOne(id, user);
  }

  @Post(':id/start')
  start(@Param('id') id: string, @CurrentUser() user: TenantContext) {
    return this.whatsappWebService.start(id, user);
  }

  @Post(':id/stop')
  stop(@Param('id') id: string, @CurrentUser() user: TenantContext) {
    return this.whatsappWebService.stop(id, user);
  }

  @Post(':id/logout')
  logout(@Param('id') id: string, @CurrentUser() user: TenantContext) {
    return this.whatsappWebService.logout(id, user);
  }

  @Post(':id/force-kill')
  forceKill(@Param('id') id: string, @CurrentUser() user: TenantContext) {
    return this.whatsappWebService.forceKill(id, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: TenantContext) {
    return this.whatsappWebService.delete(id, user);
  }

  @Get(':id/qr')
  getQr(@Param('id') id: string, @CurrentUser() user: TenantContext) {
    return this.whatsappWebService.getQr(id, user);
  }

  @Post(':id/pairing-code')
  requestPairingCode(
    @Param('id') id: string,
    @Body() dto: RequestPairingCodeDto,
    @CurrentUser() user: TenantContext,
  ) {
    return this.whatsappWebService.requestPairingCode(
      id,
      dto.phoneNumber,
      user,
    );
  }
}
