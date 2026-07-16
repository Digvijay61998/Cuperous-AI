import { IsEnum, IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { VideoStatusEnum } from '../enum/video-status.enum';

export class CreateVideoDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  url: string;

  @IsNotEmpty()
  @IsString()
  category: string;

  @IsEnum(VideoStatusEnum)
  @IsOptional()
  status: string;

  @IsNotEmpty()
  @IsString()
  description: string;
}
