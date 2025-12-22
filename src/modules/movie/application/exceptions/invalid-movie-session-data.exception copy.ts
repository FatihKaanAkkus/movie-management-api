import { BadRequestException } from '@nestjs/common';

export class InvalidMovieSessionDataException extends BadRequestException {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidMovieSessionDataException';
  }
}
