import assert from 'node:assert';
import http from 'node:http';
import app from './src/app.js';
import { devLogin } from './src/services/auth.service.js';

async function runTests() {
  console.log('=== Feature 13 Developer Utilities (Snippets Vault) E2E Tests ===');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  try {
    // 1. Unauthenticated request to /snippets fails
    console.log('[Test 1] GET /snippets without token returns 401...');
    const resUnauth = await fetch(`${baseUrl}/snippets`);
    assert.strictEqual(resUnauth.status, 401, 'Expected 401 Unauthorized');
    console.log('✓ Test 1 Passed: Auth guard active on /snippets');

    // 2. Authenticate
    console.log('[Test 2] Authenticating developer test user...');
    const { token, user } = await devLogin({
      email: 'dev-user@nexai.internal',
      name: 'NexAI Developer',
    });
    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    // 3. Create a code snippet
    console.log('[Test 3] POST /snippets to store a code snippet...');
    const createRes = await fetch(`${baseUrl}/snippets`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        title: 'AES-256-GCM Encryption Helper',
        language: 'javascript',
        code: 'const crypto = require("crypto");\nfunction encrypt(text, key) { ... }',
        tags: ['crypto', 'security', 'node'],
        description: 'Zero-knowledge client-side encryption utility',
      }),
    });

    assert.strictEqual(createRes.status, 201, 'Expected 201 Created');
    const createdData = await createRes.json();
    assert(createdData.snippet, 'Expected snippet in response body');
    const snippetId = createdData.snippet._id || createdData.snippet.id;
    assert.strictEqual(createdData.snippet.title, 'AES-256-GCM Encryption Helper');
    assert.strictEqual(createdData.snippet.language, 'javascript');
    console.log('✓ Test 3 Passed: Snippet created successfully with ID:', snippetId);

    // 4. List snippets with filter
    console.log('[Test 4] GET /snippets with language filter...');
    const listRes = await fetch(`${baseUrl}/snippets?language=javascript`, {
      headers: authHeaders,
    });

    assert.strictEqual(listRes.status, 200, 'Expected 200 OK');
    const listData = await listRes.json();
    assert(Array.isArray(listData.snippets), 'Expected array of snippets');
    assert(listData.snippets.length >= 1, 'Expected at least 1 snippet');
    console.log('✓ Test 4 Passed: Snippets queried and filtered by language');

    // 5. Update snippet
    console.log('[Test 5] PATCH /snippets/:id to update code snippet...');
    const updateRes = await fetch(`${baseUrl}/snippets/${snippetId}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        title: 'AES-256-GCM Encryption Helper (v2)',
        description: 'Updated with PBKDF2 salt derivation',
      }),
    });

    assert.strictEqual(updateRes.status, 200, 'Expected 200 OK');
    const updateData = await updateRes.json();
    assert.strictEqual(updateData.snippet.title, 'AES-256-GCM Encryption Helper (v2)');
    console.log('✓ Test 5 Passed: Snippet updated successfully');

    // 6. Delete snippet
    console.log('[Test 6] DELETE /snippets/:id to delete snippet...');
    const deleteRes = await fetch(`${baseUrl}/snippets/${snippetId}`, {
      method: 'DELETE',
      headers: authHeaders,
    });

    assert.strictEqual(deleteRes.status, 200, 'Expected 200 OK');
    const deleteData = await deleteRes.json();
    assert.strictEqual(deleteData.success, true);
    console.log('✓ Test 6 Passed: Snippet deleted successfully');

    console.log('\n==========================================');
    console.log('🎉 ALL 6 SNIPPET E2E TESTS PASSED!');
    console.log('==========================================\n');
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
