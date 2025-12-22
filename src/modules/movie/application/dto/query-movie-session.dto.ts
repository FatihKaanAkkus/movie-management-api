import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsOptional,
  IsIn,
  IsDateString,
  IsEnum,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { MovieSessionTimeSlot } from 'src/common/enums/movie-session-timeslot.enum';

export class QueryMovieSessionDto {
  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly page: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page for pagination',
    example: 25,
    default: 25,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  readonly perPage: number = 25;

  @ApiPropertyOptional({
    description: 'Field to sort by',
    enum: ['date', 'timeslot', 'roomNumber'],
    example: 'date',
  })
  @IsOptional()
  @IsIn(['date', 'timeslot', 'roomNumber'])
  readonly sort?: 'date' | 'timeslot' | 'roomNumber';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    example: 'asc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  readonly order?: 'asc' | 'desc';

  @ApiPropertyOptional({
    description: 'Filter by session date (ISO 8601 string)',
    example: '2025-01-01T20:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  readonly date?: string;

  @ApiPropertyOptional({
    description: 'Filter by timeslot',
    enum: MovieSessionTimeSlot,
    example: MovieSessionTimeSlot.Evening,
  })
  @IsOptional()
  @IsEnum(MovieSessionTimeSlot)
  readonly timeslot?: MovieSessionTimeSlot;

  @ApiPropertyOptional({
    description: 'Filter by room number',
    example: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  readonly roomNumber?: number;
}
