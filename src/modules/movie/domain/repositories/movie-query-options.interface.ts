export interface IMovieQueryOptions {
  // Page number for pagination
  readonly page?: number;

  // Number of items per page
  readonly perPage?: number;

  // Field to sort by
  readonly sort?: 'title' | 'ageRestriction' | 'createdAt';

  // Sort order
  readonly order?: 'asc' | 'desc';

  // Filter by minimum age restriction
  readonly ageRestriction?: number;

  // Filter by movie title (partial match)
  readonly title?: string;
}
