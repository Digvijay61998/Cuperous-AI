import {
  IsEnum,
  IsMongoId,
  IsObject,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrganizationStatus } from '../enums/organization-status.enum';

export class UpdateOrganizationDto {
  @IsEnum(OrganizationStatus)
  @IsOptional()
  @ApiProperty({ enum: OrganizationStatus, required: false })
  status?: OrganizationStatus;

  @IsMongoId()
  @IsOptional()
  @ApiProperty({ required: false, description: 'Move org to a different plan' })
  planId?: string;

  @IsObject()
  @IsOptional()
  @ApiProperty({ required: false, example: { maxBots: 3 } })
  limits?: Record<string, number>;

  @IsObject()
  @IsOptional()
  @ApiProperty({ required: false, example: { 'channel.telegram': true } })
  features?: Record<string, boolean>;
}
