import { EntityManager } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserResponseDto } from '../../application/dto/user-response.dto';

export abstract class IUserRepository {
  // Save or update a user
  abstract save(user: User, mgr?: EntityManager): Promise<User>;

  // Find a user by its unique ID
  abstract findById(id: string, mgr?: EntityManager): Promise<User | null>;

  // Find a user by their username
  abstract findByUsername(
    username: string,
    mgr?: EntityManager,
  ): Promise<User | null>;

  // Get all users
  abstract findAll(mgr?: EntityManager): Promise<UserResponseDto[]>;

  // Delete a user by its unique ID
  abstract delete(id: string, mgr?: EntityManager): Promise<void>;
}
