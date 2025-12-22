import { v4 as uuidv4 } from 'uuid';
import { Token } from '../value-objects/token.vo';

export interface RefreshTokenProps {
  id?: string;
  token: Token;
  userId: string;
  sessionId: string;
  createdAt?: Date;
  expiresAt: Date;
  isRevoked?: boolean;
  revokedAt?: Date | null;
}

export class RefreshToken {
  constructor(
    public readonly id: string,
    public readonly token: Token,
    public readonly userId: string,
    public readonly sessionId: string,
    public readonly createdAt: Date,
    public readonly expiresAt: Date,
    public isRevoked: boolean = false,
    public revokedAt: Date | null = null,
  ) {}

  static create(props: RefreshTokenProps): RefreshToken {
    return new RefreshToken(
      props.id ?? uuidv4(),
      props.token,
      props.userId,
      props.sessionId,
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

  isValid(): boolean {
    return !this.isRevoked && new Date() < this.expiresAt;
  }
}
