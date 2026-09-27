import crypto from 'node:crypto';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { env } from '../src/config/env.js';
import { User } from '../src/models/User.js';
import { Chat } from '../src/models/Chat.js';
import { Message } from '../src/models/Message.js';
import { LibraryItem } from '../src/models/LibraryItem.js';
import { InterviewSession } from '../src/models/InterviewSession.js';
import { Transaction } from '../src/models/Transaction.js';
import { UsageLog } from '../src/models/UsageLog.js';
import { ErrorLog } from '../src/models/ErrorLog.js';
import { generateAccessToken } from '../src/utils/token.js';
import * as chatAgent from '../src/agents/chat.agent.js';
import * as taggingAgent from '../src/agents/tagging.agent.js';
import * as interviewAgent from '../src/agents/interview.agent.js';
import * as geminiService from '../src/services/gemini.service.js';
import { vectorDbService } from '../src/services/vectorDb.service.js';

describe('NexAI End-to-End User Journey Suite (Step 13)', () => {
  const testRunId = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const testUserEmail = `journey_user_${testRunId}@e2e.nexai.test`;
  const adminEmail = `journey_admin_${testRunId}@e2e.nexai.test`;

  let userToken = '';
  let userId = '';
  let adminToken = '';

  let createdChatId = '';
  let savedLibraryItemId = '';
  let interviewSessionId = '';
  let rechargeOrderId = '';

  beforeAll(async () => {
    await connectDB();
    vectorDbService.clearLocalStore();

    // Create an Admin user to verify Admin dashboard at the end of the journey
    const admin = await User.create({
      email: adminEmail,
      role: 'admin',
      wallet: { creditsRemaining: 1000, tier: 'pro_monthly', totalTokensConsumed: 50000 },
    });
    adminToken = generateAccessToken(admin);
  });

  afterAll(async () => {
    // Thorough cleanup of all test records created in this E2E run
    const testUsers = await User.find({ email: /@e2e\.nexai\.test$/ }).select('_id');
    const userIds = testUsers.map((u) => u._id);

    if (userIds.length > 0) {
      const chats = await Chat.find({ userId: { $in: userIds } }).select('_id');
      const chatIds = chats.map((c) => c._id);

      await Promise.all([
        Message.deleteMany({ chatId: { $in: chatIds } }),
        Chat.deleteMany({ _id: { $in: chatIds } }),
        LibraryItem.deleteMany({ userId: { $in: userIds } }),
        InterviewSession.deleteMany({ userId: { $in: userIds } }),
        Transaction.deleteMany({ userId: { $in: userIds } }),
        UsageLog.deleteMany({ userId: { $in: userIds } }),
        ErrorLog.deleteMany({ userId: { $in: userIds } }),
        User.deleteMany({ _id: { $in: userIds } }),
      ]);
    }

    vectorDbService.clearLocalStore();
    vi.restoreAllMocks();
    await disconnectDB();
  });

  describe('Full Multi-Step Lifecycle Journey', () => {
    it('1️⃣ Register: New user registers and receives starter credits', async () => {
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          email: testUserEmail,
          password: 'Password123!',
          name: 'E2E Journey Tester',
        });

      expect(registerRes.status).toBe(201);
      expect(registerRes.body.data).toHaveProperty('user');
      expect(registerRes.body.data).toHaveProperty('accessToken');

      userId = registerRes.body.data.user._id || registerRes.body.data.user.id;
      userToken = registerRes.body.data.accessToken;

      expect(registerRes.body.data.user.email).toBe(testUserEmail);
      expect(registerRes.body.data.user.wallet.creditsRemaining).toBe(100);
      expect(registerRes.body.data.user.wallet.tier).toBe('free');
    });

    it('2️⃣ Initial Credits: Authenticated user checks wallet balance', async () => {
      const walletRes = await request(app)
        .get('/api/wallet')
        .set('Authorization', `Bearer ${userToken}`);

      expect(walletRes.status).toBe(200);
      expect(walletRes.body.data.wallet.creditsRemaining).toBe(100);
      expect(walletRes.body.data.wallet.tier).toBe('free');
      expect(walletRes.body.data.wallet.totalTokensConsumed).toBe(0);
    });

    it('3️⃣ Chat Streaming: User creates chat and streams response with atomic token metering', async () => {
      // Create chat session
      const createChatRes = await request(app)
        .post('/api/chats')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'New E2E Chat' });

      expect(createChatRes.status).toBe(201);
      createdChatId = createChatRes.body.data._id;
      expect(createdChatId).toBeTruthy();

      // Mock streaming reply and title generation
      const mockStreamReply = async function* () {
        yield { text: 'Hello from ' };
        yield { text: 'NexAI streaming agent!' };
        yield { usageMetadata: { totalTokenCount: 200 } }; // 200 tokens = 2 credits
      };
      vi.spyOn(chatAgent, 'streamChatReply').mockImplementation(mockStreamReply);
      vi.spyOn(chatAgent, 'generateChatTitle').mockResolvedValue({
        title: 'Streaming Architecture Discussion',
        tokensUsed: 25,
        creditsDeducted: 1,
      });

      // Stream message via SSE
      const sseRes = await request(app)
        .post(`/api/chats/${createdChatId}/messages`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ content: 'Tell me about scalable architecture.' });

      expect(sseRes.status).toBe(200);
      expect(sseRes.headers['content-type']).toContain('text/event-stream');

      const streamText = sseRes.text;
      expect(streamText).toContain('event: token');
      expect(streamText).toContain('{"text":"Hello from "}');
      expect(streamText).toContain('{"text":"NexAI streaming agent!"}');
      expect(streamText).toContain('event: done');
      expect(streamText).toContain('"tokensUsed":200');
      expect(streamText).toContain('"creditsDeducted":2');

      // Verify messages persisted in DB
      const messages = await Message.find({ chatId: createdChatId }).sort({ createdAt: 1 });
      expect(messages.length).toBe(2);
      expect(messages[0].role).toBe('user');
      expect(messages[0].content).toBe('Tell me about scalable architecture.');
      expect(messages[1].role).toBe('assistant');
      expect(messages[1].content).toBe('Hello from NexAI streaming agent!');
      expect(messages[1].tokensUsed).toBe(200);

      // Verify chat title updated
      const updatedChat = await Chat.findById(createdChatId);
      expect(updatedChat.title).toBe('Streaming Architecture Discussion');

      // Verify wallet credits deducted (100 - 2 = 98)
      const userInDb = await User.findById(userId);
      expect(userInDb.wallet.creditsRemaining).toBe(98);
      expect(userInDb.wallet.totalTokensConsumed).toBe(200);

      // Verify UsageLog created
      const chatLogs = await UsageLog.find({ userId, feature: 'chat' });
      expect(chatLogs.length).toBeGreaterThanOrEqual(1);
      expect(chatLogs[0].creditsDeducted).toBe(2);
    });

    it('4️⃣ Library Save: Suggest -> Review -> Confirm workflow saves item to Library and Vector index', async () => {
      // Step A: Suggest tags and summary with metering
      vi.spyOn(taggingAgent, 'generateLibrarySuggestion').mockResolvedValueOnce({
        title: 'Microservices & Event-Driven Architecture',
        summary: 'Deep dive into event-driven asynchronous messaging and fault isolation.',
        tags: ['microservices', 'architecture', 'event-driven'],
        tokensUsed: 100, // 100 tokens = 1 credit
      });

      const suggestRes = await request(app)
        .post('/api/library/suggest')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          type: 'note',
          content: 'Event-driven architectures decouple services through asynchronous messaging queues.',
        });

      expect(suggestRes.status).toBe(200);
      expect(suggestRes.body.data.title).toBe('Microservices & Event-Driven Architecture');
      expect(suggestRes.body.data.tags).toContain('microservices');
      expect(suggestRes.body.data.creditsDeducted).toBe(1);
      expect(suggestRes.body.data.creditsRemaining).toBe(97);

      // Verify item was NOT auto-saved (Suggest-Review-Confirm paradigm)
      const countBeforeConfirm = await LibraryItem.countDocuments({ userId });
      expect(countBeforeConfirm).toBe(0);

      // Step B: User confirms save
      const mockVector = [0.05, 0.12, 0.88, 0.42];
      vi.spyOn(geminiService, 'embedContent').mockResolvedValueOnce(mockVector);

      const saveRes = await request(app)
        .post('/api/library')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          type: 'note',
          title: suggestRes.body.data.title,
          summary: suggestRes.body.data.summary,
          tags: suggestRes.body.data.tags,
          content: 'Event-driven architectures decouple services through asynchronous messaging queues.',
        });

      expect(saveRes.status).toBe(201);
      savedLibraryItemId = saveRes.body.data._id;
      expect(savedLibraryItemId).toBeTruthy();
      expect(saveRes.body.data.vectorId).toBeTruthy();

      // Verify item appears in user's library
      const getLibRes = await request(app)
        .get('/api/library')
        .set('Authorization', `Bearer ${userToken}`);

      expect(getLibRes.status).toBe(200);
      expect(getLibRes.body.data.length).toBe(1);
      expect(getLibRes.body.data[0]._id).toBe(savedLibraryItemId);
    });

    it('5️⃣ Interview Turn & Scorecard: Completes technical turn and archives scorecard', async () => {
      // Step A: Start interview session
      vi.spyOn(interviewAgent, 'generateInterviewGreeting').mockResolvedValueOnce({
        text: 'Welcome to your Senior Backend Engineer technical interview. Let us discuss distributed locks.',
        tokensUsed: 100, // 1 credit
      });

      const startRes = await request(app)
        .post('/api/interview/start')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          role: 'Backend Engineer',
          difficulty: 'senior',
          topic: 'Distributed Systems',
        });

      expect(startRes.status).toBe(201);
      interviewSessionId = startRes.body.data.session._id;
      expect(interviewSessionId).toBeTruthy();
      expect(startRes.body.data.creditsRemaining).toBe(96); // 97 - 1 = 96

      // Step B: Candidate responds, interviewer streams critique and next challenge
      const mockStreamInterview = async function* () {
        yield { text: 'Great analysis of Redlock algorithm. ' };
        yield { text: 'Now, how would you handle fencing tokens?' };
        yield { usageMetadata: { totalTokenCount: 150 } }; // 2 credits
      };
      vi.spyOn(interviewAgent, 'streamInterviewTurn').mockImplementation(mockStreamInterview);

      const turnRes = await request(app)
        .post(`/api/interview/${interviewSessionId}/respond`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          content: 'I would use Redis with TTL and Redlock algorithm across multi-master nodes.',
        });

      expect(turnRes.status).toBe(200);
      expect(turnRes.headers['content-type']).toContain('text/event-stream');
      expect(turnRes.text).toContain('event: done');
      expect(turnRes.text).toContain('"creditsDeducted":2');

      // Step C: Conclude interview & generate scorecard
      vi.spyOn(interviewAgent, 'generateInterviewScorecard').mockResolvedValueOnce({
        scorecard: {
          overallScore: 92,
          rating: 'Strong Hire',
          categories: {
            technicalAccuracy: 95,
            problemSolving: 90,
            communication: 90,
            systemDesign: 93,
          },
          strengths: ['Excellent grasp of distributed concurrency', 'Articulate problem framing'],
          improvements: ['Mention clock drift in consensus protocols'],
          summary: 'Candidate demonstrated exemplary mastery of distributed locking and fault tolerance.',
          recommendedTopics: ['Raft consensus', 'Eventual consistency'],
        },
        tokensUsed: 200, // 2 credits
      });

      const mockVector = [0.1, 0.2, 0.3, 0.4];
      vi.spyOn(geminiService, 'embedContent').mockResolvedValue(mockVector);

      const concludeRes = await request(app)
        .post(`/api/interview/${interviewSessionId}/conclude`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(concludeRes.status).toBe(200);
      expect(concludeRes.body.data.session.status).toBe('completed');
      expect(concludeRes.body.data.session.scorecard.overallScore).toBe(92);
      expect(concludeRes.body.data.session.scorecard.rating).toBe('Strong Hire');
      expect(concludeRes.body.data.creditsRemaining).toBe(92); // 94 - 2 = 92

      // Verify auto-archival into user's Library
      const archivedItem = await LibraryItem.findOne({
        userId,
        type: 'interview',
      });
      expect(archivedItem).not.toBeNull();
      expect(archivedItem.title).toContain('Mock Interview: Backend Engineer');
    });

    it('6️⃣ Wallet Recharge: Creates order and verifies payment with cryptographic HMAC signature', async () => {
      // Step A: Create order for starter pack (₹49 -> 500 credits)
      const orderRes = await request(app)
        .post('/api/wallet/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ planId: 'starter_pack' });

      expect(orderRes.status).toBe(201);
      rechargeOrderId = orderRes.body.data.orderId;
      expect(rechargeOrderId).toBeTruthy();
      expect(orderRes.body.data.amount).toBe(4900); // 4900 paise = ₹49

      // Step B: Generate genuine Razorpay HMAC SHA-256 signature
      const paymentId = `pay_e2e_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const secret = env.RAZORPAY_KEY_SECRET || 'nexai_dev_razorpay_secret';
      const validSignature = crypto
        .createHmac('sha256', secret)
        .update(`${rechargeOrderId}|${paymentId}`)
        .digest('hex');

      // Step C: Verify payment signature
      const verifyRes = await request(app)
        .post('/api/wallet/verify')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          razorpay_order_id: rechargeOrderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: validSignature,
        });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.data.success).toBe(true);
      expect(verifyRes.body.data.credited).toBe(true);
      // Started at 92 credits + 500 pack = 592 credits
      expect(verifyRes.body.data.creditsRemaining).toBe(592);

      // Verify transaction marked as 'success' in database
      const tx = await Transaction.findOne({ paymentId });
      expect(tx).not.toBeNull();
      expect(tx.status).toBe('success');
      expect(tx.userId.toString()).toBe(userId.toString());
      expect(tx.creditsAdded).toBe(500);
      expect(tx.amountINR).toBe(49);
    });

    it('7️⃣ Admin Verification: Platform KPIs and recent transaction accurately reflect in Admin Portal', async () => {
      // Verify non-admin is restricted with 403
      const forbiddenRes = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${userToken}`);
      expect(forbiddenRes.status).toBe(403);

      // Admin accesses stats
      const statsRes = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(statsRes.status).toBe(200);

      const stats = statsRes.body.data;
      expect(stats.activeUsers).toBeGreaterThanOrEqual(2); // journey user + admin user
      expect(stats.totalTokens).toBeGreaterThan(0);
      expect(stats.totalRevenue).toBeGreaterThanOrEqual(49);

      // Admin views recent transactions
      const txRes = await request(app)
        .get('/api/admin/transactions?limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(txRes.status).toBe(200);
      const transactions = txRes.body.data.transactions;
      const foundUserTx = transactions.find((t) => t.orderId === rechargeOrderId);
      expect(foundUserTx).toBeDefined();
      expect(foundUserTx.status).toBe('success');
      expect(foundUserTx.amountINR).toBe(49);
    });

    it('8️⃣ Credit Exhaustion Gate: Returns 402 INSUFFICIENT_CREDITS when wallet credits reach 0', async () => {
      // Simulate credit exhaustion by setting creditsRemaining to 0 directly
      await User.findByIdAndUpdate(userId, { 'wallet.creditsRemaining': 0 });

      // Attempt to initiate another AI chat stream
      const blockedChatRes = await request(app)
        .post(`/api/chats/${createdChatId}/messages`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ content: 'Attempting message with 0 credits' });

      expect(blockedChatRes.status).toBe(402);
      expect(blockedChatRes.body.error.code).toBe('INSUFFICIENT_CREDITS');
      expect(blockedChatRes.body.error.message).toContain('Recharge');

      // Attempt to start new interview session
      const blockedInterviewRes = await request(app)
        .post('/api/interview/start')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          role: 'Backend Engineer',
          difficulty: 'senior',
          topic: 'Microservices',
        });

      expect(blockedInterviewRes.status).toBe(402);
      expect(blockedInterviewRes.body.error.code).toBe('INSUFFICIENT_CREDITS');
    });
  });
});
