import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsIn, IsInt, IsISO8601, IsMongoId, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";
import { IncidentStatusEnum } from "../enums/incident.enum";

export class ListIncidentsDto {
  @ApiPropertyOptional({ enum: IncidentStatusEnum })
  @IsOptional()
  @IsIn(Object.values(IncidentStatusEnum))
  status?: IncidentStatusEnum;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  bot?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number;

  @ApiPropertyOptional({ default: 20, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class IncidentContextDto {
  /** ISO date: earlier incidents opened before this (the previous page's cursor). */
  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  earlierBefore?: string;

  @ApiPropertyOptional({ default: 20, maximum: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  earlierLimit?: number;
}

export class EmailReplyDto {
  @ApiProperty({ minLength: 1, maxLength: 5000 })
  @IsString()
  @MaxLength(5000)
  body: string;
}

export class ResolveIncidentDto {
  /** Length (10–2000 after trimming) is checked in the service (R10.6). */
  @ApiProperty({ minLength: 10, maxLength: 2000 })
  @IsString()
  @MaxLength(4000)
  note: string;
}
