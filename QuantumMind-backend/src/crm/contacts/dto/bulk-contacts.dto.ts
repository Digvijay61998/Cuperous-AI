import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ArrayNotEmpty, IsArray, IsOptional, IsString } from "class-validator";

export class BulkContactIdsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  ids: string[];
}

export class BulkAssignOwnerDto extends BulkContactIdsDto {
  @ApiPropertyOptional({ description: "Owner (Mongo user id), or null to unassign." })
  @IsOptional()
  @IsString()
  ownerId?: string | null;
}

export class BulkSetCompanyDto extends BulkContactIdsDto {
  @ApiPropertyOptional({ description: "Company id, or null to clear." })
  @IsOptional()
  @IsString()
  companyId?: string | null;
}
