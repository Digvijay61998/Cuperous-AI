import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ORG_STAFF } from 'src/common/enums/role.enum';
import { TenantContext } from 'src/common/tenant/tenant-context';
import { CurrentUser } from 'src/util';
import { CreateTagDto } from './dto/create-tag.dto';
import { TagService } from './tag.service';

@Controller('tag')
@ApiTags('Tag')
@ApiSecurity('bearer')
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @Get()
  async findAll(@CurrentUser() user: any) {
    return await this.tagService.getTagList(user as TenantContext);
  }

  @Get('count')
  async findAlltagsWithCount(@CurrentUser() user: any) {
    return await this.tagService.findAll(user as TenantContext);
  }

  @Get('stats')
  async getStats(@CurrentUser() user: any) {
    return await this.tagService.stats(undefined, user as TenantContext);
  }

  @Post()
  @Roles(...ORG_STAFF)
  async create(@Body() createTagDto: CreateTagDto, @CurrentUser() user: any) {
    return await this.tagService.create(createTagDto, user as TenantContext);
  }

  @Delete(':id')
  @Roles(...ORG_STAFF)
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return await this.tagService.deleteTag(id, user as TenantContext);
  }
}
