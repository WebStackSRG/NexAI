import assert from 'node:assert';
import http from 'node:http';
import app from './src/app.js';
import { devLogin } from './src/services/auth.service.js';

async function runTests() {
  console.log('=== Feature 16 Developer Utilities (Onboarding Flow Settings) E2E Tests ===');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  try {
    // 1. Authenticate new user
    console.log('[Test 1] Authenticating new user for onboarding test...');
    const { token } = await devLogin({
      email: 'newbie@nexai.internal',
      name: 'Newbie User',
    });
    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    // 2. Initial user settings check
    console.log('[Test 2] GET /users/settings inspects initial onboardingComplete status...');
    const initRes = await fetch(`${baseUrl}/users/settings`, { headers: authHeaders });
    assert.strictEqual(initRes.status, 200, 'Expected 200 OK');
    const initData = await initRes.json();
    assert(initData.settings, 'Expected settings object');
    assert.strictEqual(initData.settings.onboardingComplete, false, 'Expected onboardingComplete to default to false');
    console.log('✓ Test 2 Passed: New user has onboardingComplete: false');

    // 3. Complete onboarding wizard with mode and instructions
    console.log('[Test 3] PATCH /users/settings completes onboarding wizard...');
    const patchRes = await fetch(`${baseUrl}/users/settings`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        onboardingComplete: true,
        preferences: {
          sidebarMode: 'developer',
        },
        globalInstructions: 'Always provide TypeScript definitions and production grade error handling.',
      }),
    });

    assert.strictEqual(patchRes.status, 200, 'Expected 200 OK');
    const patchData = await patchRes.json();
    assert.strictEqual(patchData.settings.onboardingComplete, true);
    assert.strictEqual(patchData.settings.preferences.sidebarMode, 'developer');
    assert.strictEqual(
      patchData.settings.globalInstructions,
      'Always provide TypeScript definitions and production grade error handling.'
    );
    console.log('✓ Test 3 Passed: Onboarding marked complete and preferences persisted');

    // 4. Verify updated settings persist
    console.log('[Test 4] GET /users/settings confirms persisted completed state...');
    const verifyRes = await fetch(`${baseUrl}/users/settings`, { headers: authHeaders });
    assert.strictEqual(verifyRes.status, 200, 'Expected 200 OK');
    const verifyData = await verifyRes.json();
    assert.strictEqual(verifyData.settings.onboardingComplete, true);
    console.log('✓ Test 4 Passed: Onboarding completion verified on subsequent fetch');

    console.log('\n==========================================');
    console.log('🎉 ALL 4 ONBOARDING E2E TESTS PASSED!');
    console.log('==========================================\n');
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
