import { EntityManager } from 'typeorm';
import { UserSession } from '../entities/user-session.entity';

export abstract class IUserSessionRepository {
  // Create or update a user session
  abstract save(
    session: UserSession,
    mgr?: EntityManager,
  ): Promise<UserSession>;

  // Find a user session by its unique ID
  abstract findById(
    id: string,
    mgr?: EntityManager,
  ): Promise<UserSession | null>;

  // Find all sessions for a specific user
  abstract findByUserId(
    userId: string,
    includeRevoked?: boolean,
    mgr?: EntityManager,
  ): Promise<UserSession[]>;

  // Revoke a user session by its unique ID
  abstract revoke(id: string, mgr?: EntityManager): Promise<void>;

  // Delete a user session by its unique ID
  abstract delete(id: string, mgr?: EntityManager): Promise<void>;
}
