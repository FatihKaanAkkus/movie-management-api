import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from 'src/common/enums/user-role.enum';
import { TicketResponseDto } from 'src/modules/ticket/application/dto/ticket-response.dto';

export class UserResponseDto {
  @ApiProperty({
    example: '12345678-90ab-cdef-1234-567890abcdef',
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
  readonly role: UserRole;

  @ApiProperty({
    example: 25,
    description: 'Age of the user',
  })
  readonly age: number;

  @ApiProperty({
    example: '2025-01-01T00:00:00.000Z',
    description: 'Timestamp when the user was created',
  })
  readonly createdAt: Date;

  @ApiProperty({
    example: '2025-01-01T00:00:00.000Z',
    description: 'Timestamp when the user was last updated',
  })
  readonly updatedAt: Date;
}

export class UserWithTicketsResponseDto extends UserResponseDto {
  @ApiProperty({
    type: () => [TicketResponseDto],
    description: 'List of tickets associated with the user',
  })
  readonly tickets: TicketResponseDto[];
}
