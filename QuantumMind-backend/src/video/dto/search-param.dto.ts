import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { VideoStatusEnum } from '../enum/video-status.enum';

export class SearchParamDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @ApiPropertyOptional({
    default: 0,
  })
  skip?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @ApiPropertyOptional({
    default: 10,
  })
  limit?: number;

  @IsOptional()
  @Type(() => String)
  @IsEnum(VideoStatusEnum)
  @ApiPropertyOptional({
    enum: VideoStatusEnum,
  })
  status?: string;

  @IsOptional()
  @Type(() => String)
  @ApiPropertyOptional({})
  @ApiProperty()
  category?: string;

  @IsOptional()
  @Type(() => String)
  @ApiPropertyOptional()
  text?: string;
}
