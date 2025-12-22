import { EntityManager } from 'typeorm';
import { Ticket } from '../entities/ticket.entity';

export abstract class ITicketRepository {
  // Find all tickets
  abstract findAll(mgr?: EntityManager): Promise<Ticket[]>;

  // Find a ticket by its unique ID
  abstract findById(id: string, mgr?: EntityManager): Promise<Ticket | null>;

  // Find all tickets purchased by a specific user
  abstract findByUser(userId: string, mgr?: EntityManager): Promise<Ticket[]>;

  // Find all used tickets for a specific user
  abstract findUsedByUser(
    userId: string,
    mgr?: EntityManager,
  ): Promise<Ticket[]>;

  // Find all unused tickets for a specific user
  abstract findUnusedByUser(
    userId: string,
    mgr?: EntityManager,
  ): Promise<Ticket[]>;

  // Find all tickets for a specific movie session
  abstract findBySession(
    sessionId: string,
    mgr?: EntityManager,
  ): Promise<Ticket[]>;

  // Find a ticket by user ID and session ID
  abstract findByUserAndSession(
    userId: string,
    sessionId: string,
    mgr?: EntityManager,
  ): Promise<Ticket | null>;

  // Save or update a ticket (buy or mark as used)
  abstract save(ticket: Ticket, mgr?: EntityManager): Promise<Ticket>;

  // Delete a ticket (cancel)
  abstract delete(id: string, mgr?: EntityManager): Promise<void>;
}
