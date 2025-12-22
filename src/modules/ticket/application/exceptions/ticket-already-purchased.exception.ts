import { ConflictException } from '@nestjs/common';

export class TicketAlreadyPurchasedException extends ConflictException {
  constructor(ticketId: string) {
    super(`Ticket with ID ${ticketId} has already been purchased`);
    this.name = 'TicketAlreadyPurchasedException';
  }
}
