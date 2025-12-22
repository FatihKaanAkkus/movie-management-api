import { ApiProperty } from '@nestjs/swagger';

export class TicketResponseDto {
  @ApiProperty({
    example: '12345678-90ab-cdef-1234-567890abcdef',
    description: 'Unique identifier of the ticket',
  })
  readonly id: string;

  @ApiProperty({
    example: '87654321-90ab-cdef-1234-567890abcdef',
    description: 'ID of the user who purchased the ticket',
  })
  readonly userId: string;

  @ApiProperty({
    example: '43215678-90ab-cdef-1234-567890abcdef',
    description: 'ID of the session for which the ticket was purchased',
  })
  readonly sessionId: string;

  @ApiProperty({
    example: '2025-01-01T00:00:00.000Z',
    description: 'Timestamp when the ticket was purchased',
  })
  readonly purchasedAt: Date;

  @ApiProperty({
    example: false,
    description: 'Indicates whether the ticket has been used',
  })
  readonly isUsed: boolean;

  @ApiProperty({
    example: '2025-01-02T00:00:00.000Z',
    description: 'Timestamp when the ticket was used, null if not used',
    nullable: true,
  })
  readonly usedAt?: Date | null;
}
