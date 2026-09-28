import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { DealStage } from "@prisma/client";
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class UpdateDealStageDto {
  @ApiProperty({ enum: DealStage })
  @IsEnum(DealStage)
  stage: DealStage;

  @ApiPropertyOptional({ description: "Reason, recorded when closing a deal." })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  closedReason?: string;
}

export class DealContactDto {
  @ApiProperty()
  @IsString()
  contactId: string;

  @ApiPropertyOptional({ description: "Role of the contact on this deal." })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  role?: string;
}

export class BulkDealIdsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  ids: string[];
}

export class BulkAssignDealOwnerDto extends BulkDealIdsDto {
  @ApiPropertyOptional({ description: "Owner (Mongo user id), or null to unassign." })
  @IsOptional()
  @IsString()
  ownerId?: string | null;
}
