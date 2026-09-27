import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { LibraryItem } from '../src/models/LibraryItem.js';
import { UsageLog } from '../src/models/UsageLog.js';
import { generateAccessToken } from '../src/utils/token.js';
import * as taggingAgent from '../src/agents/tagging.agent.js';
import * as geminiService from '../src/services/gemini.service.js';
import { vectorDbService } from '../src/services/vectorDb.service.js';

describe('Library API Integration Tests', () => {
  let userA = null;
  let userB = null;
  let tokenA = '';
  let tokenB = '';

  beforeAll(async () => {
    await connectDB();
  });

  const cleanupRecords = async (userIds) => {
    if (!userIds || userIds.length === 0) return;
    await LibraryItem.deleteMany({ userId: { $in: userIds } });
    await UsageLog.deleteMany({ userId: { $in: userIds } });
    await User.deleteMany({ _id: { $in: userIds } });
  };

  afterAll(async () => {
    const testUsers = await User.find({ email: /@libtest\.nexai\.test$/ }).select('_id');
    await cleanupRecords(testUsers.map((u) => u._id));
    vectorDbService.clearLocalStore();
    await disconnectDB();
  });

  beforeEach(async () => {
    if (userA || userB) {
      const ids = [userA?._id, userB?._id].filter(Boolean);
      await cleanupRecords(ids);
    }
    vectorDbService.clearLocalStore();

    userA = await User.create({
      email: `user_a_${Date.now()}_${Math.random()}@libtest.nexai.test`,
      wallet: { creditsRemaining: 100, tier: 'free', totalTokensConsumed: 0 },
    });

    userB = await User.create({
      email: `user_b_${Date.now()}_${Math.random()}@libtest.nexai.test`,
      wallet: { creditsRemaining: 100, tier: 'free', totalTokensConsumed: 0 },
    });

    tokenA = generateAccessToken(userA);
    tokenB = generateAccessToken(userB);

    vi.restoreAllMocks();
  });

  describe('Authentication & Security', () => {
    it('should reject unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/library');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should isolate library items strictly by userId', async () => {
      await LibraryItem.create({
        userId: userA._id,
        type: 'note',
        title: "User A's Private Secret Note",
        summary: 'Secret contents',
        tags: ['secret'],
      });

      const res = await request(app).get('/api/library').set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
    });
  });

  describe('POST /api/library/suggest', () => {
    it('should validate request body and reject invalid type', async () => {
      const res = await request(app)
        .post('/api/library/suggest')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ type: 'invalid_type' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 402 INSUFFICIENT_CREDITS when user has 0 credits', async () => {
      await User.findByIdAndUpdate(userA._id, { $set: { 'wallet.creditsRemaining': 0 } });

      const res = await request(app)
        .post('/api/library/suggest')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ type: 'note', content: 'Notes about database indexing' });

      expect(res.status).toBe(402);
      expect(res.body.error.code).toBe('INSUFFICIENT_CREDITS');
    });

    it('should suggest title, summary, and tags, meter usage, and NOT save item to DB', async () => {
      vi.spyOn(taggingAgent, 'generateLibrarySuggestion').mockResolvedValueOnce({
        title: 'Understanding React Server Components',
        summary: 'A deep dive into RSC architecture, server boundaries, and streaming rendering.',
        tags: ['react', 'nextjs', 'rsc', 'web-dev'],
        tokensUsed: 150,
      });

      const res = await request(app)
        .post('/api/library/suggest')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          type: 'note',
          content: 'React Server Components let you write UI that renders purely on the server...',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Understanding React Server Components');
      expect(res.body.data.tags).toContain('react');
      expect(res.body.data.tokensUsed).toBe(150);
      expect(res.body.data.creditsDeducted).toBe(2); // Math.ceil(150 / 100) = 2
      expect(res.body.data.creditsRemaining).toBe(98);

      // Verify item was NOT saved to MongoDB
      const count = await LibraryItem.countDocuments({ userId: userA._id });
      expect(count).toBe(0);

      // Verify UsageLog was written
      const logs = await UsageLog.find({ userId: userA._id, feature: 'library' });
      expect(logs).toHaveLength(1);
      expect(logs[0].tokensUsed).toBe(150);
      expect(logs[0].creditsDeducted).toBe(2);
    });
  });

  describe('POST /api/library (Save item)', () => {
    it('should save confirmed item to MongoDB and index embedding in vectorDb', async () => {
      const mockVector = [0.1, 0.2, 0.3, 0.4];
      vi.spyOn(geminiService, 'embedContent').mockResolvedValueOnce(mockVector);

      const res = await request(app)
        .post('/api/library')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          type: 'note',
          title: 'Zustand State Management Guide',
          summary: 'Fast, scalable state management without boilerplate.',
          tags: ['React', 'ZUSTAND', 'Frontend'],
          content: 'Zustand uses hooks as the primary interface...',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('Zustand State Management Guide');
      expect(res.body.data.tags).toEqual(['react', 'zustand', 'frontend']);
      expect(res.body.data.vectorId).toBeTruthy();

      const saved = await LibraryItem.findById(res.body.data._id);
      expect(saved).not.toBeNull();
      expect(saved.title).toBe('Zustand State Management Guide');
    });
  });

  describe('GET /api/library & Tag Filtering', () => {
    it('should list user items and filter by tag', async () => {
      await LibraryItem.create([
        {
          userId: userA._id,
          type: 'note',
          title: 'Docker Containers',
          summary: 'Containerization basics',
          tags: ['devops', 'docker'],
        },
        {
          userId: userA._id,
          type: 'note',
          title: 'Kubernetes Orchestration',
          summary: 'K8s pods and services',
          tags: ['devops', 'k8s'],
        },
        {
          userId: userA._id,
          type: 'note',
          title: 'CSS Grid Layouts',
          summary: 'CSS two-dimensional grid system',
          tags: ['css', 'frontend'],
        },
      ]);

      // All items
      const allRes = await request(app)
        .get('/api/library')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(allRes.status).toBe(200);
      expect(allRes.body.data).toHaveLength(3);
      expect(allRes.body.meta.tags).toEqual(['css', 'devops', 'docker', 'frontend', 'k8s']);

      // Tag filter
      const tagRes = await request(app)
        .get('/api/library?tag=css')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(tagRes.status).toBe(200);
      expect(tagRes.body.data).toHaveLength(1);
      expect(tagRes.body.data[0].title).toBe('CSS Grid Layouts');
    });
  });

  describe('PATCH & DELETE /api/library/:id', () => {
    it('should update item details and prevent editing others items', async () => {
      const item = await LibraryItem.create({
        userId: userA._id,
        type: 'note',
        title: 'Original Title',
        summary: 'Original Summary',
        tags: ['alpha'],
      });

      // User B tries to update User A's item
      const forbiddenRes = await request(app)
        .patch(`/api/library/${item._id}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ title: 'Hacked Title' });

      expect(forbiddenRes.status).toBe(404);

      // User A updates own item
      vi.spyOn(geminiService, 'embedContent').mockResolvedValueOnce([0.5, 0.5]);
      const successRes = await request(app)
        .patch(`/api/library/${item._id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ title: 'Updated Title', tags: ['beta', 'gamma'] });

      expect(successRes.status).toBe(200);
      expect(successRes.body.data.title).toBe('Updated Title');
      expect(successRes.body.data.tags).toEqual(['beta', 'gamma']);
    });

    it('should delete library item and remove vector', async () => {
      const item = await LibraryItem.create({
        userId: userA._id,
        type: 'note',
        title: 'To Be Deleted',
        tags: ['temp'],
        vectorId: 'temp_vector_id',
      });

      const removeSpy = vi.spyOn(vectorDbService, 'remove').mockResolvedValueOnce(true);

      const res = await request(app)
        .delete(`/api/library/${item._id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(removeSpy).toHaveBeenCalledWith('temp_vector_id');

      const check = await LibraryItem.findById(item._id);
      expect(check).toBeNull();
    });
  });

  describe('GET /api/library/search (Semantic Search)', () => {
    it('should return semantically matching items ranked by relevance', async () => {
      // 3 items with distinct vectors
      const item1 = await LibraryItem.create({
        userId: userA._id,
        type: 'note',
        title: 'Neural Networks and Deep Learning',
        summary: 'Backpropagation, gradient descent, and PyTorch tensors.',
        tags: ['ai', 'machine-learning'],
      });

      const item2 = await LibraryItem.create({
        userId: userA._id,
        type: 'note',
        title: 'Vegetable Gardening in Spring',
        summary: 'Planting tomatoes, soil pH, and watering schedules.',
        tags: ['gardening', 'nature'],
      });

      // Upsert vectors in vectorDbService
      // Vector A: [1, 0, 0] (AI)
      // Vector B: [0, 1, 0] (Gardening)
      await vectorDbService.upsert({
        id: item1._id.toString(),
        values: [0.99, 0.05, 0.0],
        metadata: { userId: userA._id.toString(), type: 'library', refId: item1._id.toString() },
      });
      await vectorDbService.upsert({
        id: item2._id.toString(),
        values: [0.05, 0.99, 0.0],
        metadata: { userId: userA._id.toString(), type: 'library', refId: item2._id.toString() },
      });

      // Query vector [1, 0, 0] (asking about artificial intelligence)
      vi.spyOn(geminiService, 'embedContent').mockResolvedValueOnce([1.0, 0.0, 0.0]);

      const res = await request(app)
        .get('/api/library/search?q=machine+learning+algorithms')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      // Item 1 (Neural Networks) should be first rank
      expect(res.body.data[0].title).toBe('Neural Networks and Deep Learning');
    });
  });
});
