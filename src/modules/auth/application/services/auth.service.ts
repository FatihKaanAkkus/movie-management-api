import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JsonWebTokenError, JwtService } from '@nestjs/jwt';
import { DataSource, type QueryRunner } from 'typeorm';
import { UserService } from 'src/modules/user/application/services/user.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { IRefreshTokenRepository } from '../../domain/repositories/refresh-token.repository.interface';
import { IUserSessionRepository } from '../../domain/repositories/user-session.repository.interface';
import { RefreshToken } from '../../domain/entities/refresh-token.entity';
import { UserSession } from '../../domain/entities/user-session.entity';
import { User } from 'src/modules/user/domain/entities/user.entity';
import { Password } from '../../domain/value-objects/password.vo';
import { UserRole } from 'src/modules/user/domain/value-objects/user-role.vo';
import { Token } from '../../domain/value-objects/token.vo';
import { IJwtPayload } from '../../infrastructure/jwt-payload.interface';
import { env } from '../../../../common/config/env.config';

@Injectable()
export class AuthService {
  private readonly logger = new Logger('AuthService');

  JWT_EXPIRE_IN_MS = 900 * 1000; // 15 minutes in milliseconds

  constructor(
    private readonly refreshTokenRepo: IRefreshTokenRepository,
    private readonly userSessionRepo: IUserSessionRepository,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource,
  ) {
    this.JWT_EXPIRE_IN_MS = env.get<number>('JWT_EXPIRES_IN_SEC', 900) * 1000;
  }

  /**
   * Register a new user
   */
  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const trx = await this.startTransaction();
    try {
      // Create user
      const hashedPassword = await Password.fromPlain(dto.password);
      const user = await this.userService.createUser(
        User.create({
          username: dto.username,
          hashedPassword: hashedPassword,
          role: UserRole.from(dto.role),
          age: dto.age,
        }),
        trx.manager,
      );

      const userSession = UserSession.create({
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });
      await this.userSessionRepo.save(userSession, trx.manager);

      // Create refresh token
      const refreshTokenString: string = this.jwtService.sign(
        { sub: user.id },
        { expiresIn: '7d' },
      );
      const refreshToken = RefreshToken.create({
        token: Token.create(refreshTokenString),
        userId: user.id,
        sessionId: userSession.id,
        expiresAt: userSession.expiresAt,
      });
      await this.refreshTokenRepo.save(refreshToken, trx.manager);

      // Create access token
      const payload: IJwtPayload = {
        sub: user.id,
        role: user.role.value,
        sid: refreshToken.sessionId,
      };
      const accessToken: string = this.jwtService.sign(payload);

      await trx.commitTransaction();

      return {
        accessToken,
        refreshToken: refreshToken.token.value,
        expiresAt: new Date(Date.now() + this.JWT_EXPIRE_IN_MS),
        user: {
          id: user.id,
          username: user.username,
          role: user.role.value,
          age: user.age,
        },
      };
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
   * Login an existing user
   */
  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const trx = await this.startTransaction();
    try {
      // User should exist in the system
      const user = await this.userService.findByUsername(dto.username);
      if (!user) {
        throw new UnauthorizedException(`User ${dto.username} not found`);
      }

      // Password should be valid,
      const password = Password.fromHashed(user.hashedPassword.value);
      const passwordValid = await password.compare(dto.password);
      if (!passwordValid) {
        throw new UnauthorizedException(
          `Invalid password for user ${dto.username}`,
        );
      }

      // Create user session
      const userSession = UserSession.create({
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });
      await this.userSessionRepo.save(userSession, trx.manager);

      // Create refresh token
      const refreshTokenString = this.jwtService.sign(
        { sub: user.id },
        { expiresIn: '7d' },
      );
      const refreshToken = RefreshToken.create({
        token: Token.create(refreshTokenString),
        userId: user.id,
        sessionId: userSession.id,
        expiresAt: userSession.expiresAt,
      });
      await this.refreshTokenRepo.save(refreshToken, trx.manager);

      // Create access token
      const payload: IJwtPayload = {
        sub: user.id,
        role: user.role.value,
        sid: refreshToken.sessionId,
      };
      const accessToken: string = this.jwtService.sign(payload);

      await trx.commitTransaction();

      return {
        accessToken,
        refreshToken: refreshToken.token.value,
        expiresAt: new Date(Date.now() + this.JWT_EXPIRE_IN_MS),
        user: {
          id: user.id,
          username: user.username,
          role: user.role.value,
          age: user.age,
        },
      };
    } catch (error) {
      if (trx.isTransactionActive) {
        await trx.rollbackTransaction();
      }

      if (
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException ||
        error instanceof JsonWebTokenError
      ) {
        throw new UnauthorizedException('Invalid credentials');
      }
      throw new InternalServerErrorException('Login failed');
    } finally {
      await trx.release();
    }
  }

