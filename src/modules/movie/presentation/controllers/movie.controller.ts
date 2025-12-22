import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { MovieService } from '../../application/services/movie.service';
import {
  BulkCreateMovieDto,
  CreateMovieDto,
} from '../../application/dto/create-movie.dto';
import { UpdateMovieDto } from '../../application/dto/update-movie.dto';
import { BulkDeleteMoviesDto } from '../../application/dto/delete-movie.dto';
import {
  MovieResponseDto,
  MovieWithSessionsResponseDto,
  PaginatedMovieResponseDto,
} from '../../application/dto/movie-response.dto';
import {
  BulkCreateMovieSessionsDto,
  CreateMovieSessionDto,
} from '../../application/dto/create-movie-session.dto';
import {
  MovieSessionResponseDto,
  PaginatedMovieSessionResponseDto,
} from '../../application/dto/movie-session-response.dto';
import { QueryMovieDto } from '../../application/dto/query-movie.dto';
import { QueryMovieSessionDto } from '../../application/dto/query-movie-session.dto';

import { JwtAuthGuard } from 'src/modules/auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/infrastructure/guards/roles.guard';
import { Roles } from 'src/modules/auth/infrastructure/guards/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';
import { CachedResourceInterceptor } from 'src/common/infrastructure/interceptors/cached-resource.interceptor';

