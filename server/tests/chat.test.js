import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Chat } from '../src/models/Chat.js';
import { Message } from '../src/models/Message.js';
import { UsageLog } from '../src/models/UsageLog.js';
import { generateAccessToken } from '../src/utils/token.js';
import * as chatAgent from '../src/agents/chat.agent.js';

describe('Chat API Integration Tests', () => {
  let userA = null;
  let userB = null;
  let tokenA = '';
  let tokenB = '';

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await User.deleteMany({ email: /@chattest\.nexai\.test$/ });
    await Chat.deleteMany({});
    await Message.deleteMany({});
    await UsageLog.deleteMany({});
    await disconnectDB();
  });

  beforeEach(async () => {
    await Chat.deleteMany({});
    await Message.deleteMany({});

    userA = await User.create({
      email: `user_a_${Date.now()}_${Math.random()}@chattest.nexai.test`,
      wallet: { creditsRemaining: 100, tier: 'free', totalTokensConsumed: 0 },
    });

    userB = await User.create({
      email: `user_b_${Date.now()}_${Math.random()}@chattest.nexai.test`,
      wallet: { creditsRemaining: 100, tier: 'free', totalTokensConsumed: 0 },
    });

    tokenA = generateAccessToken(userA);
    tokenB = generateAccessToken(userB);
  });

  describe('Authentication and Authorization', () => {
    it('should return 401 UNAUTHORIZED when no token is provided', async () => {
      const res = await request(app).get('/api/chats');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 401 when given an invalid token', async () => {
      const res = await request(app).get('/api/chats').set('Authorization', 'Bearer invalid_token');
      expect(res.status).toBe(401);
    });
  });

  describe('Chat CRUD Operations', () => {
    it('POST /api/chats should create a new chat session with default title', async () => {
      const res = await request(app)
        .post('/api/chats')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({});

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('_id');
      expect(res.body.data.title).toBe('New Chat');
      expect(res.body.data.userId.toString()).toBe(userA._id.toString());
    });

    it('POST /api/chats should create a new chat session with custom title', async () => {
      const res = await request(app)
        .post('/api/chats')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ title: 'React Performance Guide' });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('React Performance Guide');
    });

    it("GET /api/chats should return only the authenticated user's chats", async () => {
      await Chat.create({ userId: userA._id, title: 'Chat A1' });
      await Chat.create({ userId: userA._id, title: 'Chat A2' });
      await Chat.create({ userId: userB._id, title: 'Chat B1' });

      const resA = await request(app).get('/api/chats').set('Authorization', `Bearer ${tokenA}`);

      expect(resA.status).toBe(200);
      expect(resA.body.data.length).toBe(2);
      expect(resA.body.data.map((c) => c.title)).toContain('Chat A1');
      expect(resA.body.data.map((c) => c.title)).not.toContain('Chat B1');
    });

    it('PATCH /api/chats/:id should update chat title for owner', async () => {
      const chat = await Chat.create({ userId: userA._id, title: 'Original Title' });

      const res = await request(app)
        .patch(`/api/chats/${chat._id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ title: 'Updated Title' });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Updated Title');

      const updated = await Chat.findById(chat._id);
      expect(updated.title).toBe('Updated Title');
    });

    it("PATCH /api/chats/:id should return 404 when attempting to update another user's chat", async () => {
      const chatA = await Chat.create({ userId: userA._id, title: 'User A Chat' });

      const res = await request(app)
        .patch(`/api/chats/${chatA._id}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ title: 'Hacked Title' });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('CHAT_NOT_FOUND');
    });

    it('DELETE /api/chats/:id should delete chat and its messages for owner', async () => {
      const chat = await Chat.create({ userId: userA._id, title: 'To Delete' });
      await Message.create({ chatId: chat._id, role: 'user', content: 'hello' });
      await Message.create({ chatId: chat._id, role: 'assistant', content: 'hi' });

      const res = await request(app)
        .delete(`/api/chats/${chat._id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.message).toBe('Chat deleted successfully');

      const chatInDb = await Chat.findById(chat._id);
      expect(chatInDb).toBeNull();

      const messagesInDb = await Message.find({ chatId: chat._id });
      expect(messagesInDb.length).toBe(0);
    });

    it("DELETE /api/chats/:id should return 404 for another user's chat", async () => {
      const chatA = await Chat.create({ userId: userA._id, title: 'User A Chat' });

      const res = await request(app)
        .delete(`/api/chats/${chatA._id}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('CHAT_NOT_FOUND');
    });
  });

  describe('Message Retrieval: GET /api/chats/:id/messages', () => {
    it('should return all messages in a chat in chronological order', async () => {
      const chat = await Chat.create({ userId: userA._id, title: 'Test Chat' });
      const m1 = await Message.create({ chatId: chat._id, role: 'user', content: 'first' });
      const m2 = await Message.create({ chatId: chat._id, role: 'assistant', content: 'second' });

      const res = await request(app)
        .get(`/api/chats/${chat._id}/messages`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.data[0]._id.toString()).toBe(m1._id.toString());
      expect(res.body.data[1]._id.toString()).toBe(m2._id.toString());
    });

    it("should return 404 when requesting messages for another user's chat", async () => {
      const chatA = await Chat.create({ userId: userA._id, title: 'User A Chat' });

      const res = await request(app)
        .get(`/api/chats/${chatA._id}/messages`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/chats/:id/messages (SSE Streaming & Metering)', () => {
    it('should block message and return 402 INSUFFICIENT_CREDITS when user balance is 0', async () => {
      userA.wallet.creditsRemaining = 0;
      await userA.save();

      const chat = await Chat.create({ userId: userA._id, title: 'No Credits Chat' });

      const res = await request(app)
        .post(`/api/chats/${chat._id}/messages`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ content: 'Hello AI' });

      expect(res.status).toBe(402);
      expect(res.body.error.code).toBe('INSUFFICIENT_CREDITS');
      expect(res.body.error.message).toBe('Recharge to continue');

      // Verify no message was saved
      const messages = await Message.find({ chatId: chat._id });
      expect(messages.length).toBe(0);
    });

    it('should stream tokens over SSE, deduct credits, and send done event', async () => {
      const chat = await Chat.create({ userId: userA._id, title: 'New Chat' });

      // Mock chatAgent streaming and title generator
      const mockStreamReply = async function* () {
        yield { text: 'Hello ' };
        yield { text: 'world!' };
        yield { usageMetadata: { totalTokenCount: 150 } }; // 150 tokens = 2 credits
      };
      vi.spyOn(chatAgent, 'streamChatReply').mockImplementation(mockStreamReply);
      vi.spyOn(chatAgent, 'generateChatTitle').mockResolvedValue({
        title: 'Greeting Inquiries',
        tokensUsed: 25,
        creditsDeducted: 1,
      });

      const res = await request(app)
        .post(`/api/chats/${chat._id}/messages`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ content: 'Hello there' });

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/event-stream');

      // Verify SSE payload
      const textOutput = res.text;
      expect(textOutput).toContain('event: token');
      expect(textOutput).toContain('{"text":"Hello "}');
      expect(textOutput).toContain('{"text":"world!"}');
      expect(textOutput).toContain('event: done');
      expect(textOutput).toContain('"tokensUsed":150');
      expect(textOutput).toContain('"creditsDeducted":2');

      // Verify user message and assistant message in DB
      const messages = await Message.find({ chatId: chat._id }).sort({ createdAt: 1 });
      expect(messages.length).toBe(2);
      expect(messages[0].role).toBe('user');
      expect(messages[0].content).toBe('Hello there');
      expect(messages[1].role).toBe('assistant');
      expect(messages[1].content).toBe('Hello world!');
      expect(messages[1].tokensUsed).toBe(150);

      // Verify chat title was updated
      const updatedChat = await Chat.findById(chat._id);
      expect(updatedChat.title).toBe('Greeting Inquiries');

      // Verify user credits remaining (started at 100, deducted 2 for chat = 98)
      const updatedUser = await User.findById(userA._id);
      expect(updatedUser.wallet.creditsRemaining).toBe(98);
      expect(updatedUser.wallet.totalTokensConsumed).toBe(150);

      // Verify UsageLog entries created
      const logs = await UsageLog.find({ userId: userA._id });
      expect(logs.length).toBeGreaterThanOrEqual(1);
      const chatLog = logs.find((l) => l.tokensUsed === 150);
      expect(chatLog).toBeDefined();
      expect(chatLog.feature).toBe('chat');
      expect(chatLog.creditsDeducted).toBe(2);

      vi.restoreAllMocks();
    });
  });
});
