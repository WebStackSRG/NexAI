/**
 * End-to-End Library Integration Test
 * Verifies the Suggest → Review → Confirm lifecycle, AI summarization & tagging,
 * vector embedding, and library CRUD
 */
import http from "http";
import app from "./src/app.js";

const PORT = 5056;
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

const runTests = async () => {
  console.log("=== Running Feature 05: Personal Knowledge Library E2E Tests ===");

  server = app.listen(PORT);
  let authToken = null;
  let createdItemId = null;

  try {
    // 1. Unauthenticated request to /library must fail
    console.log("\n[Test 1] GET /library without token returns 401");
    const unauthRes = await request({ path: "/library" });
    if (unauthRes.status !== 401) {
      throw new Error(`Expected 401, got ${unauthRes.status}`);
    }
    console.log("✓ Correctly rejected unauthenticated request");

    // 2. Dev login
    console.log("\n[Test 2] Authenticate via /auth/dev-login");
    const loginRes = await request({
      method: "POST",
      path: "/auth/dev-login",
      body: { email: "library-tester@nexai.app", name: "Library Tester" },
    });
    if (loginRes.status !== 200 || !loginRes.body.token) {
      throw new Error("Failed to authenticate test user");
    }
    authToken = loginRes.body.token;
    console.log("✓ Received auth token");

    // 3. Stage 1: Suggest (POST /library/save)
    console.log("\n[Test 3] POST /library/save (Suggest stage)");
    const saveRes = await request({
      method: "POST",
      path: "/library/save",
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        type: "note",
        title: "Vector Embeddings with Pinecone",
        content:
          "Pinecone Starter allows storing 768-dimensional float vectors generated from text-embedding-004. In NexAI, we use cosine similarity search to retrieve contextual grounding for LangGraph agents.",
      },
    });

    if (saveRes.status !== 201 || !saveRes.body.item?._id) {
      throw new Error(`Save item failed: ${JSON.stringify(saveRes.body)}`);
    }

    const item = saveRes.body.item;
    createdItemId = item._id;

    if (item.status !== "pending") {
      throw new Error(`Expected status 'pending', got ${item.status}`);
    }
    if (!saveRes.body.suggestions?.summary) {
      throw new Error("Missing AI summary suggestion");
    }

    console.log(`✓ Item created with status: 'pending' (ID: ${createdItemId})`);
    console.log(`✓ AI Suggested Summary: "${saveRes.body.suggestions.summary.slice(0, 60)}..."`);
    console.log(`✓ AI Suggested Tags: [${saveRes.body.suggestions.tags?.join(", ")}]`);

    // 4. Stage 2: Confirm (PATCH /library/:id/confirm)
    console.log("\n[Test 4] PATCH /library/:id/confirm (Confirm stage & Vector indexing)");
    const confirmRes = await request({
      method: "PATCH",
      path: `/library/${createdItemId}/confirm`,
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        title: "Pinecone & Text Embeddings Guide",
        summary: "Verified overview of Pinecone vector storage and LangGraph context grounding.",
        tags: ["vector-db", "rag", "pinecone", "gemini"],
        pinned: true,
      },
    });

    if (confirmRes.status !== 200 || confirmRes.body.item.status !== "confirmed") {
      throw new Error(`Confirm failed: ${JSON.stringify(confirmRes.body)}`);
    }

    if (!confirmRes.body.item.vectorId) {
      throw new Error("Missing vectorId on confirmed library item");
    }

    console.log("✓ Item successfully confirmed & indexed with vectorId:", confirmRes.body.item.vectorId);

    // 5. Query items list
    console.log("\n[Test 5] GET /library lists confirmed items and filters");
    const listRes = await request({
      path: "/library?type=note&search=Pinecone",
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (listRes.status !== 200 || !Array.isArray(listRes.body.items)) {
      throw new Error(`List failed: ${JSON.stringify(listRes.body)}`);
    }

    const found = listRes.body.items.some((i) => (i._id || i.id) === createdItemId);
    if (!found) {
      throw new Error("Confirmed item was not found in filtered search query");
    }
    console.log(`✓ Item found in search query results (total matched: ${listRes.body.items.length})`);

    // 6. Delete item
    console.log("\n[Test 6] DELETE /library/:id removes item and vector");
    const delRes = await request({
      method: "DELETE",
      path: `/library/${createdItemId}`,
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (delRes.status !== 200 || !delRes.body.success) {
      throw new Error(`Delete failed: ${JSON.stringify(delRes.body)}`);
    }
    console.log("✓ Library item and vector successfully removed");

    console.log("\n🎉 ALL FEATURE 05 BACKEND TESTS PASSED!");
  } finally {
    server.close();
  }
};

runTests().catch((err) => {
  console.error("\n❌ Test failure:", err.message);
  if (server) server.close();
  process.exit(1);
});
