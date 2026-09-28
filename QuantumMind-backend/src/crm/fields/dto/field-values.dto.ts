import { ApiProperty } from "@nestjs/swagger";
import { FieldEntity } from "@prisma/client";
import { IsEnum, IsObject, IsString } from "class-validator";

export class GetFieldValuesDto {
  @ApiProperty({ enum: FieldEntity })
  @IsEnum(FieldEntity)
  entity: FieldEntity;

  @ApiProperty()
  @IsString()
  recordId: string;
}

export class ApplyFieldValuesDto {
  @ApiProperty({ enum: FieldEntity })
  @IsEnum(FieldEntity)
  entity: FieldEntity;

  @ApiProperty()
  @IsString()
  recordId: string;

  @ApiProperty({
    description:
      "Map of fieldId -> value. Null/empty clears. SELECT expects an optionId; USER expects a user id.",
    type: Object,
  })
  @IsObject()
  values: Record<string, unknown>;
}
