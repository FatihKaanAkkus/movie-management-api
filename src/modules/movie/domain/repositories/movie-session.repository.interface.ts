import { EntityManager } from 'typeorm';
import { MovieSession } from '../entities/movie-session.entity';
import { IMovieSessionQueryOptions } from './movie-session-query-options.interface';
import { IPaginationMeta } from 'src/common/domain/pagination-meta.interface';

export abstract class IMovieSessionRepository {
  // Save or update a movie session
  abstract save(
    session: MovieSession,
    mgr?: EntityManager,
  ): Promise<MovieSession>;

  // Find a movie session by its unique ID
  abstract findById(
    id: string,
    mgr?: EntityManager,
  ): Promise<MovieSession | null>;

  // Find all movie sessions for a specific movie
  abstract findByMovie(
    movieId: string,
    query: IMovieSessionQueryOptions,
    mgr?: EntityManager,
  ): Promise<{ sessions: MovieSession[]; meta: IPaginationMeta }>;

  // Find all movie sessions
  abstract findAll(
    query: IMovieSessionQueryOptions,
    mgr?: EntityManager,
  ): Promise<{ sessions: MovieSession[]; meta: IPaginationMeta }>;

  // Delete a movie session by its unique ID
  abstract delete(id: string, mgr?: EntityManager): Promise<void>;

  // Check if the room is available for the given session time
  abstract isRoomAvailable(
    session: MovieSession,
    mgr?: EntityManager,
  ): Promise<boolean>;
}
