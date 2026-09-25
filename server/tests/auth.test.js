import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';

describe('Auth API Integration Tests', () => {
  const timestamp = Date.now();
  const testEmail = `user_${timestamp}@nexai.test`;
  const adminEmail = `admin_${timestamp}@nexai.test`;
  const password = 'StrongPassword123!';

  let testUserToken = '';
  let testRefreshTokenCookie = '';
  let adminToken = '';

  beforeAll(async () => {
    await connectDB();
    await User.deleteMany({ email: /@nexai\.test$/ });
  });

  afterAll(async () => {
    await User.deleteMany({ email: /@nexai\.test$/ });
    await disconnectDB();
  });

  describe('POST /api/auth/register', () => {
    it('should fail with 400 when input validation fails', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'not-an-email', password: 'short' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should register a new user with 100 starter credits and set refresh cookie', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: testEmail, password });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data.user.email).toBe(testEmail);
      expect(res.body.data.user.role).toBe('user');
      expect(res.body.data.user.wallet.creditsRemaining).toBe(100);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data.user).not.toHaveProperty('passwordHash');

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const refreshCookie = cookies.find((c) => c.startsWith('refreshToken='));
      expect(refreshCookie).toBeDefined();
      expect(refreshCookie).toContain('HttpOnly');

      testUserToken = res.body.data.accessToken;
      testRefreshTokenCookie = refreshCookie.split(';')[0];
    });

    it('should return 409 when registering with duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: testEmail, password });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('USER_ALREADY_EXISTS');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should fail with 401 when given invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testEmail, password: 'WrongPassword123' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should login successfully and return access token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testEmail, password });

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe(testEmail);
      expect(res.body.data).toHaveProperty('accessToken');
      testUserToken = res.body.data.accessToken;
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should fail with 401 when no refresh token cookie is provided', async () => {
      const res = await request(app).post('/api/auth/refresh');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return a new access token when valid refresh cookie is provided', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', testRefreshTokenCookie);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data.user.email).toBe(testEmail);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should fail with 401 when no authorization header is provided', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return the current user profile when valid Bearer token is provided', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe(testEmail);
      expect(res.body.data.user.wallet.creditsRemaining).toBe(100);
    });
  });

  describe('PATCH /api/users/me/settings', () => {
    it('should update user settings successfully', async () => {
      const res = await request(app)
        .patch('/api/users/me/settings')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ theme: 'light', defaultModel: 'pro' });

      expect(res.status).toBe(200);
      expect(res.body.data.user.settings.theme).toBe('light');
      expect(res.body.data.user.settings.defaultModel).toBe('pro');
    });
  });

  describe('Role-based Authorization: GET /api/admin/stats', () => {
    it('should return 403 FORBIDDEN when accessed by non-admin user', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should return 200 OK when accessed by admin user', async () => {
      const adminUser = await User.create({
        email: adminEmail,
        passwordHash: 'hashed_password_sample',
        role: 'admin',
      });

      const { generateAccessToken } = await import('../src/utils/token.js');
      adminToken = generateAccessToken(adminUser);

      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.message).toBe('Admin authorization verified');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should clear refresh token cookie and return success message', async () => {
      const res = await request(app).post('/api/auth/logout');

      expect(res.status).toBe(200);
      expect(res.body.data.message).toBe('Logged out successfully');

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const refreshCookie = cookies.find((c) => c.startsWith('refreshToken='));
      expect(refreshCookie).toContain('refreshToken=;');
    });
  });
});
