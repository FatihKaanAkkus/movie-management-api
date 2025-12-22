import { BadRequestException } from '@nestjs/common';

export class InvalidUserRoleException extends BadRequestException {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidUserRoleException';
  }
}
