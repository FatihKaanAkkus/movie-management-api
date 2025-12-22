import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AuthUserResponseDto {
  @ApiProperty({
    example: '29392fc7-7037-417a-bd9f-8d229e736c63',
    description: 'Unique identifier of the user',
  })
  readonly id: string;

  @ApiProperty({
    example: 'user123',
    description: 'Username of the user',
  })
  readonly username: string;

  @ApiProperty({
    example: 'customer',
    description: 'Role of the user',
  })
  readonly role: string;

  @ApiProperty({
    example: 25,
    description: 'Age of the user',
  })
  readonly age: number;
}

export class AuthResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token',
  })
  @IsString()
  readonly accessToken: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT refresh token',
  })
  @IsString()
  readonly refreshToken: string;

  @ApiProperty({
    example: '2025-01-01T00:15:00.000Z',
    description:
      'Expiration date and time of the access token in ISO 8601 format (UTC timezone)',
  })
  readonly expiresAt: Date;

  @ApiProperty({
    description: 'Authenticated user information',
    type: () => AuthUserResponseDto,
  })
  readonly user: AuthUserResponseDto;
}
