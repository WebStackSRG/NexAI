import assert from 'node:assert';
import http from 'node:http';
import app from './src/app.js';
import { devLogin } from './src/services/auth.service.js';

async function runTests() {
  console.log('=== Feature 14 Developer Utilities (Learning & Study Suite) E2E Tests ===');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  try {
    // 1. Unauthenticated request to /flashcards fails
    console.log('[Test 1] GET /flashcards without token returns 401...');
    const resUnauth = await fetch(`${baseUrl}/flashcards`);
    assert.strictEqual(resUnauth.status, 401, 'Expected 401 Unauthorized');
    console.log('✓ Test 1 Passed: Auth guard active on /flashcards');

    // 2. Authenticate
    console.log('[Test 2] Authenticating student test user...');
    const { token } = await devLogin({
      email: 'student-user@nexai.internal',
      name: 'NexAI Student',
    });
    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    // 3. Create a flashcard manually
    console.log('[Test 3] POST /flashcards to create a flashcard...');
    const createRes = await fetch(`${baseUrl}/flashcards`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        deckName: 'System Architecture',
        question: 'What is the SuperMemo-2 (SM-2) algorithm?',
        answer: 'An interval-spaced repetition algorithm calculating review intervals based on difficulty grades 0-5 and ease factor.',
        tags: ['algorithms', 'learning'],
      }),
    });

    assert.strictEqual(createRes.status, 201, 'Expected 201 Created');
    const createdData = await createRes.json();
    assert(createdData.flashcard, 'Expected flashcard in response body');
    const cardId = createdData.flashcard._id || createdData.flashcard.id;
    assert.strictEqual(createdData.flashcard.repetitions, 0);
    assert.strictEqual(createdData.flashcard.interval, 1);
    console.log('✓ Test 3 Passed: Flashcard created successfully with ID:', cardId);

    // 4. Review flashcard with SM-2 grade 4
    console.log('[Test 4] PATCH /flashcards/:id/review with grade 4...');
    const reviewRes = await fetch(`${baseUrl}/flashcards/${cardId}/review`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ grade: 4 }),
    });

    assert.strictEqual(reviewRes.status, 200, 'Expected 200 OK');
    const reviewData = await reviewRes.json();
    assert.strictEqual(reviewData.flashcard.repetitions, 1);
    assert.strictEqual(reviewData.flashcard.interval, 1);
    assert(reviewData.flashcard.nextReviewAt, 'Expected nextReviewAt');
    console.log('✓ Test 4 Passed: SM-2 review calculation verified');

    // 5. Generate AI flashcard deck
    console.log('[Test 5] POST /flashcards/generate creates AI deck...');
    const genRes = await fetch(`${baseUrl}/flashcards/generate`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        topic: 'Distributed Caching',
        deckName: 'System Design',
        count: 3,
      }),
    });

    assert.strictEqual(genRes.status, 201, 'Expected 201 Created');
    const genData = await genRes.json();
    assert(Array.isArray(genData.flashcards), 'Expected array of generated cards');
    assert(genData.flashcards.length >= 1, 'Expected at least 1 generated card');
    console.log(`✓ Test 5 Passed: AI Deck generated with ${genData.flashcards.length} cards`);

    // 6. YouTube Lecture Summarizer
    console.log('[Test 6] POST /learning/youtube-summary extracts lecture takeaways...');
    const ytRes = await fetch(`${baseUrl}/learning/youtube-summary`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      }),
    });

    assert.strictEqual(ytRes.status, 200, 'Expected 200 OK');
    const ytData = await ytRes.json();
    assert(ytData.summary, 'Expected summary object');
    assert.strictEqual(ytData.summary.videoId, 'dQw4w9WgXcQ');
    assert(Array.isArray(ytData.summary.keyTakeaways), 'Expected keyTakeaways array');
    console.log('✓ Test 6 Passed: YouTube summary generated successfully');

    // 7. Delete flashcard
    console.log('[Test 7] DELETE /flashcards/:id to delete card...');
    const deleteRes = await fetch(`${baseUrl}/flashcards/${cardId}`, {
      method: 'DELETE',
      headers: authHeaders,
    });

    assert.strictEqual(deleteRes.status, 200, 'Expected 200 OK');
    const deleteData = await deleteRes.json();
    assert.strictEqual(deleteData.success, true);
    console.log('✓ Test 7 Passed: Flashcard deleted successfully');

    console.log('\n==========================================');
    console.log('🎉 ALL 7 LEARNING & SM-2 E2E TESTS PASSED!');
    console.log('==========================================\n');
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
