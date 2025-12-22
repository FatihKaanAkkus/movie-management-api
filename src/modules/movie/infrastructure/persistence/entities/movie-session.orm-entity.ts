import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MovieOrmEntity } from './movie.orm-entity';

@Entity('movie_sessions')
export class MovieSessionOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'movie_id' })
  movieId: string;

  @Column()
  date: Date;

  @Column()
  timeslot: string;

  @Column({ name: 'room_number', type: 'int' })
  roomNumber: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => MovieOrmEntity)
  @JoinColumn({ name: 'movie_id' })
  movie: MovieOrmEntity;
}
