import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { CacheableMemory } from 'cacheable';
import Keyv from 'keyv';

import { MovieService } from './application/services/movie.service';
import { MovieController } from './presentation/controllers/movie.controller';
import { MovieSessionController } from './presentation/controllers/movie-session.controller';
import { MovieOrmEntity } from './infrastructure/persistence/entities/movie.orm-entity';
import { MovieSessionOrmEntity } from './infrastructure/persistence/entities/movie-session.orm-entity';
import { IMovieRepository } from './domain/repositories/movie.repository.interface';
import { IMovieSessionRepository } from './domain/repositories/movie-session.repository.interface';
import { MovieRepository } from './infrastructure/persistence/repositories/movie.repository';
import { MovieSessionRepository } from './infrastructure/persistence/repositories/movie-session.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([MovieOrmEntity, MovieSessionOrmEntity]),
    CacheModule.register({
      stores: [
        new Keyv({ store: new CacheableMemory({ ttl: 60000, lruSize: 1000 }) }),
      ],
    }),
  ],
  providers: [
    MovieService,
    {
      provide: IMovieRepository,
      useClass: MovieRepository,
    },
    {
      provide: IMovieSessionRepository,
      useClass: MovieSessionRepository,
    },
  ],
  controllers: [MovieController, MovieSessionController],
  exports: [MovieService, IMovieRepository, IMovieSessionRepository],
})
export class MovieModule {}
