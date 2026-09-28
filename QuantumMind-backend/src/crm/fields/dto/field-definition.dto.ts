import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { FieldEntity, FieldType } from "@prisma/client";
import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";

export class FieldOptionInput {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  label: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  position?: number;
}

export class CreateFieldDefinitionDto {
  @ApiProperty({ enum: FieldEntity })
  @IsEnum(FieldEntity)
  entity: FieldEntity;

  @ApiProperty({ description: "Machine key, e.g. 'account_tier'." })
  @IsString()
  @Matches(/^[a-z][a-z0-9_]*$/, {
    message: "key must be snake_case starting with a letter.",
  })
  @MaxLength(60)
  key: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  label: string;

  @ApiProperty({ enum: FieldType })
  @IsEnum(FieldType)
  type: FieldType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showOnSheet?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showOnTable?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showOnFilter?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  position?: number;

  @ApiPropertyOptional({ type: [FieldOptionInput], description: "Options for a SELECT field." })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FieldOptionInput)
  options?: FieldOptionInput[];
}

export class UpdateFieldDefinitionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  label?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showOnSheet?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showOnTable?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showOnFilter?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  position?: number;

  @ApiPropertyOptional({ type: [FieldOptionInput], description: "Replaces the option set." })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FieldOptionInput)
  options?: FieldOptionInput[];
}

export class ListFieldsDto {
  @ApiProperty({ enum: FieldEntity })
  @IsEnum(FieldEntity)
  entity: FieldEntity;
}
