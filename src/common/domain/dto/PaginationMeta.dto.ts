import { ApiProperty } from '@nestjs/swagger';

export class PaginationMetaDto {
  @ApiProperty({
    example: 1,
    description: 'Current page number',
  })
  readonly currentPage: number;

  @ApiProperty({
    example: 4,
    description: 'Total number of pages',
  })
  readonly totalPages: number;

  @ApiProperty({
    example: 100,
    description: 'Total number of items',
  })
  readonly totalItems: number;

  @ApiProperty({
    example: 25,
    description: 'Number of items per page',
  })
  readonly perPage: number;
}
