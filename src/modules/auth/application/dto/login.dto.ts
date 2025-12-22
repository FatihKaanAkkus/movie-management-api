import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';
import { MIN_PASSWORD_LENGTH } from 'src/common/constants/auth.constants';

export class LoginDto {
  @ApiProperty({
    example: 'user123',
    description: 'User username',
  })
  @IsString()
  readonly username: string;

  @ApiProperty({
    example: 'strongPassword123',
    description: 'User password',
  })
  @IsString()
  @MinLength(MIN_PASSWORD_LENGTH)
  readonly password: string;
}
