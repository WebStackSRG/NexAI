import { GoogleGenAI } from "@google/genai";
import { config } from "../config/env.js";

let aiClient = null;

const getGenAIClient = () => {
  if (aiClient) return aiClient;
  const apiKey = config.ai.geminiApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your-gemini-api-key") {
    return null;
  }
  aiClient = new GoogleGenAI({ apiKey });
  return aiClient;
};

/**
 * Format message history for Gemini SDK contents array
 */
export const formatMessagesForGemini = (messages = []) => {
  return messages.map((m) => {
    const role = m.role === "assistant" ? "model" : "user";
    return {
      role,
      parts: [{ text: m.content || "" }],
    };
  });
};

/**
 * Fallback generator when GEMINI_API_KEY is not configured
 */
async function* fallbackStreamResponse(prompt, systemInstruction) {
  const mockTokens = [
    "Hello! I am **NexAI**, your intelligent full-stack AI assistant.\n\n",
    "I'm operating in **local developer simulation mode** because `GEMINI_API_KEY` is not configured in your environment.\n\n",
    "Here is an overview of what I received:\n",
    `- **Prompt:** "${prompt.slice(0, 120)}${prompt.length > 120 ? "..." : ""}"\n`,
    systemInstruction ? `- **Global Instructions:** Active\n\n` : `\n`,
    "### Capabilities Overview\n",
    "1. **Streaming Chat (SSE)**: Powered by Server-Sent Events with cursor telemetry.\n",
    "2. **Session Persistence**: Sessions and message threads are stored with timestamp history.\n",
    "3. **Markdown & Code**: Code blocks render with copy-to-clipboard functionality.\n\n",
    "To enable live **Gemini 2.0 Flash** responses, add your API key to `server/.env`:\n",
    "```bash\nGEMINI_API_KEY=your_google_ai_studio_key\n```\n\n",
    "How can I assist your engineering workflow today?",
  ];

  for (const token of mockTokens) {
    yield token;
    // Brief async delay simulating network streaming latency
    await new Promise((resolve) => setTimeout(resolve, 60));
  }
}

/**
 * Stream chat response using Gemini 2.0 Flash
 */
export const streamChatResponse = async function* ({
  messages = [],
  systemInstruction = "",
  model = "gemini-2.0-flash",
  abortSignal = null,
}) {
  const ai = getGenAIClient();

  // If no Gemini API key configured, provide developer fallback stream
  if (!ai) {
    const lastUserMessage =
      messages.filter((m) => m.role === "user").pop()?.content || "";
    yield* fallbackStreamResponse(lastUserMessage, systemInstruction);
    return;
  }

  const formattedContents = formatMessagesForGemini(messages);

  const requestConfig = {};
  if (systemInstruction && systemInstruction.trim()) {
    requestConfig.systemInstruction = systemInstruction.trim();
  }
  if (abortSignal) {
    requestConfig.abortSignal = abortSignal;
  }

  try {
    const responseStream = await ai.models.generateContentStream({
      model,
      contents: formattedContents,
      config: Object.keys(requestConfig).length > 0 ? requestConfig : undefined,
    });

    for await (const chunk of responseStream) {
      if (chunk && chunk.text) {
        yield chunk.text;
      }
    }
  } catch (err) {
    console.error("[GeminiService] Stream generation error:", err.message);
    // If Gemini fails (e.g. quota, network), yield an informative error message stream
    yield `\n\n*[NexAI Stream Notice: AI response encountered an issue: ${err.message}. Please check your API key and connection.]*`;
  }
};

/**
 * Generate a concise 3-4 word conversation title from the first message
 */
export const generateChatTitle = async (firstMessageText) => {
  if (!firstMessageText || !firstMessageText.trim()) {
    return "New Chat";
  }

  const ai = getGenAIClient();
  if (!ai) {
    // Clean slice for fallback
    const words = firstMessageText.trim().split(/\s+/).slice(0, 4).join(" ");
    return words.length > 28 ? words.slice(0, 28) + "..." : words || "New Chat";
  }

  try {
    const prompt = `Generate a concise 3-4 word conversation title summarizing this user message. Return ONLY the title text itself with no quotation marks, punctuation, or preamble:\n\n${firstMessageText.slice(0, 300)}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    const title = response?.text?.trim().replace(/^["']|["']$/g, "");
    if (title && title.length > 0 && title.length <= 60) {
      return title;
    }
    return "New Conversation";
  } catch (err) {
    console.warn("[GeminiService] Title generation warning:", err.message);
    const words = firstMessageText.trim().split(/\s+/).slice(0, 4).join(" ");
    return words || "New Chat";
  }
};

/**
 * Summarize content and suggest 3-5 tags using Gemini 2.0 Flash
 */
export const summarizeAndTag = async (content, title = "") => {
  const ai = getGenAIClient();

  if (!ai) {
    // Dev fallback
    const preview = content.slice(0, 180).replace(/\s+/g, " ").trim();
    return {
      summary: `Automated summary: ${preview}${preview.length >= 180 ? "..." : ""}`,
      tags: ["reference", "saved", "knowledge"],
    };
  }

  try {
    const prompt = `You are an expert knowledge curator. Analyze the following content and generate a concise 2-3 sentence executive summary, plus 3 to 5 relevant lower-case classification tags.
Title: "${title}"
Content:
${content.slice(0, 10000)}

Respond in valid JSON only with this exact format:
{
  "summary": "2-3 sentences here...",
  "tags": ["tag1", "tag2", "tag3"]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text.trim());
    return {
      summary: parsed.summary || content.slice(0, 200),
      tags: Array.isArray(parsed.tags) ? parsed.tags : ["notes"],
    };
  } catch (err) {
    console.warn("[GeminiService] summarizeAndTag warning:", err.message);
    return {
      summary: content.slice(0, 200) + "...",
      tags: ["general", "library"],
    };
  }
};

