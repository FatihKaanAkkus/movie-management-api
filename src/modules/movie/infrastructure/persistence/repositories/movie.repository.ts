import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  EntityManager,
  type FindManyOptions,
  Like,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { MovieOrmEntity } from '../entities/movie.orm-entity';
import { MovieSessionOrmEntity } from '../entities/movie-session.orm-entity';
import { Movie } from '../../../domain/entities/movie.entity';
import { IMovieRepository } from '../../../domain/repositories/movie.repository.interface';
import { IMovieQueryOptions } from '../../../domain/repositories/movie-query-options.interface';
import { IPaginationMeta } from 'src/common/domain/pagination-meta.interface';

@Injectable()
export class MovieRepository implements IMovieRepository {
  constructor(
    @InjectRepository(MovieOrmEntity)
    private readonly movieRepo: Repository<MovieOrmEntity>,
    @InjectRepository(MovieSessionOrmEntity)
    private readonly sessionRepo: Repository<MovieSessionOrmEntity>,
  ) {}

  async save(movie: Movie, mgr?: EntityManager): Promise<Movie> {
    const orm = this.toOrmEntity(movie);
    const repository = this.getRepository(mgr);
    const saved = await repository.save(orm);
    return this.toDomain(saved);
  }

  async findById(id: string, mgr?: EntityManager): Promise<Movie | null> {
    const repository = this.getRepository(mgr);
    const ormMovie = await repository.findOne({ where: { id } });
    return ormMovie ? this.toDomain(ormMovie) : null;
  }

  async findByTitle(title: string, mgr?: EntityManager): Promise<Movie | null> {
    const repository = this.getRepository(mgr);
    const ormMovie = await repository.findOne({ where: { title } });
    return ormMovie ? this.toDomain(ormMovie) : null;
  }

  async findAll(
    query: IMovieQueryOptions,
    mgr?: EntityManager,
  ): Promise<{ movies: Movie[]; meta: IPaginationMeta }> {
    const repository = this.getRepository(mgr);

    const page = query.page ?? 1;
    const perPage = query.perPage ?? 25;
    const skip = (page - 1) * perPage;
    const findOptions: FindManyOptions<MovieOrmEntity> = {
      where: {},
      order: {},
      skip,
      take: perPage,
    };

    if (query.title) {
      findOptions.where = {
        ...findOptions.where,
        title: Like(`%${query.title}%`),
      };
    }
    if (query.ageRestriction !== undefined) {
      findOptions.where = {
        ...findOptions.where,
        ageRestriction: MoreThanOrEqual(query.ageRestriction),
      };
    }
    if (query.sort) {
      findOptions.order = { [query.sort]: query.order || 'asc' };
    }

    const [ormMovies, count] = await repository.findAndCount(findOptions);
    return {
      movies: ormMovies.map((orm) => this.toDomain(orm)),
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

  private toDomain(orm: MovieOrmEntity): Movie {
    return Movie.create({
      id: orm.id,
      title: orm.title,
      ageRestriction: orm.ageRestriction,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  private toOrmEntity(domain: Movie): MovieOrmEntity {
    const orm = new MovieOrmEntity();
    orm.id = domain.id;
    orm.title = domain.title;
    orm.ageRestriction = domain.ageRestriction;
    orm.createdAt = domain.createdAt;
    orm.updatedAt = domain.updatedAt;
    return orm;
  }

  private getRepository(mgr?: EntityManager): Repository<MovieOrmEntity> {
    return mgr ? mgr.getRepository(MovieOrmEntity) : this.movieRepo;
  }
}
