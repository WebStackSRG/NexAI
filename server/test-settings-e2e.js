import assert from "node:assert";
import http from "node:http";
import app from "./src/app.js";
import { devLogin } from "./src/services/auth.service.js";

async function runTests() {
  console.log("=== Feature 07 Basic Settings Page E2E Test ===");

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  try {
    // 1. Unauthenticated request to /users/settings must be rejected (401)
    console.log("Test 1: GET /users/settings unauthorized check...");
    const unauthRes = await fetch(`${baseUrl}/users/settings`);
    assert.strictEqual(
      unauthRes.status,
      401,
      "Expected 401 Unauthorized for unauthenticated GET /users/settings",
    );
    console.log("✓ Test 1 Passed: Unauthorized access correctly rejected (401)");

    // 2. Generate dev user session
    console.log("Generating test user authentication session...");
    const { token, user } = await devLogin({
      email: "settings-tester@nexai.app",
      name: "Settings Tester",
    });
    const authHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    // 3. GET /users/settings for authenticated user
    console.log("Test 2: GET /users/settings authenticated check...");
    const getRes = await fetch(`${baseUrl}/users/settings`, {
      headers: authHeaders,
    });
    assert.strictEqual(getRes.status, 200, "Expected 200 OK for GET /users/settings");
    const getData = await getRes.json();
    assert.ok(getData.settings, "Expected settings object in response");
    assert.strictEqual(getData.settings.email, "settings-tester@nexai.app");
    assert.ok(getData.settings.preferences, "Expected preferences object");
    console.log("✓ Test 2 Passed: Settings fetched correctly with profile and preferences");

    // 4. PATCH /users/settings with valid updates
    console.log("Test 3: PATCH /users/settings updating globalInstructions and persona...");
    const patchPayload = {
      globalInstructions: "Always provide TypeScript signatures and verify assumptions.",
      preferences: {
        sidebarMode: "developer",
        theme: "dark",
        streamingEnabled: true,
      },
      notificationPrefs: {
        brokenLinks: true,
        weeklyDigest: false,
        reminders: true,
      },
    };

    const patchRes = await fetch(`${baseUrl}/users/settings`, {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify(patchPayload),
    });
    assert.strictEqual(patchRes.status, 200, "Expected 200 OK for PATCH /users/settings");
    const patchData = await patchRes.json();
    assert.strictEqual(
      patchData.settings.globalInstructions,
      "Always provide TypeScript signatures and verify assumptions.",
      "Expected globalInstructions to be updated",
    );
    assert.strictEqual(
      patchData.settings.preferences.sidebarMode,
      "developer",
      "Expected sidebarMode to be 'developer'",
    );
    assert.strictEqual(
      patchData.settings.notificationPrefs.weeklyDigest,
      false,
      "Expected weeklyDigest to be false",
    );
    console.log("✓ Test 3 Passed: Settings successfully updated and persisted");

    // 5. Verify that GET /users/settings reflects the updated settings
    console.log("Test 4: Verify persistence via subsequent GET /users/settings...");
    const verifyRes = await fetch(`${baseUrl}/users/settings`, {
      headers: authHeaders,
    });
    const verifyData = await verifyRes.json();
    assert.strictEqual(
      verifyData.settings.globalInstructions,
      "Always provide TypeScript signatures and verify assumptions.",
    );
    assert.strictEqual(verifyData.settings.preferences.sidebarMode, "developer");
    assert.strictEqual(verifyData.settings.notificationPrefs.weeklyDigest, false);
    console.log("✓ Test 4 Passed: Subsequent GET verified persistence");

    // 6. Zod validation failure check (e.g. invalid sidebarMode)
    console.log("Test 5: Zod validation rejects invalid sidebarMode...");
    const invalidRes = await fetch(`${baseUrl}/users/settings`, {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify({
        preferences: {
          sidebarMode: "invalid-mode-value",
        },
      }),
    });
    assert.strictEqual(invalidRes.status, 400, "Expected 400 Bad Request for invalid mode");
    console.log("✓ Test 5 Passed: Zod schema strictly rejects invalid preference values");

    console.log("\n==========================================");
    console.log("🎉 ALL 5 SETTINGS E2E TESTS PASSED 100%");
    console.log("==========================================");
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
