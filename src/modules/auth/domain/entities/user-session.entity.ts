import { v4 as uuidv4 } from 'uuid';

export interface UserSessionProps {
  id?: string;
  userId: string;
  createdAt?: Date;
  expiresAt: Date;
  isRevoked?: boolean;
  revokedAt?: Date | null;
}

export class UserSession {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly createdAt: Date,
    public readonly expiresAt: Date,
    public isRevoked: boolean,
    public revokedAt: Date | null,
  ) {}

  static create(props: UserSessionProps): UserSession {
    return new UserSession(
      props.id ?? uuidv4(),
      props.userId,
      props.createdAt ?? new Date(),
      props.expiresAt,
      props.isRevoked ?? false,
      props.revokedAt ?? null,
    );
  }

  revoke() {
    this.isRevoked = true;
    this.revokedAt = new Date();
  }

  isActive(): boolean {
    return !this.isRevoked && new Date() < this.expiresAt;
  }
}
