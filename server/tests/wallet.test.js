import crypto from 'node:crypto';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { env } from '../src/config/env.js';
import { PLANS } from '../src/config/plans.js';
import { Transaction } from '../src/models/Transaction.js';
import { User } from '../src/models/User.js';
import { generateAccessToken } from '../src/utils/token.js';

describe('Wallet & Billing Integration Tests (Step 11)', () => {
  let userA = null;
  let userB = null;
  let tokenA = '';
  let tokenB = '';

  beforeAll(async () => {
    await connectDB();
  });

  const cleanupRecords = async (userIds) => {
    if (!userIds || userIds.length === 0) return;
    await Transaction.deleteMany({ userId: { $in: userIds } });
    await User.deleteMany({ _id: { $in: userIds } });
  };

  afterAll(async () => {
    const testUsers = await User.find({ email: /@wallettest\.nexai\.test$/ }).select('_id');
    await cleanupRecords(testUsers.map((u) => u._id));
    await disconnectDB();
  });

  beforeEach(async () => {
    if (userA || userB) {
      const ids = [userA?._id, userB?._id].filter(Boolean);
      await cleanupRecords(ids);
    }

    userA = await User.create({
      email: `user_a_${Date.now()}_${Math.random()}@wallettest.nexai.test`,
      wallet: { creditsRemaining: 100, tier: 'free', totalTokensConsumed: 0 },
    });

    userB = await User.create({
      email: `user_b_${Date.now()}_${Math.random()}@wallettest.nexai.test`,
      wallet: { creditsRemaining: 50, tier: 'free', totalTokensConsumed: 1200 },
    });

    tokenA = generateAccessToken(userA);
    tokenB = generateAccessToken(userB);
  });

  describe('Authentication & Access Control', () => {
    it('should reject unauthenticated requests to wallet endpoints with 401', async () => {
      const getWalletRes = await request(app).get('/api/wallet');
      expect(getWalletRes.status).toBe(401);

      const getPlansRes = await request(app).get('/api/wallet/plans');
      expect(getPlansRes.status).toBe(401);

      const createOrderRes = await request(app).post('/api/wallet/orders').send({ planId: 'starter_pack' });
      expect(createOrderRes.status).toBe(401);

      const verifyRes = await request(app).post('/api/wallet/verify').send({});
      expect(verifyRes.status).toBe(401);

      const getTxRes = await request(app).get('/api/wallet/transactions');
      expect(getTxRes.status).toBe(401);
    });
  });

  describe('GET /api/wallet', () => {
    it('should return current user wallet info', async () => {
      const res = await request(app)
        .get('/api/wallet')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.wallet.creditsRemaining).toBe(100);
      expect(res.body.data.wallet.tier).toBe('free');
      expect(res.body.data.wallet.totalTokensConsumed).toBe(0);
    });
  });

  describe('GET /api/wallet/plans', () => {
    it('should return plans strictly from server configuration', async () => {
      const res = await request(app)
        .get('/api/wallet/plans')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.plans).toHaveLength(PLANS.length);

      const starter = res.body.data.plans.find((p) => p.id === 'starter_pack');
      expect(starter).toBeDefined();
      expect(starter.amountINR).toBe(49);
      expect(starter.credits).toBe(500);

      const pro = res.body.data.plans.find((p) => p.id === 'pro_pack');
      expect(pro).toBeDefined();
      expect(pro.amountINR).toBe(99);
      expect(pro.credits).toBe(1200);
    });
  });

  describe('POST /api/wallet/orders', () => {
    it('should reject invalid or non-existent planId with 400', async () => {
      const res = await request(app)
        .post('/api/wallet/orders')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ planId: 'invalid_plan_id' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should create an order and record a pending transaction', async () => {
      const res = await request(app)
        .post('/api/wallet/orders')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ planId: 'starter_pack' });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('orderId');
      expect(res.body.data.amount).toBe(4900);
      expect(res.body.data.currency).toBe('INR');
      expect(res.body.data).toHaveProperty('keyId');

      // Verify transaction in DB is pending
      const tx = await Transaction.findOne({ orderId: res.body.data.orderId });
      expect(tx).not.toBeNull();
      expect(tx.userId.toString()).toBe(userA._id.toString());
      expect(tx.status).toBe('pending');
      expect(tx.amountINR).toBe(49);
      expect(tx.creditsAdded).toBe(500);
    });
  });

  describe('POST /api/wallet/verify', () => {
    it('should reject invalid signature with 400', async () => {
      const orderRes = await request(app)
        .post('/api/wallet/orders')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ planId: 'starter_pack' });

      const res = await request(app)
        .post('/api/wallet/verify')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          razorpay_order_id: orderRes.body.data.orderId,
          razorpay_payment_id: 'pay_invalid_123',
          razorpay_signature: 'invalid_signature_hex',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_SIGNATURE');
    });

    it('should verify payment signature and credit wallet', async () => {
      const orderRes = await request(app)
        .post('/api/wallet/orders')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ planId: 'pro_pack' });

      const orderId = orderRes.body.data.orderId;
      const paymentId = `pay_test_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const secret = env.RAZORPAY_KEY_SECRET || 'nexai_dev_razorpay_secret';
      const signature = crypto
        .createHmac('sha256', secret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      const res = await request(app)
        .post('/api/wallet/verify')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: signature,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.success).toBe(true);
      expect(res.body.data.credited).toBe(true);
      expect(res.body.data.creditsRemaining).toBe(100 + 1200);

      // Verify DB state
      const updatedUser = await User.findById(userA._id);
      expect(updatedUser.wallet.creditsRemaining).toBe(1300);

      const tx = await Transaction.findOne({ paymentId });
      expect(tx.status).toBe('success');
    });
  });

  describe('GET /api/wallet/transactions', () => {
    it('should return transactions isolated strictly to the requesting user', async () => {
      // Create transaction for User A
      await Transaction.create({
        userId: userA._id,
        amountINR: 49,
        creditsAdded: 500,
        orderId: 'order_test_a1',
        paymentId: 'pay_test_a1',
        planId: 'starter_pack',
        status: 'success',
      });

      // Create transaction for User B
      await Transaction.create({
        userId: userB._id,
        amountINR: 99,
        creditsAdded: 1200,
        orderId: 'order_test_b1',
        paymentId: 'pay_test_b1',
        planId: 'pro_pack',
        status: 'success',
      });

      // User A requests transactions
      const resA = await request(app)
        .get('/api/wallet/transactions')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(resA.status).toBe(200);
      expect(resA.body.data.transactions).toHaveLength(1);
      expect(resA.body.data.transactions[0].paymentId).toBe('pay_test_a1');

      // User B requests transactions
      const resB = await request(app)
        .get('/api/wallet/transactions')
        .set('Authorization', `Bearer ${tokenB}`);

      expect(resB.status).toBe(200);
      expect(resB.body.data.transactions).toHaveLength(1);
      expect(resB.body.data.transactions[0].paymentId).toBe('pay_test_b1');
    });
  });

  describe('POST /api/webhooks/razorpay (Raw Body Webhook)', () => {
    it('should reject webhook with invalid signature with 400', async () => {
      const payload = JSON.stringify({ event: 'payment.captured' });

      const res = await request(app)
        .post('/api/webhooks/razorpay')
        .set('Content-Type', 'application/json')
        .set('x-razorpay-signature', 'invalid_webhook_sig')
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_WEBHOOK_SIGNATURE');
    });

    it('should verify raw-body signature and credit user on payment.captured event', async () => {
      const orderRes = await request(app)
        .post('/api/wallet/orders')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ planId: 'starter_pack' });

      const orderId = orderRes.body.data.orderId;
      const paymentId = `pay_wh_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

      const webhookPayload = JSON.stringify({
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: paymentId,
              order_id: orderId,
              amount: 4900,
              notes: {
                userId: userA._id.toString(),
                planId: 'starter_pack',
              },
            },
          },
        },
      });

      const secret = env.RAZORPAY_WEBHOOK_SECRET || env.RAZORPAY_KEY_SECRET || 'nexai_dev_webhook_secret';
      const signature = crypto
        .createHmac('sha256', secret)
        .update(Buffer.from(webhookPayload, 'utf-8'))
        .digest('hex');

      const res = await request(app)
        .post('/api/webhooks/razorpay')
        .set('Content-Type', 'application/json')
        .set('x-razorpay-signature', signature)
        .send(webhookPayload);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');

      // Verify wallet credits updated
      const updatedUser = await User.findById(userA._id);
      expect(updatedUser.wallet.creditsRemaining).toBe(100 + 500);

      // Verify transaction marked as success
      const tx = await Transaction.findOne({ paymentId });
      expect(tx).not.toBeNull();
      expect(tx.status).toBe('success');
    });
  });

  describe('Idempotency & Concurrent Race Condition Verification', () => {
    it('should credit user EXACTLY ONCE when verify and webhook arrive simultaneously', async () => {
      const initialCredits = userA.wallet.creditsRemaining; // 100
      const planCredits = 500; // starter_pack credits

      const orderRes = await request(app)
        .post('/api/wallet/orders')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ planId: 'starter_pack' });

      const orderId = orderRes.body.data.orderId;
      const paymentId = `pay_race_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

      // 1. Prepare checkout verify payload
      const verifySecret = env.RAZORPAY_KEY_SECRET || 'nexai_dev_razorpay_secret';
      const verifySig = crypto
        .createHmac('sha256', verifySecret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      const verifyCall = request(app)
        .post('/api/wallet/verify')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: verifySig,
        });

      // 2. Prepare webhook payload for the same payment
      const webhookPayload = JSON.stringify({
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: paymentId,
              order_id: orderId,
              amount: 4900,
              notes: {
                userId: userA._id.toString(),
                planId: 'starter_pack',
              },
            },
          },
        },
      });

      const whSecret = env.RAZORPAY_WEBHOOK_SECRET || env.RAZORPAY_KEY_SECRET || 'nexai_dev_webhook_secret';
      const whSig = crypto
        .createHmac('sha256', whSecret)
        .update(Buffer.from(webhookPayload, 'utf-8'))
        .digest('hex');

      const webhookCall = request(app)
        .post('/api/webhooks/razorpay')
        .set('Content-Type', 'application/json')
        .set('x-razorpay-signature', whSig)
        .send(webhookPayload);

      // Fire BOTH simultaneously
      const [resVerify, resWebhook] = await Promise.all([verifyCall, webhookCall]);

      expect(resVerify.status).toBe(200);
      expect(resWebhook.status).toBe(200);

      // Verify that credits increased by 500 EXACTLY ONCE (100 + 500 = 600, NOT 1100)
      const userAfter = await User.findById(userA._id);
      expect(userAfter.wallet.creditsRemaining).toBe(initialCredits + planCredits);

      // Verify that only one transaction exists with this paymentId and is success
      const txs = await Transaction.find({ paymentId });
      expect(txs).toHaveLength(1);
      expect(txs[0].status).toBe('success');

      // 3. Retry verify again (e.g. user refreshed the page)
      const retryRes = await request(app)
        .post('/api/wallet/verify')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: verifySig,
        });

      expect(retryRes.status).toBe(200);
      expect(retryRes.body.data.alreadyProcessed).toBe(true);

      // Balance still exactly 600
      const userAfterRetry = await User.findById(userA._id);
      expect(userAfterRetry.wallet.creditsRemaining).toBe(initialCredits + planCredits);
    });
  });
});
