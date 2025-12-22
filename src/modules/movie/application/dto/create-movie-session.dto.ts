import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  Min,
  ValidateNested,
} from 'class-validator';
import { MovieSessionTimeSlot } from 'src/common/enums/movie-session-timeslot.enum';

export class CreateMovieSessionDto {
  @ApiProperty({
    example: '2025-01-01T20:00:00.000Z',
    description: 'Date and time of the movie session (ISO 8601 format)',
  })
  @IsDateString()
  readonly date: string;

  @ApiProperty({
    example: MovieSessionTimeSlot.Evening,
    enum: MovieSessionTimeSlot,
    description: 'Timeslot for the session',
  })
  @IsEnum(MovieSessionTimeSlot)
  readonly timeslot: MovieSessionTimeSlot;

  @ApiProperty({
    example: 1,
    description: 'Room number for the session (must be >= 1)',
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  readonly roomNumber: number;
}

export class BulkCreateMovieSessionsDto {
  @ApiProperty({
    type: [CreateMovieSessionDto],
    description: 'Array of movie sessions to create',
    example: [
      {
        date: '2025-01-01T20:00:00.000Z',
        timeslot: MovieSessionTimeSlot.Evening,
        roomNumber: 1,
      },
      {
        date: '2025-01-02T18:00:00.000Z',
        timeslot: MovieSessionTimeSlot.Afternoon,
        roomNumber: 2,
      },
    ],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateMovieSessionDto)
  readonly sessions: CreateMovieSessionDto[];
}
