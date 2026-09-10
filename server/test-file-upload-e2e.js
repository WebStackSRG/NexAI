import assert from "node:assert";
import http from "node:http";
import app from "./src/app.js";
import { devLogin } from "./src/services/auth.service.js";

async function runTests() {
  console.log("=== Feature 12 File Upload & Multimodal Analysis E2E Tests ===");

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  try {
    // 1. Unauthenticated check
    console.log("[Test 1] POST /library/upload without token returns 401...");
    const unauthRes = await fetch(`${baseUrl}/library/upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: "test.pdf",
        mimeType: "application/pdf",
        dataBase64: Buffer.from("dummy pdf content").toString("base64"),
      }),
    });
    assert.strictEqual(unauthRes.status, 401, "Expected 401 Unauthorized");
    console.log("✓ Test 1 Passed: Unauthorized access correctly rejected");

    // 2. Authenticate
    console.log("[Test 2] Authenticate user...");
    const { token } = await devLogin({
      email: "multimodal-tester@nexai.app",
      name: "Multimodal Tester",
    });
    const authHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    // 3. Upload and analyze text document
    console.log("[Test 3] POST /library/upload with text markdown document...");
    const markdownContent =
      "# System Invariants\n1. Zero-defect architecture.\n2. In-memory fallback support.\n3. Complete test coverage.";
    const textRes = await fetch(`${baseUrl}/library/upload`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        filename: "invariants.md",
        mimeType: "text/markdown",
        dataBase64: Buffer.from(markdownContent).toString("base64"),
      }),
    });
    assert.strictEqual(textRes.status, 201, "Expected 201 Created");
    const textData = await textRes.json();
    assert.strictEqual(textData.item.type, "file");
    assert.strictEqual(textData.item.title, "invariants.md");
    assert.ok(textData.item.vectorId, "Expected vectorId for RAG indexing");
    console.log("✓ Test 3 Passed: Markdown document analyzed, saved, and indexed");

    // 4. Upload and analyze mock PDF / image document (Multimodal)
    console.log("[Test 4] POST /library/upload with mock PDF document...");
    const dummyPdf = Buffer.from("%PDF-1.4 ... architectural diagram data ...").toString("base64");
    const pdfRes = await fetch(`${baseUrl}/library/upload`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        filename: "architecture-spec.pdf",
        mimeType: "application/pdf",
        dataBase64: dummyPdf,
      }),
    });
    assert.strictEqual(pdfRes.status, 201);
    const pdfData = await pdfRes.json();
    assert.strictEqual(pdfData.item.type, "file");
    assert.strictEqual(pdfData.item.mimeType, "application/pdf");
    assert.ok(pdfData.item.summary, "Expected generated summary");
    console.log("✓ Test 4 Passed: PDF document multimodal analysis succeeded");

    // 5. Verify file shows up in GET /library
    console.log("[Test 5] GET /library lists uploaded file items...");
    const listRes = await fetch(`${baseUrl}/library?type=file`, {
      headers: authHeaders,
    });
    assert.strictEqual(listRes.status, 200);
    const listData = await listRes.json();
    assert.ok(Array.isArray(listData.items));
    const foundPdf = listData.items.find((i) => i.title === "architecture-spec.pdf");
    assert.ok(foundPdf, "Expected architecture-spec.pdf in library items list");
    console.log("✓ Test 5 Passed: Uploaded file verified in library list");

    console.log("\n==========================================");
    console.log("🎉 ALL 5 MULTIMODAL UPLOAD E2E TESTS PASSED!");
    console.log("==========================================");
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
