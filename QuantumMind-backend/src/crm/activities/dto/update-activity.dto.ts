import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsISO8601, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateActivityDto {
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

  @ApiPropertyOptional({ description: "Due date (ISO 8601), or null to clear." })
  @IsOptional()
  @IsISO8601()
  dueAt?: string | null;

  @ApiPropertyOptional({ description: "Mark the task complete/incomplete." })
  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}
