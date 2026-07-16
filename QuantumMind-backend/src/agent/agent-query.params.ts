import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { ObjectId } from 'mongoose';
import { AgentStatusEnum } from './enums/agent-status.enum';

export class AgentQueryParams {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @ApiPropertyOptional({
    default: 0,
  })
  skip?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @ApiPropertyOptional({
    default: 10,
  })
  limit?: number;

  @IsOptional()
  @Type(() => String)
  @IsEnum(AgentStatusEnum)
  @ApiPropertyOptional({
    enum: AgentStatusEnum,
  })
  status?: string;

  @IsOptional()
  @Type(() => String)
  @ApiPropertyOptional({
    isArray: true,
  })
  @ApiProperty({
    isArray: true,
  })
  tags?: ObjectId[];

  @IsOptional()
  @Type(() => String)
  @ApiPropertyOptional()
  @ApiProperty()
  bot?: string;
}
