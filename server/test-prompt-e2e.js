import assert from "node:assert";
import http from "node:http";
import app from "./src/app.js";
import { devLogin } from "./src/services/auth.service.js";

async function runTests() {
  console.log("=== Feature 09 Prompt Vault E2E Tests ===");

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  try {
    // 1. Unauthenticated check
    console.log("[Test 1] GET /prompts without token returns 401...");
    const unauthRes = await fetch(`${baseUrl}/prompts`);
    assert.strictEqual(unauthRes.status, 401, "Expected 401 Unauthorized");
    console.log("✓ Test 1 Passed: Unauthorized access correctly rejected");

    // 2. Authenticate
    console.log("[Test 2] Authenticate via /auth/dev-login...");
    const { token, user } = await devLogin({
      email: "prompt-tester@nexai.app",
      name: "Prompt Vault Tester",
    });
    const authHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
    console.log("✓ Test 2 Passed: Obtained session token");

    // 3. POST /prompts create template with variables
    console.log("[Test 3] POST /prompts create template with {{variables}}...");
    const templateText =
      "Analyze the following {{language}} code for {{focus}} and explain your findings in a {{tone}} tone:\n\n{{code}}";

    const createRes = await fetch(`${baseUrl}/prompts`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        title: "Deep Code Analysis",
        template: templateText,
        tags: ["engineering", "review"],
        pinned: true,
      }),
    });
    assert.strictEqual(createRes.status, 201, "Expected 201 Created");
    const createData = await createRes.json();
    const prompt = createData.prompt;
    const promptId = prompt._id || prompt.id;

    assert.ok(promptId, "Expected prompt ID");
    assert.strictEqual(prompt.title, "Deep Code Analysis");
    assert.strictEqual(prompt.pinned, true);
    // Verify automated regex variable extraction
    assert.deepStrictEqual(
      prompt.variables.sort(),
      ["code", "focus", "language", "tone"].sort(),
      "Expected 4 extracted variables: language, focus, tone, code",
    );
    console.log(`✓ Test 3 Passed: Prompt created with variables: [${prompt.variables.join(", ")}]`);

    // 4. GET /prompts lists created template
    console.log("[Test 4] GET /prompts lists prompts and supports tag filter...");
    const listRes = await fetch(`${baseUrl}/prompts?tag=engineering`, {
      headers: authHeaders,
    });
    assert.strictEqual(listRes.status, 200);
    const listData = await listRes.json();
    assert.ok(Array.isArray(listData.prompts));
    const found = listData.prompts.find((p) => (p._id || p.id) === promptId);
    assert.ok(found, "Expected created prompt in filtered list");
    console.log("✓ Test 4 Passed: Prompt returned with tag filter");

    // 5. POST /prompts/:id/use fills variables and increments useCount
    console.log("[Test 5] POST /prompts/:id/use interpolates variables and tracks useCount...");
    const useRes = await fetch(`${baseUrl}/prompts/${promptId}/use`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        variables: {
          language: "TypeScript",
          focus: "memory leaks and concurrency",
          tone: "rigorous",
          code: "export const leak = () => { globalCache.push(new Array(1000)); };",
        },
      }),
    });
    assert.strictEqual(useRes.status, 200);
    const useData = await useRes.json();
    assert.ok(useData.filledPrompt.includes("TypeScript code"));
    assert.ok(useData.filledPrompt.includes("memory leaks and concurrency"));
    assert.ok(useData.filledPrompt.includes("rigorous tone"));
    assert.ok(useData.prompt.useCount >= 1, "Expected useCount to be incremented");
    console.log("✓ Test 5 Passed: Variable interpolation and useCount increment succeeded");

    // 6. PATCH /prompts/:id updates title and pins
    console.log("[Test 6] PATCH /prompts/:id updates prompt...");
    const patchRes = await fetch(`${baseUrl}/prompts/${promptId}`, {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify({
        title: "Advanced TypeScript Reviewer",
        pinned: false,
      }),
    });
    assert.strictEqual(patchRes.status, 200);
    const patchData = await patchRes.json();
    assert.strictEqual(patchData.prompt.title, "Advanced TypeScript Reviewer");
    assert.strictEqual(patchData.prompt.pinned, false);
    console.log("✓ Test 6 Passed: Prompt updated successfully");

    // 7. DELETE /prompts/:id removes prompt
    console.log("[Test 7] DELETE /prompts/:id removes prompt...");
    const delRes = await fetch(`${baseUrl}/prompts/${promptId}`, {
      method: "DELETE",
      headers: authHeaders,
    });
    assert.strictEqual(delRes.status, 200);
    console.log("✓ Test 7 Passed: Prompt deleted successfully");

    console.log("\n==========================================");
    console.log("🎉 ALL 7 PROMPT VAULT E2E TESTS PASSED!");
    console.log("==========================================");
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
