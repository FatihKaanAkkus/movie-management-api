import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MovieSessionOrmEntity } from './movie-session.orm-entity';

@Entity('movies')
export class MovieOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ name: 'age_restriction', type: 'int' })
  ageRestriction: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => MovieSessionOrmEntity, (session) => session.movie)
  sessions: MovieSessionOrmEntity[];
}
