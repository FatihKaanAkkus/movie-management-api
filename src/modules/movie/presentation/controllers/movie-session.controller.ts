import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { MovieService } from '../../application/services/movie.service';
import { BulkDeleteMovieSessionsDto } from '../../application/dto/delete-movie-session.dto';
import { PaginatedMovieSessionResponseDto } from '../../application/dto/movie-session-response.dto';
import { QueryMovieSessionDto } from '../../application/dto/query-movie-session.dto';

import { JwtAuthGuard } from 'src/modules/auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/infrastructure/guards/roles.guard';
import { Roles } from 'src/modules/auth/infrastructure/guards/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';
import { CachedResourceInterceptor } from 'src/common/infrastructure/interceptors/cached-resource.interceptor';

@ApiTags('movie-sessions')
@Controller('v1/movie-sessions')
export class MovieSessionController {
  constructor(private readonly movieService: MovieService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'Get all movie sessions (paginated)' })
  @ApiResponse({ status: 200, type: PaginatedMovieSessionResponseDto })
  @ApiBearerAuth()
  @HttpCode(200)
  @UseInterceptors(CachedResourceInterceptor)
  async getAllSessions(
    @Req() req: Request,
    @Query() query: QueryMovieSessionDto,
  ): Promise<PaginatedMovieSessionResponseDto> {
    return this.movieService.getAllSessions(query, req.url);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Manager)
  @Delete('bulk')
  @ApiOperation({
    summary: 'Delete multiple movie sessions by unique IDs',
    description: 'Requires Manager role',
  })
  @ApiResponse({ status: 204, description: 'Movie sessions deleted' })
  @ApiNotFoundResponse({ description: 'One or more movie sessions not found' })
  @ApiBearerAuth()
  @HttpCode(204)
  async deleteBulkSessions(
    @Body() dto: BulkDeleteMovieSessionsDto,
  ): Promise<void> {
    return this.movieService.deleteBulkSessions(dto.sessionIds);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Manager)
  @Delete(':sessionId')
  @ApiOperation({
    summary: 'Delete a movie session by unique ID',
    description: 'Requires Manager role',
  })
  @ApiResponse({ status: 204, description: 'Movie session deleted' })
  @ApiNotFoundResponse({ description: 'Movie session not found' })
  @ApiBearerAuth()
  @HttpCode(204)
  async deleteSession(
    @Param('sessionId', new ParseUUIDPipe()) sessionId: string,
  ): Promise<void> {
    return this.movieService.deleteSession(sessionId);
  }
}
