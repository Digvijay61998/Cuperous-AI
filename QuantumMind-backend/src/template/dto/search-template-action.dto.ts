import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { TemplateActionTypeEnum } from '../enums/template-action-type.enum';

export class SearchTemplateActionDto {
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
  @ApiPropertyOptional({ default: 20 })
  limit?: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  templateId?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  botId?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  conversationId?: string;

  @IsOptional()
  @IsEnum(TemplateActionTypeEnum)
  @ApiPropertyOptional({ enum: TemplateActionTypeEnum })
  actionType?: string;
}
