import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Chat } from '../models/Chat.js';
import { Message } from '../models/Message.js';
import { UsageLog } from '../models/UsageLog.js';

async function runE2E() {
  const timestamp = Date.now();
  const testEmail = `e2e_test_${timestamp}@nexai.local`;
  const password = 'StrongPassword123!';
  const baseUrl = 'http://localhost:5000/api';

  console.log(`\n======================================================`);
  console.log(`🚀 Starting REAL End-to-End Gemini Streaming Chat Test`);
  console.log(`======================================================\n`);

  // Step 1: Register user
  console.log(`1️⃣ Registering test user: ${testEmail}...`);
  const regRes = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password }),
  });

  if (!regRes.ok) {
    const err = await regRes.text();
    throw new Error(`Registration failed: ${regRes.status} ${err}`);
  }

  const regData = await regRes.json();
  const token = regData.data.accessToken;
  const userId = regData.data.user._id;
  console.log(`   User registered successfully! ID: ${userId}`);
  console.log(`   Starter Credits: ${regData.data.user.wallet.creditsRemaining}`);

  // Step 2: Create chat
  console.log(`\n2️⃣ Creating new chat session...`);
  const chatRes = await fetch(`${baseUrl}/chats`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ title: 'New Chat' }),
  });

  if (!chatRes.ok) {
    throw new Error(`Chat creation failed: ${chatRes.status}`);
  }

  const chatData = await chatRes.json();
  const chatId = chatData.data._id;
  console.log(`   Chat created! ID: ${chatId}`);

  // Step 3: Send message and capture raw SSE stream
  console.log(`\n3️⃣ Sending message to Gemini API and streaming response...`);
  console.log(`   Prompt: "What is 2+2? Answer in one word."`);
  console.log(`--------------------- RAW SSE STREAM ---------------------`);

  const sseRes = await fetch(`${baseUrl}/chats/${chatId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      content: 'What is 2+2? Answer in one word.',
      model: 'flash',
    }),
  });

  if (!sseRes.ok) {
    const errText = await sseRes.text();
    throw new Error(`Message request failed (${sseRes.status}): ${errText}`);
  }

  const reader = sseRes.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    process.stdout.write(chunk);
  }

  console.log(`\n------------------- END OF SSE STREAM --------------------\n`);

  // Step 4: Verify Database State
  console.log(`4️⃣ Verifying Database state directly...`);
  await connectDB();

  try {
    const userInDb = await User.findById(userId);
    console.log(
      `   Database Credits Remaining: ${userInDb.wallet.creditsRemaining} (Started: 100)`,
    );
    console.log(`   Total Tokens Consumed: ${userInDb.wallet.totalTokensConsumed}`);

    const chatInDb = await Chat.findById(chatId);
    console.log(`   Chat Auto-Generated Title: "${chatInDb.title}"`);

    const messages = await Message.find({ chatId }).sort({ createdAt: 1 });
    console.log(`   Persisted Messages in DB: ${messages.length}`);
    messages.forEach((m) => {
      console.log(`     - [${m.role}] "${m.content.trim()}" (tokensUsed: ${m.tokensUsed})`);
    });

    const usageLogs = await UsageLog.find({ userId });
    console.log(`   UsageLog Entries in DB: ${usageLogs.length}`);
    usageLogs.forEach((l) => {
      console.log(
        `     - Feature: ${l.feature}, Model: ${l.model}, Tokens: ${l.tokensUsed}, Deducted: ${l.creditsDeducted} credits`,
      );
    });

    // Cleanup specific test records only
    console.log(`\n5️⃣ Cleaning up test records created for this run...`);
    await Message.deleteMany({ chatId });
    await Chat.deleteOne({ _id: chatId });
    await UsageLog.deleteMany({ userId });
    await User.deleteOne({ _id: userId });
    console.log(`   Cleanup complete! Test records removed safely.`);
  } finally {
    await disconnectDB();
  }

  console.log(`\n✅ End-to-End Gemini Streaming Test PASSED!\n`);
}

runE2E().catch((err) => {
  console.error(`\n❌ End-to-End Test Failed:`, err);
  process.exit(1);
});