/**
 * Generate vector embedding using text-embedding-004 (768 dimensions)
 */
export const generateEmbedding = async (text) => {
  const ai = getGenAIClient();

  if (!ai) {
    // Dev fallback: deterministic normalized 768-dim vector for testing
    const vector = new Array(768).fill(0);
    const clean = text.toLowerCase();
    for (let i = 0; i < clean.length; i++) {
      const charCode = clean.charCodeAt(i);
      const idx = (charCode * 31 + i) % 768;
      vector[idx] += 0.05;
    }
    // Normalize vector
    const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0)) || 1;
    return vector.map((v) => v / norm);
  }

  try {
    const response = await ai.models.embedContent({
      model: "text-embedding-004",
      contents: text.slice(0, 4000),
    });

    return response.embedding?.values || [];
  } catch (err) {
    console.warn("[GeminiService] embedContent warning:", err.message);
    const fallbackVector = new Array(768).fill(0);
    fallbackVector[0] = 1;
    return fallbackVector;
  }
};

/**
 * Generate structured document sections using Gemini 2.5 Pro
 */
export const generateDocumentSections = async ({
  topic,
  tone = "technical",
  sectionCount = 4,
}) => {
  const ai = getGenAIClient();

  if (!ai) {
    // High-quality structured fallback generator for local testing
    return {
      title: topic.slice(0, 80),
      sections: [
        {
          heading: "1. Executive Summary & Problem Framing",
          body: `<p>This document presents a structured investigation into <strong>${topic}</strong>. Modern software engineering demands zero-defect designs, rigorous abstractions, and resilient operational boundaries. In this report, we evaluate the architectural requirements, trade-offs, and implementation strategies necessary to achieve production readiness.</p>`,
          order: 0,
        },
        {
          heading: "2. Technical Architecture & Invariants",
          body: `<p>To maintain high availability and predictable latency under scale, several core principles must be enforced:</p><ul><li><strong>Stateless Compute:</strong> Keep service instances lightweight to facilitate horizontal autoscaling.</li><li><strong>Defensive Validation:</strong> Reject malformed payloads at the API boundary before entering core business logic.</li><li><strong>Isolation:</strong> Strict tenant separation across both relational state and vector embeddings.</li></ul>`,
          order: 1,
        },
        {
          heading: "3. Implementation Strategy & Trade-Offs",
          body: `<p>When executing solutions for <em>${topic}</em>, engineering teams face significant architectural choices. Pure JavaScript in-memory pipelines (such as client-side PDF and DOCX generation) eliminate server memory overhead while safeguarding free-tier compute ceilings. Automated test harnesses guarantee that schema invariants remain uncompromised across iterative deployments.</p>`,
          order: 2,
        },
        {
          heading: "4. Conclusion & Recommended Next Steps",
          body: `<p>In summary, adhering to the outlined standards delivers a durable foundation that scales seamlessly. Next milestones should focus on automated telemetry pipelines, continuous performance regression testing, and comprehensive operational documentation.</p>`,
          order: 3,
        },
      ].slice(0, sectionCount),
    };
  }

  try {
    const prompt = `You are a Principal Software Architect and technical author. Generate a comprehensive, professional, multi-section document on the topic below.
Topic: "${topic}"
Tone: "${tone}"
Target Section Count: ${sectionCount}

Generate structured JSON with a suggested overall document title and exactly ${sectionCount} distinct sections. Each section must contain an informative heading and a rich HTML body (using <p>, <strong>, <em>, <ul>, <li>, <code> tags for clear formatting).

Return ONLY valid JSON matching this schema:
{
  "title": "Document Title",
  "sections": [
    {
      "heading": "Section Heading",
      "body": "<p>HTML content here...</p>",
      "order": 0
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text.trim());
    return {
      title: parsed.title || topic,
      sections: (parsed.sections || []).map((s, idx) => ({
        heading: s.heading || `Section ${idx + 1}`,
        body: s.body || "",
        order: typeof s.order === "number" ? s.order : idx,
      })),
    };
  } catch (err) {
    console.warn("[GeminiService] generateDocumentSections fallback:", err.message);
    return {
      title: topic,
      sections: [
        {
          heading: "Overview",
          body: `<p>Overview for <strong>${topic}</strong>.</p>`,
          order: 0,
        },
        {
          heading: "Key Concepts",
          body: `<p>Detailed discussion and breakdown of relevant principles.</p>`,
          order: 1,
        },
      ],
    };
  }
};


