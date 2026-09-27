import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Prompt, extractVariables } from '../src/models/Prompt.js';
import { generateAccessToken } from '../src/utils/token.js';

describe('Prompt API Integration Tests', () => {
  let userA = null;
  let userB = null;
  let tokenA = '';

  beforeAll(async () => {
    await connectDB();
  });

  const cleanupUserRecords = async (userIds) => {
    if (!userIds || userIds.length === 0) return;
    await Prompt.deleteMany({ userId: { $in: userIds } });
    await User.deleteMany({ _id: { $in: userIds } });
  };

  afterAll(async () => {
    const testUsers = await User.find({ email: /@prompttest\.nexai\.test$/ }).select('_id');
    await cleanupUserRecords(testUsers.map((u) => u._id));
    await disconnectDB();
  });

  beforeEach(async () => {
    if (userA || userB) {
      const ids = [userA?._id, userB?._id].filter(Boolean);
      await cleanupUserRecords(ids);
    }

    userA = await User.create({
      email: `user_a_${Date.now()}_${Math.random()}@prompttest.nexai.test`,
      wallet: { creditsRemaining: 100, tier: 'free', totalTokensConsumed: 0 },
    });

    userB = await User.create({
      email: `user_b_${Date.now()}_${Math.random()}@prompttest.nexai.test`,
      wallet: { creditsRemaining: 100, tier: 'free', totalTokensConsumed: 0 },
    });

    tokenA = generateAccessToken(userA);
  });


  describe('Variable Extraction Unit Function', () => {
    it('should correctly extract clean variable names including spaces inside brackets', () => {
      const template = 'Analyze {{code}} for {{ language }} and format with {{  style_guide  }}';
      const variables = extractVariables(template);
      expect(variables).toEqual(['code', 'language', 'style_guide']);
    });

    it('should deduplicate repeating variables', () => {
      const template = 'Check {{query}} then refine {{query}} into {{output}}';
      const variables = extractVariables(template);
      expect(variables).toEqual(['query', 'output']);
    });

    it('should return an empty array if template has no variables or is invalid', () => {
      expect(extractVariables('Plain text with no variables')).toEqual([]);
      expect(extractVariables('')).toEqual([]);
      expect(extractVariables(null)).toEqual([]);
    });
  });

  describe('Authentication & Security', () => {
    it('should return 401 UNAUTHORIZED when no token is provided', async () => {
      const res = await request(app).get('/api/prompts');
      expect(res.status).toBe(401);
    });

    it('should strictly isolate prompts by userId and prevent cross-user access', async () => {
      const promptB = await Prompt.create({
        userId: userB._id,
        title: 'User B Secret Prompt',
        template: 'Secret template for {{name}}',
      });

      // User A attempts to read User B's prompt
      const getRes = await request(app)
        .get(`/api/prompts/${promptB._id}`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect(getRes.status).toBe(404);

      // User A attempts to update User B's prompt
      const patchRes = await request(app)
        .patch(`/api/prompts/${promptB._id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ title: 'Hacked Title' });
      expect(patchRes.status).toBe(404);

      // User A attempts to delete User B's prompt
      const deleteRes = await request(app)
        .delete(`/api/prompts/${promptB._id}`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect(deleteRes.status).toBe(404);

      // Verify User B's prompt remains untouched
      const checkPrompt = await Prompt.findById(promptB._id);
      expect(checkPrompt.title).toBe('User B Secret Prompt');
    });
  });

  describe('Prompt CRUD & Variable Lifecycle', () => {
    it('POST /api/prompts should create a prompt and auto-extract variables', async () => {
      const res = await request(app)
        .post('/api/prompts')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          title: 'Code Reviewer',
          description: 'Reviews code according to given guidelines',
          template: 'Review the following {{language}} code:\n\n{{code}}\n\nFocus on: {{focus_areas}}',
          tags: ['engineering', 'review'],
          isFavorite: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.title).toBe('Code Reviewer');
      expect(res.body.data.variables).toEqual(['language', 'code', 'focus_areas']);
      expect(res.body.data.tags).toEqual(['engineering', 'review']);
      expect(res.body.data.isFavorite).toBe(true);
      expect(res.body.data.userId.toString()).toBe(userA._id.toString());
    });

    it('POST /api/prompts should reject invalid inputs with 400', async () => {
      const res = await request(app)
        .post('/api/prompts')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          title: '', // empty title
          template: '',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('GET /api/prompts should return only current user prompts', async () => {
      await Prompt.create({
        userId: userA._id,
        title: 'Prompt A1',
        template: 'Template A1',
        tags: ['react'],
      });
      await Prompt.create({
        userId: userA._id,
        title: 'Prompt A2',
        template: 'Template A2',
        tags: ['node'],
      });
      await Prompt.create({
        userId: userB._id,
        title: 'Prompt B1',
        template: 'Template B1',
        tags: ['python'],
      });

      const res = await request(app)
        .get('/api/prompts')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      const titles = res.body.data.map((p) => p.title);
      expect(titles).toContain('Prompt A1');
      expect(titles).toContain('Prompt A2');
      expect(titles).not.toContain('Prompt B1');
    });

    it('PATCH /api/prompts/:id should update prompt and re-extract variables when template changes', async () => {
      const prompt = await Prompt.create({
        userId: userA._id,
        title: 'Old Title',
        template: 'Hello {{name}}',
      });

      const res = await request(app)
        .patch(`/api/prompts/${prompt._id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          title: 'New Title',
          template: 'Write a {{tone}} email to {{recipient}} regarding {{subject}}',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('New Title');
      expect(res.body.data.variables).toEqual(['tone', 'recipient', 'subject']);
    });

    it('DELETE /api/prompts/:id should remove prompt from database', async () => {
      const prompt = await Prompt.create({
        userId: userA._id,
        title: 'To Delete',
        template: 'Delete me',
      });

      const res = await request(app)
        .delete(`/api/prompts/${prompt._id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(prompt._id.toString());

      const check = await Prompt.findById(prompt._id);
      expect(check).toBeNull();
    });
  });

  describe('Filtering & Searching', () => {
    beforeEach(async () => {
      await Prompt.create([
        {
          userId: userA._id,
          title: 'Docker Deployment Spec',
          template: 'Deploy container {{service}}',
          tags: ['devops', 'infra'],
          isFavorite: false,
        },
        {
          userId: userA._id,
          title: 'React Component Generator',
          description: 'Generates clean React component',
          template: 'Build component {{componentName}} with {{styling}}',
          tags: ['frontend', 'react'],
          isFavorite: true,
        },
        {
          userId: userA._id,
          title: 'Bug Report Formatter',
          template: 'Format bug {{issueId}}',
          tags: ['qa'],
          isFavorite: false,
        },
      ]);
    });

    it('should filter prompts by tag', async () => {
      const res = await request(app)
        .get('/api/prompts?tag=react')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].title).toBe('React Component Generator');
    });

    it('should filter prompts by search term', async () => {
      const res = await request(app)
        .get('/api/prompts?search=Docker')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].title).toBe('Docker Deployment Spec');
    });

    it('should filter prompts by isFavorite', async () => {
      const res = await request(app)
        .get('/api/prompts?isFavorite=true')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].isFavorite).toBe(true);
    });

    it('should sort favorites before non-favorites by default', async () => {
      const res = await request(app)
        .get('/api/prompts')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data[0].isFavorite).toBe(true);
      expect(res.body.data[0].title).toBe('React Component Generator');
    });
  });
});
