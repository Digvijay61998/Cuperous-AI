import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ArrayNotEmpty, IsArray, IsOptional, IsString } from "class-validator";

export class BulkCompanyIdsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  ids: string[];
}

export class BulkAssignCompanyOwnerDto extends BulkCompanyIdsDto {
  @ApiPropertyOptional({ description: "Owner (Mongo user id), or null to unassign." })
  @IsOptional()
  @IsString()
  ownerId?: string | null;
}
