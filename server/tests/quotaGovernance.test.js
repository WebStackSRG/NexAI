import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { UsageLog } from '../src/models/UsageLog.js';
import { SystemConfig } from '../src/models/SystemConfig.js';
import { systemConfigService } from '../src/services/systemConfig.service.js';
import { creditCheck } from '../src/middleware/creditCheck.js';
import { deductCredits } from '../src/services/credit.service.js';
import { generateAccessToken } from '../src/utils/token.js';
import { ApiError } from '../src/utils/ApiError.js';

describe('Dual-Mode Quota Governance & Live Gemini Telemetry (ADR-027 & PRD 8.G)', () => {
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
      User.deleteMany({ _id: { $in: userIds } }),
    ]);
  };

  afterAll(async () => {
    const testUsers = await User.find({ email: /@quotatest\.nexai\.test$/ }).select('_id');
    await cleanupRecords(testUsers.map((u) => u._id));
    await systemConfigService.updateConfig({
      billingEnforcementMode: 'credit_strict',
      dailyGeminiQuotaLimit: 1500,
    });
    await SystemConfig.deleteMany({});
    await disconnectDB();
  });

  beforeEach(async () => {
    if (regularUser || adminUser) {
      await cleanupRecords([regularUser?._id, adminUser?._id].filter(Boolean));
    }

    regularUser = await User.create({
      email: `regular_${Date.now()}_${Math.random()}@quotatest.nexai.test`,
      role: 'user',
      wallet: { creditsRemaining: 0, tier: 'free', totalTokensConsumed: 1500 },
    });

    adminUser = await User.create({
      email: `admin_${Date.now()}_${Math.random()}@quotatest.nexai.test`,
      role: 'admin',
      wallet: { creditsRemaining: 500, tier: 'pro_monthly', totalTokensConsumed: 5000 },
    });

    regularToken = generateAccessToken(regularUser);
    adminToken = generateAccessToken(adminUser);
  });

  describe('1. SystemConfig Service & Model Governance', () => {
    it('should initialize and return global system configuration', async () => {
      const config = await systemConfigService.getConfig();
      expect(config).toBeDefined();
      expect(['quota_free', 'credit_strict']).toContain(config.billingEnforcementMode);
      expect(config.dailyGeminiQuotaLimit).toBe(1500);
    });

    it('should update billingEnforcementMode to credit_strict and quota_free cleanly', async () => {
      const strictConfig = await systemConfigService.updateConfig({
        billingEnforcementMode: 'credit_strict',
        updatedBy: adminUser._id,
      });
      expect(strictConfig.billingEnforcementMode).toBe('credit_strict');
      expect(systemConfigService.getBillingMode()).toBe('credit_strict');

      const freeConfig = await systemConfigService.updateConfig({
        billingEnforcementMode: 'quota_free',
        updatedBy: adminUser._id,
      });
      expect(freeConfig.billingEnforcementMode).toBe('quota_free');
      expect(systemConfigService.getBillingMode()).toBe('quota_free');
    });

    it('should reject invalid billingEnforcementMode with 400 ApiError', async () => {
      await expect(
        systemConfigService.updateConfig({
          billingEnforcementMode: 'invalid_mode',
        }),
      ).rejects.toThrowError(
        expect.objectContaining({
          statusCode: 400,
          code: 'INVALID_ENFORCEMENT_MODE',
        }),
      );
    });
  });

  describe('2. CreditCheck Middleware Dual-Mode Enforcement', () => {
    it('in credit_strict mode: should block user with 0 credits with 402 INSUFFICIENT_CREDITS', async () => {
      await systemConfigService.updateConfig({ billingEnforcementMode: 'credit_strict' });

      const req = { user: { wallet: { creditsRemaining: 0 } } };
      const res = {};
      let caughtError = null;
      const next = (err) => {
        caughtError = err;
      };

      creditCheck(req, res, next);
      expect(caughtError).toBeInstanceOf(ApiError);
      expect(caughtError.statusCode).toBe(402);
      expect(caughtError.code).toBe('INSUFFICIENT_CREDITS');
    });

    it('in quota_free mode: should allow user with 0 credits to proceed without 402', async () => {
      await systemConfigService.updateConfig({
        billingEnforcementMode: 'quota_free',
        dailyGeminiQuotaLimit: 1500,
      });

      const req = { user: { wallet: { creditsRemaining: 0 } } };
      const res = {};

      await new Promise((resolve, reject) => {
        creditCheck(req, res, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    });

    it('in quota_free mode: should block with 429 when daily Gemini quota limit is reached', async () => {
      // Set quota limit to 1 and simulate 1 request today
      await systemConfigService.updateConfig({
        billingEnforcementMode: 'quota_free',
        dailyGeminiQuotaLimit: 1,
      });

      await UsageLog.create({
        userId: regularUser._id,
        model: 'flash',
        feature: 'chat',
        tokensUsed: 500,
        creditsDeducted: 5,
        createdAt: new Date(),
      });

      const req = { user: { wallet: { creditsRemaining: 0 } } };
      const res = {};

      const error = await new Promise((resolve) => {
        creditCheck(req, res, (err) => {
          resolve(err);
        });
      });

      expect(error).toBeInstanceOf(ApiError);
      expect(error.statusCode).toBe(429);
      expect(error.code).toBe('DAILY_QUOTA_EXCEEDED');
      expect(error.message).toContain('Daily Gemini API quota limit');
    });

    it('atomic credit deductions and UsageLog tracking must remain fully active in quota_free mode', async () => {
      await systemConfigService.updateConfig({
        billingEnforcementMode: 'quota_free',
        dailyGeminiQuotaLimit: 1500,
      });

      const deduction = await deductCredits({
        userId: regularUser._id,
        tokensUsed: 350, // 4 credits
        feature: 'chat',
        model: 'flash',
      });

      expect(deduction.creditsDeducted).toBe(4);
      expect(deduction.creditsRemaining).toBe(0); // clamped to 0
      expect(deduction.totalTokensConsumed).toBe(1850); // 1500 + 350

      const savedLog = await UsageLog.findById(deduction.usageLogId);
      expect(savedLog).toBeDefined();
      expect(savedLog.tokensUsed).toBe(350);
      expect(savedLog.creditsDeducted).toBe(4);
    });
  });

  describe('3. Admin APIs & Live Quota Telemetry (GET/PATCH /api/admin/config)', () => {
    it('should reject non-admin users from accessing /api/admin/config with 403', async () => {
      const res = await request(app)
        .get('/api/admin/config')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(res.status).toBe(403);
    });

    it('GET /api/admin/config: returns system config and comprehensive Gemini telemetry', async () => {
      // Seed a usage log today
      await UsageLog.create({
        userId: adminUser._id,
        model: 'flash',
        feature: 'interview',
        tokensUsed: 1200,
        creditsDeducted: 12,
        createdAt: new Date(),
      });

      const res = await request(app)
        .get('/api/admin/config')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.config).toBeDefined();
      expect(res.body.data.telemetry).toBeDefined();

      const { telemetry } = res.body.data;
      expect(telemetry.dailyLimit).toBe(1500);
      expect(telemetry.requestsToday).toBeGreaterThanOrEqual(1);
      expect(telemetry.requestsRemaining).toBeLessThanOrEqual(1500);
      expect(telemetry.rpmLimit).toBe(15);
      expect(telemetry.tpmLimit).toBe(1000000);
      expect(telemetry.tokensToday).toBeDefined();
      expect(telemetry.tokensToday.total).toBeGreaterThanOrEqual(1200);
    });

    it('PATCH /api/admin/config: 1-click toggle switches mode instantly with live telemetry response', async () => {
      const res = await request(app)
        .patch('/api/admin/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ billingEnforcementMode: 'credit_strict' });

      expect(res.status).toBe(200);
      expect(res.body.data.config.billingEnforcementMode).toBe('credit_strict');
      expect(systemConfigService.getBillingMode()).toBe('credit_strict');

      // Toggle back to quota_free
      const toggleBackRes = await request(app)
        .patch('/api/admin/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ billingEnforcementMode: 'quota_free' });

      expect(toggleBackRes.status).toBe(200);
      expect(toggleBackRes.body.data.config.billingEnforcementMode).toBe('quota_free');
      expect(systemConfigService.getBillingMode()).toBe('quota_free');
    });
  });

  describe('4. Wallet API Governance Presentation (GET /api/wallet)', () => {
    it('should include governance status in GET /api/wallet response', async () => {
      await systemConfigService.updateConfig({
        billingEnforcementMode: 'quota_free',
        dailyGeminiQuotaLimit: 1500,
      });

      const res = await request(app)
        .get('/api/wallet')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.wallet).toBeDefined();
      expect(res.body.data.governance).toBeDefined();
      expect(res.body.data.governance.billingEnforcementMode).toBe('quota_free');
      expect(res.body.data.governance.dailyGeminiQuotaLimit).toBe(1500);
      expect(typeof res.body.data.governance.dailyRequestsRemaining).toBe('number');
    });
  });
});
