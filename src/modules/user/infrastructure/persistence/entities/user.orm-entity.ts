import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole } from 'src/common/enums/user-role.enum';
import { RefreshTokenOrmEntity } from 'src/modules/auth/infrastructure/persistence/entities/refresh-token.orm-entity';
import { UserSessionOrmEntity } from 'src/modules/auth/infrastructure/persistence/entities/user-session.orm-entity';

@Entity('users')
export class UserOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column({ name: 'hashed_password' })
  hashedPassword: string;

  @Column({ default: UserRole.Customer })
  role: string;

  @Column({ type: 'int' })
  age: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => RefreshTokenOrmEntity, (token) => token.user)
  refreshTokens: RefreshTokenOrmEntity[];

  @OneToMany(() => UserSessionOrmEntity, (session) => session.user)
  userSessions: UserSessionOrmEntity[];
}
