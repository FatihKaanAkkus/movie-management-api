import { ApiProperty } from '@nestjs/swagger';
import { MovieSessionResponseDto } from './movie-session-response.dto';
import { PaginationMetaDto } from 'src/common/domain/dto/PaginationMeta.dto';

export class MovieResponseDto {
  @ApiProperty({
    example: '12345678-90ab-cdef-1234-567890abcdef',
    description: 'Unique identifier of the created movie',
  })
  readonly id: string;

  @ApiProperty({
    example: 'Sherlock Holmes',
    description: 'Title of the created movie',
  })
  readonly title: string;

  @ApiProperty({
    example: 13,
    description: 'Minimum age required to watch the movie',
  })
  readonly ageRestriction: number;

  @ApiProperty({
    example: '2025-01-01T00:00:00.000Z',
    description: 'Timestamp when the movie was created',
    type: String,
    format: 'date-time',
  })
  readonly createdAt: Date;

  @ApiProperty({
    example: '2025-01-01T00:00:00.000Z',
    description: 'Timestamp when the movie was last updated',
    type: String,
    format: 'date-time',
  })
  readonly updatedAt: Date;
}

export class MovieWithSessionsResponseDto extends MovieResponseDto {
  @ApiProperty({
    description: 'List of sessions associated with the movie',
    type: () => [MovieSessionResponseDto],
    required: false,
    default: [],
  })
  readonly sessions: MovieSessionResponseDto[];
}

export class PaginatedMovieResponseDto {
  @ApiProperty({
    description: 'List of movies for the current page',
    type: () => [MovieResponseDto],
  })
  readonly movies: MovieResponseDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: () => PaginationMetaDto,
  })
  readonly meta: PaginationMetaDto;
}
