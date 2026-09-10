/**
 * End-to-End Chat & Streaming Integration Test
 * Verifies authentication, CRUD, and Server-Sent Events (SSE) streaming
 */
import http from "http";
import app from "./src/app.js";

const PORT = 5055;
let server;

const request = ({
  method = "GET",
  path = "/",
  headers = {},
  body = null,
} = {}) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "127.0.0.1",
      port: PORT,
      path,
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data ? JSON.parse(data) : null,
            rawText: data,
          });
        } catch {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data,
            rawText: data,
          });
        }
      });
    });

    req.on("error", reject);

    if (body) {
      req.write(typeof body === "string" ? body : JSON.stringify(body));
    }
    req.end();
  });
};

/**
 * Helper to test SSE streaming response
 */
const requestSSE = ({ path = "/chat/message", headers = {}, body = null }) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "127.0.0.1",
      port: PORT,
      path,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      const events = [];
      let buffer = "";

      res.on("data", (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split("\n\n");
        buffer = lines.pop(); // keep partial

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              events.push(JSON.parse(line.replace("data: ", "")));
            } catch (e) {
              // ignore parse errors on partial
            }
          }
        }
      });

      res.on("end", () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          events,
        });
      });
    });

    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
};

const runTests = async () => {
  console.log("=== Running Feature 04: Core Streaming Chat E2E Tests ===");

  server = app.listen(PORT);
  let authToken = null;
  let createdChatId = null;

  try {
    // 1. Unauthenticated request to /chat must fail
    console.log("\n[Test 1] GET /chat without token returns 401");
    const unauthRes = await request({ path: "/chat" });
    if (unauthRes.status !== 401) {
      throw new Error(`Expected 401, got ${unauthRes.status}`);
    }
    console.log("✓ Correctly rejected unauthenticated request");

    // 2. Dev login to get valid token
    console.log("\n[Test 2] Authenticate via /auth/dev-login");
    const loginRes = await request({
      method: "POST",
      path: "/auth/dev-login",
      body: { email: "chat-tester@nexai.app", name: "Chat Tester" },
    });
    if (loginRes.status !== 200 || !loginRes.body.token) {
      throw new Error("Failed to authenticate test user");
    }
    authToken = loginRes.body.token;
    console.log("✓ Received auth token");

    // 3. Create a new chat
    console.log("\n[Test 3] POST /chat to create a new session");
    const createRes = await request({
      method: "POST",
      path: "/chat",
      headers: { Authorization: `Bearer ${authToken}` },
      body: { title: "E2E Architecture Session" },
    });
    if (createRes.status !== 201 || !createRes.body.chat?._id) {
      throw new Error(`Create chat failed: ${JSON.stringify(createRes.body)}`);
    }
    createdChatId = createRes.body.chat._id;
    console.log(`✓ Chat created with ID: ${createdChatId}`);

    // 4. List user chats
    console.log("\n[Test 4] GET /chat lists the created session");
    const listRes = await request({
      path: "/chat",
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const found = listRes.body.chats?.some(
      (c) => (c._id || c.id) === createdChatId,
    );
    if (!found) throw new Error("Created chat was not returned in /chat list");
    console.log(`✓ Chat found in user chat list (total: ${listRes.body.chats.length})`);

    // 5. Update chat (rename and pin)
    console.log("\n[Test 5] PATCH /chat/:id renames and pins session");
    const patchRes = await request({
      method: "PATCH",
      path: `/chat/${createdChatId}`,
      headers: { Authorization: `Bearer ${authToken}` },
      body: { title: "Pinned System Architecture", pinned: true },
    });
    if (
      patchRes.status !== 200 ||
      patchRes.body.chat.title !== "Pinned System Architecture" ||
      !patchRes.body.chat.pinned
    ) {
      throw new Error(`Update chat failed: ${JSON.stringify(patchRes.body)}`);
    }
    console.log("✓ Chat successfully renamed and pinned");

    // 6. Test SSE streaming message
    console.log("\n[Test 6] POST /chat/message with Server-Sent Events (SSE)");
    const sseRes = await requestSSE({
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        chatId: createdChatId,
        content: "Explain the architecture of Server-Sent Events in high precision.",
      },
    });

    if (sseRes.status !== 200) {
      throw new Error(`SSE request failed with status: ${sseRes.status}`);
    }

    const initEvent = sseRes.events.find((e) => e.type === "session_init");
    const chunkEvents = sseRes.events.filter((e) => e.type === "chunk");
    const doneEvent = sseRes.events.find((e) => e.type === "done");

    if (!initEvent) throw new Error("Missing session_init event");
    if (chunkEvents.length === 0) throw new Error("No streaming chunks received");
    if (!doneEvent || !doneEvent.message) throw new Error("Missing done event");

    console.log(
      `✓ Received ${chunkEvents.length} streaming chunks and valid done event`,
    );
    console.log(`✓ Assistant response preview: "${doneEvent.message.content.slice(0, 60)}..."`);

    // 7. Verify message history in chat
    console.log("\n[Test 7] GET /chat/:id loads message history");
    const getRes = await request({
      path: `/chat/${createdChatId}`,
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (getRes.status !== 200 || getRes.body.messages.length < 2) {
      throw new Error(`Expected at least 2 messages in history, got ${getRes.body.messages?.length}`);
    }
    console.log(`✓ Successfully loaded history (${getRes.body.messages.length} messages)`);

    // 8. Delete chat session
    console.log("\n[Test 8] DELETE /chat/:id removes chat session");
    const delRes = await request({
      method: "DELETE",
      path: `/chat/${createdChatId}`,
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (delRes.status !== 200 || !delRes.body.success) {
      throw new Error("Delete chat failed");
    }
    console.log("✓ Chat session deleted");

    console.log("\n🎉 ALL FEATURE 04 BACKEND TESTS PASSED!");
  } finally {
    server.close();
  }
};

runTests().catch((err) => {
  console.error("\n❌ Test failure:", err.message);
  if (server) server.close();
  process.exit(1);
});

