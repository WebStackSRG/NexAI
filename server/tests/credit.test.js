import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { UsageLog } from '../src/models/UsageLog.js';
import { tokensToCredits, assertBalance, deductCredits } from '../src/services/credit.service.js';
import { creditCheck } from '../src/middleware/creditCheck.js';
import { ApiError } from '../src/utils/ApiError.js';

describe('Credit Service Unit & Integration Tests', () => {
  let testUser = null;

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    if (testUser) {
      await User.deleteMany({ email: /@credittest\.nexai\.test$/ });
      await UsageLog.deleteMany({ userId: testUser._id });
    }
    await disconnectDB();
  });

  beforeEach(async () => {
    testUser = await User.create({
      email: `user_${Date.now()}_${Math.random()}@credittest.nexai.test`,
      wallet: {
        creditsRemaining: 100,
        tier: 'free',
        totalTokensConsumed: 0,
      },
    });
  });

  describe('tokensToCredits calculation', () => {
    it('should return 0 credits for 0 or negative tokens', () => {
      expect(tokensToCredits(0)).toBe(0);
      expect(tokensToCredits(-10)).toBe(0);
    });

    it('should charge 1 credit for 1 to 100 tokens (Math.ceil)', () => {
      expect(tokensToCredits(1)).toBe(1);
      expect(tokensToCredits(50)).toBe(1);
      expect(tokensToCredits(100)).toBe(1);
    });

    it('should charge 2 credits for 101 to 200 tokens', () => {
      expect(tokensToCredits(101)).toBe(2);
      expect(tokensToCredits(200)).toBe(2);
    });

    it('should charge 10 credits for 950 tokens', () => {
      expect(tokensToCredits(950)).toBe(10);
    });
  });

  describe('assertBalance', () => {
    it('should return creditsRemaining when user has sufficient credits', async () => {
      const balance = await assertBalance(testUser._id);
      expect(balance).toBe(100);
    });

    it('should throw 402 INSUFFICIENT_CREDITS when creditsRemaining is 0', async () => {
      testUser.wallet.creditsRemaining = 0;
      await testUser.save();

      await expect(assertBalance(testUser._id)).rejects.toThrowError(
        expect.objectContaining({
          statusCode: 402,
          code: 'INSUFFICIENT_CREDITS',
        }),
      );
    });

    it('should throw 404 if user not found', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      await expect(assertBalance(fakeId)).rejects.toThrowError(
        expect.objectContaining({
          statusCode: 404,
          code: 'USER_NOT_FOUND',
        }),
      );
    });
  });

  describe('deductCredits atomic operation', () => {
    it('should atomically deduct credits and increment totalTokensConsumed', async () => {
      const result = await deductCredits({
        userId: testUser._id,
        tokensUsed: 250, // 250 tokens -> 3 credits
        feature: 'chat',
        model: 'flash',
      });

      expect(result.creditsDeducted).toBe(3);
      expect(result.creditsRemaining).toBe(97);
      expect(result.totalTokensConsumed).toBe(250);

      // Verify DB state
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.wallet.creditsRemaining).toBe(97);
      expect(updatedUser.wallet.totalTokensConsumed).toBe(250);

      // Verify UsageLog
      const log = await UsageLog.findById(result.usageLogId);
      expect(log).toBeDefined();
      expect(log.userId.toString()).toBe(testUser._id.toString());
      expect(log.tokensUsed).toBe(250);
      expect(log.creditsDeducted).toBe(3);
      expect(log.feature).toBe('chat');
      expect(log.model).toBe('flash');
    });

    it('should clamp creditsRemaining to 0 and never drop below 0', async () => {
      testUser.wallet.creditsRemaining = 2;
      await testUser.save();

      const result = await deductCredits({
        userId: testUser._id,
        tokensUsed: 500, // 500 tokens -> 5 credits (exceeds balance of 2)
        feature: 'chat',
        model: 'flash',
      });

      expect(result.creditsDeducted).toBe(5);
      expect(result.creditsRemaining).toBe(0);

      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.wallet.creditsRemaining).toBe(0);
    });
  });

  describe('creditCheck middleware', () => {
    it('should call next() when user has credits remaining', () => {
      const req = { user: { wallet: { creditsRemaining: 50 } } };
      const res = {};
      let nextCalled = false;
      const next = (err) => {
        expect(err).toBeUndefined();
        nextCalled = true;
      };

      creditCheck(req, res, next);
      expect(nextCalled).toBe(true);
    });

    it('should throw 402 ApiError when user has 0 credits', () => {
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
  });
});
