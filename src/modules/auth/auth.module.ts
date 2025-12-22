import { env } from 'src/common/config/env.config';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './application/services/auth.service';
import { AuthController } from './presentation/controllers/auth.controller';
import { RefreshTokenOrmEntity } from './infrastructure/persistence/entities/refresh-token.orm-entity';
import { UserSessionOrmEntity } from './infrastructure/persistence/entities/user-session.orm-entity';
import { IRefreshTokenRepository } from './domain/repositories/refresh-token.repository.interface';
import { IUserSessionRepository } from './domain/repositories/user-session.repository.interface';
import { RefreshTokenRepository } from './infrastructure/persistence/repositories/refresh-token.repository';
import { UserSessionRepository } from './infrastructure/persistence/repositories/user-session.repository';
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';
import { UserModule } from 'src/modules/user/user.module';
import { UserOrmEntity } from 'src/modules/user/infrastructure/persistence/entities/user.orm-entity';

@Module({
  imports: [
    UserModule,
    TypeOrmModule.forFeature([
      RefreshTokenOrmEntity,
      UserSessionOrmEntity,
      UserOrmEntity,
    ]),
    JwtModule.register({
      secret: env.get<string>('JWT_SECRET', 'dummy-jwt-secret'),
      signOptions: { expiresIn: env.get('JWT_EXPIRES_IN_SEC', 900) },
    }),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    {
      provide: IRefreshTokenRepository,
      useClass: RefreshTokenRepository,
    },
    {
      provide: IUserSessionRepository,
      useClass: UserSessionRepository,
    },
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
