import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { QuestionStatusEnum } from '../enums/question-status.enum';

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
  @IsEnum(QuestionStatusEnum)
  @ApiPropertyOptional({
    enum: QuestionStatusEnum,
  })
  status?: string;

  @IsOptional()
  @Type(() => String)
  @ApiPropertyOptional({
    isArray: true,
  })
  @ApiProperty({
    isArray: true,
  })
  tags?: string[];

  @IsOptional()
  @Type(() => String)
  @ApiPropertyOptional()
  language?: string;

  @IsOptional()
  @Type(() => String)
  @ApiPropertyOptional()
  question?: string;
}
