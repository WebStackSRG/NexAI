import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';

describe('Health API', () => {
  it('GET /api/health should return 200 with status ok and uptime', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data.status).toBe('ok');
    expect(res.body.data).toHaveProperty('db');
    expect(res.body.data).toHaveProperty('uptime');
    expect(typeof res.body.data.uptime).toBe('number');
  });

  it('GET /api/non-existent-route should return 404 with normalized error format', async () => {
    const res = await request(app).get('/api/non-existent-route');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(res.body.error).toHaveProperty('message');
  });
});
