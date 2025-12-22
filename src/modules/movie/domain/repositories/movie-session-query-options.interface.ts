import { MovieSessionTimeSlot } from 'src/common/enums/movie-session-timeslot.enum';

export interface IMovieSessionQueryOptions {
  // Page number for pagination
  readonly page?: number;

  // Number of items per page
  readonly perPage?: number;

  // Field to sort by
  readonly sort?: 'date' | 'timeslot' | 'roomNumber';

  // Sort order
  readonly order?: 'asc' | 'desc';

  // Filter by session date (ISO 8601 string)
  readonly date?: string;

  // Filter by timeslot
  readonly timeslot?: MovieSessionTimeSlot;

  // Filter by room number
  readonly roomNumber?: number;
}
