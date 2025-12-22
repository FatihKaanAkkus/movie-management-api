import { BadRequestException } from '@nestjs/common';

export class Token {
  private readonly token: string;

  private constructor(token: string) {
    if (!Token.isValid(token)) {
      throw new BadRequestException('Invalid token format');
    }
    this.token = token;
  }

  static create(token: string): Token {
    return new Token(token);
  }

  static isValid(token: string): boolean {
    return typeof token === 'string' && token.split('.').length === 3;
  }

  get value(): string {
    return this.token;
  }
}
