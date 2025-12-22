import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { MIN_PASSWORD_LENGTH } from 'src/common/constants/auth.constants';

export class Password {
  private readonly hashed: string;

  private constructor(hashed: string) {
    this.hashed = hashed;
  }

  static async fromPlain(plain: string): Promise<Password> {
    if (!Password.isValid(plain)) {
      throw new BadRequestException(
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters and contain a number`,
      );
    }
    const hashed = await bcrypt.hash(plain, 10);
    return new Password(hashed);
  }

  static fromHashed(hashed: string): Password {
    if (!hashed || typeof hashed !== 'string') {
      throw new BadRequestException('Invalid hashed password');
    }
    return new Password(hashed);
  }

  static isValid(plain: string): boolean {
    return (
      typeof plain === 'string' &&
      plain.length >= MIN_PASSWORD_LENGTH &&
      /\d/.test(plain)
    );
  }

  async compare(plain: string): Promise<boolean> {
    return bcrypt.compare(plain, this.hashed);
  }

  get value(): string {
    return this.hashed;
  }
}
