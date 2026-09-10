import assert from "node:assert";
import http from "node:http";
import app from "./src/app.js";
import { devLogin } from "./src/services/auth.service.js";
import { saveItem, confirmItem } from "./src/services/library.service.js";
import { createDocument } from "./src/services/document.service.js";
import { createPrompt } from "./src/services/prompt.service.js";
import { createChat } from "./src/services/chat.service.js";

async function runTests() {
  console.log("=== Feature 10 Unified Global Search E2E Tests ===");

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  try {
    // 1. Unauthenticated check
    console.log("[Test 1] GET /search without token returns 401...");
    const unauthRes = await fetch(`${baseUrl}/search?q=test`);
    assert.strictEqual(unauthRes.status, 401, "Expected 401 Unauthorized");
    console.log("✓ Test 1 Passed: Unauthorized access correctly rejected");

    // 2. Authenticate
    console.log("[Test 2] Authenticate test user...");
    const { token, user } = await devLogin({
      email: "search-tester@nexai.app",
      name: "Search Tester",
    });
    const authHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
    const userId = user._id || user.id;

    // 3. Seed multi-entity data
    console.log("[Test 3] Seeding test data across Library, Documents, Prompts, and Chats...");
    // A. Library item
    const { item } = await saveItem(userId, {
      title: "Kubernetes Cluster Networking Invariants",
      content: "Deep dive into CNI plugins, Calico eBPF routing, and service mesh sidecars.",
      type: "note",
    });
    await confirmItem(item._id || item.id, userId, {
      title: item.title,
      summary: "Calico eBPF routing and CNI plugins for Kubernetes clusters.",
      tags: ["kubernetes", "networking"],
    });

    // B. Document
    await createDocument(userId, {
      title: "Kubernetes Disaster Recovery Runbook",
      sections: [
        {
          heading: "Etcd Snapshot and Restore",
          body: "<p>Restoring control plane state from etcd snapshot.</p>",
        },
      ],
    });

    // C. Prompt
    await createPrompt(userId, {
      title: "Kubernetes Manifest Validator",
      template: "Audit the following Kubernetes manifest for security invariants: {{manifest}}",
      tags: ["devops", "kubernetes"],
    });

    // D. Chat session
    await createChat(userId, {
      title: "Kubernetes Ingress Troubleshooting",
    });

    console.log("✓ Test 3 Passed: Multi-entity seed data created");

    // 4. GET /search?q=Kubernetes
    console.log("[Test 4] GET /search?q=Kubernetes returns unified grouped results...");
    const searchRes = await fetch(`${baseUrl}/search?q=Kubernetes`, {
      headers: authHeaders,
    });
    assert.strictEqual(searchRes.status, 200);
    const data = await searchRes.json();

    assert.ok(data.results, "Expected results object");
    assert.ok(data.total >= 4, `Expected at least 4 total matches, received ${data.total}`);

    // Verify Library results
    const libMatch = data.results.library.find((l) =>
      l.title.includes("Kubernetes Cluster Networking"),
    );
    assert.ok(libMatch, "Expected library item in search results");

    // Verify Documents results
    const docMatch = data.results.documents.find((d) =>
      d.title.includes("Disaster Recovery Runbook"),
    );
    assert.ok(docMatch, "Expected document in search results");

    // Verify Prompts results
    const promptMatch = data.results.prompts.find((p) =>
      p.title.includes("Manifest Validator"),
    );
    assert.ok(promptMatch, "Expected prompt in search results");

    // Verify Chats results
    const chatMatch = data.results.chats.find((c) =>
      c.title.includes("Ingress Troubleshooting"),
    );
    assert.ok(chatMatch, "Expected chat session in search results");

    console.log(
      `✓ Test 4 Passed: Found ${data.total} unified matches (Library: ${data.results.library.length}, Docs: ${data.results.documents.length}, Prompts: ${data.results.prompts.length}, Chats: ${data.results.chats.length})`,
    );

    // 5. Empty query handling
    console.log("[Test 5] GET /search with empty query returns empty results...");
    const emptyRes = await fetch(`${baseUrl}/search?q=`, {
      headers: authHeaders,
    });
    assert.strictEqual(emptyRes.status, 200);
    const emptyData = await emptyRes.json();
    assert.strictEqual(emptyData.total, 0);
    console.log("✓ Test 5 Passed: Empty search query handled safely");

    console.log("\n==========================================");
    console.log("🎉 ALL 5 UNIFIED SEARCH E2E TESTS PASSED!");
    console.log("==========================================");
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});

