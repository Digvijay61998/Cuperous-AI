import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from 'src/auth/Public/public.decorator';
import { CreateWhatsappWebSessionDto } from './dto/create-session.dto';
import { RequestPairingCodeDto } from './dto/request-pairing-code.dto';
import { WhatsappWebService } from './whatsapp-web.service';

/**
 * WhatsApp Web session endpoints, mirroring OpenWA's `/sessions` surface.
 * Marked @Public to match the existing Social/WhatsApp controllers in this
 * codebase (which are all public). NOTE: like the rest of the social module,
 * these endpoints are currently unauthenticated — worth tightening later.
 */
@Controller('whatsapp-web/sessions')
@ApiTags('WhatsApp Web')
export class WhatsappWebController {
  constructor(private readonly whatsappWebService: WhatsappWebService) {}

  @Post()
  @Public()
  create(@Body() dto: CreateWhatsappWebSessionDto) {
    return this.whatsappWebService.create(dto);
  }

  @Get()
  @Public()
  findAll() {
    return this.whatsappWebService.findAll();
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.whatsappWebService.findOne(id);
  }

  @Post(':id/start')
  @Public()
  start(@Param('id') id: string) {
    return this.whatsappWebService.start(id);
  }

  @Post(':id/stop')
  @Public()
  stop(@Param('id') id: string) {
    return this.whatsappWebService.stop(id);
  }

  @Post(':id/logout')
  @Public()
  logout(@Param('id') id: string) {
    return this.whatsappWebService.logout(id);
  }

  @Post(':id/force-kill')
  @Public()
  forceKill(@Param('id') id: string) {
    return this.whatsappWebService.forceKill(id);
  }

  @Delete(':id')
  @Public()
  remove(@Param('id') id: string) {
    return this.whatsappWebService.delete(id);
  }

  @Get(':id/qr')
  @Public()
  getQr(@Param('id') id: string) {
    return this.whatsappWebService.getQr(id);
  }

  @Post(':id/pairing-code')
  @Public()
  requestPairingCode(
    @Param('id') id: string,
    @Body() dto: RequestPairingCodeDto,
  ) {
    return this.whatsappWebService.requestPairingCode(id, dto.phoneNumber);
  }
}
