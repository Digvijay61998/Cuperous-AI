import { Global, Module } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { TicketProviders } from './ticket.provider';

@Global()
@Module({
  controllers: [TicketsController],
  providers: [TicketsService, ...TicketProviders],
  exports: [TicketsService],
})
export class TicketsModule {}
