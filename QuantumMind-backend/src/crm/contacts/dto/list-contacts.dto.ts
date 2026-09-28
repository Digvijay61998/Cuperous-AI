import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";
import { toArray, toBool } from "../../common/list.util";

/**
 * Query params for GET /crm/contacts. Applied with a transforming
 * ValidationPipe at the route so `page`/`pageSize` arrive as numbers and the
 * multi-value filters (`owner`, `company`, `source`) normalise to arrays whether
 * the client sends one value or many.
 */
export class ListContactsDto {
  @ApiPropertyOptional({ description: "Free-text search (name, email, company)." })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({
    description: "Sort column.",
    enum: ["name", "email", "title", "company", "createdAt", "lastActivity"],
  })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({ enum: ["asc", "desc"] })
  @IsOptional()
  @IsIn(["asc", "desc"])
  dir?: "asc" | "desc";

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 25, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 25;

  @ApiPropertyOptional({ description: "Filter by owner id(s). 'unassigned' for none." })
  @IsOptional()
  @Transform(({ value }) => toArray(value))
  @IsArray()
  owner?: string[] = [];

  @ApiPropertyOptional({ description: "Filter by company id(s). 'none' for no company." })
  @IsOptional()
  @Transform(({ value }) => toArray(value))
  @IsArray()
  company?: string[] = [];

  @ApiPropertyOptional({ description: "Filter by record source(s)." })
  @IsOptional()
  @Transform(({ value }) => toArray(value))
  @IsArray()
  source?: string[] = [];

  @ApiPropertyOptional({ default: false, description: "Show archived instead of active." })
  @IsOptional()
  @Transform(({ value }) => toBool(value))
  @IsBoolean()
  archived?: boolean = false;
}
