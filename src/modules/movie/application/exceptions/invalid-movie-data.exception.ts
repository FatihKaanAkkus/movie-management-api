import { BadRequestException } from '@nestjs/common';

export class InvalidMovieDataException extends BadRequestException {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidMovieDataException';
  }
}
