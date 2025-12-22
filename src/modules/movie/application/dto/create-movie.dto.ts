import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateMovieDto {
  @ApiProperty({
    example: 'Sherlock Holmes',
    description: 'Title of the movie',
  })
  @IsString()
  readonly title: string;

  @ApiProperty({
    example: 13,
    description: 'Minimum age required to watch the movie',
    minimum: 0,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  readonly ageRestriction: number;
}

export class BulkCreateMovieDto {
  @ApiProperty({
    type: [CreateMovieDto],
    description: 'Array of movies to create',
    example: [
      { title: 'Sherlock Holmes', ageRestriction: 13 },
      { title: 'Hobbit', ageRestriction: 3 },
    ],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateMovieDto)
  readonly movies: CreateMovieDto[];
}
