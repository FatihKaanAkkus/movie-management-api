import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    example: 'xRxGGEpVawiUak6He367W3oeOfh+3...',
    description: 'Refresh token string',
  })
  @IsString()
  readonly refreshToken: string;
}
