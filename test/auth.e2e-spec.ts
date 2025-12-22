import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

describe('AuthController (e2e)', () => {
  let app: INestApplication<App>;
  let accessToken: string;
  let refreshToken: string;
  const testUsername = `testuser${Date.now()}`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/v1/auth/register (POST)', () => {
    it('should register a new user', () => {
      return request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({
          username: testUsername,
          password: 'password123',
          role: 'customer',
          age: 25,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
          expect(res.body).toHaveProperty('expiresAt');
          expect(res.body).toHaveProperty('user');
          const body = res.body as {
            accessToken: string;
            refreshToken: string;
            user: { username: string };
          };
          expect(body.user).toHaveProperty('username');
          expect(body.user.username).toBe(testUsername);
          accessToken = body.accessToken;
          refreshToken = body.refreshToken;
        });
    });

    it('should return 409 if username already exists', () => {
      return request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({
          username: testUsername,
          password: 'password123',
          role: 'customer',
          age: 25,
        })
        .expect(409);
    });

    it('should return 400 for invalid input', () => {
      return request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({
          username: 'a',
          password: '123',
          age: -1,
        })
        .expect(400);
    });
  });

  describe('/v1/auth/login (POST)', () => {
    it('should login with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({
          username: testUsername,
          password: 'password123',
        })
        .expect(200)
        .expect((res: Response) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
          expect(res.body).toHaveProperty('expiresAt');
        });
    });

    it('should return 401 for invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({
          username: testUsername,
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('should return 401 for non-existent user', () => {
      return request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({
          username: 'nonexistentuser123',
          password: 'password123',
        })
        .expect(401);
    });
  });

  describe('/v1/auth/refresh (POST)', () => {
    it('should refresh access token with valid refresh token', () => {
      return request(app.getHttpServer())
        .post('/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200)
        .expect((res: Response) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
          expect(res.body).toHaveProperty('expiresAt');
        });
    });

    it('should return 401 for invalid refresh token', () => {
      return request(app.getHttpServer())
        .post('/v1/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);
    });
  });

  describe('/v1/auth/logout (POST)', () => {
    it('should logout successfully', () => {
      return request(app.getHttpServer())
        .post('/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);
    });

    it('should return 401 without valid token', () => {
      return request(app.getHttpServer()).post('/v1/auth/logout').expect(401);
    });
  });
});
