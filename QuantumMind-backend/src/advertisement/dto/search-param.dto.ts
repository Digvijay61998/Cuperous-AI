import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { AdvertisementStatus } from '../enums/advertisement-status.enum';

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
  @IsEnum(AdvertisementStatus)
  @ApiPropertyOptional({
    enum: AdvertisementStatus,
  })
  status?: string;

  @IsOptional()
  @Type(() => String)
  @ApiPropertyOptional()
  @ApiProperty()
  bot?: string;
}
