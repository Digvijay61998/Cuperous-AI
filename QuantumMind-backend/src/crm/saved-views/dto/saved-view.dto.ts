import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { FieldEntity } from "@prisma/client";
import {
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

export class ListSavedViewsDto {
  @ApiProperty({ enum: FieldEntity })
  @IsEnum(FieldEntity)
  entity: FieldEntity;
}

export class CreateSavedViewDto {
  @ApiProperty({ enum: FieldEntity })
  @IsEnum(FieldEntity)
  entity: FieldEntity;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name: string;

  @ApiPropertyOptional({ default: false, description: "Visible to the whole org." })
  @IsOptional()
  @IsBoolean()
  shared?: boolean;

  @ApiProperty({ description: "Arbitrary filter payload (q, facets, sort).", type: Object })
  @IsObject()
  filters: Record<string, unknown>;
}

export class UpdateSavedViewDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  shared?: boolean;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  filters?: Record<string, unknown>;
}
