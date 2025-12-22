import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { UserSessionOrmEntity } from '../entities/user-session.orm-entity';
import { IUserSessionRepository } from '../../../domain/repositories/user-session.repository.interface';
import { UserSession } from '../../../domain/entities/user-session.entity';

@Injectable()
export class UserSessionRepository implements IUserSessionRepository {
  constructor(
    @InjectRepository(UserSessionOrmEntity)
    private readonly repo: Repository<UserSessionOrmEntity>,
  ) {}

  async save(session: UserSession, mgr?: EntityManager): Promise<UserSession> {
    const ormSession = this.toOrmEntity(session);
    const repository = this.getRepository(mgr);
    const saved = await repository.save(ormSession);
    return this.toDomain(saved);
  }

  async findById(id: string, mgr?: EntityManager): Promise<UserSession | null> {
    const repository = this.getRepository(mgr);
    const ormSession = await repository.findOne({ where: { id } });
    return ormSession ? this.toDomain(ormSession) : null;
  }

  async findByUserId(
    userId: string,
    includeRevoked?: boolean,
    mgr?: EntityManager,
  ): Promise<UserSession[]> {
    const repository = this.getRepository(mgr);
    const ormSessions = await repository.find({
      where: { userId, isRevoked: includeRevoked ? undefined : false },
    });
    return ormSessions.map((orm) => this.toDomain(orm));
  }

  async revoke(id: string, mgr?: EntityManager): Promise<void> {
    const repository = this.getRepository(mgr);
    await repository.update({ id }, { isRevoked: true });
  }

  async delete(id: string, mgr?: EntityManager): Promise<void> {
    const repository = this.getRepository(mgr);
    await repository.delete({ id });
  }

  private toDomain(orm: UserSessionOrmEntity): UserSession {
    return UserSession.create({
      id: orm.id,
      userId: orm.userId,
      createdAt: orm.createdAt,
      expiresAt: orm.expiresAt,
      isRevoked: orm.isRevoked,
      revokedAt: orm.revokedAt,
    });
  }

  private toOrmEntity(domain: UserSession): UserSessionOrmEntity {
    const orm = new UserSessionOrmEntity();
    orm.id = domain.id;
    orm.userId = domain.userId;
    orm.createdAt = domain.createdAt;
    orm.expiresAt = domain.expiresAt;
    orm.isRevoked = domain.isRevoked;
    orm.revokedAt = domain.revokedAt;
    return orm;
  }

  private getRepository(mgr?: EntityManager): Repository<UserSessionOrmEntity> {
    return mgr ? mgr.getRepository(UserSessionOrmEntity) : this.repo;
  }
}