@ApiTags('movies')
@Controller('v1/movies')
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'Get all movies (paginated)' })
  @ApiResponse({ status: 200, type: PaginatedMovieResponseDto })
  @ApiBearerAuth()
  @HttpCode(200)
  @UseInterceptors(CachedResourceInterceptor)
  async getMovies(
    @Req() req: Request,
    @Query() query: QueryMovieDto,
  ): Promise<PaginatedMovieResponseDto> {
    return this.movieService.getMovies(query, req.url);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':movieId')
  @ApiOperation({ summary: 'Get a movie by unique ID' })
  @ApiResponse({ status: 200, type: MovieWithSessionsResponseDto })
  @ApiNotFoundResponse({ description: 'Movie not found' })
  @ApiBearerAuth()
  @HttpCode(200)
  async getMovie(
    @Param('movieId', new ParseUUIDPipe()) movieId: string,
  ): Promise<MovieWithSessionsResponseDto> {
    return this.movieService.getMovieById(movieId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Manager)
  @Post()
  @ApiOperation({
    summary: 'Create a new movie',
    description: 'Requires Manager role',
  })
  @ApiConflictResponse({ description: 'Movie with this title already exists' })
  @ApiResponse({ status: 201, type: MovieResponseDto })
  @ApiBearerAuth()
  @HttpCode(201)
  async createMovie(@Body() dto: CreateMovieDto): Promise<MovieResponseDto> {
    return this.movieService.createMovie(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Manager)
  @Post('bulk')
  @ApiOperation({
    summary: 'Create multiple new movies',
    description: 'Requires Manager role',
  })
  @ApiResponse({ status: 201, type: [MovieResponseDto] })
  @ApiConflictResponse({
    description: 'One or more movies have titles that already exist',
  })
  @ApiBearerAuth()
  @HttpCode(201)
  async createBulkMovies(
    @Body() dto: BulkCreateMovieDto,
  ): Promise<MovieResponseDto[]> {
    return this.movieService.createBulkMovies(dto.movies);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Manager)
  @Patch(':movieId')
  @ApiOperation({
    summary: 'Update a movie by unique ID',
    description: 'Requires Manager role',
  })
  @ApiResponse({ status: 200, type: MovieResponseDto })
  @ApiNotFoundResponse({ description: 'Movie not found' })
  @ApiBearerAuth()
  @HttpCode(200)
  async updateMovie(
    @Param('movieId', new ParseUUIDPipe()) movieId: string,
    @Body() dto: UpdateMovieDto,
  ): Promise<MovieResponseDto> {
    return this.movieService.updateMovie(movieId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Manager)
  @Delete('bulk')
  @ApiOperation({
    summary: 'Delete multiple movies by unique IDs',
    description: 'Requires Manager role',
  })
  @ApiResponse({ status: 204, description: 'Movies deleted' })
  @ApiNotFoundResponse({ description: 'One or more movies not found' })
  @ApiBearerAuth()
  @HttpCode(204)
  async deleteBulkMovies(@Body() dto: BulkDeleteMoviesDto): Promise<void> {
    return this.movieService.deleteBulkMovies(dto.movieIds);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Manager)
  @Delete(':movieId')
  @ApiOperation({
    summary: 'Delete a movie by unique ID',
    description: 'Requires Manager role',
  })
  @ApiResponse({ status: 204, description: 'Movie deleted' })
  @ApiNotFoundResponse({ description: 'Movie not found' })
  @ApiBearerAuth()
  @HttpCode(204)
  async deleteMovie(
    @Param('movieId', new ParseUUIDPipe()) movieId: string,
  ): Promise<void> {
    return this.movieService.deleteMovie(movieId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':movieId/sessions')
  @ApiOperation({
    summary: 'Get sessions for a movie by unique ID (paginated)',
  })
  @ApiResponse({ status: 200, type: PaginatedMovieSessionResponseDto })
  @ApiBearerAuth()
  @HttpCode(200)
  @UseInterceptors(CachedResourceInterceptor)
  async getMovieSessions(
    @Req() req: Request,
    @Param('movieId', new ParseUUIDPipe()) movieId: string,
    @Query() query: QueryMovieSessionDto,
  ): Promise<PaginatedMovieSessionResponseDto> {
    return this.movieService.getSessions(movieId, query, req.url);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':movieId/sessions/:sessionId')
  @ApiOperation({ summary: 'Get a movie session by unique ID' })
  @ApiResponse({ status: 200, type: MovieSessionResponseDto })
  @ApiNotFoundResponse({ description: 'Movie session not found' })
  @ApiBearerAuth()
  @HttpCode(200)
  async getMovieSession(
    @Param('movieId', new ParseUUIDPipe()) movieId: string,
    @Param('sessionId', new ParseUUIDPipe()) sessionId: string,
  ): Promise<MovieSessionResponseDto> {
    return this.movieService.getMovieSessionById(movieId, sessionId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Manager)
  @Post(':movieId/sessions')
  @ApiOperation({
    summary: 'Create a movie session for a movie',
    description: 'Requires Manager role',
  })
  @ApiResponse({ status: 201, type: MovieSessionResponseDto })
  @ApiNotFoundResponse({ description: 'Movie not found' })
  @ApiConflictResponse({
    description: 'Room is already booked for this timeslot',
  })
  @ApiBearerAuth()
  @HttpCode(201)
  async createMovieSession(
    @Param('movieId', new ParseUUIDPipe()) movieId: string,
    @Body() dto: CreateMovieSessionDto,
  ): Promise<MovieSessionResponseDto> {
    return this.movieService.createSession(movieId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Manager)
  @Post(':movieId/sessions/bulk')
  @ApiOperation({
    summary: 'Create multiple movie sessions for a movie',
    description: 'Requires Manager role',
  })
  @ApiResponse({ status: 201, type: [MovieSessionResponseDto] })
  @ApiNotFoundResponse({ description: 'Movie not found' })
  @ApiConflictResponse({
    description: 'One or more rooms are already booked for the given timeslots',
  })
  @ApiBearerAuth()
  @HttpCode(201)
  async createBulkMovieSessions(
    @Param('movieId', new ParseUUIDPipe()) movieId: string,
    @Body() dto: BulkCreateMovieSessionsDto,
  ): Promise<MovieSessionResponseDto[]> {
    return this.movieService.createBulkSessions(movieId, dto.sessions);
  }
}
