import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from 'src/common/domain/dto/PaginationMeta.dto';
import { MovieSessionTimeSlot } from 'src/common/enums/movie-session-timeslot.enum';

export class MovieSessionResponseDto {
  @ApiProperty({
    example: '12345678-90ab-cdef-1234-567890abcdef',
    description: 'Unique identifier of the movie session',
  })
  readonly id: string;

  @ApiProperty({
    example: '87654321-90ab-cdef-1234-567890abcdef',
    description: 'ID of the movie this session belongs to',
  })
  readonly movieId: string;

  @ApiProperty({
    example: '2025-01-01T20:00:00.000Z',
    description: 'Date and time of the session',
    type: String,
    format: 'date-time',
  })
  readonly date: Date;

  @ApiProperty({
    example: 'Evening',
    description: 'Timeslot of the session',
    enum: MovieSessionTimeSlot,
  })
  readonly timeslot: string;

  @ApiProperty({
    example: 1,
    description: 'Room number for the session',
  })
  readonly roomNumber: number;

  @ApiProperty({
    example: '2025-01-01T10:00:00.000Z',
    description: 'Timestamp when the session was created',
    type: String,
    format: 'date-time',
  })
  readonly createdAt: Date;

  @ApiProperty({
    example: '2025-01-01T12:00:00.000Z',
    description: 'Timestamp when the session was last updated',
    type: String,
    format: 'date-time',
  })
  readonly updatedAt: Date;
}

export class PaginatedMovieSessionResponseDto {
  @ApiProperty({
    description: 'List of movie sessions',
    type: [MovieSessionResponseDto],
  })
  readonly sessions: MovieSessionResponseDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: PaginationMetaDto,
  })
  readonly meta: PaginationMetaDto;
}
