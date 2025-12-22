import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateMovieDto {
  @ApiPropertyOptional({
    example: 'Sherlock Holmes',
    description: 'Title of the movie',
  })
  @IsOptional()
  @IsString()
  readonly title?: string;

  @ApiPropertyOptional({
    example: 13,
    description: 'Minimum age required to watch the movie',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  readonly ageRestriction?: number;
}
