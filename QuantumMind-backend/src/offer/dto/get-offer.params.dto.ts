import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Min, IsEnum } from 'class-validator';

export class offerQueryParams {
  @IsOptional()
  @Type(() => String)
  @ApiPropertyOptional()
  @ApiProperty()
  offerId?: string;

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
