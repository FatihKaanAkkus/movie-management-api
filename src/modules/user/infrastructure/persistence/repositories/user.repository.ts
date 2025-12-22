import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { UserResponseDto } from 'src/modules/user/application/dto/user-response.dto';
import { UserOrmEntity } from '../entities/user.orm-entity';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { User } from '../../../domain/entities/user.entity';
import { UserRole } from '../../../domain/value-objects/user-role.vo';
import { Password } from 'src/modules/auth/domain/value-objects/password.vo';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly repo: Repository<UserOrmEntity>,
  ) {}

  async save(user: User, mgr?: EntityManager): Promise<User> {
    const orm = this.toOrmEntity(user);
    const repository = this.getRepository(mgr);
    const saved = await repository.save(orm);
    return this.toDomain(saved);
  }

  async findById(id: string, mgr?: EntityManager): Promise<User | null> {
    const repository = this.getRepository(mgr);
    const orm = await repository.findOne({ where: { id } });
    return orm ? this.toDomain(orm) : null;
  }

  async findByUsername(
    username: string,
    mgr?: EntityManager,
  ): Promise<User | null> {
    const repository = this.getRepository(mgr);
    const orm = await repository.findOne({ where: { username } });
    return orm ? this.toDomain(orm) : null;
  }

  async findAll(mgr?: EntityManager): Promise<UserResponseDto[]> {
    const repository = this.getRepository(mgr);
    const orms = await repository.find();
    return orms.map((orm) => {
      const user = this.toDomain(orm);
      return {
        id: user.id,
        username: user.username,
        role: user.role.value,
        age: user.age,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      } as UserResponseDto;
    });
  }

  async delete(id: string, mgr?: EntityManager): Promise<void> {
    const repository = this.getRepository(mgr);
    await repository.delete({ id });
  }

  private toDomain(orm: UserOrmEntity): User {
    return User.create({
      id: orm.id,
      username: orm.username,
      hashedPassword: Password.fromHashed(orm.hashedPassword),
      role: UserRole.from(orm.role),
      age: orm.age,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  private toOrmEntity(domain: User): UserOrmEntity {
    const orm = new UserOrmEntity();
    orm.id = domain.id;
    orm.username = domain.username;
    orm.hashedPassword = domain.hashedPassword.value;
    orm.role = domain.role.value;
    orm.age = domain.age;
    orm.createdAt = domain.createdAt;
    orm.updatedAt = domain.updatedAt;
    return orm;
  }

  private getRepository(mgr?: EntityManager): Repository<UserOrmEntity> {
    return mgr ? mgr.getRepository(UserOrmEntity) : this.repo;
  }
}
