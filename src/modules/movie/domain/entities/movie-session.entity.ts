import { v4 as uuidv4 } from 'uuid';
import { InvalidMovieSessionDataException } from '../../application/exceptions/invalid-movie-session-data.exception copy';

export interface MovieSessionProps {
  id?: string;
  movieId: string;
  date: Date;
  timeslot: string;
  roomNumber: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class MovieSession {
  constructor(
    public readonly id: string,
    public readonly movieId: string,
    public readonly date: Date,
    public readonly timeslot: string,
    public readonly roomNumber: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(props: MovieSessionProps): MovieSession {
    if (props.date < new Date()) {
      throw new InvalidMovieSessionDataException(
        'Session date must be in the future',
      );
    }
    if (props.roomNumber <= 0) {
      throw new InvalidMovieSessionDataException(
        'Room number must be a positive integer',
      );
    }
    const allowedSlots = [
      '10:00-12:00',
      '12:00-14:00',
      '14:00-16:00',
      '16:00-18:00',
      '18:00-20:00',
      '20:00-22:00',
      '22:00-00:00',
    ];
    if (!allowedSlots.includes(props.timeslot)) {
      throw new InvalidMovieSessionDataException(
        `Invalid timeslot: ${props.timeslot}`,
      );
    }

    return new MovieSession(
      props.id ?? uuidv4(),
      props.movieId,
      props.date,
      props.timeslot,
      props.roomNumber,
      props.createdAt ?? new Date(),
      props.updatedAt ?? new Date(),
    );
  }
}
