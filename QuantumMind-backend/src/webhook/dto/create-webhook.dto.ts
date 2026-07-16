import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsDate,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWebhookDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  url: string;

  @IsString()
  @IsNotEmpty()
  verifyToken: string;

  @IsString()
  @IsOptional()
  headersKey: string;

  @IsString()
  @IsOptional()
  headersValue: string;

  @IsString()
  @IsOptional()
  basicAuthUsername: string;

  @IsString()
  @IsOptional()
  basicAuthPassword: string;

  @IsString()
  @IsOptional()
  events: string;

  @IsBoolean()
  @IsOptional()
  isActive: boolean;
}
