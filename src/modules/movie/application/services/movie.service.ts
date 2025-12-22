import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { DataSource, type QueryRunner } from 'typeorm';
import { IMovieRepository } from '../../domain/repositories/movie.repository.interface';
import { IMovieSessionRepository } from '../../domain/repositories/movie-session.repository.interface';
import { CreateMovieDto } from '../dto/create-movie.dto';
import { UpdateMovieDto } from '../dto/update-movie.dto';
import {
  MovieResponseDto,
  MovieWithSessionsResponseDto,
  PaginatedMovieResponseDto,
} from '../dto/movie-response.dto';
import { CreateMovieSessionDto } from '../dto/create-movie-session.dto';
import {
  MovieSessionResponseDto,
  PaginatedMovieSessionResponseDto,
} from '../dto/movie-session-response.dto';
import { QueryMovieDto } from '../dto/query-movie.dto';
import { QueryMovieSessionDto } from '../dto/query-movie-session.dto';
import { Movie } from '../../domain/entities/movie.entity';
import { MovieSession } from '../../domain/entities/movie-session.entity';

@Injectable()
export class MovieService {
  private readonly logger = new Logger('MovieService');

  constructor(
    private readonly movieRepo: IMovieRepository,
    private readonly movieSessionRepo: IMovieSessionRepository,
    private readonly dataSource: DataSource,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  readonly DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get all movies
   */
  async getMovies(
    query: QueryMovieDto,
    cacheKey?: string,
  ): Promise<PaginatedMovieResponseDto> {
    const movies = await this.movieRepo.findAll(query);
    if (cacheKey) {
      await this.cacheManager.set(cacheKey, movies, this.DEFAULT_CACHE_TTL);
    }
    return movies;
  }

  /**
   * Get movie by unique ID with its sessions
   */
  async getMovieById(movieId: string): Promise<MovieWithSessionsResponseDto> {
    const movie = await this.movieRepo.findById(movieId);
    if (!movie) {
      throw new NotFoundException('Movie not found');
    }

    // Chose DDD over optimization using orm relations, later can be optimized if needed
    const { sessions } = await this.movieSessionRepo.findByMovie(movieId, {
      perPage: 9999,
    });

    return {
      ...movie,
      sessions: sessions,
    };
  }

  /**
   * Create a new movie
   */
  async createMovie(dto: CreateMovieDto): Promise<MovieResponseDto> {
    const trx = await this.startTransaction();
    try {
      const existingMovie = await this.movieRepo.findByTitle(dto.title);
      if (existingMovie) {
        throw new ConflictException('Movie already exists');
      }

      const movie = await this.movieRepo.save(
        Movie.create({ title: dto.title, ageRestriction: dto.ageRestriction }),
        trx.manager,
      );

      await trx.commitTransaction();

      await this.cacheManager.clear(); // <-- Invalidate module cache

      return movie;
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
   * Create multiple movies in bulk
   */
  async createBulkMovies(dtos: CreateMovieDto[]): Promise<MovieResponseDto[]> {
    const trx = await this.startTransaction();
    try {
      const createdMovies: MovieResponseDto[] = [];

      for (const dto of dtos) {
        const existingMovie = await this.movieRepo.findByTitle(
          dto.title,
          trx.manager,
        );
        if (existingMovie) {
          throw new ConflictException(
            `Movie with title "${dto.title}" already exists`,
          );
        }

        const movie = await this.movieRepo.save(
          Movie.create({
            title: dto.title,
            ageRestriction: dto.ageRestriction,
          }),
          trx.manager,
        );
        createdMovies.push(movie);
      }

      await trx.commitTransaction();

      await this.cacheManager.clear(); // <-- Invalidate module cache

      return createdMovies;
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
   * Update an existing movie
   */
  async updateMovie(
    id: string,
    dto: UpdateMovieDto,
  ): Promise<MovieResponseDto> {
    const trx = await this.startTransaction();
    try {
      const movie = await this.movieRepo.findById(id, trx.manager);
      if (!movie) {
        throw new NotFoundException('Movie not found');
      }

      const updatedMovie = await this.movieRepo.save(
        Movie.create({
          id: movie.id,
          title: dto.title ?? movie.title,
          ageRestriction: dto.ageRestriction ?? movie.ageRestriction,
          createdAt: movie.createdAt,
        }),
        trx.manager,
      );

      await trx.commitTransaction();

      await this.cacheManager.clear(); // <-- Invalidate module cache

      return updatedMovie;
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
   * Delete a movie
   */
  async deleteMovie(movieId: string): Promise<void> {
    const trx = await this.startTransaction();
    try {
      const movie = await this.movieRepo.findById(movieId, trx.manager);
      if (!movie) {
        throw new NotFoundException('Movie not found');
      }

      // Deleting movie will also delete related entities via cascading
      await this.movieRepo.delete(movieId, trx.manager);

      await trx.commitTransaction();

      await this.cacheManager.clear(); // <-- Invalidate module cache
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
   * Delete multiple movies in bulk
   */
  async deleteBulkMovies(movieIds: string[]): Promise<void> {
    const trx = await this.startTransaction();
    try {
      for (const movieId of movieIds) {
        const movie = await this.movieRepo.findById(movieId, trx.manager);
        if (!movie) {
          throw new NotFoundException(`Movie with ID ${movieId} not found`);
        }

        // Deleting movie will also delete related entities via cascading
        await this.movieRepo.delete(movieId, trx.manager);
      }

      await trx.commitTransaction();

      await this.cacheManager.clear(); // <-- Invalidate module cache
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
   * Get all sessions for a movie
   */
  async getSessions(
    movieId: string,
    query: QueryMovieSessionDto,
    cacheKey?: string,
  ): Promise<PaginatedMovieSessionResponseDto> {
    const sessions = await this.movieSessionRepo.findByMovie(movieId, query);
    if (cacheKey) {
      await this.cacheManager.set(cacheKey, sessions, this.DEFAULT_CACHE_TTL);
    }
    return sessions;
  }

  /**
   * Get a specific movie session by unique ID
   */
  async getMovieSessionById(
    movieId: string,
    sessionId: string,
  ): Promise<MovieSessionResponseDto> {
    const session = await this.movieSessionRepo.findById(sessionId);
    if (!session) {
      throw new NotFoundException('Movie session not found');
    }
    if (session.movieId !== movieId) {
      throw new ConflictException('Movie session does not belong to the movie');
    }
    return session;
  }

  /**
   * Create a new movie session
   */
  async createSession(
    movieId: string,
    dto: CreateMovieSessionDto,
  ): Promise<MovieSessionResponseDto> {
    const trx = await this.startTransaction();
    try {
      const existingMovie = await this.movieRepo.findById(movieId, trx.manager);
      if (!existingMovie) {
        throw new NotFoundException('Movie not found');
      }

      const session = MovieSession.create({
        movieId,
        date: new Date(dto.date),
        timeslot: dto.timeslot,
        roomNumber: dto.roomNumber,
      });

      // Check room availability
      const isAvailable = await this.movieSessionRepo.isRoomAvailable(
        session,
        trx.manager,
      );
      if (!isAvailable) {
        throw new ConflictException(
          `Room ${dto.roomNumber} is already booked for ${dto.date} ${dto.timeslot}`,
        );
      }

      const savedSession = await this.movieSessionRepo.save(
        session,
        trx.manager,
      );

      await trx.commitTransaction();

      return savedSession;
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
   * Create multiple movie sessions in bulk
   */
  async createBulkSessions(
    movieId: string,
    dtos: CreateMovieSessionDto[],
  ): Promise<MovieSessionResponseDto[]> {
    const trx = await this.startTransaction();
    try {
      const existingMovie = await this.movieRepo.findById(movieId, trx.manager);
      if (!existingMovie) {
        throw new NotFoundException('Movie not found');
      }

      const createdSessions: MovieSessionResponseDto[] = [];

      for (const dto of dtos) {
        const session = MovieSession.create({
          movieId,
          date: new Date(dto.date),
          timeslot: dto.timeslot,
          roomNumber: dto.roomNumber,
        });

        // Check room availability
        const isAvailable = await this.movieSessionRepo.isRoomAvailable(
          session,
          trx.manager,
        );
        if (!isAvailable) {
          throw new ConflictException(
            `Room ${dto.roomNumber} is already booked for ${dto.date} ${dto.timeslot}`,
          );
        }

        const savedSession = await this.movieSessionRepo.save(
          session,
          trx.manager,
        );
        createdSessions.push(savedSession);
      }

      await trx.commitTransaction();

      return createdSessions;
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
   * Get all movie sessions
   */
  async getAllSessions(
    query: QueryMovieSessionDto,
    cacheKey?: string,
  ): Promise<PaginatedMovieSessionResponseDto> {
    const sessions = await this.movieSessionRepo.findAll(query);
    if (cacheKey) {
      await this.cacheManager.set(cacheKey, sessions, this.DEFAULT_CACHE_TTL);
    }
    return sessions;
  }

  /**
   * Delete a movie session
   */
  async deleteSession(sessionId: string): Promise<void> {
    const trx = await this.startTransaction();
    try {
      const session = await this.movieSessionRepo.findById(
        sessionId,
        trx.manager,
      );
      if (!session) {
        throw new NotFoundException('Movie session not found');
      }

      await this.movieSessionRepo.delete(sessionId, trx.manager);

      await trx.commitTransaction();
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
   * Delete multiple movie sessions in bulk
   */
  async deleteBulkSessions(sessionIds: string[]): Promise<void> {
    const trx = await this.startTransaction();
    try {
      for (const sessionId of sessionIds) {
        const session = await this.movieSessionRepo.findById(
          sessionId,
          trx.manager,
        );
        if (!session) {
          throw new NotFoundException(
            `Movie session with ID ${sessionId} not found`,
          );
        }

        await this.movieSessionRepo.delete(sessionId, trx.manager);
      }

      await trx.commitTransaction();
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
   * Helper method to start a new transaction
   */
  private async startTransaction(): Promise<QueryRunner> {
    const trx = this.dataSource.createQueryRunner();
    await trx.connect();
    await trx.startTransaction();
    return trx;
  }
}
