import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { IRefreshTokenRepository } from '../../domain/repositories/refresh-token.repository.interface';
import { IUserSessionRepository } from '../../domain/repositories/user-session.repository.interface';
import { DataSource } from 'typeorm';
import { UserRole as UserRoleEnum } from '../../../../common/enums/user-role.enum';
import { UserService } from 'src/modules/user/application/services/user.service';
import { User } from 'src/modules/user/domain/entities/user.entity';
import { Password } from '../../domain/value-objects/password.vo';
import { RefreshToken } from '../../domain/entities/refresh-token.entity';
import { Token } from '../../domain/value-objects/token.vo';
import { UserSession } from '../../domain/entities/user-session.entity';

const dummyJwtTokenString = 'header.payload.signature';

describe('AuthService', function (this: void) {
  let service: AuthService;
  let userService: jest.Mocked<UserService>;
  let refreshTokenRepo: jest.Mocked<IRefreshTokenRepository>;
  let sessionRepo: jest.Mocked<IUserSessionRepository>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async function (this: void) {
    const mockUserService = {
      createUser: jest.fn(),
      findByUsername: jest.fn(),
      findById: jest.fn(),
    };

    const mockRefreshTokenRepo = {
      save: jest.fn(),
      findByToken: jest.fn(),
      findByUserId: jest.fn(),
      delete: jest.fn(),
      revoke: jest.fn(),
    };

    const mockSessionRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      delete: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    const mockQueryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {},
      isTransactionActive: true,
    };

    const mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: mockUserService },
        { provide: IRefreshTokenRepository, useValue: mockRefreshTokenRepo },
        { provide: IUserSessionRepository, useValue: mockSessionRepo },
        { provide: JwtService, useValue: mockJwtService },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get<jest.Mocked<UserService>>(UserService);
    refreshTokenRepo = module.get(IRefreshTokenRepository);
    sessionRepo = module.get(IUserSessionRepository);
    jwtService = module.get(JwtService);
  });

  describe('register', function (this: void) {
    it('should register a new user successfully', async function (this: void) {
      const registerDto = {
        username: 'testuser',
        password: 'password123',
        role: UserRoleEnum.Customer,
        age: 25,
      };

      (userService.createUser as jest.Mock).mockResolvedValue({
        id: 'user-id',
        username: 'testuser',
        role: UserRoleEnum.Customer,
        age: 25,
      });

      // Return valid JWT-like strings
      jwtService.sign
        .mockReturnValueOnce(dummyJwtTokenString)
        .mockReturnValueOnce(dummyJwtTokenString);

      const result = await service.register(registerDto);

      expect(result.accessToken).toBe(dummyJwtTokenString);
      expect(result.refreshToken).toBe(dummyJwtTokenString);
      expect(result.expiresAt).toBeInstanceOf(Date);
      expect(result.user.username).toBe('testuser');
    });

    it('should throw ConflictException if username already exists', async function (this: void) {
      const registerDto = {
        username: 'existinguser',
        password: 'password123',
        role: UserRoleEnum.Customer,
        age: 25,
      };

      (userService.createUser as jest.Mock).mockRejectedValue(
        new ConflictException('Username already exists'),
      );

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('login', function (this: void) {
    it('should login user with valid credentials', async function (this: void) {
      const loginDto = { username: 'testuser', password: 'password123' };

      // Create a mock Password with compare method
      const mockPassword = await Password.fromPlain('password123');
      mockPassword.compare = jest.fn().mockResolvedValue(true);

      // Create a valid User entity with all required properties
      const userEntity = User.create({
        id: 'user-id',
        username: 'testuser',
        hashedPassword: mockPassword,
        age: 25,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      userService.findByUsername.mockResolvedValue(userEntity);
      jwtService.sign
        .mockReturnValueOnce(dummyJwtTokenString)
        .mockReturnValueOnce(dummyJwtTokenString);

      const result = await service.login(loginDto);

      expect(result.accessToken).toBe(dummyJwtTokenString);
      expect(result.refreshToken).toBe(dummyJwtTokenString);
      expect(result.expiresAt).toBeInstanceOf(Date);
    });

    it('should throw UnauthorizedException for invalid username', async function (this: void) {
      const loginDto = { username: 'wronguser', password: 'password123' };

      userService.findByUsername.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for invalid password', async function (this: void) {
      const loginDto = { username: 'testuser', password: 'wrongpassword' };
      const user = User.create({
        id: 'user-id',
        username: 'testuser',
        hashedPassword: await Password.fromPlain('password123'),
        age: 25,
      });

      userService.findByUsername.mockResolvedValue(user);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refreshToken', function (this: void) {
    it('should refresh access token with valid refresh token', async function (this: void) {
      const refreshDto = { refreshToken: 'valid.refresh.token' };
      const refreshTokenEntity = RefreshToken.create({
        userId: 'user-id',
        token: Token.create('valid.refresh.token'),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        sessionId: 'session-id',
      });
      const user = User.create({
        id: 'user-id',
        username: 'testuser',
        hashedPassword: Password.fromHashed('hashed-password'),
        age: 25,
      });

      jwtService.verify.mockImplementation(() => ({ userId: 'user-id' }));
      refreshTokenRepo.findByToken.mockResolvedValue(refreshTokenEntity);
      // Use findById as that's what the actual service calls
      userService.findById.mockResolvedValue(user);
      jwtService.sign.mockReturnValue('new.access.token');

      const result = await service.refreshToken(refreshDto);

      expect(result.accessToken).toBe('new.access.token');
    });

    it('should throw UnauthorizedException for invalid refresh token', async function (this: void) {
      const refreshDto = { refreshToken: 'invalid-token' };

      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.refreshToken(refreshDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', function (this: void) {
    it('should revoke refresh token and delete session', async function (this: void) {
      const accessToken = 'valid-access-token';

      jwtService.verify.mockImplementation(() => ({
        sub: 'user-id',
        sid: 'session-id',
      }));
      sessionRepo.findById.mockResolvedValue(
        UserSession.create({
          id: 'session-id',
          userId: 'user-id',
          createdAt: new Date(),
          expiresAt: new Date(),
          isRevoked: false,
          revokedAt: null,
        }),
      );
      refreshTokenRepo.findByUserId.mockResolvedValue([
        RefreshToken.create({
          userId: 'user-id',
          token: Token.create('some.refresh.token'),
          expiresAt: new Date(Date.now() + 1000 * 60 * 60),
          sessionId: 'session-id',
        }),
      ]);
      sessionRepo.findByUserId.mockResolvedValue([
        UserSession.create({
          id: 'session-id',
          userId: 'user-id',
          createdAt: new Date(),
          expiresAt: new Date(),
          isRevoked: false,
          revokedAt: null,
        }),
      ]);
      refreshTokenRepo.delete.mockResolvedValue(undefined);
      sessionRepo.delete.mockResolvedValue(undefined);

      await service.logout(accessToken);
    });

    it('should throw UnauthorizedException for invalid token', async function (this: void) {
      const accessToken = 'invalid-token';

      jwtService.verify.mockImplementation(() => ({
        sub: 'user-id',
        sid: 'session-id',
      }));
      sessionRepo.findById.mockResolvedValue(
        UserSession.create({
          id: 'session-id',
          userId: 'user-id',
          createdAt: new Date(),
          expiresAt: new Date(),
          isRevoked: false,
          revokedAt: null,
        }),
      );
      refreshTokenRepo.findByUserId.mockResolvedValue([
        RefreshToken.create({
          userId: 'user-id',
          token: Token.create('some.refresh.token'),
          expiresAt: new Date(Date.now() + 1000 * 60 * 60),
          sessionId: 'session-id',
        }),
      ]);
      sessionRepo.findByUserId.mockResolvedValue([
        UserSession.create({
          id: 'session-id',
          userId: 'user-id',
          createdAt: new Date(),
          expiresAt: new Date(),
          isRevoked: false,
          revokedAt: null,
        }),
      ]);

      jwtService.verify.mockImplementation(() => {
        throw new UnauthorizedException('Invalid token');
      });

      await expect(service.logout(accessToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
