import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PlatformEnum } from '../enums/platform.enum';

export class CreateConversationDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  agent?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  visitor: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  type: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  bot: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty()
  @IsOptional()
  @IsArray({
    each: true,
  })
  chats?: string[];

  @IsBoolean()
  anonymous?: boolean;

  @ApiProperty({
    enum: PlatformEnum,
  })
  @IsOptional()
  @IsEnum(PlatformEnum)
  platform?: string;
}
