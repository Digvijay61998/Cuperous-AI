import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ActivityType } from "@prisma/client";
import {
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class CreateActivityDto {
  @ApiProperty({ enum: ActivityType })
  @IsEnum(ActivityType)
  type: ActivityType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  subject?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  body?: string;

  @ApiPropertyOptional({ description: "When it happened (ISO 8601)." })
  @IsOptional()
  @IsISO8601()
  occurredAt?: string;

  @ApiPropertyOptional({ description: "Due date for a task (ISO 8601)." })
  @IsOptional()
  @IsISO8601()
  dueAt?: string;

  @ApiPropertyOptional({ description: "Linked contact id." })
  @IsOptional()
  @IsString()
  contactId?: string;

  @ApiPropertyOptional({ description: "Linked company id." })
  @IsOptional()
  @IsString()
  companyId?: string;

  @ApiPropertyOptional({ description: "Linked deal id." })
  @IsOptional()
  @IsString()
  dealId?: string;
}
