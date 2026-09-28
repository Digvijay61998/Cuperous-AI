import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { DealStage } from "@prisma/client";
import { Type } from "class-transformer";
import {
  IsEnum,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export class CreateDealDto {
  @ApiProperty()
  @IsString()
  @MinLength(1, { message: "A deal needs a name." })
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ description: "Company this deal belongs to." })
  @IsString()
  companyId: string;

  @ApiPropertyOptional({ description: "Owner (Mongo user id)." })
  @IsOptional()
  @IsString()
  ownerId?: string;

  @ApiPropertyOptional({ enum: DealStage })
  @IsOptional()
  @IsEnum(DealStage)
  stage?: DealStage;

  @ApiPropertyOptional({ description: "Deal amount." })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1_000_000_000_000)
  amount?: number;

  @ApiPropertyOptional({ default: "USD" })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiPropertyOptional({ description: "Expected close date (ISO 8601)." })
  @IsOptional()
  @IsISO8601()
  expectedCloseDate?: string;
}
