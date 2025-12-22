import { v4 as uuidv4 } from 'uuid';
import { TicketAlreadyUsedException } from '../../application/exceptions/ticket-already-used.exception';

export interface TicketProps {
  id?: string;
  userId: string;
  sessionId: string;
  purchasedAt?: Date;
  isUsed?: boolean;
  usedAt?: Date | null;
}

export class Ticket {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly sessionId: string,
    public readonly purchasedAt: Date,
    public isUsed: boolean,
    public usedAt: Date | null,
  ) {}

  static create(props: TicketProps): Ticket {
    return new Ticket(
      props.id ?? uuidv4(),
      props.userId,
      props.sessionId,
      props.purchasedAt ?? new Date(),
      props.isUsed ?? false,
      props.usedAt ?? null,
    );
  }

  markAsUsed(usedAt: Date): Ticket {
    if (this.isUsed) {
      throw new TicketAlreadyUsedException(this.id);
    }
    this.isUsed = true;
    this.usedAt = usedAt;
    return this;
  }
}
