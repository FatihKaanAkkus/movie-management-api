import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

describe('UserController (e2e)', () => {
  let app: INestApplication<App>;
  let managerToken: string;
  let customerToken: string;
  let testUserId: string;

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
      refreshToken: string;
      user: { id: string; username: string };
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
      refreshToken: string;
      user: { id: string; username: string };
    };
    customerToken = customerRegisterBody.accessToken;
    testUserId = customerRegisterBody.user.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /users', () => {
    it('should return all users when authenticated as manager', () => {
      return request(app.getHttpServer())
        .get('/v1/users')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          const body = res.body as Array<any>;
          expect(body.length).toBeGreaterThanOrEqual(2);
          expect(body[0]).toHaveProperty('id');
          expect(body[0]).toHaveProperty('username');
          expect(body[0]).toHaveProperty('role');
          expect(body[0]).toHaveProperty('age');
        });
    });

    it('should return 401 when no token is provided', () => {
      return request(app.getHttpServer()).get('/v1/users').expect(401);
    });

    it('should return 403 when authenticated as customer', () => {
      return request(app.getHttpServer())
        .get('/v1/users')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });

    it('should return 401 with invalid token', () => {
      return request(app.getHttpServer())
        .get('/v1/users')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);
    });
  });

  describe('GET /users/:id', () => {
    it('should return user by id when authenticated as manager', () => {
      return request(app.getHttpServer())
        .get(`/v1/users/${testUserId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', testUserId);
          expect(res.body).toHaveProperty('username', customerUsername);
          expect(res.body).toHaveProperty('role');
          expect(res.body).toHaveProperty('age', 25);
          expect(res.body).toHaveProperty('tickets');
          expect(Array.isArray((res.body as { tickets: any[] }).tickets)).toBe(
            true,
          );
        });
    });

    it('should return own user data when authenticated as customer', () => {
      return request(app.getHttpServer())
        .get(`/v1/users/${testUserId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', testUserId);
          expect(res.body).toHaveProperty('username', customerUsername);
        });
    });

    it('should return 403 when customer tries to access another user', async () => {
      // Get manager's ID first
      const usersRes = await request(app.getHttpServer())
        .get('/v1/users')
        .set('Authorization', `Bearer ${managerToken}`);

      const managerUser = (
        usersRes.body as { id: string; username: string }[]
      ).find((u) => u.username === managerUsername);

      return request(app.getHttpServer())
        .get(`/v1/users/${managerUser?.id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });

    it('should return 401 when no token is provided', () => {
      return request(app.getHttpServer())
        .get(`/v1/users/${testUserId}`)
        .expect(401);
    });

    it('should return 404 for non-existent user', () => {
      return request(app.getHttpServer())
        .get(`/v1/users/${nonExistingUUID}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(404);
    });
  });
});