  /**
   * Refresh access token using a valid refresh token
   */
  async refreshToken(dto: RefreshTokenDto): Promise<AuthResponseDto> {
    const trx = await this.startTransaction();
    try {
      // Parse token value object
      const tokenVO = Token.create(dto.refreshToken);

      // Validate refresh token
      const refreshToken = await this.refreshTokenRepo.findByToken(
        tokenVO.value,
        trx.manager,
      );
      if (
        !refreshToken ||
        refreshToken.isRevoked ||
        refreshToken.expiresAt < new Date()
      ) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Validate user existence
      const user = await this.userService.findById(
        refreshToken.userId,
        trx.manager,
      );
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Create new access token
      const payload: IJwtPayload = {
        sub: user.id,
        role: user.role.value,
        sid: refreshToken.sessionId,
      };
      const newAccessToken: string = this.jwtService.sign(payload);

      await trx.commitTransaction();

      return {
        accessToken: newAccessToken,
        refreshToken: refreshToken.token.value,
        expiresAt: new Date(Date.now() + this.JWT_EXPIRE_IN_MS),
        user: {
          id: user.id,
          username: user.username,
          role: user.role.value,
          age: user.age,
        },
      };
    } catch (error) {
      if (trx.isTransactionActive) {
        await trx.rollbackTransaction();
      }

      if (
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException ||
        error instanceof JsonWebTokenError
      ) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      throw error;
    } finally {
      await trx.release();
    }
  }

  /**
   * Logout user by revoking all tokens and sessions
   */
  async logout(token: string): Promise<void> {
    const trx = await this.startTransaction();
    try {
      // Find and validate refresh token
      const payload: IJwtPayload = this.jwtService.verify<IJwtPayload>(token);
      const userId = payload.sub;
      const sessionId = payload.sid;

      const userSession = await this.userSessionRepo.findById(
        sessionId,
        trx.manager,
      );
      if (!userSession || userSession.isRevoked) {
        throw new UnauthorizedException('Invalid session');
      }

      // Revoke all refresh tokens
      const userTokens = await this.refreshTokenRepo.findByUserId(
        userId,
        false,
        trx.manager,
      );
      for (const refreshTokenEntity of userTokens) {
        refreshTokenEntity.revoke();
        await this.refreshTokenRepo.save(refreshTokenEntity, trx.manager);
      }

      // Revoke all sessions
      const userSessions = await this.userSessionRepo.findByUserId(
        userId,
        false,
        trx.manager,
      );
      for (const userSession of userSessions) {
        userSession.revoke();
        await this.userSessionRepo.save(userSession, trx.manager);
      }

      await trx.commitTransaction();
    } catch (error) {
      if (trx.isTransactionActive) {
        await trx.rollbackTransaction();
      }

      if (
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException ||
        error instanceof JsonWebTokenError
      ) {
        throw new UnauthorizedException('Invalid token');
      }
      throw error;
    } finally {
      await trx.release();
    }
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
