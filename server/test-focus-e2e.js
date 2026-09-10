import assert from 'node:assert';
import http from 'node:http';
import app from './src/app.js';
import { devLogin } from './src/services/auth.service.js';

async function runTests() {
  console.log('=== Feature 15 Developer Utilities (Productivity & Focus Reminders) E2E Tests ===');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  try {
    // 1. Unauthenticated request to /focus/reminders fails
    console.log('[Test 1] GET /focus/reminders without token returns 401...');
    const resUnauth = await fetch(`${baseUrl}/focus/reminders`);
    assert.strictEqual(resUnauth.status, 401, 'Expected 401 Unauthorized');
    console.log('✓ Test 1 Passed: Auth guard active on /focus/reminders');

    // 2. Authenticate
    console.log('[Test 2] Authenticating focus test user...');
    const { token } = await devLogin({
      email: 'focus-user@nexai.internal',
      name: 'NexAI Focus Tester',
    });
    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    // 3. Create a reminder
    console.log('[Test 3] POST /focus/reminders creates a scheduled reminder...');
    const targetTime = new Date(Date.now() + 3600 * 1000).toISOString();
    const createRes = await fetch(`${baseUrl}/focus/reminders`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        title: 'Review System Design Capstone Diagram',
        remindAt: targetTime,
        itemType: 'document',
      }),
    });

    assert.strictEqual(createRes.status, 201, 'Expected 201 Created');
    const createdData = await createRes.json();
    assert(createdData.reminder, 'Expected reminder in response body');
    const reminderId = createdData.reminder._id || createdData.reminder.id;
    assert.strictEqual(createdData.reminder.title, 'Review System Design Capstone Diagram');
    assert.strictEqual(createdData.reminder.isCompleted, false);
    console.log('✓ Test 3 Passed: Reminder created with ID:', reminderId);

    // 4. Update reminder status (complete)
    console.log('[Test 4] PATCH /focus/reminders/:id marks reminder as completed...');
    const updateRes = await fetch(`${baseUrl}/focus/reminders/${reminderId}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ isCompleted: true }),
    });

    assert.strictEqual(updateRes.status, 200, 'Expected 200 OK');
    const updateData = await updateRes.json();
    assert.strictEqual(updateData.reminder.isCompleted, true);
    console.log('✓ Test 4 Passed: Reminder completion updated');

    // 5. Update Quiet Hours configuration
    console.log('[Test 5] PATCH /focus/quiet-hours configures notification quiet hours...');
    const qhRes = await fetch(`${baseUrl}/focus/quiet-hours`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        enabled: true,
        start: '22:00',
        end: '08:00',
      }),
    });

    assert.strictEqual(qhRes.status, 200, 'Expected 200 OK');
    const qhData = await qhRes.json();
    assert.strictEqual(qhData.success, true);
    assert.strictEqual(qhData.quietHours.enabled, true);
    console.log('✓ Test 5 Passed: Quiet hours configured successfully');

    // 6. Create Workspace Session (manual link bundle)
    console.log('[Test 6] POST /focus/sessions creates a workspace link bundle...');
    const sessionRes = await fetch(`${baseUrl}/focus/sessions`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: 'Backend Dev Suite',
        description: 'Mongo Atlas, Pinecone console, and Render dashboard',
        links: [
          { title: 'MongoDB Atlas', url: 'https://cloud.mongodb.com' },
          { title: 'Pinecone Console', url: 'https://app.pinecone.io' },
        ],
      }),
    });

    assert.strictEqual(sessionRes.status, 201, 'Expected 201 Created');
    const sessionData = await sessionRes.json();
    assert(sessionData.session, 'Expected session in response body');
    const sessionId = sessionData.session._id || sessionData.session.id;
    assert.strictEqual(sessionData.session.name, 'Backend Dev Suite');
    assert.strictEqual(sessionData.session.links.length, 2);
    console.log('✓ Test 6 Passed: Workspace session created with ID:', sessionId);

    // 7. Cleanup reminder & session
    console.log('[Test 7] DELETE endpoints clean up reminder and session...');
    const delRemRes = await fetch(`${baseUrl}/focus/reminders/${reminderId}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    assert.strictEqual(delRemRes.status, 200, 'Expected 200 OK');

    const delSessRes = await fetch(`${baseUrl}/focus/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    assert.strictEqual(delSessRes.status, 200, 'Expected 200 OK');
    console.log('✓ Test 7 Passed: Resources cleaned up successfully');

    console.log('\n==========================================');
    console.log('🎉 ALL 7 FOCUS & REMINDER E2E TESTS PASSED!');
    console.log('==========================================\n');
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
