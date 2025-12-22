import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';

export class BulkDeleteMovieSessionsDto {
  @ApiProperty({
    type: [String],
    description: 'Array of movie session IDs to delete',
    example: ['sessionId1', 'sessionId2'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  readonly sessionIds: string[];
}
