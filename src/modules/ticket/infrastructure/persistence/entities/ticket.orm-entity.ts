import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserOrmEntity } from 'src/modules/user/infrastructure/persistence/entities/user.orm-entity';
import { MovieSessionOrmEntity } from 'src/modules/movie/infrastructure/persistence/entities/movie-session.orm-entity';

@Entity('tickets')
export class TicketOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'session_id' })
  sessionId: string;

  @CreateDateColumn({ name: 'purchased_at' })
  purchasedAt: Date;

  @Column({ name: 'is_used', default: false })
  isUsed: boolean;

  @Column({ name: 'used_at', type: 'timestamp', nullable: true })
  usedAt: Date | null;

  @ManyToOne(() => UserOrmEntity)
  @JoinColumn({ name: 'user_id' })
  user: UserOrmEntity;

  @ManyToOne(() => MovieSessionOrmEntity)
  @JoinColumn({ name: 'session_id' })
  session: MovieSessionOrmEntity;
}
