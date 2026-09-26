import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Project } from '../src/models/Project.js';
import { Chat } from '../src/models/Chat.js';
import { Message } from '../src/models/Message.js';
import { generateAccessToken } from '../src/utils/token.js';

describe('Project API Integration Tests', () => {
  let userA = null;
  let userB = null;
  let tokenA = '';
  let tokenB = '';

  beforeAll(async () => {
    await connectDB();
  });

  const cleanupUserRecords = async (userIds) => {
    if (!userIds || userIds.length === 0) return;
    const chats = await Chat.find({ userId: { $in: userIds } }).select('_id');
    const chatIds = chats.map((c) => c._id);
    await Message.deleteMany({ chatId: { $in: chatIds } });
    await Chat.deleteMany({ _id: { $in: chatIds } });
    await Project.deleteMany({ userId: { $in: userIds } });
    await User.deleteMany({ _id: { $in: userIds } });
  };

  afterAll(async () => {
    const testUsers = await User.find({ email: /@projecttest\.nexai\.test$/ }).select('_id');
    await cleanupUserRecords(testUsers.map((u) => u._id));
    await disconnectDB();
  });

  beforeEach(async () => {
    if (userA || userB) {
      const ids = [userA?._id, userB?._id].filter(Boolean);
      await cleanupUserRecords(ids);
    }

    userA = await User.create({
      email: `user_a_${Date.now()}_${Math.random()}@projecttest.nexai.test`,
      wallet: { creditsRemaining: 100, tier: 'free', totalTokensConsumed: 0 },
    });

    userB = await User.create({
      email: `user_b_${Date.now()}_${Math.random()}@projecttest.nexai.test`,
      wallet: { creditsRemaining: 100, tier: 'free', totalTokensConsumed: 0 },
    });

    tokenA = generateAccessToken(userA);
    tokenB = generateAccessToken(userB);
  });

  describe('Authentication & Authorization', () => {
    it('should return 401 UNAUTHORIZED when no token is provided', async () => {
      const res = await request(app).get('/api/projects');
      expect(res.status).toBe(401);
    });

    it('should isolate projects strictly by userId', async () => {
      const projA = await Project.create({
        userId: userA._id,
        name: 'Project User A',
        customInstructions: 'Instructions for A',
      });

      const res = await request(app)
        .get(`/api/projects/${projA._id}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(404);
    });
  });

  describe('Project CRUD & Chat Association', () => {
    it('POST /api/projects should create a project with custom instructions and color', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          name: 'Web Architecture',
          description: 'Frontend and backend designs',
          customInstructions: 'Always answer in bullet points and provide code blocks.',
          color: '#10b981',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Web Architecture');
      expect(res.body.data.customInstructions).toContain('bullet points');
      expect(res.body.data.color).toBe('#10b981');
      expect(res.body.data.chatCount).toBe(0);
    });

    it('GET /api/projects should return user projects with accurate chat count', async () => {
      const project = await Project.create({
        userId: userA._id,
        name: 'AI Viva Prep',
      });

      // Create two chats belonging to this project
      await Chat.create({
        userId: userA._id,
        projectId: project._id,
        title: 'Chat 1',
      });
      await Chat.create({
        userId: userA._id,
        projectId: project._id,
        title: 'Chat 2',
      });
      // Standalone chat (no project)
      await Chat.create({
        userId: userA._id,
        title: 'Standalone Chat',
      });

      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe('AI Viva Prep');
      expect(res.body.data[0].chatCount).toBe(2);
    });

    it('GET /api/projects/:id should return project details along with its chats', async () => {
      const project = await Project.create({
        userId: userA._id,
        name: 'Project Details Test',
      });

      await Chat.create({
        userId: userA._id,
        projectId: project._id,
        title: 'Project Chat Alpha',
      });

      const res = await request(app)
        .get(`/api/projects/${project._id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Project Details Test');
      expect(res.body.data.chats).toHaveLength(1);
      expect(res.body.data.chats[0].title).toBe('Project Chat Alpha');
    });

    it('PATCH /api/projects/:id should update name and custom instructions', async () => {
      const project = await Project.create({
        userId: userA._id,
        name: 'Old Name',
        customInstructions: 'Old Instructions',
      });

      const res = await request(app)
        .patch(`/api/projects/${project._id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          name: 'New Name',
          customInstructions: 'Updated Instructions',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('New Name');
      expect(res.body.data.customInstructions).toBe('Updated Instructions');
    });

    it('DELETE /api/projects/:id should delete project and safely unlink chats', async () => {
      const project = await Project.create({
        userId: userA._id,
        name: 'To Delete',
      });

      const chat = await Chat.create({
        userId: userA._id,
        projectId: project._id,
        title: 'Linked Chat',
      });

      const res = await request(app)
        .delete(`/api/projects/${project._id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);

      // Verify project is removed
      const checkProject = await Project.findById(project._id);
      expect(checkProject).toBeNull();

      // Verify chat is preserved with projectId set to null
      const checkChat = await Chat.findById(chat._id);
      expect(checkChat).not.toBeNull();
      expect(checkChat.projectId).toBeNull();
    });

    it('PATCH /api/chats/:id should move chat into a project or remove from project', async () => {
      const project = await Project.create({
        userId: userA._id,
        name: 'Target Project',
      });

      const chat = await Chat.create({
        userId: userA._id,
        title: 'Floating Chat',
      });

      // Move into project
      const moveRes = await request(app)
        .patch(`/api/chats/${chat._id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ projectId: project._id.toString() });

      expect(moveRes.status).toBe(200);
      expect(moveRes.body.data.projectId).toBe(project._id.toString());

      // Remove from project (set to null)
      const unmoveRes = await request(app)
        .patch(`/api/chats/${chat._id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ projectId: null });

      expect(unmoveRes.status).toBe(200);
      expect(unmoveRes.body.data.projectId).toBeNull();
    });
  });

  describe('Project Knowledge Sources (Local Files)', () => {
    it('POST /api/projects/:id/sources should add a local file source with content', async () => {
      const project = await Project.create({
        userId: userA._id,
        name: 'Unit 1 Java Study',
      });

      const res = await request(app)
        .post(`/api/projects/${project._id}/sources`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          name: 'java_unit1_notes.md',
          mimeType: 'text/markdown',
          size: 1024,
          content: '# Java Unit 1: OOP Principles and Class Diagrams',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('java_unit1_notes.md');
      expect(res.body.data.content).toContain('OOP Principles');

      const updated = await Project.findById(project._id);
      expect(updated.sources).toHaveLength(1);
      expect(updated.sources[0].name).toBe('java_unit1_notes.md');
    });

    it('DELETE /api/projects/:id/sources/:sourceId should delete a source from project', async () => {
      const project = await Project.create({
        userId: userA._id,
        name: 'Unit 1 Java Study',
        sources: [
          {
            name: 'temp_notes.txt',
            mimeType: 'text/plain',
            size: 512,
            content: 'Temporary notes to delete',
          },
        ],
      });

      const sourceId = project.sources[0]._id.toString();

      const res = await request(app)
        .delete(`/api/projects/${project._id}/sources/${sourceId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.sourceId).toBe(sourceId);

      const updated = await Project.findById(project._id);
      expect(updated.sources).toHaveLength(0);
    });
  });
});

