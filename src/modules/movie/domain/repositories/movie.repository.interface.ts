import { EntityManager } from 'typeorm';
import { Movie } from '../entities/movie.entity';
import { IMovieQueryOptions } from './movie-query-options.interface';
import { IPaginationMeta } from 'src/common/domain/pagination-meta.interface';

export abstract class IMovieRepository {
  // Save or update a movie
  abstract save(movie: Movie, mgr?: EntityManager): Promise<Movie>;

  // Find a movie by its unique ID
  abstract findById(id: string, mgr?: EntityManager): Promise<Movie | null>;

  // Find a movie by its title
  abstract findByTitle(
    title: string,
    mgr?: EntityManager,
  ): Promise<Movie | null>;

  // Find all movies
  abstract findAll(
    query: IMovieQueryOptions,
    mgr?: EntityManager,
  ): Promise<{ movies: Movie[]; meta: IPaginationMeta }>;

  // Delete a movie by its unique ID
  abstract delete(id: string, mgr?: EntityManager): Promise<void>;
}
