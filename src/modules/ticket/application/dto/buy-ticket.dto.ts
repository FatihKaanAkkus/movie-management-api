import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty } from 'class-validator';

export class BuyTicketDto {
  @ApiProperty({
    example: '12345678-90ab-cdef-1234-567890abcdef',
    description: 'ID of the user buying the ticket',
  })
  @IsUUID('4')
  @IsNotEmpty()
  readonly userId: string;

  @ApiProperty({
    example: '87654321-90ab-cdef-1234-567890abcdef',
    description: 'ID of the movie session for which the ticket is being bought',
  })
  @IsUUID('4')
  @IsNotEmpty()
  readonly sessionId: string;
}
