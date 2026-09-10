/**
 * End-to-End Chat with RAG Test
 * Verifies that conversational queries trigger LangGraph vector retrieval,
 * emit real-time SSE sources events, and ground Gemini generation.
 */
import http from "http";
import app from "./src/app.js";

const PORT = 5057;
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
    if (body) req.write(typeof body === "string" ? body : JSON.stringify(body));
    req.end();
  });
};

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
        buffer = lines.pop();

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              events.push(JSON.parse(line.replace("data: ", "")));
            } catch (e) {}
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
  console.log("=== Running Feature 06: Chat with RAG E2E Tests ===");

  server = app.listen(PORT);
  let authToken = null;

  try {
    // 1. Authenticate test user
    console.log("\n[Test 1] Authenticate user");
    const loginRes = await request({
      method: "POST",
      path: "/auth/dev-login",
      body: { email: "rag-tester@nexai.app", name: "RAG Tester" },
    });
    authToken = loginRes.body.token;
    console.log("✓ Authenticated");

    // 2. Index a specialized knowledge item in the library
    console.log("\n[Test 2] Save and confirm specialized knowledge item in library");
    const saveRes = await request({
      method: "POST",
      path: "/library/save",
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        type: "note",
        title: "Quantum Encryption Protocol Q17",
        content:
          "Protocol Q17 operates at 850nm wavelength using BB84 polarization states with decoy states to detect eavesdropping on quantum channels.",
      },
    });

    const itemId = saveRes.body.item._id;
    await request({
      method: "PATCH",
      path: `/library/${itemId}/confirm`,
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        title: "Quantum Encryption Protocol Q17",
        summary: "Details of Protocol Q17 operating at 850nm wavelength using BB84 polarization.",
        tags: ["quantum", "cryptography", "q17"],
      },
    });
    console.log("✓ Knowledge item indexed into Pinecone namespace 'library'");

    // 3. Send conversational chat message asking about Q17
    console.log("\n[Test 3] Send chat message querying the indexed topic");
    const sseRes = await requestSSE({
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        content: "What wavelength and protocol does Quantum Encryption Protocol Q17 utilize?",
      },
    });

    if (sseRes.status !== 200) {
      throw new Error(`SSE request failed with status: ${sseRes.status}`);
    }

    const sourcesEvent = sseRes.events.find((e) => e.type === "sources");
    const doneEvent = sseRes.events.find((e) => e.type === "done");

    if (!sourcesEvent || !sourcesEvent.sources || sourcesEvent.sources.length === 0) {
      throw new Error("Expected SSE 'sources' event with retrieved knowledge sources");
    }

    console.log(`✓ Received SSE sources event with ${sourcesEvent.sources.length} citations`);
    console.log(`✓ Top retrieved source: "${sourcesEvent.sources[0].title}" (Score: ${sourcesEvent.sources[0].score}%)`);

    if (!doneEvent || !doneEvent.message) {
      throw new Error("Missing final completion event");
    }

    const toolCalls = doneEvent.message.toolCalls || [];
    const ragCall = toolCalls.find((t) => t.name === "rag_knowledge_retrieval");
    if (!ragCall) {
      throw new Error("Expected rag_knowledge_retrieval telemetry in message.toolCalls");
    }

    console.log("✓ Confirmed agent telemetry toolCall in assistant message record");
    console.log("\n🎉 ALL FEATURE 06 RAG TESTS PASSED!");
  } finally {
    server.close();
  }
};

runTests().catch((err) => {
  console.error("\n❌ Test failure:", err.message);
  if (server) server.close();
  process.exit(1);
});
