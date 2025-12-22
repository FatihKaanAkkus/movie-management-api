import { v4 as uuidv4 } from 'uuid';
import { InvalidMovieDataException } from '../../application/exceptions/invalid-movie-data.exception';

export interface MovieProps {
  id?: string;
  title: string;
  ageRestriction: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Movie {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly ageRestriction: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(props: MovieProps): Movie {
    if (props.title.trim().length === 0) {
      throw new InvalidMovieDataException('Title cannot be empty');
    }
    if (props.ageRestriction < 0 || props.ageRestriction > 21) {
      throw new InvalidMovieDataException(
        'Age restriction must be between 0 and 21',
      );
    }

    return new Movie(
      props.id ?? uuidv4(),
      props.title,
      props.ageRestriction,
      props.createdAt ?? new Date(),
      props.updatedAt ?? new Date(),
    );
  }
}
