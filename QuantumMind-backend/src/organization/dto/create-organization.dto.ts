import { Type } from 'class-transformer';
import {
  IsEmail,
  IsMongoId,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class OrganizationOwnerDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Rahul' })
  name: string;

  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({ example: 'rahul@abc-health.com' })
  email: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'StrongPass123' })
  password: string;
}

export class CreateOrganizationDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'ABC Healthcare' })
  name: string;

  @ValidateNested()
  @Type(() => OrganizationOwnerDto)
  @ApiProperty({ type: OrganizationOwnerDto })
  owner: OrganizationOwnerDto;

  @IsMongoId()
  @ApiProperty({ description: 'Plan id to attach' })
  planId: string;

  /** Per-org limit overrides layered on top of the plan defaults. */
  @IsObject()
  @IsOptional()
  @ApiProperty({ required: false, example: { maxBots: 3 } })
  limits?: Record<string, number>;

  /** Per-org feature overrides (keys validated against the fixed catalog). */
  @IsObject()
  @IsOptional()
  @ApiProperty({ required: false, example: { 'channel.telegram': true } })
  features?: Record<string, boolean>;
}
