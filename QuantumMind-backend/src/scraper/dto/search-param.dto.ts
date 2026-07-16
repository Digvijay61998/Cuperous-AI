import { ApiPropertyOptional, ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";
import { ScrapeStatusEnum } from "../enum/scrape-status.enum";
import { ObjectId } from "mongoose";

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
  @IsEnum(ScrapeStatusEnum)
  @ApiPropertyOptional({
    enum: ScrapeStatusEnum,
  })
  status?: string;

  @IsOptional()
  @Type(() => Array)
  @ApiPropertyOptional()
  @ApiProperty({
    isArray: true,
  })
  tags?: string[];
}
