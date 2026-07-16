import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { TicketActivitiesEnum } from '../enums/ticket-activities.enum';

export class CreateActivityDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsOptional()
  ticket: string;

  @IsString()
  @IsOptional()
  agent: string;

  @IsString()
  @IsNotEmpty()
  @IsEnum(TicketActivitiesEnum)
  status: string;
}
