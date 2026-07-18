import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { TemplateCategoryEnum } from '../enums/template-category.enum';
import { TemplateIndustryEnum } from '../enums/template-industry.enum';
import { TemplateStatusEnum } from '../enums/template-status.enum';

export class SearchTemplateDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @ApiPropertyOptional({ default: 0 })
  skip?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @ApiPropertyOptional({ default: 10 })
  limit?: number;

  @IsOptional()
  @IsEnum(TemplateStatusEnum)
  @ApiPropertyOptional({ enum: TemplateStatusEnum })
  status?: string;

  @IsOptional()
  @IsEnum(TemplateIndustryEnum)
  @ApiPropertyOptional({ enum: TemplateIndustryEnum })
  industry?: string;

  @IsOptional()
  @IsEnum(TemplateCategoryEnum)
  @ApiPropertyOptional({ enum: TemplateCategoryEnum })
  category?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  text?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ default: 'createdAt' })
  sortBy?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ default: 'desc' })
  sortOrder?: string;
}
