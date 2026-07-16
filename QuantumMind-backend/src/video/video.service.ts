import { HttpException, Inject, Injectable, Logger } from '@nestjs/common';
import { Model } from 'mongoose';
import { SearchParamDto } from './dto/search-param.dto';
import { VIDEO_PROVIDER } from './constant';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { VideoDocument } from './entities/video.entity';
import { VideoCategoryEnumList } from './enum/video-category.enum';
import { VideoStatusEnumList } from './enum/video-status.enum';
import { Public } from 'src/auth/Public/public.decorator';

@Injectable()
export class VideoService {
  private readonly logger = new Logger(VideoService.name);
  constructor(
    @Inject(VIDEO_PROVIDER)
    private readonly videoModel: Model<VideoDocument>,
  ) {}

  async create(createVideoDto: CreateVideoDto) {
    try {
      const video = await this.videoModel.create({
        ...createVideoDto,
      });
      return video;
    } catch (error) {
      this.logger.error(`Error creating tag: ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async findAll(query: SearchParamDto) {
    try {
      const { skip, limit, status, category, text } = query;
      const queryObj = {};
      if (status) {
        queryObj['status'] = status;
      }
      if (category) {
        queryObj['category'] = category;
      }

      if (text) {
        queryObj['$text'] = { $search: text };
      }
      const video = this.videoModel
        .find(queryObj)
        .skip(skip)
        .sort({ createdAt: -1 });
      if (limit) video.limit(limit);

      const data = await video;
      const count = await this.videoModel.countDocuments(queryObj);
      const search = {
        categories: VideoCategoryEnumList,
        status: VideoStatusEnumList,
      };

      return { data, count, search };
    } catch (error) {
      this.logger.error(`Error while getting all webhooks : ${error.message}`);
      throw new HttpException(error.message, error.status || 500);
    }
  }

  getParams() {
    return {
      categories: VideoCategoryEnumList,
      status: VideoStatusEnumList,
    };
  }

  async incrementViewCount(videoId: string) {
    try {
      const video = await this.videoModel.findByIdAndUpdate(videoId, {
        $push: {
          views: {
            date: new Date(),
          },
        },
      });
      if (!video) {
        throw new HttpException('Video not found', 404);
      }
      return video;
    } catch (error) {
      this.logger.error(
        `Error while getting video with id ${videoId} : ${error.message}`,
      );
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async findOne(videoId: string) {
    try {
      const video = await this.videoModel.findById(videoId);
      return video;
    } catch (error) {
      this.logger.error(
        `Error while getting video with id ${videoId} : ${error.message}`,
      );
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async update(id: string, updateVideoDto: UpdateVideoDto) {
    try {
      const video = await this.videoModel.findByIdAndUpdate(
        id,
        updateVideoDto,
        { new: true },
      );
      return video;
    } catch (error) {
      this.logger.error(
        `Error while updating Video with id ${id} : ${error.message}`,
      );
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async remove(id: string) {
    try {
      const video = await this.videoModel.findByIdAndDelete(id);
      return video;
    } catch (error) {
      this.logger.error(
        `Error while deleting webhook with id ${id} : ${error.message}`,
      );
      throw new HttpException(error.message, error.status || 500);
    }
  }
}
