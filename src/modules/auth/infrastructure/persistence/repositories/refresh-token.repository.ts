import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { RefreshTokenOrmEntity } from '../entities/refresh-token.orm-entity';
import { IRefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository.interface';
import { RefreshToken } from '../../../domain/entities/refresh-token.entity';
import { Token } from '../../../domain/value-objects/token.vo';

@Injectable()
export class RefreshTokenRepository implements IRefreshTokenRepository {
  constructor(
    @InjectRepository(RefreshTokenOrmEntity)
    private readonly repo: Repository<RefreshTokenOrmEntity>,
  ) {}

  async save(token: RefreshToken, mgr?: EntityManager): Promise<RefreshToken> {
    const ormToken = this.toOrmEntity(token);
    const repository = this.getRepository(mgr);
    const saved = await repository.save(ormToken);
    return this.toDomain(saved);
  }

  async findByToken(
    token: string,
    mgr?: EntityManager,
  ): Promise<RefreshToken | null> {
    const repository = this.getRepository(mgr);
    const ormToken = await repository.findOne({ where: { token } });
    return ormToken ? this.toDomain(ormToken) : null;
  }

  async findByUserId(
    userId: string,
    includeRevoked?: boolean,
    mgr?: EntityManager,
  ): Promise<RefreshToken[]> {
    const repository = this.getRepository(mgr);
    const ormTokens = await repository.find({
      where: { userId, isRevoked: includeRevoked ? undefined : false },
    });
    return ormTokens.map((orm) => this.toDomain(orm));
  }

  async revoke(token: string, mgr?: EntityManager): Promise<void> {
    const repository = this.getRepository(mgr);
    await repository.update(
      { token },
      { isRevoked: true, revokedAt: new Date() },
    );
  }

  async delete(token: string, mgr?: EntityManager): Promise<void> {
    const repository = this.getRepository(mgr);
    await repository.delete({ token });
  }

  private toDomain(orm: RefreshTokenOrmEntity): RefreshToken {
    return RefreshToken.create({
      id: orm.id,
      token: Token.create(orm.token),
      userId: orm.userId,
      sessionId: orm.sessionId,
      createdAt: orm.createdAt,
      expiresAt: orm.expiresAt,
      isRevoked: orm.isRevoked,
      revokedAt: orm.revokedAt,
    });
  }

  private toOrmEntity(domain: RefreshToken): RefreshTokenOrmEntity {
    const orm = new RefreshTokenOrmEntity();
    orm.id = domain.id;
    orm.token = domain.token.value;
    orm.userId = domain.userId;
    orm.sessionId = domain.sessionId;
    orm.createdAt = domain.createdAt;
    orm.expiresAt = domain.expiresAt;
    orm.isRevoked = domain.isRevoked;
    orm.revokedAt = domain.revokedAt;
    return orm;
  }

  private getRepository(
    mgr?: EntityManager,
  ): Repository<RefreshTokenOrmEntity> {
    return mgr ? mgr.getRepository(RefreshTokenOrmEntity) : this.repo;
  }
}
