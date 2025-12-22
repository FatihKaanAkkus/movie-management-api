import { v4 as uuidv4 } from 'uuid';
import { UserRole } from '../value-objects/user-role.vo';
import { Password } from 'src/modules/auth/domain/value-objects/password.vo';

export interface UserProps {
  id?: string;
  username: string;
  hashedPassword?: Password;
  role?: UserRole;
  age: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class User {
  constructor(
    public readonly id: string,
    public username: string,
    public hashedPassword: Password,
    public role: UserRole,
    public age: number,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {}

  static create(props: UserProps): User {
    return new User(
      props.id ?? uuidv4(),
      props.username,
      props.hashedPassword ?? Password.fromHashed(''),
      props.role ?? UserRole.Customer,
      props.age,
      props.createdAt ?? new Date(),
      props.updatedAt ?? new Date(),
    );
  }

  changePassword(newHashedPassword: string) {
    this.hashedPassword = Password.fromHashed(newHashedPassword);
    this.updateTimestamp();
  }

  updateProfile(username: string, age: number) {
    this.username = username;
    this.age = age;
    this.updateTimestamp();
  }

  private updateTimestamp() {
    this.updatedAt = new Date();
  }

  get value(): UserProps {
    return {
      id: this.id,
      username: this.username,
      role: this.role,
      age: this.age,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
