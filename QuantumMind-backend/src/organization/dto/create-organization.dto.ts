import { Type } from 'class-transformer';
import {
  IsEmail,
  IsMongoId,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LimitsOverrideDto } from './limits.dto';

export class OrganizationOwnerDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @ApiProperty({ example: 'Rahul' })
  name: string;

  @IsEmail()
  @IsNotEmpty()
  @MaxLength(254)
  @ApiProperty({ example: 'rahul@abc-health.com' })
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @ApiProperty({ example: 'StrongPass123' })
  password: string;
}

export class CreateOrganizationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
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
  @IsOptional()
  @ValidateNested()
  @Type(() => LimitsOverrideDto)
  @ApiProperty({ required: false, type: LimitsOverrideDto })
  limits?: LimitsOverrideDto;

  /** Per-org feature overrides (keys validated against the fixed catalog). */
  @IsObject()
  @IsOptional()
  @ApiProperty({ required: false, example: { 'channel.telegram': true } })
  features?: Record<string, boolean>;
}
