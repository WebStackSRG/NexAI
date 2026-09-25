import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import * as db from '../src/config/db.js';

describe('Health API', () => {
  it('GET /api/health should return 503 with status degraded when DB is disconnected', async () => {
    vi.spyOn(db, 'isDbConnected').mockReturnValue(false);
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(503);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data.status).toBe('degraded');
    expect(res.body.data.db).toBe('disconnected');
    expect(res.body.data).toHaveProperty('uptime');
    expect(typeof res.body.data.uptime).toBe('number');
  });

  it('GET /api/health should return 200 with status ok when DB is connected', async () => {
    vi.spyOn(db, 'isDbConnected').mockReturnValue(true);
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data.status).toBe('ok');
    expect(res.body.data.db).toBe('connected');
    expect(res.body.data).toHaveProperty('uptime');
  });

  it('GET /api/non-existent-route should return 404 with normalized error format', async () => {
    const res = await request(app).get('/api/non-existent-route');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(res.body.error).toHaveProperty('message');
  });
});
