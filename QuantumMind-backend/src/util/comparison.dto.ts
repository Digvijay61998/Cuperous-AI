import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ComparisonDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  param1: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  param2: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  startDate: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  endDate: string;
}
