import { BadRequestException } from '@nestjs/common';

export class UserRole {
  private static readonly allowed = ['manager', 'customer'] as const;

  private readonly role: (typeof UserRole.allowed)[number];

  private constructor(role: (typeof UserRole.allowed)[number]) {
    this.role = role;
  }

  static Manager = new UserRole('manager');
  static Customer = new UserRole('customer');

  static from(role: string): UserRole {
    if (!UserRole.isAllowed(role)) {
      throw new BadRequestException(`Invalid user role: ${role}`);
    }
    return new UserRole(role);
  }

  private static isAllowed(
    role: string,
  ): role is (typeof UserRole.allowed)[number] {
    return UserRole.allowed.includes(role as (typeof UserRole.allowed)[number]);
  }

  isManager(): boolean {
    return this.role === 'manager';
  }

  isCustomer(): boolean {
    return this.role === 'customer';
  }

  toString(): string {
    return this.role;
  }

  get value(): string {
    return this.role;
  }
}
