/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager, QueryRunner } from 'typeorm';
import { TicketService } from './ticket.service';
import { ITicketRepository } from '../../domain/repositories/ticket.repository.interface';
import { IUserRepository } from 'src/modules/user/domain/repositories/user.repository.interface';
import { IMovieSessionRepository } from 'src/modules/movie/domain/repositories/movie-session.repository.interface';
import { Ticket } from '../../domain/entities/ticket.entity';
import { TicketAlreadyPurchasedException } from '../exceptions/ticket-already-purchased.exception';
import { FilterTicketByUse } from 'src/common/enums/filter-ticket-by-use.enum';
import { MovieSessionTimeSlot } from 'src/common/enums/movie-session-timeslot.enum';
import { User } from 'src/modules/user/domain/entities/user.entity';
import { UserRole } from 'src/modules/user/domain/value-objects/user-role.vo';
import { Password } from 'src/modules/auth/domain/value-objects/password.vo';
import { TicketResponseDto } from '../dto/ticket-response.dto';
import { MovieSession } from 'src/modules/movie/domain/entities/movie-session.entity';

describe('TicketService', function (this: void) {
  let service: TicketService;
  let ticketRepo: jest.Mocked<ITicketRepository>;
  let userRepo: jest.Mocked<IUserRepository>;
  let movieSessionRepo: jest.Mocked<IMovieSessionRepository>;
  let mockQueryRunner: jest.Mocked<QueryRunner>;

  beforeEach(async function (this: void) {
    const mockTicketRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByUser: jest.fn(),
      findUsedByUser: jest.fn(),
      findUnusedByUser: jest.fn(),
      findByUserAndSession: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    const mockUserRepo = {
      findById: jest.fn(),
      findByUsername: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    const mockMovieSessionRepo = {
      findById: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    mockQueryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {} as unknown as EntityManager,
      isTransactionActive: true,
    } as unknown as jest.Mocked<QueryRunner>;

    const mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketService,
        { provide: ITicketRepository, useValue: mockTicketRepo },
        { provide: IUserRepository, useValue: mockUserRepo },
        { provide: IMovieSessionRepository, useValue: mockMovieSessionRepo },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<TicketService>(TicketService);
    ticketRepo = module.get(ITicketRepository);
    userRepo = module.get(IUserRepository);
    movieSessionRepo = module.get(IMovieSessionRepository);
  });

  describe('getTickets', function (this: void) {
    it('should return all tickets', async function (this: void) {
      const mockTickets = [
        Ticket.create({
          id: 'ticket-1',
          userId: 'user-1',
          sessionId: 'session-1',
          purchasedAt: new Date(),
          isUsed: false,
          usedAt: null,
        }),
        Ticket.create({
          id: 'ticket-2',
          userId: 'user-2',
          sessionId: 'session-2',
          purchasedAt: new Date(),
          isUsed: true,
          usedAt: new Date(),
        }),
      ];
      const mockTicketDtos: TicketResponseDto[] = mockTickets;

      ticketRepo.findAll.mockResolvedValue(mockTickets);

      const result = await service.getTickets();

      expect(result).toEqual(mockTicketDtos);
      expect(ticketRepo.findAll).toHaveBeenCalled();
    });

    it('should return empty array when no tickets exist', async function (this: void) {
      ticketRepo.findAll.mockResolvedValue([]);

      const result = await service.getTickets();

      expect(result).toEqual([]);
      expect(ticketRepo.findAll).toHaveBeenCalled();
    });
  });

  describe('buyTicket', function (this: void) {
    const userId = 'user-id-1';
    const sessionId = 'session-id-1';

    it('should buy ticket successfully', async function (this: void) {
      const mockUser = User.create({
        id: userId,
        username: 'testuser',
        hashedPassword: Password.fromHashed('hashed-password'),
        role: UserRole.Customer,
        age: 25,
      });

      const mockSession = MovieSession.create({
        id: sessionId,
        movieId: 'movie-1',
        date: new Date(Date.now() + 60000),
        timeslot: MovieSessionTimeSlot.Evening,
        roomNumber: 5,
      });

      const mockTicket = Ticket.create({
        id: 'ticket-1',
        userId,
        sessionId,
        purchasedAt: new Date(),
        isUsed: false,
        usedAt: null,
      });

      userRepo.findById.mockResolvedValue(mockUser);
      movieSessionRepo.findById.mockResolvedValue(mockSession);
      ticketRepo.findByUserAndSession.mockResolvedValue(null);
      ticketRepo.save.mockResolvedValue(mockTicket);

      const result = await service.buyTicket(userId, sessionId);

      expect(result).toEqual(mockTicket);
      expect(userRepo.findById).toHaveBeenCalledWith(
        userId,
        mockQueryRunner.manager,
      );
      expect(movieSessionRepo.findById).toHaveBeenCalledWith(
        sessionId,
        mockQueryRunner.manager,
      );
      expect(ticketRepo.findByUserAndSession).toHaveBeenCalledWith(
        userId,
        sessionId,
        mockQueryRunner.manager,
      );
      expect(ticketRepo.save).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should throw NotFoundException when user does not exist', async function (this: void) {
      userRepo.findById.mockResolvedValue(null);

      await expect(service.buyTicket(userId, sessionId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.buyTicket(userId, sessionId)).rejects.toThrow(
        `User ${userId} not found`,
      );
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should throw NotFoundException when session does not exist', async function (this: void) {
      const mockUser = User.create({
        id: userId,
        username: 'testuser',
        hashedPassword: Password.fromHashed('hashed-password'),
        role: UserRole.Customer,
        age: 25,
      });

      userRepo.findById.mockResolvedValue(mockUser);
      movieSessionRepo.findById.mockResolvedValue(null);

      await expect(service.buyTicket(userId, sessionId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.buyTicket(userId, sessionId)).rejects.toThrow(
        `Movie session ${sessionId} not found`,
      );
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should throw TicketAlreadyPurchasedException when ticket already exists', async function (this: void) {
      const mockUser = User.create({
        id: userId,
        username: 'testuser',
        hashedPassword: Password.fromHashed('hashed-password'),
        role: UserRole.Customer,
        age: 25,
      });

      const mockSession = MovieSession.create({
        id: sessionId,
        movieId: 'movie-1',
        date: new Date(Date.now() + 60000),
        timeslot: MovieSessionTimeSlot.Evening,
        roomNumber: 5,
      });

      const existingTicket = Ticket.create({
        id: 'existing-ticket',
        userId,
        sessionId,
        purchasedAt: new Date(),
        isUsed: false,
        usedAt: null,
      });

      userRepo.findById.mockResolvedValue(mockUser);
      movieSessionRepo.findById.mockResolvedValue(mockSession);
      ticketRepo.findByUserAndSession.mockResolvedValue(existingTicket);

      await expect(service.buyTicket(userId, sessionId)).rejects.toThrow(
        TicketAlreadyPurchasedException,
      );
      expect(ticketRepo.save).not.toHaveBeenCalled();
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should rollback transaction on error', async function (this: void) {
      const mockUser = User.create({
        id: userId,
        username: 'testuser',
        hashedPassword: Password.fromHashed('hashed-password'),
        role: UserRole.Customer,
        age: 25,
      });

      userRepo.findById.mockResolvedValue(mockUser);
      movieSessionRepo.findById.mockRejectedValue(new Error('Database error'));

      await expect(service.buyTicket(userId, sessionId)).rejects.toThrow(
        'Database error',
      );
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });
  });

  describe('useTicket', function (this: void) {
    it('should mark ticket as used successfully', async function (this: void) {
      const ticketId = 'ticket-1';
      const mockTicket = Ticket.create({
        id: ticketId,
        userId: 'user-1',
        sessionId: 'session-1',
        purchasedAt: new Date(),
        isUsed: false,
        usedAt: null,
      });

      const usedTicket = Ticket.create({
        ...mockTicket,
        isUsed: true,
        usedAt: new Date(),
      });

      ticketRepo.findById.mockResolvedValue(mockTicket);
      ticketRepo.save.mockResolvedValue(usedTicket);

      const result = await service.useTicket(ticketId);

      expect(result.isUsed).toBe(true);
      expect(result.usedAt).not.toBeNull();
      expect(ticketRepo.findById).toHaveBeenCalledWith(
        ticketId,
        mockQueryRunner.manager,
      );
      expect(ticketRepo.save).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should throw NotFoundException when ticket does not exist', async function (this: void) {
      const ticketId = 'non-existent-ticket';

      ticketRepo.findById.mockResolvedValue(null);

      await expect(service.useTicket(ticketId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.useTicket(ticketId)).rejects.toThrow(
        `Ticket ${ticketId} not found`,
      );
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should rollback transaction on error', async function (this: void) {
      const ticketId = 'ticket-1';
      const mockTicket = Ticket.create({
        id: ticketId,
        userId: 'user-1',
        sessionId: 'session-1',
        purchasedAt: new Date(),
        isUsed: false,
        usedAt: null,
      });

      ticketRepo.findById.mockResolvedValue(mockTicket);
      ticketRepo.save.mockRejectedValue(new Error('Database error'));

      await expect(service.useTicket(ticketId)).rejects.toThrow(
        'Database error',
      );
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });
  });

  describe('deleteTicket', function (this: void) {
    it('should delete ticket successfully', async function (this: void) {
      const ticketId = 'ticket-1';
      const mockTicket = Ticket.create({
        id: ticketId,
        userId: 'user-1',
        sessionId: 'session-1',
        purchasedAt: new Date(),
        isUsed: false,
        usedAt: null,
      });

      ticketRepo.findById.mockResolvedValue(mockTicket);
      ticketRepo.delete.mockResolvedValue(undefined);

      await service.deleteTicket(ticketId);

      expect(ticketRepo.findById).toHaveBeenCalledWith(
        ticketId,
        mockQueryRunner.manager,
      );
      expect(ticketRepo.delete).toHaveBeenCalledWith(
        ticketId,
        mockQueryRunner.manager,
      );
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should throw NotFoundException when ticket does not exist', async function (this: void) {
      const ticketId = 'non-existent-ticket';

      ticketRepo.findById.mockResolvedValue(null);

      await expect(service.deleteTicket(ticketId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.deleteTicket(ticketId)).rejects.toThrow(
        `Ticket ${ticketId} not found`,
      );
      expect(ticketRepo.delete).not.toHaveBeenCalled();
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should rollback transaction on error', async function (this: void) {
      const ticketId = 'ticket-1';
      const mockTicket = Ticket.create({
        id: ticketId,
        userId: 'user-1',
        sessionId: 'session-1',
        purchasedAt: new Date(),
        isUsed: false,
        usedAt: null,
      });

      ticketRepo.findById.mockResolvedValue(mockTicket);
      ticketRepo.delete.mockRejectedValue(new Error('Database error'));

      await expect(service.deleteTicket(ticketId)).rejects.toThrow(
        'Database error',
      );
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });
  });

  describe('getUserTickets', function (this: void) {
    const userId = 'user-1';

    beforeEach(function (this: void) {
      const mockUser = User.create({
        id: userId,
        username: 'testuser',
        hashedPassword: Password.fromHashed('hashed-password'),
        role: UserRole.Customer,
        age: 25,
      });
      userRepo.findById.mockResolvedValue(mockUser);
    });

    it('should return all tickets when filter is All', async function (this: void) {
      const mockTickets = [
        Ticket.create({
          id: 'ticket-1',
          userId,
          sessionId: 'session-1',
          purchasedAt: new Date(),
          isUsed: false,
          usedAt: null,
        }),
        Ticket.create({
          id: 'ticket-2',
          userId,
          sessionId: 'session-2',
          purchasedAt: new Date(),
          isUsed: true,
          usedAt: new Date(),
        }),
      ];

      ticketRepo.findByUser.mockResolvedValue(mockTickets);

      const result = await service.getUserTickets(userId, {
        filterByUse: FilterTicketByUse.All,
      });

      expect(result).toEqual(mockTickets);
      expect(ticketRepo.findByUser).toHaveBeenCalledWith(userId);
    });

    it('should return only unused tickets when filter is Unused', async function (this: void) {
      const mockUnusedTickets = [
        Ticket.create({
          id: 'ticket-1',
          userId,
          sessionId: 'session-1',
          purchasedAt: new Date(),
          isUsed: false,
          usedAt: null,
        }),
      ];

      ticketRepo.findUnusedByUser.mockResolvedValue(mockUnusedTickets);

      const result = await service.getUserTickets(userId, {
        filterByUse: FilterTicketByUse.Unused,
      });

      expect(result).toEqual(mockUnusedTickets);
      expect(ticketRepo.findUnusedByUser).toHaveBeenCalledWith(userId);
      expect(result.every((t) => !t.isUsed)).toBe(true);
    });

    it('should return only used tickets when filter is Used', async function (this: void) {
      const mockUsedTickets = [
        Ticket.create({
          id: 'ticket-2',
          userId,
          sessionId: 'session-2',
          purchasedAt: new Date(),
          isUsed: true,
          usedAt: new Date(),
        }),
      ];

      ticketRepo.findUsedByUser.mockResolvedValue(mockUsedTickets);

      const result = await service.getUserTickets(userId, {
        filterByUse: FilterTicketByUse.Used,
      });

      expect(result).toEqual(mockUsedTickets);
      expect(ticketRepo.findUsedByUser).toHaveBeenCalledWith(userId);
      expect(result.every((t) => t.isUsed)).toBe(true);
    });

    it('should default to All filter when no dto provided', async function (this: void) {
      const mockTickets = [
        Ticket.create({
          id: 'ticket-1',
          userId,
          sessionId: 'session-1',
          purchasedAt: new Date(),
          isUsed: false,
          usedAt: null,
        }),
      ];

      ticketRepo.findByUser.mockResolvedValue(mockTickets);

      const result = await service.getUserTickets(userId);

      expect(result).toEqual(mockTickets);
      expect(ticketRepo.findByUser).toHaveBeenCalledWith(userId);
    });

    it('should throw NotFoundException when user does not exist', async function (this: void) {
      const nonExistentUserId = 'non-existent-user';

      userRepo.findById.mockResolvedValue(null);

      await expect(
        service.getUserTickets(nonExistentUserId, {
          filterByUse: FilterTicketByUse.All,
        }),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.getUserTickets(nonExistentUserId, {
          filterByUse: FilterTicketByUse.All,
        }),
      ).rejects.toThrow(`User ${nonExistentUserId} not found`);
      expect(ticketRepo.findByUser).not.toHaveBeenCalled();
    });

    it('should return empty array when user has no tickets', async function (this: void) {
      ticketRepo.findByUser.mockResolvedValue([]);

      const result = await service.getUserTickets(userId, {
        filterByUse: FilterTicketByUse.All,
      });

      expect(result).toEqual([]);
      expect(ticketRepo.findByUser).toHaveBeenCalledWith(userId);
    });
  });

  describe('Transaction management', function (this: void) {
    it('should properly manage transaction lifecycle on success', async function (this: void) {
      const ticketId = 'ticket-1';
      const mockTicket = Ticket.create({
        id: ticketId,
        userId: 'user-1',
        sessionId: 'session-1',
        purchasedAt: new Date(),
        isUsed: false,
        usedAt: null,
      });

      ticketRepo.findById.mockResolvedValue(mockTicket);
      ticketRepo.delete.mockResolvedValue(undefined);

      await service.deleteTicket(ticketId);

      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.rollbackTransaction).not.toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should rollback and release on transaction failure', async function (this: void) {
      const userId = 'user-1';
      const sessionId = 'session-1';

      userRepo.findById.mockRejectedValue(
        new Error('Database connection lost'),
      );

      await expect(service.buyTicket(userId, sessionId)).rejects.toThrow(
        'Database connection lost',
      );

      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).not.toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });
  });
});
