import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { TemplateCategoryEnum } from '../enums/template-category.enum';
import { TemplateIndustryEnum } from '../enums/template-industry.enum';
import { TemplateStatusEnum } from '../enums/template-status.enum';

/**
 * Parses a field that may arrive either as a real array (JSON body) or a
 * JSON-stringified array / comma separated string (multipart form-data).
 */
const toArray = ({ value }: { value: any }): string[] => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [value];
    } catch {
      return value.split(',').map((v) => v.trim());
    }
  }
  return [];
};

const toBoolean = ({ value }: { value: any }): boolean => {
  if (typeof value === 'boolean') return value;
  return value === 'true' || value === '1';
};

export class CreateTemplateDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(60)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'slug may only contain lowercase letters, numbers and hyphens',
  })
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ enum: TemplateIndustryEnum })
  @IsEnum(TemplateIndustryEnum)
  industry: string;

  @ApiProperty({ enum: TemplateCategoryEnum })
  @IsEnum(TemplateCategoryEnum)
  category: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @Transform(toArray)
  @IsArray()
  @ArrayMaxSize(20)
  tags?: string[];

  @ApiPropertyOptional({ enum: TemplateStatusEnum })
  @IsOptional()
  @IsEnum(TemplateStatusEnum)
  status?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @Transform(toArray)
  @IsArray()
  supportedLanguages?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  supportsDarkMode?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  isResponsive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  estimatedDuration?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  changelog?: string;
}
