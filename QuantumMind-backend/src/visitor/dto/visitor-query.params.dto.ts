import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNumber, IsOptional, Min, IsEnum } from "class-validator";
import { VisitorStatusEnum } from "../enums/visitor-status.enum";

export class VisitorQueryParams {
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
  @ApiPropertyOptional()
  @ApiProperty()
  bot?: string;

  @IsOptional()
  @Type(() => String)
  @IsEnum(VisitorStatusEnum)
  @ApiPropertyOptional({
    enum: VisitorStatusEnum,
  })
  status?: string;

  @IsOptional()
  @Type(() => String)
  @ApiPropertyOptional()
  @ApiProperty()
  startDate?: string;

  @IsOptional()
  @Type(() => String)
  @ApiPropertyOptional()
  @ApiProperty()
  endDate?: string;

  @IsOptional()
  @ApiPropertyOptional()
  text?: string;
}
