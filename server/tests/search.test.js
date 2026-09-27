import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { LibraryItem } from '../src/models/LibraryItem.js';
import { Prompt } from '../src/models/Prompt.js';
import { Chat } from '../src/models/Chat.js';
import { Message } from '../src/models/Message.js';
import { generateAccessToken } from '../src/utils/token.js';
import { vectorDbService } from '../src/services/vectorDb.service.js';

describe('Unified Search API Integration Tests (Step 10)', () => {
  let userA = null;
  let userB = null;
  let tokenA = '';
  let tokenB = '';

  beforeAll(async () => {
    await connectDB();
  });

  const cleanupUserRecords = async (userIds) => {
    if (!userIds || userIds.length === 0) return;
    const userChats = await Chat.find({ userId: { $in: userIds } }).select('_id');
    const chatIds = userChats.map((c) => c._id);
    await Message.deleteMany({ chatId: { $in: chatIds } });
    await Chat.deleteMany({ userId: { $in: userIds } });
    await LibraryItem.deleteMany({ userId: { $in: userIds } });
    await Prompt.deleteMany({ userId: { $in: userIds } });
    await User.deleteMany({ _id: { $in: userIds } });
    vectorDbService.clearLocalStore();
  };

  afterAll(async () => {
    const testUsers = await User.find({ email: /@searchtest\.nexai\.test$/ }).select('_id');
    await cleanupUserRecords(testUsers.map((u) => u._id));
    await disconnectDB();
  });

  beforeEach(async () => {
    if (userA || userB) {
      const ids = [userA?._id, userB?._id].filter(Boolean);
      await cleanupUserRecords(ids);
    }

    userA = await User.create({
      email: `user_a_${Date.now()}_${Math.random()}@searchtest.nexai.test`,
      wallet: { creditsRemaining: 100, tier: 'free', totalTokensConsumed: 0 },
    });

    userB = await User.create({
      email: `user_b_${Date.now()}_${Math.random()}@searchtest.nexai.test`,
      wallet: { creditsRemaining: 100, tier: 'free', totalTokensConsumed: 0 },
    });

    tokenA = generateAccessToken(userA);
    tokenB = generateAccessToken(userB);

    vi.restoreAllMocks();
  });

  describe('Authentication & Validation', () => {
    it('should reject unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/search?q=test');
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject requests without a search query with 400', async () => {
      const res = await request(app)
        .get('/api/search')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject empty search query with 400', async () => {
      const res = await request(app)
        .get('/api/search?q=   ')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Unified Search Execution & Scoping', () => {
    beforeEach(async () => {
      // User A data
      await LibraryItem.create({
        userId: userA._id,
        type: 'note',
        title: 'Microservices Architecture with Docker',
        summary: 'Deep dive into container orchestration and service mesh pattern',
        tags: ['docker', 'microservices', 'devops'],
        content: 'Containerization enables independent scaling of backend services.',
      });

      await Prompt.create({
        userId: userA._id,
        title: 'Docker Compose Generator',
        description: 'Generates multi-container docker compose configuration',
        template: 'Create a docker-compose.yml for {{service_name}} using {{db_type}}',
        tags: ['docker', 'devops'],
      });

      const chatA = await Chat.create({
        userId: userA._id,
        title: 'Docker Deployment Debugging',
      });

      await Message.create({
        chatId: chatA._id,
        role: 'user',
        content: 'How do I optimize Docker multi-stage builds for a Node.js service?',
        tokensUsed: 25,
      });

      await Message.create({
        chatId: chatA._id,
        role: 'assistant',
        content: 'Use an Alpine base image and separate dependency installation layers.',
        tokensUsed: 40,
      });

      // User B data (isolated, should NEVER appear in User A search)
      await LibraryItem.create({
        userId: userB._id,
        type: 'link',
        title: 'Docker Security Best Practices for Enterprise',
        summary: 'Rootless containers and secret management',
        tags: ['docker', 'security'],
      });

      await Prompt.create({
        userId: userB._id,
        title: 'Docker Healthcheck Template',
        template: 'Configure healthcheck for {{app}}',
      });
    });

    it('should return matching items across Library, Prompts, and Chats for User A', async () => {
      const res = await request(app)
        .get('/api/search?q=Docker')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      const { counts, library, prompts, chats } = res.body.data;

      expect(counts.total).toBeGreaterThanOrEqual(3);
      expect(library.length).toBe(1);
      expect(library[0].title).toBe('Microservices Architecture with Docker');
      expect(library[0].userId.toString()).toBe(userA._id.toString());

      expect(prompts.length).toBe(1);
      expect(prompts[0].title).toBe('Docker Compose Generator');
      expect(prompts[0].userId.toString()).toBe(userA._id.toString());

      expect(chats.length).toBe(1);
      expect(chats[0].title).toBe('Docker Deployment Debugging');
    });

    it('should enforce strict user isolation (User B only sees User B data)', async () => {
      const resB = await request(app)
        .get('/api/search?q=Docker')
        .set('Authorization', `Bearer ${tokenB}`);

      expect(resB.status).toBe(200);
      const { library, prompts, chats } = resB.body.data;

      expect(library.length).toBe(1);
      expect(library[0].title).toBe('Docker Security Best Practices for Enterprise');
      expect(library[0].userId.toString()).toBe(userB._id.toString());

      expect(prompts.length).toBe(1);
      expect(prompts[0].title).toBe('Docker Healthcheck Template');

      expect(chats.length).toBe(0); // User B has no chats
    });

    it('should filter by category when type=library is specified', async () => {
      const res = await request(app)
        .get('/api/search?q=Docker&type=library')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      const { library, prompts, chats, counts } = res.body.data;

      expect(library.length).toBe(1);
      expect(prompts.length).toBe(0);
      expect(chats.length).toBe(0);
      expect(counts.library).toBe(1);
      expect(counts.prompts).toBe(0);
      expect(counts.chats).toBe(0);
    });

    it('should filter by category when type=prompts is specified', async () => {
      const res = await request(app)
        .get('/api/search?q=Docker&type=prompts')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      const { library, prompts, chats } = res.body.data;

      expect(library.length).toBe(0);
      expect(prompts.length).toBe(1);
      expect(chats.length).toBe(0);
    });

    it('should filter by category when type=chats is specified', async () => {
      const res = await request(app)
        .get('/api/search?q=Docker&type=chats')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      const { library, prompts, chats } = res.body.data;

      expect(library.length).toBe(0);
      expect(prompts.length).toBe(0);
      expect(chats.length).toBe(1);
    });

    it('should search chat message content and provide a snippet', async () => {
      const res = await request(app)
        .get('/api/search?q=Alpine')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      const { chats } = res.body.data;

      expect(chats.length).toBe(1);
      expect(chats[0].title).toBe('Docker Deployment Debugging');
      expect(chats[0].snippet.toLowerCase()).toContain('alpine');
    });

    it('should return empty lists and zero counts when no items match', async () => {
      const res = await request(app)
        .get('/api/search?q=NonExistentKeywordXYZ123')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      const { counts, library, prompts, chats } = res.body.data;

      expect(counts.total).toBe(0);
      expect(library.length).toBe(0);
      expect(prompts.length).toBe(0);
      expect(chats.length).toBe(0);
    });
  });
});
