import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsIn, IsString, IsInt, Min, Max } from 'class-validator';

export class QueryMovieDto {
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
    enum: ['title', 'ageRestriction', 'createdAt'],
    example: 'title',
  })
  @IsOptional()
  @IsIn(['title', 'ageRestriction', 'createdAt'])
  readonly sort?: 'title' | 'ageRestriction' | 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    example: 'asc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  readonly order?: 'asc' | 'desc';

  @ApiPropertyOptional({
    description: 'Filter by minimum age restriction',
    example: 18,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  readonly ageRestriction?: number;

  @ApiPropertyOptional({
    description: 'Filter by movie title (partial match)',
    example: 'Matrix',
  })
  @IsOptional()
  @IsString()
  readonly title?: string;
}
