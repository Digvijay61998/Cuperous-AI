import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Min, IsEnum } from 'class-validator';

export class AdvertisementQueryParams {
  @IsOptional()
  @Type(() => String)
  @ApiPropertyOptional()
  @ApiProperty()
  advertisementId?: string;

  @IsOptional()
  @Type(() => String)
  @ApiPropertyOptional()
  @ApiProperty()
  compareAdvertisementId?: string;

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
