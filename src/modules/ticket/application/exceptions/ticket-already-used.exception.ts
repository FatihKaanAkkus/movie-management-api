import { ConflictException } from '@nestjs/common';

export class TicketAlreadyUsedException extends ConflictException {
  constructor(ticketId: string) {
    super(`Ticket with ID ${ticketId} has already been used`);
    this.name = 'TicketAlreadyUsedException';
  }
}
