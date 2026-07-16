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
import { Public } from 'src/auth/Public/public.decorator';
import { CreateVideoDto } from './dto/create-video.dto';
import { SearchParamDto } from './dto/search-param.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { VideoService } from './video.service';

@Controller('video')
@ApiTags('Video')
@ApiSecurity('bearer')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Post()
  async create(@Body() createVideoDto: CreateVideoDto) {
    return await this.videoService.create(createVideoDto);
  }

  @Get()
  @Public()
  async findAll(@Query() query: SearchParamDto) {
    return await this.videoService.findAll(query);
  }

  @Get('params')
  @Public()
  getParams() {
    return this.videoService.getParams();
  }

  @Get('increment-view-count/:id')
  async incrementViewCount(@Param('id') id: string) {
    return await this.videoService.incrementViewCount(id);
  }

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
