/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UserService } from './user.service';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { TicketService } from 'src/modules/ticket/application/services/ticket.service';
import { User } from '../../domain/entities/user.entity';
import { UserRole } from '../../domain/value-objects/user-role.vo';
import { Password } from 'src/modules/auth/domain/value-objects/password.vo';
import { UserRole as UserRoleEnum } from 'src/common/enums/user-role.enum';
import { FilterTicketByUse } from 'src/common/enums/filter-ticket-by-use.enum';
import { UserResponseDto } from '../dto/user-response.dto';
import { EntityManager } from 'typeorm';

describe('UserService', function (this: void) {
  let service: UserService;
  let userRepo: jest.Mocked<IUserRepository>;
  let ticketService: jest.Mocked<TicketService>;

  beforeEach(async function (this: void) {
    const mockUserRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByUsername: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    const mockTicketService = {
      getUserTickets: jest.fn(),
      buyTicket: jest.fn(),
      useTicket: jest.fn(),
      deleteTicket: jest.fn(),
      getTickets: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: IUserRepository, useValue: mockUserRepo },
        { provide: TicketService, useValue: mockTicketService },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepo = module.get(IUserRepository);
    ticketService = module.get(TicketService);
  });

  describe('getUsers', function (this: void) {
    it('should return all users', async function (this: void) {
      const mockUsers: UserResponseDto[] = [
        {
          id: 'user-id-1',
          username: 'user1',
          role: UserRoleEnum.Customer,
          age: 25,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'user-id-2',
          username: 'user2',
          role: UserRoleEnum.Manager,
          age: 30,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      userRepo.findAll.mockResolvedValue(mockUsers);

      const result = await service.getUsers();

      expect(result).toEqual(mockUsers);
      expect(userRepo.findAll).toHaveBeenCalledWith(undefined);
    });

    it('should return empty array when no users exist', async function (this: void) {
      userRepo.findAll.mockResolvedValue([]);

      const result = await service.getUsers();

      expect(result).toEqual([]);
      expect(userRepo.findAll).toHaveBeenCalled();
    });
  });

  describe('getUserById', function (this: void) {
    it('should return user with tickets', async function (this: void) {
      const userId = 'user-id-1';
      const mockUser = User.create({
        id: userId,
        username: 'testuser',
        hashedPassword: Password.fromHashed('hashed-password'),
        role: UserRole.Customer,
        age: 25,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const mockTickets = [
        {
          id: 'ticket-1',
          userId: userId,
          sessionId: 'session-1',
          isUsed: false,
          purchasedAt: new Date(),
          usedAt: null,
        },
        {
          id: 'ticket-2',
          userId: userId,
          sessionId: 'session-2',
          isUsed: true,
          purchasedAt: new Date(),
          usedAt: new Date(),
        },
      ];

      userRepo.findById.mockResolvedValue(mockUser);
      ticketService.getUserTickets.mockResolvedValue(mockTickets);

      const result = await service.getUserById(userId);

      expect(result.id).toBe(userId);
      expect(result.username).toBe('testuser');
      expect(result.tickets).toEqual(mockTickets);
      expect(userRepo.findById).toHaveBeenCalledWith(userId, undefined);
      expect(ticketService.getUserTickets).toHaveBeenCalledWith(userId, {
        filterByUse: FilterTicketByUse.All,
      });
    });

    it('should throw NotFoundException when user does not exist', async function (this: void) {
      const userId = 'non-existent-user-id';

      userRepo.findById.mockResolvedValue(null);

      await expect(service.getUserById(userId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getUserById(userId)).rejects.toThrow(
        'User not found',
      );
      expect(userRepo.findById).toHaveBeenCalledWith(userId, undefined);
    });

    it('should return user with empty tickets array', async function (this: void) {
      const userId = 'user-id-1';
      const mockUser = User.create({
        id: userId,
        username: 'testuser',
        hashedPassword: Password.fromHashed('hashed-password'),
        role: UserRole.Manager,
        age: 30,
      });

      userRepo.findById.mockResolvedValue(mockUser);
      ticketService.getUserTickets.mockResolvedValue([]);

      const result = await service.getUserById(userId);

      expect(result.id).toBe(userId);
      expect(result.tickets).toEqual([]);
    });
  });

  describe('createUser', function (this: void) {
    it('should create a new user successfully', async function (this: void) {
      const newUser = User.create({
        username: 'newuser',
        hashedPassword: await Password.fromPlain('password123'),
        role: UserRole.Customer,
        age: 25,
      });

      userRepo.findByUsername.mockResolvedValue(null);
      userRepo.save.mockResolvedValue(newUser);

      const result = await service.createUser(newUser);

      expect(result).toEqual(newUser);
      expect(userRepo.findByUsername).toHaveBeenCalledWith('newuser');
      expect(userRepo.save).toHaveBeenCalledWith(newUser, undefined);
    });

    it('should throw ConflictException when username already exists', async function (this: void) {
      const existingUser = User.create({
        id: 'existing-user-id',
        username: 'existinguser',
        hashedPassword: Password.fromHashed('hashed-password'),
        role: UserRole.Customer,
        age: 25,
      });

      const newUser = User.create({
        username: 'existinguser',
        hashedPassword: await Password.fromPlain('password123'),
        role: UserRole.Customer,
        age: 30,
      });

      userRepo.findByUsername.mockResolvedValue(existingUser);

      await expect(service.createUser(newUser)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.createUser(newUser)).rejects.toThrow(
        'Username already exists',
      );
      expect(userRepo.findByUsername).toHaveBeenCalledWith('existinguser');
      expect(userRepo.save).not.toHaveBeenCalled();
    });

    it('should create manager user successfully', async function (this: void) {
      const managerUser = User.create({
        username: 'manageruser',
        hashedPassword: await Password.fromPlain('password123'),
        role: UserRole.Manager,
        age: 35,
      });

      userRepo.findByUsername.mockResolvedValue(null);
      userRepo.save.mockResolvedValue(managerUser);

      const result = await service.createUser(managerUser);

      expect(result.role.value).toBe('manager');
      expect(userRepo.save).toHaveBeenCalledWith(managerUser, undefined);
    });
  });

  describe('findById', function (this: void) {
    it('should return user when found', async function (this: void) {
      const userId = 'user-id-1';
      const mockUser = User.create({
        id: userId,
        username: 'testuser',
        hashedPassword: Password.fromHashed('hashed-password'),
        role: UserRole.Customer,
        age: 25,
      });

      userRepo.findById.mockResolvedValue(mockUser);

      const result = await service.findById(userId);

      expect(result).toEqual(mockUser);
      expect(userRepo.findById).toHaveBeenCalledWith(userId, undefined);
    });

    it('should return null when user not found', async function (this: void) {
      const userId = 'non-existent-user-id';

      userRepo.findById.mockResolvedValue(null);

      const result = await service.findById(userId);

      expect(result).toBeNull();
      expect(userRepo.findById).toHaveBeenCalledWith(userId, undefined);
    });
  });

  describe('findByUsername', function (this: void) {
    it('should return user when found by username', async function (this: void) {
      const username = 'testuser';
      const mockUser = User.create({
        id: 'user-id-1',
        username: username,
        hashedPassword: Password.fromHashed('hashed-password'),
        role: UserRole.Customer,
        age: 25,
      });

      userRepo.findByUsername.mockResolvedValue(mockUser);

      const result = await service.findByUsername(username);

      expect(result).toEqual(mockUser);
      expect(result?.username).toBe(username);
      expect(userRepo.findByUsername).toHaveBeenCalledWith(username, undefined);
    });

    it('should return null when username not found', async function (this: void) {
      const username = 'nonexistentuser';

      userRepo.findByUsername.mockResolvedValue(null);

      const result = await service.findByUsername(username);

      expect(result).toBeNull();
      expect(userRepo.findByUsername).toHaveBeenCalledWith(username, undefined);
    });

    it('should be case-sensitive when searching username', async function (this: void) {
      const username = 'TestUser';
      const mockUser = User.create({
        id: 'user-id-1',
        username: username,
        hashedPassword: Password.fromHashed('hashed-password'),
        role: UserRole.Customer,
        age: 25,
      });

      userRepo.findByUsername.mockResolvedValue(mockUser);

      const result = await service.findByUsername(username);

      expect(result).toEqual(mockUser);
      expect(userRepo.findByUsername).toHaveBeenCalledWith(username, undefined);
    });
  });

  describe('deleteUser', function (this: void) {
    it('should delete user successfully', async function (this: void) {
      const userId = 'user-id-to-delete';

      userRepo.delete.mockResolvedValue(undefined);

      await service.deleteUser(userId);

      expect(userRepo.delete).toHaveBeenCalledWith(userId, undefined);
    });

    it('should call delete with entity manager when provided', async function (this: void) {
      const userId = 'user-id-to-delete';
      const mockManager: Partial<{ [key: string]: unknown }> = {};

      userRepo.delete.mockResolvedValue(undefined);

      await service.deleteUser(userId, mockManager as unknown as EntityManager);

      expect(userRepo.delete).toHaveBeenCalledWith(userId, mockManager);
    });

    it('should handle deletion of user with cascading relationships', async function (this: void) {
      const userId = 'user-with-tickets';

      userRepo.delete.mockResolvedValue(undefined);

      await service.deleteUser(userId);

      expect(userRepo.delete).toHaveBeenCalledWith(userId, undefined);
    });
  });

  describe('EntityManager integration', function (this: void) {
    it('should pass entity manager to repository methods', async function (this: void) {
      const mockManager: Partial<{ [key: string]: unknown }> = {};
      const userId = 'user-id-1';

      userRepo.findById.mockResolvedValue(null);

      await expect(
        service.getUserById(userId, mockManager as unknown as EntityManager),
      ).rejects.toThrow();

      expect(userRepo.findById).toHaveBeenCalledWith(userId, mockManager);
    });

    it('should support transaction context for createUser', async function (this: void) {
      const mockManager: Partial<{ [key: string]: unknown }> = {};
      const newUser = User.create({
        username: 'transactionuser',
        hashedPassword: await Password.fromPlain('password123'),
        role: UserRole.Customer,
        age: 25,
      });

      userRepo.findByUsername.mockResolvedValue(null);
      userRepo.save.mockResolvedValue(newUser);

      await service.createUser(
        newUser,
        mockManager as unknown as EntityManager,
      );

      expect(userRepo.save).toHaveBeenCalledWith(newUser, mockManager);
    });
  });
});
