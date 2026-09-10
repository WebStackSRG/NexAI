import assert from "node:assert";
import http from "node:http";
import app from "./src/app.js";
import { devLogin } from "./src/services/auth.service.js";

async function runCreativeWritingTest() {
  console.log("=== Feature 19: Creative Writing Suite E2E Test ===");

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = "http://localhost:" + port;

  try {
    console.log("[Test 1] Unauthenticated POST /documents/creative-continue fails with 401...");
    const resUnauth = await fetch(baseUrl + "/documents/creative-continue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    assert.strictEqual(resUnauth.status, 401, "Expected 401 Unauthorized");
    console.log("✓ Test 1 Passed: Auth guard active on /documents/creative-continue");

    console.log("[Test 2] Authenticating test user...");
    const { token } = await devLogin({
      email: "writer@nexai.internal",
      name: "Author Elena",
    });
    const authHeaders = {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    };

    console.log("[Test 3] POST /documents/creative-continue generates multi-chapter section...");
    const continueRes = await fetch(baseUrl + "/documents/creative-continue", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        title: "Chronicles of Aethelgard",
        genre: "fantasy",
        tone: "epic",
        style: "lyrical",
        chapterNumber: 2,
        characters: [
          { name: "Kaelen", role: "Rogue Mage", description: "Wields forbidden void magic" },
          { name: "Lyra", role: "Paladin of the Dawn", description: "Bound by sacred oath" }
        ],
        worldNotes: "A shattered continent floating above an endless sea of mist.",
        instruction: "Introduce an unexpected betrayal during the dawn assault.",
      }),
    });

    assert.strictEqual(continueRes.status, 200, "Expected 200 OK");
    const data = await continueRes.json();
    assert.strictEqual(data.success, true);
    assert(data.heading, "Expected chapter heading");
    assert(data.body, "Expected chapter HTML body");
    console.log("✓ Test 3 Passed: Generated heading ->", data.heading);

    console.log("=== ALL CREATIVE WRITING E2E TESTS PASSED (3/3) ===");
    setTimeout(() => process.exit(0), 100);
  } catch (err) {
    console.error("Test failed:", err);
    setTimeout(() => process.exit(1), 100);
  }
}

runCreativeWritingTest();
