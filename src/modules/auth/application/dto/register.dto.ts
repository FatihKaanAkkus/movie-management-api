import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsString, Min, MinLength } from 'class-validator';
import {
  MIN_PASSWORD_LENGTH,
  MIN_USERNAME_LENGTH,
} from 'src/common/constants/auth.constants';
import { UserRole } from 'src/common/enums/user-role.enum';

export class RegisterDto {
  @ApiProperty({ example: 'user123', description: 'Desired username' })
  @IsString()
  @MinLength(MIN_USERNAME_LENGTH)
  readonly username: string;

  @ApiProperty({ example: 'strongPassword123', description: 'User password' })
  @IsString()
  @MinLength(MIN_PASSWORD_LENGTH)
  readonly password: string;

  @ApiProperty({
    example: 'customer',
    enum: UserRole,
    description: 'User role',
  })
  @IsEnum(UserRole)
  readonly role: UserRole;

  @ApiProperty({ example: 25, description: 'User age' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  readonly age: number;
}
