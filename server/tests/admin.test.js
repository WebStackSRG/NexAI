import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { UsageLog } from '../src/models/UsageLog.js';
import { Transaction } from '../src/models/Transaction.js';
import { ErrorLog } from '../src/models/ErrorLog.js';
import { generateAccessToken } from '../src/utils/token.js';

describe('Admin Analytics Dashboard Integration Tests (Step 12)', () => {
  let regularUser = null;
  let adminUser = null;
  let regularToken = '';
  let adminToken = '';

  beforeAll(async () => {
    await connectDB();
  });

  const cleanupRecords = async (userIds) => {
    if (!userIds || userIds.length === 0) return;
    await Promise.all([
      UsageLog.deleteMany({ userId: { $in: userIds } }),
      Transaction.deleteMany({ userId: { $in: userIds } }),
      ErrorLog.deleteMany({ userId: { $in: userIds } }),
      User.deleteMany({ _id: { $in: userIds } }),
    ]);
  };

  afterAll(async () => {
    const testUsers = await User.find({ email: /@admintest\.nexai\.test$/ }).select('_id');
    await cleanupRecords(testUsers.map((u) => u._id));
    await disconnectDB();
  });

  beforeEach(async () => {
    if (regularUser || adminUser) {
      const ids = [regularUser?._id, adminUser?._id].filter(Boolean);
      await cleanupRecords(ids);
    }

    regularUser = await User.create({
      email: `regular_${Date.now()}_${Math.random()}@admintest.nexai.test`,
      role: 'user',
      wallet: { creditsRemaining: 80, tier: 'free', totalTokensConsumed: 2000 },
    });

    adminUser = await User.create({
      email: `admin_${Date.now()}_${Math.random()}@admintest.nexai.test`,
      role: 'admin',
      wallet: { creditsRemaining: 500, tier: 'pro_monthly', totalTokensConsumed: 10000 },
    });

    regularToken = generateAccessToken(regularUser);
    adminToken = generateAccessToken(adminUser);
  });

  describe('Authentication & Role Authorization', () => {
    it('should reject unauthenticated requests to /api/admin/stats with 401', async () => {
      const res = await request(app).get('/api/admin/stats');
      expect(res.status).toBe(401);
    });

    it('should reject regular users with role "user" with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error?.code).toBe('FORBIDDEN');
    });

    it('should allow admin users to access /api/admin/stats', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(typeof res.body.data.activeUsers).toBe('number');
    });
  });

  describe('Platform Stats Aggregation (GET /api/admin/stats)', () => {
    it('should accurately aggregate tokens, revenue, and active users', async () => {
      await UsageLog.create([
        {
          userId: regularUser._id,
          model: 'flash',
          feature: 'chat',
          tokensUsed: 1200,
          creditsDeducted: 12,
        },
        {
          userId: adminUser._id,
          model: 'pro',
          feature: 'interview',
          tokensUsed: 3500,
          creditsDeducted: 35,
        },
      ]);

      await Transaction.create({
        userId: regularUser._id,
        amountINR: 499,
        creditsAdded: 500,
        status: 'success',
        orderId: `order_adm_${Date.now()}`,
        paymentId: `pay_adm_${Date.now()}`,
      });

      await ErrorLog.create({
        route: '/api/chat',
        method: 'POST',
        status: 500,
        message: 'Test simulated failure',
        userId: regularUser._id,
      });

      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const stats = res.body.data;
      expect(stats.totalTokens).toBeGreaterThanOrEqual(4700);
      expect(stats.totalRevenue).toBeGreaterThanOrEqual(499);
      expect(stats.totalErrors).toBeGreaterThanOrEqual(1);
      expect(stats.activeUsers).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Usage Time-Series & Model Split (GET /api/admin/usage)', () => {
    it('should return 7d daily time series and model split breakdown', async () => {
      await UsageLog.create([
        {
          userId: regularUser._id,
          model: 'flash',
          feature: 'chat',
          tokensUsed: 800,
          creditsDeducted: 8,
        },
        {
          userId: adminUser._id,
          model: 'pro',
          feature: 'docgen',
          tokensUsed: 1600,
          creditsDeducted: 16,
        },
      ]);

      const res = await request(app)
        .get('/api/admin/usage?range=7d')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const data = res.body.data;
      expect(data.range).toBe('7d');
      expect(Array.isArray(data.timeSeries)).toBe(true);
      expect(data.timeSeries.length).toBe(7);

      expect(Array.isArray(data.modelSplit)).toBe(true);
      const flash = data.modelSplit.find((m) => m.model === 'flash');
      const pro = data.modelSplit.find((m) => m.model === 'pro');
      expect(flash).toBeDefined();
      expect(pro).toBeDefined();
      expect(flash.tokens).toBeGreaterThanOrEqual(800);
      expect(pro.tokens).toBeGreaterThanOrEqual(1600);
    });

    it('should reject invalid range parameter with 400', async () => {
      const res = await request(app)
        .get('/api/admin/usage?range=invalid_range')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
    });
  });

  describe('Admin Transactions & Error Logs (Paginated)', () => {
    it('GET /api/admin/transactions should return paginated platform recharges', async () => {
      await Transaction.create([
        {
          userId: regularUser._id,
          amountINR: 99,
          creditsAdded: 100,
          status: 'success',
          orderId: `order_${Date.now()}_1`,
          paymentId: `pay_${Date.now()}_1`,
        },
        {
          userId: regularUser._id,
          amountINR: 499,
          creditsAdded: 500,
          status: 'success',
          orderId: `order_${Date.now()}_2`,
          paymentId: `pay_${Date.now()}_2`,
        },
      ]);

      const res = await request(app)
        .get('/api/admin/transactions?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.transactions).toBeDefined();
      expect(Array.isArray(res.body.data.transactions)).toBe(true);
      expect(res.body.data.total).toBeGreaterThanOrEqual(2);
      expect(res.body.data.page).toBe(1);
    });

    it('GET /api/admin/errors should return paginated system error telemetry', async () => {
      await ErrorLog.create({
        route: '/api/chats',
        method: 'GET',
        status: 404,
        message: 'Not found mock error',
        userId: regularUser._id,
      });

      const res = await request(app)
        .get('/api/admin/errors?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.errors)).toBe(true);
      expect(res.body.data.total).toBeGreaterThanOrEqual(1);
    });
  });
});
