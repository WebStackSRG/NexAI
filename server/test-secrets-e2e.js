import assert from "node:assert";
import http from "node:http";
import app from "./src/app.js";
import { devLogin } from "./src/services/auth.service.js";
import Secret from "./src/models/Secret.js";

async function runSecretsTest() {
  console.log("=== Feature 18: Secrets Vault (Web Crypto) E2E Test ===");

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = "http://localhost:" + port;

  try {
    console.log("[Test 1] Unauthenticated request to /secrets fails with 401...");
    const resUnauth = await fetch(baseUrl + "/secrets");
    assert.strictEqual(resUnauth.status, 401, "Expected 401 Unauthorized");
    console.log("✓ Test 1 Passed: JWT middleware protects /secrets");

    console.log("[Test 2] Authenticating test user...");
    const { token } = await devLogin({
      email: "vault_tester@nexai.internal",
      name: "Vault Tester",
    });
    const authHeaders = {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    };

    console.log("[Test 3] POST /secrets with client-encrypted ciphertext...");
    const mockCiphertext = "dGhpcy1pcy1hLW1vY2stZW5jcnlwdGVkLWNpcGhlcnRleHQ=";
    const mockIv = "MTIzNDU2Nzg5MDEy";
    const mockSalt = "YWJjZGVmZ2hpamtsbW5vcA==";

    const createRes = await fetch(baseUrl + "/secrets", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        label: "Gemini 2.5 Pro Key",
        category: "api_key",
        ciphertext: mockCiphertext,
        iv: mockIv,
        salt: mockSalt,
      }),
    });
    assert.strictEqual(createRes.status, 201, "Expected 201 Created");
    const createData = await createRes.json();
    assert(createData.secret, "Expected secret in response");
    assert.strictEqual(createData.secret.label, "Gemini 2.5 Pro Key");
    const secretId = createData.secret._id;
    console.log("✓ Test 2 & 3 Passed: Secret saved without plaintext");

    console.log("[Test 4] GET /secrets lists encrypted items...");
    const listRes = await fetch(baseUrl + "/secrets", { headers: authHeaders });
    assert.strictEqual(listRes.status, 200, "Expected 200 OK");
    const listData = await listRes.json();
    assert(Array.isArray(listData.secrets), "Expected array of secrets");
    const found = listData.secrets.find((s) => s._id === secretId);
    assert(found, "Created secret must be returned in list");
    assert.strictEqual(found.ciphertext, mockCiphertext, "Ciphertext matches");
    console.log("✓ Test 4 Passed: GET /secrets returned encrypted items");

    console.log("[Test 5] DELETE /secrets/:id cleans up...");
    const delRes = await fetch(baseUrl + "/secrets/" + secretId, {
      method: "DELETE",
      headers: authHeaders,
    });
    assert.strictEqual(delRes.status, 200, "Expected 200 OK");
    console.log("✓ Test 5 Passed: Secret deleted cleanly");

    console.log("=== ALL SECRETS VAULT E2E TESTS PASSED (5/5) ===");
    setTimeout(() => process.exit(0), 100);
  } catch (err) {
    console.error("Test failed:", err);
    server.close();
    process.exit(1);
  }
}

runSecretsTest();
