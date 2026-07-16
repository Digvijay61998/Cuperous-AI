import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Min, IsEnum } from 'class-validator';

export class SegmentQueryParams {
  @IsOptional()
  @Type(() => String)
  @ApiPropertyOptional()
  @ApiProperty()
  segmentId?: string;

  @IsOptional()
  @Type(() => String)
  @ApiPropertyOptional()
  @ApiProperty()
  comapreSegmentId?: string;

  @IsOptional()
  @Type(() => String)
  @ApiPropertyOptional()
  @ApiProperty()
  startDate?: string;

  @IsOptional()
  @Type(() => String)
  @ApiPropertyOptional()
  @ApiProperty()
  endDate?: string;
}
