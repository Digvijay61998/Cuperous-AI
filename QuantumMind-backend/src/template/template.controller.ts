import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/auth/Public/public.decorator';
import { JwtPayload } from 'src/auth/strategy/jwt.strategy';
import { CurrentUser } from 'src/util';
import { CreateTemplateDto } from './dto/create-template.dto';
import { SearchTemplateDto } from './dto/search-template.dto';
import { UpdateConfigDto } from './dto/update-config.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { TemplateService } from './template.service';

type MulterFiles = {
  template?: Express.Multer.File[];
  thumbnail?: Express.Multer.File[];
};

@Controller('template')
@ApiTags('Template')
@ApiSecurity('bearer')
export class TemplateController {
  constructor(private readonly templateService: TemplateService) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'template', maxCount: 1 },
      { name: 'thumbnail', maxCount: 1 },
    ]),
  )
  async create(
    @Body() createTemplateDto: CreateTemplateDto,
    @UploadedFiles() files: MulterFiles,
    @CurrentUser() user: JwtPayload,
  ) {
    return await this.templateService.create(
      createTemplateDto,
      {
        template: files?.template?.[0] as any,
        thumbnail: files?.thumbnail?.[0] as any,
      },
      user,
    );
  }

  @Get()
  async findAll(@Query() query: SearchTemplateDto) {
    return await this.templateService.findAll(query);
  }

  @Get('params')
  getParams() {
    return this.templateService.getParams();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.templateService.findOne(id);
  }

  // Public runtime config for the hosted template (opened in WhatsApp WebView).
  @Get(':id/config')
  @Public()
  async getConfig(@Param('id') id: string) {
    return await this.templateService.getConfig(id);
  }

  @Patch(':id/config')
  async updateConfig(
    @Param('id') id: string,
    @Body() dto: UpdateConfigDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return await this.templateService.updateConfig(id, dto.configValues, user);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTemplateDto: UpdateTemplateDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return await this.templateService.update(id, updateTemplateDto, user);
  }

  @Post(':id/publish')
  async publish(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return await this.templateService.publish(id, user);
  }

  @Post(':id/unpublish')
  async unpublish(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return await this.templateService.unpublish(id, user);
  }

  @Post(':id/archive')
  async archive(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return await this.templateService.archive(id, user);
  }

  @Post(':id/duplicate')
  async duplicate(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return await this.templateService.duplicate(id, user);
  }

  @Post(':id/version')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'template', maxCount: 1 }]),
  )
  async uploadVersion(
    @Param('id') id: string,
    @UploadedFiles() files: MulterFiles,
    @Body('changelog') changelog: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return await this.templateService.uploadNewVersion(
      id,
      files?.template?.[0] as any,
      changelog,
      user,
    );
  }

  @Post(':id/rollback/:version')
  async rollback(
    @Param('id') id: string,
    @Param('version') version: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return await this.templateService.rollback(id, version, user);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return await this.templateService.softDelete(id, user);
  }
}
