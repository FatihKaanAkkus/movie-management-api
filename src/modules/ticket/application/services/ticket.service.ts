import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';
import { ITicketRepository } from '../../domain/repositories/ticket.repository.interface';
import { IUserRepository } from 'src/modules/user/domain/repositories/user.repository.interface';
import { IMovieSessionRepository } from 'src/modules/movie/domain/repositories/movie-session.repository.interface';
import { TicketResponseDto } from '../dto/ticket-response.dto';
import { GetUserTicketsDto } from '../dto/get-user-tickets.dto';
import { Ticket } from '../../domain/entities/ticket.entity';
import { TicketAlreadyPurchasedException } from '../exceptions/ticket-already-purchased.exception';
import { FilterTicketByUse } from 'src/common/enums/filter-ticket-by-use.enum';

@Injectable()
export class TicketService {
  private readonly logger = new Logger('TicketService');

  constructor(
    private readonly ticketRepo: ITicketRepository,
    private readonly userRepo: IUserRepository,
    private readonly movieSessionRepo: IMovieSessionRepository,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Get all tickets
   */
  async getTickets(): Promise<TicketResponseDto[]> {
    return this.ticketRepo.findAll();
  }

  /**
   * Buy a new ticket for a movie session
   */
  async buyTicket(
    userId: string,
    sessionId: string,
  ): Promise<TicketResponseDto> {
    const trx = await this.startTransaction();
    try {
      // Validate user exists
      const existingUser = await this.userRepo.findById(userId, trx.manager);
      if (!existingUser) {
        throw new NotFoundException(`User ${userId} not found`);
      }

      // Validate movie session exists
      const existingSession = await this.movieSessionRepo.findById(
        sessionId,
        trx.manager,
      );
      if (!existingSession) {
        throw new NotFoundException(`Movie session ${sessionId} not found`);
      }

      // Validate if not already purchased
      const existingTicket = await this.ticketRepo.findByUserAndSession(
        userId,
        sessionId,
        trx.manager,
      );
      if (existingTicket) {
        throw new TicketAlreadyPurchasedException(
          `User ${userId} has already purchased a ticket for session ${sessionId}`,
        );
      }

      const ticket = await this.ticketRepo.save(
        Ticket.create({ userId, sessionId }),
        trx.manager,
      );

      await trx.commitTransaction();

      return ticket;
    } catch (error) {
      if (trx.isTransactionActive) {
        await trx.rollbackTransaction();
      }

      throw error;
    } finally {
      await trx.release();
    }
  }

  /**
   * Use a ticket (mark as watched)
   */
  async useTicket(ticketId: string): Promise<TicketResponseDto> {
    const trx = await this.startTransaction();
    try {
      const ticket = await this.ticketRepo.findById(ticketId, trx.manager);
      if (!ticket) {
        throw new NotFoundException(`Ticket ${ticketId} not found`);
      }

      // Perform marking as used
      ticket.markAsUsed(new Date());

      const savedTicket = await this.ticketRepo.save(ticket, trx.manager);

      await trx.commitTransaction();

      return savedTicket;
    } catch (error) {
      if (trx.isTransactionActive) {
        await trx.rollbackTransaction();
      }

      throw error;
    } finally {
      await trx.release();
    }
  }

  /**
   * Delete a ticket (cancel)
   */
  async deleteTicket(ticketId: string): Promise<void> {
    const trx = await this.startTransaction();
    try {
      const ticket = await this.ticketRepo.findById(ticketId, trx.manager);
      if (!ticket) {
        throw new NotFoundException(`Ticket ${ticketId} not found`);
      }

      // Delete ticket can be enhanced by connecting to refund service in future
      await this.ticketRepo.delete(ticketId, trx.manager);

      await trx.commitTransaction();
    } catch (error) {
      if (trx.isTransactionActive) {
        await trx.rollbackTransaction();
      }

      throw error;
    } finally {
      await trx.release();
    }
  }

  /**
   * Get all tickets for a specific user (watch history)
   */
  async getUserTickets(
    userId: string,
    dto: GetUserTicketsDto = { filterByUse: FilterTicketByUse.All },
  ): Promise<TicketResponseDto[]> {
    const existingUser = await this.userRepo.findById(userId);
    if (!existingUser) {
      throw new NotFoundException(`User ${userId} not found`);
    }
    if (dto.filterByUse === FilterTicketByUse.Unused) {
      return this.ticketRepo.findUnusedByUser(userId);
    }
    if (dto.filterByUse === FilterTicketByUse.Used) {
      return this.ticketRepo.findUsedByUser(userId);
    }
    return this.ticketRepo.findByUser(userId);
  }

  /**
   * Helper method to start a new transaction
   */
  private async startTransaction(): Promise<QueryRunner> {
    const trx = this.dataSource.createQueryRunner();
    await trx.connect();
    await trx.startTransaction();
    return trx;
  }
}
