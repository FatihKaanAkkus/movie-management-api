import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { MovieSessionTimeSlot } from '../src/common/enums/movie-session-timeslot.enum';

describe('MovieController (e2e)', () => {
  let app: INestApplication<App>;
  let managerToken: string;
  let customerToken: string;
  let testMovieId: string;
  let testSessionId: string;

  const managerUsername = `manager${Date.now()}`;
  const customerUsername = `customer${Date.now()}`;

  const nonExistingUUID = 'cb489a20-27cf-4676-9615-6f444f525562';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    // Register and login as manager
    const managerRegisterRes = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({
        username: managerUsername,
        password: 'password123',
        role: 'manager',
        age: 30,
      });
    const managerRegisterBody = managerRegisterRes.body as {
      accessToken: string;
    };
    managerToken = managerRegisterBody.accessToken;

    // Register and login as customer
    const customerRegisterRes = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({
        username: customerUsername,
        password: 'password123',
        role: 'customer',
        age: 25,
      });
    const customerRegisterBody = customerRegisterRes.body as {
      accessToken: string;
    };
    customerToken = customerRegisterBody.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /movies', () => {
    it('should create a movie when authenticated as manager', () => {
      return request(app.getHttpServer())
        .post('/v1/movies')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          title: 'Sherlock Holmes',
          ageRestriction: 13,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('title', 'Sherlock Holmes');
          expect(res.body).toHaveProperty('ageRestriction', 13);
          testMovieId = (res.body as { id: string }).id;
        });
    });

    it('should return 401 when no token is provided', () => {
      return request(app.getHttpServer())
        .post('/v1/movies')
        .send({
          title: 'Test Movie',
          ageRestriction: 10,
        })
        .expect(401);
    });

    it('should return 403 when authenticated as customer', () => {
      return request(app.getHttpServer())
        .post('/v1/movies')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          title: 'Test Movie',
          ageRestriction: 10,
        })
        .expect(403);
    });

    it('should return 400 with invalid data (negative age restriction)', () => {
      return request(app.getHttpServer())
        .post('/v1/movies')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          title: 'Test Movie',
          ageRestriction: -1,
        })
        .expect(400);
    });

    it('should return 400 with missing required fields', () => {
      return request(app.getHttpServer())
        .post('/v1/movies')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          title: 'Test Movie',
        })
        .expect(400);
    });
  });

  describe('POST /movies/bulk', () => {
    it('should create multiple movies when authenticated as manager', () => {
      return request(app.getHttpServer())
        .post('/v1/movies/bulk')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          movies: [
            { title: 'The Hobbit', ageRestriction: 3 },
            { title: 'The Lord of the Rings', ageRestriction: 13 },
          ],
        })
        .expect(201)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          const body = res.body as Array<any>;
          expect(body.length).toBe(2);
          expect(body[0]).toHaveProperty('id');
          expect(body[0]).toHaveProperty('title', 'The Hobbit');
          expect(body[1]).toHaveProperty('title', 'The Lord of the Rings');
        });
    });

    it('should return 403 when authenticated as customer', () => {
      return request(app.getHttpServer())
        .post('/v1/movies/bulk')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          movies: [{ title: 'Test Movie', ageRestriction: 10 }],
        })
        .expect(403);
    });

    it('should return 400 with empty array', () => {
      return request(app.getHttpServer())
        .post('/v1/movies/bulk')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          movies: [],
        })
        .expect(400);
    });
  });

  describe('GET /movies', () => {
    it('should return all movies when authenticated', () => {
      return request(app.getHttpServer())
        .get('/v1/movies')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('movies');
          expect(res.body).toHaveProperty('meta');
          expect(Array.isArray((res.body as { movies: any[] }).movies)).toBe(
            true,
          );
          const body = res.body as { movies: any[] };
          expect(body.movies.length).toBeGreaterThanOrEqual(1);
          expect(body.movies[0]).toHaveProperty('id');
          expect(body.movies[0]).toHaveProperty('title');
          expect(body.movies[0]).toHaveProperty('ageRestriction');
        });
    });

    it('should return 401 when no token is provided', () => {
      return request(app.getHttpServer()).get('/v1/movies').expect(401);
    });

    it('should support pagination with perPage and currentPage', () => {
      return request(app.getHttpServer())
        .get('/v1/movies?perPage=2&currentPage=1')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('movies');
          expect(res.body).toHaveProperty('meta');
          const body = res.body as { movies: any[]; meta: any };
          expect(body.movies.length).toBeLessThanOrEqual(2);
          expect(body.meta).toHaveProperty('currentPage');
          expect(body.meta).toHaveProperty('totalPages');
          expect(body.meta).toHaveProperty('totalItems');
          expect(body.meta).toHaveProperty('perPage');
        });
    });

    it('should filter by title', () => {
      return request(app.getHttpServer())
        .get('/v1/movies?title=Sherlock')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200)
        .expect((res) => {
          const body = res.body as { movies: any[] };
          expect(body.movies.length).toBeGreaterThanOrEqual(1);
          expect(
            body.movies.some((m: { title: string }) =>
              m.title.toLowerCase().includes('sherlock'),
            ),
          ).toBe(true);
        });
    });
  });

  describe('GET /movies/:id', () => {
    it('should return movie by id when authenticated', () => {
      return request(app.getHttpServer())
        .get(`/v1/movies/${testMovieId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', testMovieId);
          expect(res.body).toHaveProperty('title');
          expect(res.body).toHaveProperty('ageRestriction');
          expect(res.body).toHaveProperty('sessions');
          expect(
            Array.isArray((res.body as { sessions: any[] }).sessions),
          ).toBe(true);
        });
    });

    it('should return 401 when no token is provided', () => {
      return request(app.getHttpServer())
        .get(`/v1/movies/${testMovieId}`)
        .expect(401);
    });

    it('should return 404 for non-existent movie', () => {
      return request(app.getHttpServer())
        .get(`/v1/movies/${nonExistingUUID}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(404);
    });

    it('should return 400 for invalid UUID', () => {
      return request(app.getHttpServer())
        .get('/v1/movies/invalid-id')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(400);
    });
  });

  describe('PATCH /movies/:id', () => {
    it('should update movie when authenticated as manager', () => {
      return request(app.getHttpServer())
        .patch(`/v1/movies/${testMovieId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          title: 'Sherlock Holmes Updated',
          ageRestriction: 15,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', testMovieId);
          expect(res.body).toHaveProperty('title', 'Sherlock Holmes Updated');
          expect(res.body).toHaveProperty('ageRestriction', 15);
        });
    });

    it('should update only title when provided', () => {
      return request(app.getHttpServer())
        .patch(`/v1/movies/${testMovieId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          title: 'Sherlock Holmes Final',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('title', 'Sherlock Holmes Final');
          expect(res.body).toHaveProperty('ageRestriction', 15);
        });
    });

    it('should return 401 when no token is provided', () => {
      return request(app.getHttpServer())
        .patch(`/v1/movies/${testMovieId}`)
        .send({
          title: 'Test',
        })
        .expect(401);
    });

    it('should return 403 when authenticated as customer', () => {
      return request(app.getHttpServer())
        .patch(`/v1/movies/${testMovieId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          title: 'Test',
        })
        .expect(403);
    });

    it('should return 404 for non-existent movie', () => {
      return request(app.getHttpServer())
        .patch(`/v1/movies/${nonExistingUUID}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          title: 'Test',
        })
        .expect(404);
    });
  });

  describe('POST /movies/:id/sessions', () => {
    it('should create a session for a movie when authenticated as manager', () => {
      return request(app.getHttpServer())
        .post(`/v1/movies/${testMovieId}/sessions`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          date: '2025-12-25T20:00:00.000Z',
          timeslot: MovieSessionTimeSlot.Evening,
          roomNumber: 1,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('movieId', testMovieId);
          expect(res.body).toHaveProperty('date');
          expect(res.body).toHaveProperty(
            'timeslot',
            MovieSessionTimeSlot.Evening,
          );
          expect(res.body).toHaveProperty('roomNumber', 1);
          testSessionId = (res.body as { id: string }).id;
        });
    });

    it('should return 401 when no token is provided', () => {
      return request(app.getHttpServer())
        .post(`/v1/movies/${testMovieId}/sessions`)
        .send({
          date: '2025-12-25T20:00:00.000Z',
          timeslot: MovieSessionTimeSlot.Evening,
          roomNumber: 1,
        })
        .expect(401);
    });

    it('should return 403 when authenticated as customer', () => {
      return request(app.getHttpServer())
        .post(`/v1/movies/${testMovieId}/sessions`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          date: '2025-12-25T20:00:00.000Z',
          timeslot: MovieSessionTimeSlot.Evening,
          roomNumber: 1,
        })
        .expect(403);
    });

    it('should return 400 with invalid timeslot', () => {
      return request(app.getHttpServer())
        .post(`/v1/movies/${testMovieId}/sessions`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          date: '2025-12-25T20:00:00.000Z',
          timeslot: 'invalid',
          roomNumber: 1,
        })
        .expect(400);
    });

    it('should return 400 with invalid room number', () => {
      return request(app.getHttpServer())
        .post(`/v1/movies/${testMovieId}/sessions`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          date: '2025-12-25T20:00:00.000Z',
          timeslot: MovieSessionTimeSlot.Evening,
          roomNumber: 0,
        })
        .expect(400);
    });

    it('should return 409 when room is already booked for the timeslot', async () => {
      // Create first session
      await request(app.getHttpServer())
        .post(`/v1/movies/${testMovieId}/sessions`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          date: '2025-12-30T20:00:00.000Z',
          timeslot: MovieSessionTimeSlot.Evening,
          roomNumber: 10,
        });

      // Try to book same room at same time
      return request(app.getHttpServer())
        .post(`/v1/movies/${testMovieId}/sessions`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          date: '2025-12-30T20:00:00.000Z',
          timeslot: MovieSessionTimeSlot.Evening,
          roomNumber: 10,
        })
        .expect(409);
    });

    it('should return 409 when creating movie with duplicate title', () => {
      return request(app.getHttpServer())
        .post('/v1/movies')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          title: 'Sherlock Holmes Final', // Already created
          ageRestriction: 13,
        })
        .expect(409);
    });
  });

  describe('POST /movies/:id/sessions/bulk', () => {
    it('should create multiple sessions for a movie when authenticated as manager', () => {
      return request(app.getHttpServer())
        .post(`/v1/movies/${testMovieId}/sessions/bulk`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          sessions: [
            {
              date: '2025-12-26T14:00:00.000Z',
              timeslot: MovieSessionTimeSlot.Afternoon,
              roomNumber: 2,
            },
            {
              date: '2025-12-26T18:00:00.000Z',
              timeslot: MovieSessionTimeSlot.Evening,
              roomNumber: 3,
            },
          ],
        })
        .expect(201)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          const body = res.body as Array<any>;
          expect(body.length).toBe(2);
          expect(body[0]).toHaveProperty('movieId', testMovieId);
          expect(body[0]).toHaveProperty('roomNumber', 2);
          expect(body[1]).toHaveProperty('roomNumber', 3);
        });
    });

    it('should return 403 when authenticated as customer', () => {
      return request(app.getHttpServer())
        .post(`/v1/movies/${testMovieId}/sessions/bulk`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          sessions: [
            {
              date: '2025-12-26T14:00:00.000Z',
              timeslot: MovieSessionTimeSlot.Afternoon,
              roomNumber: 2,
            },
          ],
        })
        .expect(403);
    });
  });

  describe('GET /movies/:id/sessions', () => {
    it('should return all sessions for a movie when authenticated', () => {
      return request(app.getHttpServer())
        .get(`/v1/movies/${testMovieId}/sessions`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('sessions');
          expect(res.body).toHaveProperty('meta');
          expect(
            Array.isArray((res.body as { sessions: any[] }).sessions),
          ).toBe(true);
          const body = res.body as { sessions: any[] };
          expect(body.sessions.length).toBeGreaterThanOrEqual(1);
          expect(body.sessions[0]).toHaveProperty('id');
          expect(body.sessions[0]).toHaveProperty('movieId', testMovieId);
          expect(body.sessions[0]).toHaveProperty('date');
          expect(body.sessions[0]).toHaveProperty('timeslot');
          expect(body.sessions[0]).toHaveProperty('roomNumber');
        });
    });

    it('should return 401 when no token is provided', () => {
      return request(app.getHttpServer())
        .get(`/v1/movies/${testMovieId}/sessions`)
        .expect(401);
    });
  });

  describe('GET /movies/:movieId/sessions/:sessionId', () => {
    it('should return a specific session when authenticated', () => {
      return request(app.getHttpServer())
        .get(`/v1/movies/${testMovieId}/sessions/${testSessionId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', testSessionId);
          expect(res.body).toHaveProperty('movieId', testMovieId);
          expect(res.body).toHaveProperty('date');
          expect(res.body).toHaveProperty('timeslot');
          expect(res.body).toHaveProperty('roomNumber');
        });
    });

    it('should return 401 when no token is provided', () => {
      return request(app.getHttpServer())
        .get(`/v1/movies/${testMovieId}/sessions/${testSessionId}`)
        .expect(401);
    });

    it('should return 404 for non-existent session', () => {
      return request(app.getHttpServer())
        .get(`/v1/movies/${testMovieId}/sessions/${nonExistingUUID}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(404);
    });

    it('should return 409 when session does not belong to the movie', async () => {
      // Create another movie
      const anotherMovieRes = await request(app.getHttpServer())
        .post('/v1/movies')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          title: 'Another Movie for Mismatch Test',
          ageRestriction: 10,
        });
      const anotherMovieId = (anotherMovieRes.body as { id: string }).id;

      // Try to access testSessionId (which belongs to testMovieId) through anotherMovieId
      return request(app.getHttpServer())
        .get(`/v1/movies/${anotherMovieId}/sessions/${testSessionId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(409);
    });
  });

  describe('GET /movie-sessions', () => {
    it('should return all sessions for all movies when authenticated', () => {
      return request(app.getHttpServer())
        .get('/v1/movie-sessions')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('sessions');
          expect(res.body).toHaveProperty('meta');
          expect(
            Array.isArray((res.body as { sessions: any[] }).sessions),
          ).toBe(true);
          const body = res.body as { sessions: any[] };
          expect(body.sessions.length).toBeGreaterThanOrEqual(1);
          expect(body.sessions[0]).toHaveProperty('id');
          expect(body.sessions[0]).toHaveProperty('movieId');
          expect(body.sessions[0]).toHaveProperty('date');
        });
    });

    it('should return 401 when no token is provided', () => {
      return request(app.getHttpServer()).get('/v1/movie-sessions').expect(401);
    });

    it('should support filtering by timeslot', () => {
      return request(app.getHttpServer())
        .get(`/v1/movie-sessions?timeslot=${MovieSessionTimeSlot.Evening}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('sessions');
          expect(res.body).toHaveProperty('meta');
          const body = res.body as { sessions: any[] };
          if (body.sessions.length > 0) {
            expect(body.sessions[0]).toHaveProperty(
              'timeslot',
              MovieSessionTimeSlot.Evening,
            );
          }
        });
    });
  });

  describe('DELETE /movie-sessions/:id', () => {
    let sessionToDelete: string;

    beforeAll(async () => {
      // Create a session to delete
      const res = await request(app.getHttpServer())
        .post(`/v1/movies/${testMovieId}/sessions`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          date: '2025-12-27T20:00:00.000Z',
          timeslot: MovieSessionTimeSlot.Evening,
          roomNumber: 5,
        });
      sessionToDelete = (res.body as { id: string }).id;
    });

    it('should delete a session when authenticated as manager', () => {
      return request(app.getHttpServer())
        .delete(`/v1/movie-sessions/${sessionToDelete}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(204);
    });

    it('should return 401 when no token is provided', () => {
      return request(app.getHttpServer())
        .delete(`/v1/movie-sessions/${testSessionId}`)
        .expect(401);
    });

    it('should return 403 when authenticated as customer', () => {
      return request(app.getHttpServer())
        .delete(`/v1/movie-sessions/${testSessionId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });

    it('should return 404 for non-existent session', () => {
      return request(app.getHttpServer())
        .delete(`/v1/movie-sessions/${nonExistingUUID}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(404);
    });
  });

  describe('DELETE /movies/:id', () => {
    let movieToDelete: string;

    beforeAll(async () => {
      // Create a movie to delete
      const res = await request(app.getHttpServer())
        .post('/v1/movies')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          title: 'Movie To Delete',
          ageRestriction: 10,
        });
      movieToDelete = (res.body as { id: string }).id;
    });

    it('should delete a movie when authenticated as manager', () => {
      return request(app.getHttpServer())
        .delete(`/v1/movies/${movieToDelete}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(204);
    });

    it('should return 401 when no token is provided', () => {
      return request(app.getHttpServer())
        .delete(`/v1/movies/${testMovieId}`)
        .expect(401);
    });

    it('should return 403 when authenticated as customer', () => {
      return request(app.getHttpServer())
        .delete(`/v1/movies/${testMovieId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });

    it('should return 404 for non-existent movie', () => {
      return request(app.getHttpServer())
        .delete(`/v1/movies/${nonExistingUUID}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(404);
    });
  });

  describe('DELETE /movies/bulk', () => {
    let movieIds: string[] = [];

    beforeAll(async () => {
      // Create movies to delete
      const res = await request(app.getHttpServer())
        .post('/v1/movies/bulk')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          movies: [
            { title: 'Bulk Delete 1', ageRestriction: 10 },
            { title: 'Bulk Delete 2', ageRestriction: 12 },
          ],
        });
      movieIds = (res.body as { id: string }[]).map((m) => m.id);
    });

    it('should delete multiple movies when authenticated as manager', () => {
      return request(app.getHttpServer())
        .delete('/v1/movies/bulk')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          movieIds,
        })
        .expect(204);
    });

    it('should return 403 when authenticated as customer', () => {
      return request(app.getHttpServer())
        .delete('/v1/movies/bulk')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          movieIds: [testMovieId],
        })
        .expect(403);
    });

    it('should return 400 with empty array', () => {
      return request(app.getHttpServer())
        .delete('/v1/movies/bulk')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          movieIds: [],
        })
        .expect(400);
    });
  });

  describe('Cascading deletes', () => {
    let movieWithSessions: string;
    let sessionIds: string[] = [];

    beforeAll(async () => {
      // Create a movie with sessions to test cascading delete
      const movieRes = await request(app.getHttpServer())
        .post('/v1/movies')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          title: 'Movie for Cascade Test',
          ageRestriction: 10,
        });
      movieWithSessions = (movieRes.body as { id: string }).id;

      // Create multiple sessions for this movie
      const sessionsRes = await request(app.getHttpServer())
        .post(`/v1/movies/${movieWithSessions}/sessions/bulk`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          sessions: [
            {
              date: '2025-12-28T14:00:00.000Z',
              timeslot: MovieSessionTimeSlot.Afternoon,
              roomNumber: 20,
            },
            {
              date: '2025-12-28T18:00:00.000Z',
              timeslot: MovieSessionTimeSlot.Evening,
              roomNumber: 21,
            },
          ],
        });
      sessionIds = (sessionsRes.body as { id: string }[]).map((s) => s.id);
    });

    it('should cascade delete sessions when movie is deleted', async () => {
      // Delete the movie
      await request(app.getHttpServer())
        .delete(`/v1/movies/${movieWithSessions}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(204);

      // Verify sessions are also deleted
      for (const sessionId of sessionIds) {
        await request(app.getHttpServer())
          .get(`/v1/movies/${movieWithSessions}/sessions/${sessionId}`)
          .set('Authorization', `Bearer ${customerToken}`)
          .expect(404);
      }
    });
  });

  describe('DELETE /movie-sessions/bulk', () => {
    let sessionIds: string[] = [];

    beforeAll(async () => {
      // Create a movie and sessions to delete in bulk
      const movieRes = await request(app.getHttpServer())
        .post('/v1/movies')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          title: 'Movie for Bulk Session Delete',
          ageRestriction: 10,
        });
      const movieId = (movieRes.body as { id: string }).id;

      const sessionsRes = await request(app.getHttpServer())
        .post(`/v1/movies/${movieId}/sessions/bulk`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          sessions: [
            {
              date: '2025-12-29T14:00:00.000Z',
              timeslot: MovieSessionTimeSlot.Afternoon,
              roomNumber: 30,
            },
            {
              date: '2025-12-29T18:00:00.000Z',
              timeslot: MovieSessionTimeSlot.Evening,
              roomNumber: 31,
            },
          ],
        });
      sessionIds = (sessionsRes.body as { id: string }[]).map((s) => s.id);
    });

    it('should delete multiple sessions when authenticated as manager', () => {
      return request(app.getHttpServer())
        .delete('/v1/movie-sessions/bulk')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          sessionIds,
        })
        .expect(204);
    });

    it('should return 403 when authenticated as customer', () => {
      return request(app.getHttpServer())
        .delete('/v1/movie-sessions/bulk')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          sessionIds: [sessionIds[0]],
        })
        .expect(403);
    });

    it('should return 401 when no token is provided', () => {
      return request(app.getHttpServer())
        .delete('/v1/movie-sessions/bulk')
        .send({
          sessionIds: [sessionIds[0]],
        })
        .expect(401);
    });

    it('should return 400 with empty array', () => {
      return request(app.getHttpServer())
        .delete('/v1/movie-sessions/bulk')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          sessionIds: [],
        })
        .expect(400);
    });

    it('should return 404 when one or more sessions do not exist', () => {
      return request(app.getHttpServer())
        .delete('/v1/movie-sessions/bulk')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          sessionIds: [nonExistingUUID],
        })
        .expect(404);
    });
  });
});
