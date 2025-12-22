import { ApiProperty } from '@nestjs/swagger';

export class ApiInfoDto {
  @ApiProperty({
    example: 'Welcome to the Movie Management API!',
    description: 'Description of the API',
  })
  readonly description: string;

  @ApiProperty({
    example: ['v1'],
    description: 'List of available API versions',
  })
  readonly availableVersions: string[];

  @ApiProperty({
    example: '/api',
    description: 'URL to the API documentation',
  })
  readonly docsUrl: string;
}
