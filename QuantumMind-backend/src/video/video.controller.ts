import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ALL_ROLES, Role } from 'src/common/enums/role.enum';
import { CreateVideoDto } from './dto/create-video.dto';
import { SearchParamDto } from './dto/search-param.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { VideoService } from './video.service';

@Controller('video')
@ApiTags('Video')
@ApiSecurity('bearer')
// Support videos are platform-wide content: every signed-in user may read,
// only the platform owner may create/update/delete.
@Roles(Role.SUPER_ADMIN)
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Post()
  async create(@Body() createVideoDto: CreateVideoDto) {
    return await this.videoService.create(createVideoDto);
  }

  @Roles(...ALL_ROLES)
  @Get()
  async findAll(@Query() query: SearchParamDto) {
    return await this.videoService.findAll(query);
  }

  @Roles(...ALL_ROLES)
  @Get('params')
  getParams() {
    return this.videoService.getParams();
  }

  @Roles(...ALL_ROLES)
  @Get('increment-view-count/:id')
  async incrementViewCount(@Param('id') id: string) {
    return await this.videoService.incrementViewCount(id);
  }

  @Roles(...ALL_ROLES)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.videoService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateVideoDto: UpdateVideoDto) {
    return this.videoService.update(id, updateVideoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.videoService.remove(id);
  }
}
