import { Type } from 'class-transformer';
import {
  IsEnum,
  IsMongoId,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrganizationStatus } from '../enums/organization-status.enum';
import { SubscriptionStatus } from 'src/billing/enums/subscription-status.enum';
import { LimitsOverrideDto } from './limits.dto';

export class UpdateOrganizationDto {
  @IsString()
  @IsOptional()
  @MaxLength(120)
  @ApiProperty({ required: false })
  name?: string;

  @IsEnum(OrganizationStatus)
  @IsOptional()
  @ApiProperty({ enum: OrganizationStatus, required: false })
  status?: OrganizationStatus;

  @IsEnum(SubscriptionStatus)
  @IsOptional()
  @ApiProperty({ enum: SubscriptionStatus, required: false })
  subscriptionStatus?: SubscriptionStatus;

  @IsMongoId()
  @IsOptional()
  @ApiProperty({ required: false, description: 'Move org to a different plan' })
  planId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => LimitsOverrideDto)
  @ApiProperty({ required: false, type: LimitsOverrideDto })
  limits?: LimitsOverrideDto;

  @IsObject()
  @IsOptional()
  @ApiProperty({ required: false, example: { 'channel.telegram': true } })
  features?: Record<string, boolean>;
}
