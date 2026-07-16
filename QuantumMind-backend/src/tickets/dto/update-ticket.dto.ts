import { PartialType } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { TicketStatusEnum } from '../enums/ticket-status.enum';
import { CreateTicketDto } from './create-ticket.dto';

export class UpdateTicketDto extends PartialType(CreateTicketDto) {
  @IsOptional()
  status: TicketStatusEnum;
}
