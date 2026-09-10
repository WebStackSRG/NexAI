import assert from "node:assert";
import http from "node:http";
import app from "./src/app.js";
import { devLogin } from "./src/services/auth.service.js";

async function runTests() {
  console.log("=== Feature 08 AI Document Generator E2E Tests ===");

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  try {
    // 1. Unauthenticated check
    console.log("[Test 1] GET /documents without token returns 401...");
    const unauthRes = await fetch(`${baseUrl}/documents`);
    assert.strictEqual(unauthRes.status, 401, "Expected 401 Unauthorized");
    console.log("✓ Test 1 Passed: Correctly rejected unauthenticated request");

    // 2. Authenticate
    console.log("[Test 2] Authenticate via /auth/dev-login...");
    const { token, user } = await devLogin({
      email: "doc-tester@nexai.app",
      name: "Document Tester",
    });
    const authHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
    console.log("✓ Test 2 Passed: Authenticated user token obtained");

    // 3. AI Section Generation via POST /documents/generate
    console.log("[Test 3] POST /documents/generate with Gemini 2.5 Pro...");
    const genRes = await fetch(`${baseUrl}/documents/generate`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        topic: "Zero-Trust Architecture for Cloud-Native Microservices",
        tone: "technical",
        sectionCount: 4,
      }),
    });
    assert.strictEqual(genRes.status, 200, "Expected 200 OK for document generation");
    const genData = await genRes.json();
    assert.ok(genData.title, "Expected document title");
    assert.ok(Array.isArray(genData.sections), "Expected sections array");
    assert.strictEqual(genData.sections.length, 4, "Expected 4 generated sections");
    assert.ok(genData.sections[0].heading, "Expected section heading");
    assert.ok(genData.sections[0].body, "Expected section HTML body");
    console.log(`✓ Test 3 Passed: Generated 4 sections for title: "${genData.title}"`);

    // 4. Create Document via POST /documents
    console.log("[Test 4] POST /documents create document...");
    const createRes = await fetch(`${baseUrl}/documents`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        title: genData.title,
        sections: genData.sections,
      }),
    });
    assert.strictEqual(createRes.status, 201, "Expected 201 Created");
    const createData = await createRes.json();
    const docId = createData.document._id || createData.document.id;
    assert.ok(docId, "Expected document ID");
    assert.strictEqual(createData.document.sections.length, 4);
    console.log(`✓ Test 4 Passed: Document created with ID: ${docId}`);

    // 5. GET /documents lists the created document
    console.log("[Test 5] GET /documents lists user documents...");
    const listRes = await fetch(`${baseUrl}/documents`, {
      headers: authHeaders,
    });
    assert.strictEqual(listRes.status, 200);
    const listData = await listRes.json();
    assert.ok(Array.isArray(listData.documents));
    const found = listData.documents.find((d) => (d._id || d.id) === docId);
    assert.ok(found, "Expected newly created document in list");
    console.log("✓ Test 5 Passed: Document found in user document list");

    // 6. PATCH /documents/:id updates title and sections
    console.log("[Test 6] PATCH /documents/:id update document sections...");
    const updatedSections = [
      ...genData.sections,
      {
        heading: "5. Telemetry & Continuous Compliance",
        body: "<p>Real-time audit logging and identity lifecycle verification.</p>",
        order: 4,
      },
    ];

    const patchRes = await fetch(`${baseUrl}/documents/${docId}`, {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify({
        title: "Updated Zero-Trust Specification",
        sections: updatedSections,
      }),
    });
    assert.strictEqual(patchRes.status, 200);
    const patchData = await patchRes.json();
    assert.strictEqual(patchData.document.title, "Updated Zero-Trust Specification");
    assert.strictEqual(patchData.document.sections.length, 5);
    console.log("✓ Test 6 Passed: Document successfully updated with 5 sections");

    // 7. POST /documents/:id/index-library syncs document into Knowledge Library for RAG
    console.log("[Test 7] POST /documents/:id/index-library indexes for RAG...");
    const indexRes = await fetch(`${baseUrl}/documents/${docId}/index-library`, {
      method: "POST",
      headers: authHeaders,
    });
    assert.strictEqual(indexRes.status, 200);
    const indexData = await indexRes.json();
    assert.ok(indexData.libraryItemId, "Expected libraryItemId");
    assert.ok(indexData.vectorId, "Expected vectorId");
    console.log(`✓ Test 7 Passed: Document indexed into Library (vector: ${indexData.vectorId})`);

    // 8. DELETE /documents/:id removes document
    console.log("[Test 8] DELETE /documents/:id...");
    const delRes = await fetch(`${baseUrl}/documents/${docId}`, {
      method: "DELETE",
      headers: authHeaders,
    });
    assert.strictEqual(delRes.status, 200);
    console.log("✓ Test 8 Passed: Document deleted successfully");

    console.log("\n==========================================");
    console.log("🎉 ALL 8 DOCUMENT STUDIO E2E TESTS PASSED!");
    console.log("==========================================");
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});

