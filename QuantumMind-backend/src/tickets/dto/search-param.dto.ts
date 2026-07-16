import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { TicketPriorityEnum } from '../enums/ticket-priority';
import { TicketStatusEnum } from '../enums/ticket-status.enum';

export class SearchParamDto {
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
  @IsEnum(TicketStatusEnum)
  @ApiPropertyOptional({
    enum: TicketStatusEnum,
  })
  status?: string;

  @IsOptional()
  @Type(() => String)
  @IsEnum(TicketPriorityEnum)
  @ApiPropertyOptional({
    enum: TicketPriorityEnum,
  })
  priority?: string;

  @IsOptional()
  @Type(() => String)
  @ApiPropertyOptional({
    isArray: true,
  })
  @ApiProperty({
    isArray: true,
  })
  tags?: string[];

  @IsOptional()
  @Type(() => String)
  @ApiPropertyOptional()
  startDate?: Date;

  @IsOptional()
  @Type(() => String)
  @ApiPropertyOptional()
  endDate?: Date;

  @IsOptional()
  @Type(() => String)
  @ApiPropertyOptional()
  @ApiProperty()
  bot?: string;
}
