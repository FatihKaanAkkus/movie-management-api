import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';

export class BulkDeleteMoviesDto {
  @ApiProperty({
    type: [String],
    description: 'Array of movie IDs to delete',
    example: ['movieId1', 'movieId2'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  readonly movieIds: string[];
}
