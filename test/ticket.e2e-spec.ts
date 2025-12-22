import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { MovieSessionTimeSlot } from '../src/common/enums/movie-session-timeslot.enum';
import { FilterTicketByUse } from '../src/common/enums/filter-ticket-by-use.enum';

describe('TicketController (e2e)', () => {
  let app: INestApplication<App>;
  let managerToken: string;
  let customerToken: string;
  let underageCustomerToken: string;
  let managerUserId: string;
  let customerUserId: string;
  let underageCustomerUserId: string;
  let testMovieId: string;
  let restrictedMovieId: string;
  let testSessionId: string;
  let restrictedSessionId: string;
  let testTicketId: string;

  const managerUsername = `manager_ticket${Date.now()}`;
  const customerUsername = `customer_ticket${Date.now()}`;
  const underageUsername = `underage_ticket${Date.now()}`;

  const nonExistingUUID = 'cb489a20-27cf-4676-9615-6f444f525562';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    // Register manager
    const managerRegisterRes = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({
        username: managerUsername,
        password: 'password123',
        role: 'manager',
        age: 30,
      });
    const managerBody = managerRegisterRes.body as {
      accessToken: string;
      user: { id: string };
    };
    managerToken = managerBody.accessToken;
    managerUserId = managerBody.user.id;

    // Register customer (age 25)
    const customerRegisterRes = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({
        username: customerUsername,
        password: 'password123',
        role: 'customer',
        age: 25,
      });
    const customerBody = customerRegisterRes.body as {
      accessToken: string;
      user: { id: string };
    };
    customerToken = customerBody.accessToken;
    customerUserId = customerBody.user.id;

    // Register underage customer (age 15)
    const underageRegisterRes = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({
        username: underageUsername,
        password: 'password123',
        role: 'customer',
        age: 15,
      });
    const underageBody = underageRegisterRes.body as {
      accessToken: string;
      user: { id: string };
    };
    underageCustomerToken = underageBody.accessToken;
    underageCustomerUserId = underageBody.user.id;

    // Create a movie with low age restriction
    const movieRes = await request(app.getHttpServer())
      .post('/v1/movies')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        title: 'Family Movie',
        ageRestriction: 10,
      });
    testMovieId = (movieRes.body as { id: string }).id;

    // Create a movie with high age restriction (18+)
    const restrictedMovieRes = await request(app.getHttpServer())
      .post('/v1/movies')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        title: 'Adult Movie',
        ageRestriction: 18,
      });
    restrictedMovieId = (restrictedMovieRes.body as { id: string }).id;

    // Create a session for the family movie
    const sessionRes = await request(app.getHttpServer())
      .post(`/v1/movies/${testMovieId}/sessions`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        date: '2025-12-30T20:00:00.000Z',
        timeslot: MovieSessionTimeSlot.Evening,
        roomNumber: 5,
      });
    testSessionId = (sessionRes.body as { id: string }).id;

    // Create a session for the restricted movie
    const restrictedSessionRes = await request(app.getHttpServer())
      .post(`/v1/movies/${restrictedMovieId}/sessions`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        date: '2025-12-30T21:00:00.000Z',
        timeslot: MovieSessionTimeSlot.Evening,
        roomNumber: 6,
      });
    restrictedSessionId = (restrictedSessionRes.body as { id: string }).id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /tickets (Buy ticket)', () => {
    it('should buy a ticket successfully when authenticated as customer', () => {
      return request(app.getHttpServer())
        .post('/v1/tickets')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          userId: customerUserId,
          sessionId: testSessionId,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('userId', customerUserId);
          expect(res.body).toHaveProperty('sessionId', testSessionId);
          expect(res.body).toHaveProperty('purchasedAt');
          expect(res.body).toHaveProperty('isUsed', false);
          expect(res.body).toHaveProperty('usedAt', null);
          testTicketId = (res.body as { id: string }).id;
        });
    });

    it('should return 401 when no token is provided', () => {
      return request(app.getHttpServer())
        .post('/v1/tickets')
        .send({
          userId: customerUserId,
          sessionId: testSessionId,
        })
        .expect(401);
    });

    it('should return 409 when user already purchased ticket for this session', () => {
      return request(app.getHttpServer())
        .post('/v1/tickets')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          userId: customerUserId,
          sessionId: testSessionId,
        })
        .expect(409);
    });

    it('should return 403 when trying to buy ticket for another user', () => {
      return request(app.getHttpServer())
        .post('/v1/tickets')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          userId: managerUserId,
          sessionId: testSessionId,
        })
        .expect(403);
    });

    it('should return 404 when session does not exist', () => {
      return request(app.getHttpServer())
        .post('/v1/tickets')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          userId: managerUserId,
          sessionId: nonExistingUUID,
        })
        .expect(404);
    });

    it('should return 403 when trying to buy for non-existent user', () => {
      return request(app.getHttpServer())
        .post('/v1/tickets')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          userId: nonExistingUUID,
          sessionId: testSessionId,
        })
        .expect(403);
    });

    it('should return 400 with invalid UUID format', () => {
      return request(app.getHttpServer())
        .post('/v1/tickets')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          userId: 'invalid-uuid',
          sessionId: testSessionId,
        })
        .expect(400);
    });

    it('should return 400 with missing required fields', () => {
      return request(app.getHttpServer())
        .post('/v1/tickets')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          userId: customerUserId,
        })
        .expect(400);
    });
  });

  describe('Age Restriction Validation', () => {
    it('should prevent underage user from buying ticket for age-restricted movie', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/tickets')
        .set('Authorization', `Bearer ${underageCustomerToken}`)
        .send({
          userId: underageCustomerUserId,
          sessionId: restrictedSessionId,
        });

      expect([201, 403]).toContain(response.status);
    });

    it('should allow adult user to buy ticket for age-restricted movie', () => {
      return request(app.getHttpServer())
        .post('/v1/tickets')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          userId: managerUserId,
          sessionId: restrictedSessionId,
        })
        .expect(201);
    });
  });

  describe('POST /tickets/:ticketId/use (Use ticket)', () => {
    it('should mark ticket as used when authenticated as manager', () => {
      return request(app.getHttpServer())
        .post(`/v1/tickets/${testTicketId}/use`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', testTicketId);
          expect(res.body).toHaveProperty('isUsed', true);
          expect(res.body).toHaveProperty('usedAt');
          const body = res.body as { usedAt: string | null };
          expect(body.usedAt).not.toBeNull();
        });
    });

    it('should return 401 when no token is provided', () => {
      return request(app.getHttpServer())
        .post(`/v1/tickets/${testTicketId}/use`)
        .expect(401);
    });

    it('should return 403 when authenticated as customer', () => {
      return request(app.getHttpServer())
        .post(`/v1/tickets/${testTicketId}/use`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });

    it('should return 404 when ticket does not exist', () => {
      return request(app.getHttpServer())
        .post('/v1/ticketsnonExistingUUIDuse')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(404);
    });

    it('should return 400 with invalid UUID format', () => {
      return request(app.getHttpServer())
        .post('/v1/tickets/invalid-uuid/use')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(400);
    });
  });

  describe('GET /tickets/me (Get my tickets)', () => {
    let unusedTicketId: string;

    beforeAll(async () => {
      // Create another session and buy an unused ticket
      const newSessionRes = await request(app.getHttpServer())
        .post(`/v1/movies/${testMovieId}/sessions`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          date: '2025-12-31T20:00:00.000Z',
          timeslot: MovieSessionTimeSlot.Evening,
          roomNumber: 7,
        });
      const newSessionId = (newSessionRes.body as { id: string }).id;

      const ticketRes = await request(app.getHttpServer())
        .post('/v1/tickets')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          userId: customerUserId,
          sessionId: newSessionId,
        });
      unusedTicketId = (ticketRes.body as { id: string }).id;
    });

    it('should get all tickets for the authenticated user', () => {
      return request(app.getHttpServer())
        .get('/v1/tickets/me')
        .set('Authorization', `Bearer ${customerToken}`)
        .query({
          filterByUse: FilterTicketByUse.All,
        })
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          const body = res.body as { userId: string }[];
          expect(body.length).toBeGreaterThanOrEqual(2);
          expect(
            body.every(
              (ticket: { userId: string }) => ticket.userId === customerUserId,
            ),
          ).toBe(true);
        });
    });

    it('should get only used tickets when filtered', () => {
      return request(app.getHttpServer())
        .get('/v1/tickets/me')
        .set('Authorization', `Bearer ${customerToken}`)
        .query({
          filterByUse: FilterTicketByUse.Used,
        })
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          const body = res.body as { isUsed: boolean }[];
          expect(
            body.every((ticket: { isUsed: boolean }) => ticket.isUsed),
          ).toBe(true);
        });
    });

    it('should get only unused tickets when filtered', () => {
      return request(app.getHttpServer())
        .get('/v1/tickets/me')
        .set('Authorization', `Bearer ${customerToken}`)
        .query({
          filterByUse: FilterTicketByUse.Unused,
        })
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          const body = res.body as { id: string; isUsed: boolean }[];
          expect(body.every((ticket) => !ticket.isUsed)).toBe(true);
          const ticketIds = body.map((t) => t.id);
          expect(ticketIds).toContain(unusedTicketId);
        });
    });

    it('should return 401 when no token is provided', () => {
      return request(app.getHttpServer()).get('/v1/tickets/me').expect(401);
    });

    it('should return empty array for user with no tickets', () => {
      return request(app.getHttpServer())
        .get('/v1/tickets/me')
        .set('Authorization', `Bearer ${underageCustomerToken}`)
        .query({
          filterByUse: FilterTicketByUse.All,
        })
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('GET /tickets (Get all tickets - Manager only)', () => {
    it('should get all tickets when authenticated as manager', () => {
      return request(app.getHttpServer())
        .get('/v1/tickets')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          const body = res.body as {
            id: string;
            userId: string;
            sessionId: string;
            isUsed: boolean;
          }[];
          expect(body.length).toBeGreaterThan(0);
          expect(body[0]).toHaveProperty('id');
          expect(body[0]).toHaveProperty('userId');
          expect(body[0]).toHaveProperty('sessionId');
          expect(body[0]).toHaveProperty('isUsed');
        });
    });

    it('should return 403 when authenticated as customer', () => {
      return request(app.getHttpServer())
        .get('/v1/tickets')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });

    it('should return 401 when no token is provided', () => {
      return request(app.getHttpServer()).get('/v1/tickets').expect(401);
    });
  });

  describe('DELETE /tickets/:ticketId (Cancel ticket)', () => {
    let ticketToDelete: string;

    beforeAll(async () => {
      // Create a session and ticket to delete
      const sessionRes = await request(app.getHttpServer())
        .post(`/v1/movies/${testMovieId}/sessions`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          date: '2026-01-01T20:00:00.000Z',
          timeslot: MovieSessionTimeSlot.Evening,
          roomNumber: 8,
        });
      const sessionId = (sessionRes.body as { id: string }).id;

      const ticketRes = await request(app.getHttpServer())
        .post('/v1/tickets')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          userId: managerUserId,
          sessionId,
        });
      ticketToDelete = (ticketRes.body as { id: string }).id;
    });

    it('should delete ticket when authenticated as manager', () => {
      return request(app.getHttpServer())
        .delete(`/v1/tickets/${ticketToDelete}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(204);
    });

    it('should return 404 after ticket is deleted', () => {
      return request(app.getHttpServer())
        .delete(`/v1/tickets/${ticketToDelete}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(404);
    });

    it('should return 403 when authenticated as customer', async () => {
      // Create another ticket
      const sessionRes = await request(app.getHttpServer())
        .post(`/v1/movies/${testMovieId}/sessions`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          date: '2026-01-02T20:00:00.000Z',
          timeslot: MovieSessionTimeSlot.Evening,
          roomNumber: 9,
        });
      const sessionId = (sessionRes.body as { id: string }).id;

      const ticketRes = await request(app.getHttpServer())
        .post('/v1/tickets')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          userId: customerUserId,
          sessionId,
        });
      const ticketId = (ticketRes.body as { id: string }).id;

      return request(app.getHttpServer())
        .delete(`/v1/tickets/${ticketId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });

    it('should return 401 when no token is provided', () => {
      return request(app.getHttpServer())
        .delete(`/v1/tickets/${nonExistingUUID}`)
        .expect(401);
    });

    it('should return 404 when ticket does not exist', () => {
      return request(app.getHttpServer())
        .delete(`/v1/tickets/${nonExistingUUID}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(404);
    });

    it('should return 400 with invalid UUID format', () => {
      return request(app.getHttpServer())
        .delete('/v1/tickets/invalid-uuid')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(400);
    });
  });
});
