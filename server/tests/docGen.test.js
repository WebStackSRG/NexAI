import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { LibraryItem } from '../src/models/LibraryItem.js';
import { UsageLog } from '../src/models/UsageLog.js';
import { generateAccessToken } from '../src/utils/token.js';
import * as docGenAgent from '../src/agents/docGen.agent.js';
import { vectorDbService } from '../src/services/vectorDb.service.js';

describe('Document Generation & Polymorphic Library Tests (Step 8)', () => {
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
    const testUsers = await User.find({ email: /@docgentest\.nexai\.test$/ }).select('_id');
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
      email: `user_a_${Date.now()}_${Math.random()}@docgentest.nexai.test`,
      wallet: { creditsRemaining: 100, tier: 'free', totalTokensConsumed: 0 },
    });

    userB = await User.create({
      email: `user_b_${Date.now()}_${Math.random()}@docgentest.nexai.test`,
      wallet: { creditsRemaining: 100, tier: 'free', totalTokensConsumed: 0 },
    });

    tokenA = generateAccessToken(userA);
    tokenB = generateAccessToken(userB);

    vi.restoreAllMocks();
  });

  describe('POST /api/library/documents/generate', () => {
    it('should reject requests with missing prompt or invalid category', async () => {
      const res = await request(app)
        .post('/api/library/documents/generate')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ prompt: 'ab', category: 'invalid-cat' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 402 INSUFFICIENT_CREDITS when user has 0 credits', async () => {
      await User.findByIdAndUpdate(userA._id, { $set: { 'wallet.creditsRemaining': 0 } });

      const res = await request(app)
        .post('/api/library/documents/generate')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          prompt: 'Create a full-stack engineer resume for React and Node.js',
          category: 'resume',
        });

      expect(res.status).toBe(402);
      expect(res.body.error.code).toBe('INSUFFICIENT_CREDITS');
    });

    it('should call docGen agent, meter token usage, and return draft without auto-saving to DB', async () => {
      vi.spyOn(docGenAgent, 'generateDocumentDraft').mockResolvedValueOnce({
        title: 'Full-Stack Developer Resume',
        category: 'resume',
        summary: 'Experienced software engineer specializing in React, Node.js, and cloud systems.',
        sections: [
          { heading: 'Summary', body: '5+ years building scalable distributed web apps.' },
          { heading: 'Experience', body: 'Senior Full Stack Engineer at Acme Corp (2022-Present).' },
          { heading: 'Technical Skills', body: '- React, Node.js, TypeScript\n- MongoDB, PostgreSQL' },
        ],
        tokensUsed: 350,
      });

      const res = await request(app)
        .post('/api/library/documents/generate')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          prompt: 'Write a comprehensive resume for a senior full stack developer',
          category: 'resume',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Full-Stack Developer Resume');
      expect(res.body.data.category).toBe('resume');
      expect(res.body.data.sections).toHaveLength(3);
      expect(res.body.data.tokensUsed).toBe(350);
      expect(res.body.data.creditsDeducted).toBe(4); // ceil(350 / 100) = 4
      expect(res.body.data.creditsRemaining).toBe(96);

      // Verify draft was NOT saved to MongoDB
      const count = await LibraryItem.countDocuments({ userId: userA._id });
      expect(count).toBe(0);

      // Verify UsageLog entry
      const log = await UsageLog.findOne({ userId: userA._id, feature: 'document' });
      expect(log).not.toBeNull();
      expect(log.tokensUsed).toBe(350);
      expect(log.creditsDeducted).toBe(4);
    });
  });

  describe('GET /api/library/documents/:id/export.pdf', () => {
    it('should return 404 when document does not exist or belongs to another user', async () => {
      const doc = await LibraryItem.create({
        userId: userA._id,
        type: 'document',
        title: 'Secret Spec Document',
        category: 'spec',
        sections: [{ heading: 'System Architecture', body: 'Top secret architecture design' }],
      });

      // User B tries to export User A's document
      const res = await request(app)
        .get(`/api/library/documents/${doc._id}/export.pdf`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('DOCUMENT_NOT_FOUND');
    });

    it('should generate and stream a valid PDF file with proper headers', async () => {
      const doc = await LibraryItem.create({
        userId: userA._id,
        type: 'document',
        title: 'NexAI Architecture Specification',
        category: 'spec',
        summary: 'Complete system architecture and component specifications for NexAI platform.',
        sections: [
          { heading: '1. Executive Summary', body: 'NexAI is an intelligent productivity workspace.' },
          { heading: '2. Backend API Architecture', body: 'Node.js Express backend with SSE streaming and atomic credit deduction.' },
          { heading: '3. Data Persistence & RAG', body: '- MongoDB Atlas for metadata\n- Pinecone for vector embeddings' },
        ],
      });

      const res = await request(app)
        .get(`/api/library/documents/${doc._id}/export.pdf`)
        .set('Authorization', `Bearer ${tokenA}`)
        .responseType('blob');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/pdf');
      expect(res.headers['content-disposition']).toContain('attachment');
      expect(res.headers['content-disposition']).toContain('.pdf');

      // Check PDF header signature '%PDF-'
      const buffer = Buffer.from(res.body);
      expect(buffer.length).toBeGreaterThan(100);
      const pdfHeader = buffer.subarray(0, 5).toString('ascii');
      expect(pdfHeader).toBe('%PDF-');
    });
  });

  describe('Polymorphic Items & Tabbed Filtering', () => {
    it('should create and retrieve polymorphic items (documents, files, notes, links)', async () => {
      // Create a document
      const docRes = await request(app)
        .post('/api/library')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          type: 'document',
          title: 'Project Roadmap 2026',
          category: 'spec',
          summary: 'Milestones and technical deliverables',
          sections: [{ heading: 'Phase 1', body: 'Core platform MVP' }],
          tags: ['spec', 'roadmap'],
        });
      expect(docRes.status).toBe(201);
      expect(docRes.body.data.type).toBe('document');
      expect(docRes.body.data.category).toBe('spec');

      // Create a file upload item
      const fileRes = await request(app)
        .post('/api/library')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          type: 'file',
          title: 'Dataset README',
          fileName: 'README.md',
          mimeType: 'text/markdown',
          size: 1420,
          content: '# Dataset Documentation\n\nInstructions on data processing pipeline.',
          tags: ['dataset', 'docs'],
        });
      expect(fileRes.status).toBe(201);
      expect(fileRes.body.data.type).toBe('file');
      expect(fileRes.body.data.fileName).toBe('README.md');

      // Create a note
      const noteRes = await request(app)
        .post('/api/library')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          type: 'note',
          title: 'Quick Dev Note',
          content: 'Remember to verify edge cases in line wrapping.',
          tags: ['notes'],
        });
      expect(noteRes.status).toBe(201);

      // Verify tabbed filtering: Documents
      const docsTabRes = await request(app)
        .get('/api/library?tab=documents')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(docsTabRes.status).toBe(200);
      expect(docsTabRes.body.data).toHaveLength(1);
      expect(docsTabRes.body.data[0].type).toBe('document');
      expect(docsTabRes.body.meta.counts.documents).toBe(1);
      expect(docsTabRes.body.meta.counts.files).toBe(1);
      expect(docsTabRes.body.meta.counts.notes_links).toBe(1);
      expect(docsTabRes.body.meta.counts.all).toBe(3);

      // Verify tabbed filtering: Files
      const filesTabRes = await request(app)
        .get('/api/library?tab=files')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(filesTabRes.status).toBe(200);
      expect(filesTabRes.body.data).toHaveLength(1);
      expect(filesTabRes.body.data[0].type).toBe('file');

      // Verify tabbed filtering: Notes & Links
      const notesTabRes = await request(app)
        .get('/api/library?tab=notes_links')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(notesTabRes.status).toBe(200);
      expect(notesTabRes.body.data).toHaveLength(1);
      expect(notesTabRes.body.data[0].type).toBe('note');
    });
  });
});
