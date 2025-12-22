import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, FindManyOptions, Repository } from 'typeorm';
import { MovieOrmEntity } from '../entities/movie.orm-entity';
import { MovieSessionOrmEntity } from '../entities/movie-session.orm-entity';
import { MovieSession } from '../../../domain/entities/movie-session.entity';
import { IMovieSessionRepository } from '../../../domain/repositories/movie-session.repository.interface';
import { IMovieSessionQueryOptions } from '../../../domain/repositories/movie-session-query-options.interface';
import { IPaginationMeta } from 'src/common/domain/pagination-meta.interface';

@Injectable()
export class MovieSessionRepository implements IMovieSessionRepository {
  constructor(
    @InjectRepository(MovieSessionOrmEntity)
    private readonly sessionRepo: Repository<MovieSessionOrmEntity>,
    @InjectRepository(MovieOrmEntity)
    private readonly movieRepo: Repository<MovieOrmEntity>,
  ) {}

  async save(
    session: MovieSession,
    mgr?: EntityManager,
  ): Promise<MovieSession> {
    const ormSession = this.toOrmEntity(session);
    const repository = this.getRepository(mgr);
    const saved = await repository.save(ormSession);
    return this.toDomain(saved);
  }

  async findById(
    id: string,
    mgr?: EntityManager,
  ): Promise<MovieSession | null> {
    const repository = this.getRepository(mgr);
    const ormSession = await repository.findOne({ where: { id } });
    return ormSession ? this.toDomain(ormSession) : null;
  }

  async findByMovie(
    movieId: string,
    query: IMovieSessionQueryOptions,
    mgr?: EntityManager,
  ): Promise<{ sessions: MovieSession[]; meta: IPaginationMeta }> {
    const repository = this.getRepository(mgr);

    const page = query.page ?? 1;
    const perPage = query.perPage ?? 25;
    const skip = (page - 1) * perPage;
    const findOptions: FindManyOptions<MovieSessionOrmEntity> = {
      where: {},
      order: {},
      skip,
      take: perPage,
    };

    if (query.date) {
      findOptions.where = { ...findOptions.where, date: new Date(query.date) };
    }
    if (query.timeslot) {
      findOptions.where = { ...findOptions.where, timeslot: query.timeslot };
    }
    if (query.roomNumber !== undefined) {
      findOptions.where = {
        ...findOptions.where,
        roomNumber: query.roomNumber,
      };
    }
    if (query.sort) {
      findOptions.order = { [query.sort]: query.order || 'asc' };
    }

    const [ormSessions, count] = await repository.findAndCount({
      where: { movieId, ...findOptions.where },
      order: findOptions.order,
      relations: ['movie'],
    });

    return {
      sessions: ormSessions.map((orm) => this.toDomain(orm)),
      meta: {
        currentPage: page,
        totalPages: Math.ceil(count / perPage),
        totalItems: count,
        perPage,
      },
    };
  }

  async findAll(
    query: IMovieSessionQueryOptions,
    mgr?: EntityManager,
  ): Promise<{ sessions: MovieSession[]; meta: IPaginationMeta }> {
    const repository = this.getRepository(mgr);

    const page = query.page ?? 1;
    const perPage = query.perPage ?? 25;
    const skip = (page - 1) * perPage;
    const findOptions: FindManyOptions<MovieSessionOrmEntity> = {
      where: {},
      order: {},
      skip,
      take: perPage,
    };

    if (query.date) {
      findOptions.where = { ...findOptions.where, date: new Date(query.date) };
    }
    if (query.timeslot) {
      findOptions.where = { ...findOptions.where, timeslot: query.timeslot };
    }
    if (query.roomNumber !== undefined) {
      findOptions.where = {
        ...findOptions.where,
        roomNumber: query.roomNumber,
      };
    }
    if (query.sort) {
      findOptions.order = { [query.sort]: query.order || 'asc' };
    }

    const [ormSessions, count] = await repository.findAndCount(findOptions);

    return {
      sessions: ormSessions.map((orm) => this.toDomain(orm)),
      meta: {
        currentPage: page,
        totalPages: Math.ceil(count / perPage),
        totalItems: count,
        perPage,
      },
    };
  }

  async delete(id: string, mgr?: EntityManager): Promise<void> {
    const repository = this.getRepository(mgr);
    await repository.delete({ id });
  }

  async isRoomAvailable(
    session: MovieSession,
    mgr?: EntityManager,
  ): Promise<boolean> {
    const repository = this.getRepository(mgr);
    const count = await repository.count({
      where: {
        date: session.date,
        timeslot: session.timeslot,
        roomNumber: session.roomNumber,
      },
    });
    return count === 0;
  }

  private toDomain(orm: MovieSessionOrmEntity): MovieSession {
    return MovieSession.create({
      id: orm.id,
      movieId: orm.movieId,
      date: orm.date,
      timeslot: orm.timeslot,
      roomNumber: orm.roomNumber,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  private toOrmEntity(domain: MovieSession): MovieSessionOrmEntity {
    const orm = new MovieSessionOrmEntity();
    orm.id = domain.id;
    orm.movieId = domain.movieId;
    orm.date = domain.date;
    orm.timeslot = domain.timeslot;
    orm.roomNumber = domain.roomNumber;
    orm.createdAt = domain.createdAt;
    orm.updatedAt = domain.updatedAt;
    return orm;
  }

  private getRepository(
    mgr?: EntityManager,
  ): Repository<MovieSessionOrmEntity> {
    return mgr ? mgr.getRepository(MovieSessionOrmEntity) : this.sessionRepo;
  }
}
