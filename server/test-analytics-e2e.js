import assert from 'node:assert';
import http from 'node:http';
import app from './src/app.js';
import { devLogin } from './src/services/auth.service.js';

async function runTests() {
  console.log('=== Feature 17 Developer Utilities (Usage Analytics Dashboard) E2E Tests ===');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  try {
    // 1. Unauthenticated request to /analytics/stats fails
    console.log('[Test 1] GET /analytics/stats without token returns 401...');
    const resUnauth = await fetch(`${baseUrl}/analytics/stats`);
    assert.strictEqual(resUnauth.status, 401, 'Expected 401 Unauthorized');
    console.log('✓ Test 1 Passed: Auth guard active on /analytics/stats');

    // 2. Authenticate
    console.log('[Test 2] Authenticating analytics test user...');
    const { token } = await devLogin({
      email: 'analytics-user@nexai.internal',
      name: 'NexAI Analytics Tester',
    });
    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    // 3. Fetch Analytics Stats
    console.log('[Test 3] GET /analytics/stats retrieves usage aggregates...');
    const statsRes = await fetch(`${baseUrl}/analytics/stats`, { headers: authHeaders });
    assert.strictEqual(statsRes.status, 200, 'Expected 200 OK');
    const data = await statsRes.json();
    assert(data.stats, 'Expected stats object in response body');
    assert(typeof data.stats.chatCount === 'number', 'Expected chatCount number');
    assert(typeof data.stats.messageCount === 'number', 'Expected messageCount number');
    assert(typeof data.stats.libraryCount === 'number', 'Expected libraryCount number');
    assert(typeof data.stats.focusScore === 'number', 'Expected focusScore number');
    assert(data.stats.focusScore >= 0 && data.stats.focusScore <= 100, 'Focus score should be 0-100');
    assert(Array.isArray(data.stats.activityTrend), 'Expected activityTrend array');
    assert.strictEqual(data.stats.activityTrend.length, 14, 'Expected 14-day activity trend series');
    console.log('✓ Test 3 Passed: Analytics aggregates and activity trend verified');

    console.log('\n==========================================');
    console.log('🎉 ALL 3 ANALYTICS E2E TESTS PASSED!');
    console.log('==========================================\n');
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
