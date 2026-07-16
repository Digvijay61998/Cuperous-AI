import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/auth/Public/public.decorator';
import { CreateTagDto } from './dto/create-tag.dto';
import { TagService } from './tag.service';

@Controller('tag')
@ApiTags('Tag')
@ApiSecurity('bearer')
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @Get()
  async findAll() {
    return await this.tagService.getTagList();
  }

  @Get('count')
  async findAlltagsWithCount() {
    return await this.tagService.findAll();
  }

  @Get('stats')
  async getStats() {
    return await this.tagService.stats();
  }

  @Post()
  async create(@Body() createTagDto: CreateTagDto) {
    return await this.tagService.create(createTagDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.tagService.deleteTag(id);
  }
}
