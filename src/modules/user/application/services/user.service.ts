import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { TicketService } from 'src/modules/ticket/application/services/ticket.service';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import {
  UserResponseDto,
  UserWithTicketsResponseDto,
} from '../dto/user-response.dto';
import { User } from '../../domain/entities/user.entity';
import { FilterTicketByUse } from 'src/common/enums/filter-ticket-by-use.enum';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly ticketService: TicketService,
  ) {}

  /**
   * Get all users
   */
  async getUsers(mgr?: EntityManager): Promise<UserResponseDto[]> {
    return this.userRepo.findAll(mgr);
  }

  /**
   * Get user by unique ID
   */
  async getUserById(
    id: string,
    mgr?: EntityManager,
  ): Promise<UserWithTicketsResponseDto> {
    const user = await this.userRepo.findById(id, mgr);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const tickets = await this.ticketService.getUserTickets(id, {
      filterByUse: FilterTicketByUse.All,
    });
    return {
      id: user.id,
      username: user.username,
      role: user.role.value,
      age: user.age,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      tickets: tickets,
    } as UserWithTicketsResponseDto;
  }

  /**
   * Create a new user
   */
  async createUser(user: User, mgr?: EntityManager): Promise<User> {
    const existingUser = await this.userRepo.findByUsername(user.username);
    if (existingUser) {
      throw new ConflictException('Username already exists');
    }
    return this.userRepo.save(user, mgr);
  }

  /**
   * Get user by unique ID
   */
  async findById(id: string, mgr?: EntityManager): Promise<User | null> {
    return this.userRepo.findById(id, mgr);
  }

  /**
   * Get user by username
   */
  async findByUsername(
    username: string,
    mgr?: EntityManager,
  ): Promise<User | null> {
    return this.userRepo.findByUsername(username, mgr);
  }

  /**
   * Delete a user by unique ID
   */
  async deleteUser(id: string, mgr?: EntityManager): Promise<void> {
    // Deleting user will also delete related entities via cascading
    await this.userRepo.delete(id, mgr);
  }
}
