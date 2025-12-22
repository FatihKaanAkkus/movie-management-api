import { EntityManager } from 'typeorm';
import { RefreshToken } from '../entities/refresh-token.entity';

export abstract class IRefreshTokenRepository {
  // Create or update a refresh token
  abstract save(
    token: RefreshToken,
    mgr?: EntityManager,
  ): Promise<RefreshToken>;

  // Find a refresh token by its token string
  abstract findByToken(
    token: string,
    mgr?: EntityManager,
  ): Promise<RefreshToken | null>;

  // Find all refresh tokens for a specific user
  abstract findByUserId(
    userId: string,
    includeRevoked?: boolean,
    mgr?: EntityManager,
  ): Promise<RefreshToken[]>;

  // Revoke a refresh token by its token string
  abstract revoke(token: string, mgr?: EntityManager): Promise<void>;

  // Delete a refresh token by its token string
  abstract delete(token: string, mgr?: EntityManager): Promise<void>;
}
