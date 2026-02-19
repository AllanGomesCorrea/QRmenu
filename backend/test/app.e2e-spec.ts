import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * E2E tests - requires running infrastructure (Postgres, Redis).
 * Run with: npm run test:e2e
 * 
 * These tests validate the full request/response cycle through the API.
 * For CI without infrastructure, use the unit tests instead (npm test).
 */
describe('QRMenu API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // Skip E2E tests if no DATABASE_URL is available
    if (!process.env.DATABASE_URL) {
      console.warn('⚠️ DATABASE_URL not set - skipping E2E tests. Set DATABASE_URL to run E2E tests.');
      return;
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  }, 30000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Health Check', () => {
    it('should respond to GET / (if health endpoint exists)', async () => {
      if (!app) return;

      // The backend may not have a root health endpoint
      // but the auth endpoints should be available
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: '', password: '' });

      // Should get a validation error, not a 404
      expect(response.status).not.toBe(404);
    });
  });

  describe('Auth Endpoints', () => {
    it('POST /auth/login should return 401 for invalid credentials', async () => {
      if (!app) return;

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'wrong-password',
        });

      expect(response.status).toBe(401);
    });

    it('POST /auth/login should validate request body', async () => {
      if (!app) return;

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({});

      // Should return 400 (validation error) or 401
      expect([400, 401]).toContain(response.status);
    });
  });

  describe('Public Menu Endpoints', () => {
    it('GET /restaurants/public should return restaurants list', async () => {
      if (!app) return;

      const response = await request(app.getHttpServer())
        .get('/restaurants/public');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
    });
  });

  describe('Protected Endpoints', () => {
    it('GET /orders should return 401 without auth token', async () => {
      if (!app) return;

      const response = await request(app.getHttpServer())
        .get('/orders');

      expect(response.status).toBe(401);
    });

    it('GET /tables should return 401 without auth token', async () => {
      if (!app) return;

      const response = await request(app.getHttpServer())
        .get('/tables');

      expect(response.status).toBe(401);
    });

    it('GET /users should return 401 without auth token', async () => {
      if (!app) return;

      const response = await request(app.getHttpServer())
        .get('/users');

      expect(response.status).toBe(401);
    });
  });
});
