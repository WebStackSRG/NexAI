import { sendSse } from './sse.js';

/**
 * Predefined simulated responses across common developer, architectural, and UI scenarios.
 * Completely eliminates Gemini API consumption during UI testing and offline viva demos.
 */
export function getSimulatedChatContent(prompt = '', attachments = []) {
  if (Array.isArray(attachments) && attachments.length > 0) {
    const att = attachments[0];
    const isImage = att.mimeType?.startsWith('image/');
    const isAudio = att.mimeType?.startsWith('audio/');
    const isVideo = att.mimeType?.startsWith('video/');
    const isPdf = att.mimeType?.includes('pdf') || att.name?.endsWith('.pdf');

    const fileType = isImage ? 'Image' : isAudio ? 'Audio' : isVideo ? 'Video' : isPdf ? 'PDF Document' : 'File Asset';

    const fullText = `### Multimodal Understanding: ${fileType} Analysis (${att.name || 'uploaded_media'})

I have successfully parsed and analyzed the uploaded **${fileType}** asset: \`${att.name || 'attachment'}\`.

#### 1. Extracted Insights & Perception Overview:
* **MIME Classification:** \`${att.mimeType || 'application/octet-stream'}\`
* **Analysis Scope:** Multimodal feature extraction processed with zero latency via NexAI multimodal engine.
* **Contextual Prompt:** "${prompt || 'Examine uploaded asset'}"

#### 2. Structural Breakdown:
* **Perception Channel:** ${isImage ? 'Visual geometry, optical characters (OCR), and color harmony patterns inspected.' : isAudio ? 'Acoustic waveform, speech cadence, and vocal transcription processed.' : isVideo ? 'Temporal sequence frames and keyframe transitions analyzed.' : 'Full-text semantics and document structural layout indexed.'}
* **Security & Verification:** Asset integrity verified with clean checksums and no malicious payloads detected.

\`\`\`json
{
  "asset": "${att.name || 'file'}",
  "type": "${fileType.toLowerCase()}",
  "mimeType": "${att.mimeType || 'unknown'}",
  "status": "ready_for_conversation"
}
\`\`\`

Feel free to ask specific questions about this ${fileType.toLowerCase()} or request code transformations!`;

    return {
      title: `${fileType}: ${att.name || 'Multimodal Asset'}`,
      fullText,
      followUps: [
        `Extract detailed insights from ${att.name || 'this file'}`,
        `Summarize key points in 3 bullets`,
        `Generate code handling this ${fileType.toLowerCase()} format`,
      ],
    };
  }

  const normalized = (prompt || '').toLowerCase().trim();

  // 1. Concept / Quantum Computing (ChatHero starter prompt)
  if (
    normalized.includes('quantum') ||
    (normalized.includes('concept') && !normalized.includes('css'))
  ) {
    const fullText = `### Quantum Computing: Intuitive Concepts & Superposition

Imagine a standard computer bit as a light switch: it can be either **OFF (0)** or **ON (1)**. In contrast, a **qubit** (quantum bit) behaves like a spinning coin: while it is spinning, it is in a state of **superposition**—both heads and tails simultaneously until you catch it.

#### 1. Core Quantum Principles:
* **Superposition:** A qubit exists in a linear combination of states $|\\psi\\rangle = \\alpha|0\\rangle + \\beta|1\\rangle$. While $n$ classical bits store 1 state at a time, $n$ qubits can represent $2^n$ states in parallel.
* **Entanglement:** Two or more qubits become inextricably correlated; measuring one instantly reveals the state of the other, regardless of physical separation.
* **Quantum Interference:** Quantum algorithms (like Shor's or Grover's) amplify constructive probabilities towards the correct answer while destructively canceling incorrect paths.

#### 2. Classical vs Quantum Comparison:

| Feature | Classical Computing | Quantum Computing |
| :--- | :--- | :--- |
| **Basic Unit** | Bit ($0$ or $1$) | Qubit ($|0\\rangle$, $|1\\rangle$, or superposition) |
| **State Space** | $n$ bits $\\rightarrow 1$ of $2^n$ values | $n$ qubits $\\rightarrow$ all $2^n$ states simultaneously |
| **Primary Strength** | Deterministic sequential logic | Combinatorial optimization & molecular simulation |

\`\`\`python
# Conceptual 2-Qubit Bell State Circuit (Qiskit)
from qiskit import QuantumCircuit

circuit = QuantumCircuit(2, 2)
circuit.h(0)         # Put qubit 0 into superposition (Hadamard gate)
circuit.cx(0, 1)     # Entangle qubit 0 and qubit 1 (CNOT gate)
circuit.measure([0, 1], [0, 1])
\`\`\`

#### Why it matters:
Quantum computers will not replace smartphones; they are specialized accelerators for problems like drug discovery, financial risk modeling, and cryptographic factoring.`;

    return {
      title: 'Quantum Computing Fundamentals',
      fullText,
      followUps: [
        'How is quantum computing different from classical computing?',
        'What is quantum cryptography and RSA encryption vulnerability?',
        'Show quantum computing code in Python using Qiskit',
      ],
    };
  }

  // 2. Python Script / CSV Dataset Transformation (ChatHero starter prompt)
  if (
    normalized.includes('csv') ||
    normalized.includes('dataset') ||
    (normalized.includes('python') && !normalized.includes('quantum'))
  ) {
    const fullText = `### Robust Python Script for CSV Dataset Ingestion & Cleansing

Here is a production-grade Python script designed to stream, validate, and transform a CSV dataset with automated schema checks, outlier detection, and summary reporting:

\`\`\`python
import csv
import sys
from dataclasses import dataclass
from typing import List, Optional
from pathlib import Path

@dataclass
class TransactionRecord:
    transaction_id: str
    user_id: str
    amount: float
    category: str
    status: str

def parse_and_clean_csv(input_path: Path) -> List[TransactionRecord]:
    valid_records: List[TransactionRecord] = []
    skipped_rows = 0

    if not input_path.exists():
        raise FileNotFoundError(f"Source file not found: {input_path}")

    with input_path.open(mode="r", encoding="utf-8") as file:
        reader = csv.DictReader(file)
        for line_num, row in enumerate(reader, start=2):
            try:
                # Sanitize and cast fields
                amount = float(row.get("amount", 0.0))
                if amount <= 0:
                    skipped_rows += 1
                    continue

                record = TransactionRecord(
                    transaction_id=row["transaction_id"].strip(),
                    user_id=row["user_id"].strip(),
                    amount=amount,
                    category=row.get("category", "General").strip().title(),
                    status=row.get("status", "pending").strip().lower()
                )
                valid_records.append(record)
            except (ValueError, KeyError) as err:
                print(f"[Row {line_num}] Skipping invalid record: {err}", file=sys.stderr)
                skipped_rows += 1

    print(f"Processed: {len(valid_records)} valid records | {skipped_rows} skipped.")
    return valid_records

if __name__ == "__main__":
    sample_file = Path("data/transactions.csv")
    # Example execution: parse_and_clean_csv(sample_file)
\`\`\`

#### Architectural Highlights:
1. **Memory Efficiency:** Uses streaming dict iterators rather than holding multi-gigabyte unparsed buffers.
2. **Strict Typing:** \`dataclass\` ensures downstream consumers receive predictable, type-safe structures.
3. **Resilient Error Logging:** Malformed rows are logged to \`sys.stderr\` without aborting the entire batch.`;

    return {
      title: 'Python CSV Data Pipeline',
      fullText,
      followUps: [
        'How do we handle missing values and malformed CSV rows?',
        'Add data visualization with matplotlib or seaborn',
        'Convert this script into an asynchronous FastAPI endpoint',
      ],
    };
  }

  // 3. Professional Email / Interview Follow-up (ChatHero starter prompt)
  if (
    normalized.includes('email') ||
    normalized.includes('letter') ||
    normalized.includes('follow-up') ||
    normalized.includes('draft')
  ) {
    const fullText = `### High-Impact Post-Interview Follow-Up Email

Here is an authentic, professional follow-up email template tailored for software engineering and technical roles. It references specific architectural conversations to leave a memorable impression:

---

**Subject:** Thank You - [Role Title] Interview | [Your Name]

Dear [Interviewer Name / Hiring Manager],

Thank you for taking the time to speak with me today regarding the **[Role Title]** role at **[Company Name]**.

I particularly enjoyed our discussion around [mention a specific challenge discussed, e.g., transitioning to event-driven microservices / scaling your database indexing]. It reaffirmed my enthusiasm for this role, as my background in [your primary strength, e.g., Node.js backend systems & distributed caching] directly aligns with the technical goals you outlined for the team this quarter.

Please let me know if you need any additional code samples, architectural diagrams, or references from my previous projects. I look forward to hearing about the next steps in the process.

Warm regards,

**[Your Full Name]**  
[Your Portfolio / GitHub URL] · [Your LinkedIn] · [Your Phone Number]

---

#### 💡 Best Practice Tips:
* **Timing:** Send within 12 to 24 hours of concluding your interview.
* **Personalization:** Always replace the bracketed sections with concrete technical discussion points from the interview.
* **Tone:** Confident, appreciative, and concise—under 200 words is ideal.`;

    return {
      title: 'Professional Follow-Up Email',
      fullText,
      followUps: [
        'Make this email shorter and more concise',
        'Draft a polite salary negotiation email template',
        'How should I reply if they ask for code samples?',
      ],
    };
  }

  // 4. Redis / Caching Strategy / System Architecture (ChatHero starter prompt)
  if (
    normalized.includes('redis') ||
    normalized.includes('caching') ||
    normalized.includes('cache')
  ) {
    const fullText = `### Production Caching Strategy with Redis & Cache-Aside Architecture

High-throughput APIs require a multi-tiered caching strategy to protect primary database connection pools and maintain sub-10ms response latencies.

Here is the recommended **Cache-Aside (Lazy Loading)** implementation in Node.js with connection pooling, stampede protection, and automatic TTL expiration:

\`\`\`javascript
import Redis from 'ioredis';
import { logger } from '../utils/logger.js';

// 1. Connection Pool with Auto-Reconnect
export const redisClient = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  lazyConnect: true,
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 100, 3000),
});

/**
 * Cache-Aside Fetcher with Jittered TTL to Prevent Thundering Herd
 */
export async function fetchWithCache(cacheKey, fetchDbFn, ttlSeconds = 300) {
  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (err) {
    logger.warn({ err: err.message, cacheKey }, 'Redis read fallback to DB');
  }

  // Cache miss: execute primary database query
  const freshData = await fetchDbFn();

  if (freshData) {
    try {
      // Add random jitter (±10%) to prevent simultaneous batch expirations
      const jitter = Math.floor(Math.random() * (ttlSeconds * 0.2)) - (ttlSeconds * 0.1);
      const effectiveTtl = Math.max(30, Math.floor(ttlSeconds + jitter));
      await redisClient.set(cacheKey, JSON.stringify(freshData), 'EX', effectiveTtl);
    } catch (err) {
      logger.error({ err: err.message, cacheKey }, 'Redis write failure');
    }
  }

  return freshData;
}
\`\`\`

#### Key Architectural Defenses:
1. **Cache Stampede Prevention:** Jittered TTL spreads expirations over a distribution curve.
2. **Graceful Fallback:** If Redis is down, queries seamlessly fall back to MongoDB/PostgreSQL without crashing the request.
3. **Sticky Code Ergonomics:** Notice the header pins to the viewport as you scroll.`;

    return {
      title: 'Scalable Redis Caching Strategy',
      fullText,
      followUps: [
        'How do we prevent Cache Stampede and Cache Penetration?',
        'Compare Redis Sentinel vs Redis Cluster for high availability',
        'Implement distributed locking with Redlock in Node.js',
      ],
    };
  }

  // 5. Connection Pooling / Database Bottlenecks (Follow-up scenario)
  if (
    normalized.includes('connection pool') ||
    normalized.includes('pool') ||
    normalized.includes('bottleneck')
  ) {
    const fullText = `### High-Concurrency Database Connection Pooling & Bottleneck Defense

When incoming write traffic spikes 10x, uncontrolled database connection spawning leads to **thread exhaustion, memory ballooning, and connection timeouts**.

\`\`\`javascript
// Recommended Mongoose / MongoDB Connection Pool Configuration
import mongoose from 'mongoose';

export async function connectWithPool(mongoUri) {
  return mongoose.connect(mongoUri, {
    maxPoolSize: 50,         // Max simultaneous sockets per Node process
    minPoolSize: 10,         // Maintain active warm connections
    socketTimeoutMS: 45000,  // Terminate stale slow queries
    serverSelectionTimeoutMS: 5000,
    heartbeatFrequencyMS: 10000,
  });
}
\`\`\`

#### Core Architectural Mechanics:
1. **Queuing vs Rejection:** When all 50 pool slots are occupied, subsequent queries queue in memory. If wait time exceeds \`serverSelectionTimeoutMS\`, fail fast with a 503 instead of hanging the HTTP client.
2. **Connection Starvation:** Always add indexes on foreign keys and filter fields; a single unindexed collection scan locks a pool connection for seconds.
3. **Circuit Breaking:** Use an active circuit breaker (e.g. Opossum) around database calls to shed load when P99 latency crosses 250ms.`;

    return {
      title: 'Database Connection Pool Architecture',
      fullText,
      followUps: [
        'How do we size connection pools for PostgreSQL and MongoDB?',
        'How does database indexing impact pool connection hold time?',
        'Implement circuit breakers in Express with opossum',
      ],
    };
  }

  // 6. Vitest Integration Testing (Follow-up scenario)
  if (
    normalized.includes('vitest') ||
    normalized.includes('test')
  ) {
    const fullText = `### Vitest Integration Testing for Express & SSE Endpoints

Here is a clean Vitest integration test leveraging \`supertest\` and isolated mock databases:

\`\`\`javascript
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { User } from '../src/models/User.js';
import { createAuthToken } from './helpers/auth.helper.js';

describe('Order Creation & Idempotency Pipeline', () => {
  let authToken;

  beforeEach(async () => {
    const user = await User.create({
      email: 'test@nexai.internal',
      wallet: { creditsRemaining: 50 },
    });
    authToken = createAuthToken(user);
  });

  it('rejects order with 400 when items array is empty', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', \`Bearer \${authToken}\`)
      .send({ customerId: 'cust_123', items: [] });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('creates order and deducts credits atomically', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', \`Bearer \${authToken}\`)
      .send({
        customerId: 'cust_123',
        items: [{ productId: 'prod_99', quantity: 2, unitPrice: 250 }],
      });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('confirmed');
  });
});
\`\`\`

#### Key Testing Best Practices:
* **In-Memory Database Isolation:** Run tests with \`mongodb-memory-server\` to ensure zero network pollution.
* **Deterministic Fixtures:** Clean database state in \`beforeEach\` rather than \`afterEach\` to simplify post-mortem inspection on failure.`;

    return {
      title: 'Vitest Integration Test Suite',
      fullText,
      followUps: [
        'How do we run tests in parallel without database race conditions?',
        'Add code coverage thresholds in vitest.config.js',
        'How do we test Server-Sent Events (SSE) in Vitest?',
      ],
    };
  }

  // 7. GPU Hardware Acceleration & CSS (Follow-up scenario)
  if (
    normalized.includes('hardware') ||
    normalized.includes('gpu')
  ) {
    const fullText = `### GPU Hardware Acceleration in Modern Web Interfaces

Browsers render web pages across three main pipelines: **Layout (Reflow) $\\rightarrow$ Paint $\\rightarrow$ Composite**.

#### 1. Why Composite-Only Properties Matter:
Properties like \`transform\`, \`opacity\`, and \`filter\` can be offloaded entirely to the GPU compositor thread without forcing the CPU to recalculate page layout or repaint pixels.

\`\`\`css
/* High-performance GPU compositor reveal */
.smoothReveal {
  will-change: transform, opacity;
  transform: translateZ(0); /* Promotes layer to GPU */
  animation: liquidTokenReveal 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes liquidTokenReveal {
  from {
    opacity: 0.4;
    transform: translateY(2px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
\`\`\`

#### 2. Performance Comparison:
* **Costly Reflows:** Animating \`height\`, \`top\`, \`margin\` triggers a cascading layout recalculation of all surrounding DOM nodes (15-30ms CPU stall).
* **Zero-Reflow GPU:** Animating \`transform: translateY()\` isolates changes to an individual GPU texture, guaranteeing silky 60fps / 120fps scrolling.`;

    return {
      title: 'GPU Accelerated CSS Rendering',
      fullText,
      followUps: [
        'What is the difference between repaint and layout reflow?',
        'How does will-change affect GPU memory usage?',
        'Benchmark animation frame rates using Chrome DevTools',
      ],
    };
  }

  // 8. NexAI Viva Moats & Architecture (Follow-up scenario)
  if (
    normalized.includes('viva') ||
    normalized.includes('moat')
  ) {
    const fullText = `### The 5 Core Engineering Moats of NexAI for Academic Viva

When presenting NexAI to evaluators, focus on these five core architectural moats that elevate the project above typical toy wrapper apps:

1. **Exact Gemini Token Telemetry Metering:**
   Deductions do not use fabricated estimates. The server reads \`response.usageMetadata.totalTokenCount\` directly from the Gemini 2.5/3.8 engine and computes \`ceil(tokens / 100)\` atomically.
2. **Hybrid RAG Retrieval Pipeline:**
   Combines Pinecone 768-dimensional cosine vector embeddings with MongoDB text indexes, delivering high-precision contextual search across personal documents.
3. **Zero-Quota Voice Processing:**
   Speech recognition and synthesis run on client-side native browser engines via the Web Speech API (\`webkitSpeechRecognition\` & \`speechSynthesis\`), saving thousands of dollars in third-party STT/TTS API bills.
4. **Resilient Offline Simulation Engine:**
   You are running in Simulation Mode right now! An intelligent simulation layer allows full end-to-end demonstrations (streaming SSE, sticky code blocks, and follow-up chips) with zero token costs and zero external API dependency.
5. **Strict Multi-Tenant User Isolation:**
   Every single MongoDB query, vector index query, and SSE stream is strictly scoped to \`req.user._id\` validated via stateless JWT middleware.`;

    return {
      title: 'NexAI 5 Core Architectural Moats',
      fullText,
      followUps: [
        'How does real token-based utility metering work?',
        'Show the multi-chunk vector search architecture',
        'How do Razorpay webhooks atomically grant credits?',
      ],
    };
  }

  // 9. Real Token-based Utility Metering (Follow-up scenario)
  if (
    normalized.includes('meter') ||
    normalized.includes('utility') ||
    normalized.includes('credit')
  ) {
    const fullText = `### Real Token-Based Utility Metering Architecture

NexAI treats AI compute as a metered utility (like electricity or water), guaranteeing that API costs never exceed customer balances.

\`\`\`javascript
// Atomic Credit Ledger Deductor (server/src/services/credit.service.js)
export async function deductCredits({ userId, tokensUsed, feature, model }) {
  const creditsToDeduct = Math.ceil(tokensUsed / 100);

  const updatedUser = await User.findOneAndUpdate(
    {
      _id: userId,
      'wallet.creditsRemaining': { $gte: creditsToDeduct }, // Atomic balance guard
    },
    {
      $inc: {
        'wallet.creditsRemaining': -creditsToDeduct,
        'wallet.totalCreditsUsed': creditsToDeduct,
      },
    },
    { new: true }
  );

  if (!updatedUser) {
    throw new ApiError(402, 'INSUFFICIENT_CREDITS', 'Balance depleted');
  }

  // Write immutable audit log
  await UsageLog.create({
    userId,
    feature,
    model,
    tokensUsed,
    creditsDeducted: creditsToDeduct,
  });

  return { creditsDeducted: creditsToDeduct, creditsRemaining: updatedUser.wallet.creditsRemaining };
}
\`\`\`

#### Key Guarantees:
* **No Negative Balances:** The \`$gte\` query operator guarantees that concurrent requests cannot overdraft the wallet below 0.
* **Audit Trail:** Every token spent is permanently recorded in \`UsageLog\` for user transparency.`;

    return {
      title: 'Token Metering & Ledger Pipeline',
      fullText,
      followUps: [
        'Explain the 5 core moats of NexAI for viva',
        'Show the multi-chunk vector search architecture',
        'How do Razorpay webhooks atomically grant credits?',
      ],
    };
  }

  // 10. Multi-Chunk Vector Search & Hybrid RAG (Follow-up scenario)
  if (
    normalized.includes('vector') ||
    normalized.includes('rag') ||
    normalized.includes('chunk') ||
    normalized.includes('pinecone')
  ) {
    const fullText = `### Multi-Chunk Hybrid Vector Retrieval Architecture

NexAI implements a high-performance RAG pipeline to ground AI responses in your saved library items and prompt notes:

\`\`\`text
[Document Upload] ──> [Recursive Token Chunking (500 tokens, 50 overlap)]
                            │
                            ▼
              [Gemini text-embedding-004] (768 Dimensions)
                            │
                            ▼
             [Pinecone Vector Index (Cosine Similarity)]
                            │
               [Query: "caching in Express"]
                            │
                            ▼
[Top-k Vector Matches (Score > 0.75)] + [MongoDB Full-Text Filter]
                            │
                            ▼
          [Augmented Context Prompt injected into Gemini]
\`\`\`

#### Key RAG Principles:
1. **User Namespace Isolation:** All vectors in Pinecone are namespaced by \`userId\`. A query from User A will never match vectors from User B.
2. **Hybrid Reranking:** Vector similarity finds conceptual relevance, while MongoDB regex handles exact identifiers (like \`ord_8923\`).`;

    return {
      title: 'Multi-Chunk Hybrid RAG Pipeline',
      fullText,
      followUps: [
        'Explain the 5 core moats of NexAI for viva',
        'How does real token-based utility metering work?',
        'How do we optimize vector search latency under 50ms?',
      ],
    };
  }

  // 11. Backend Service & Sticky Code Header
  if (
    normalized.includes('code') ||
    normalized.includes('api') ||
    normalized.includes('express') ||
    normalized.includes('node') ||
    normalized.includes('sticky') ||
    normalized.includes('backend') ||
    normalized.includes('service')
  ) {
    const fullText = `### Production-Ready Service Architecture & Resilient Middleware

To build a high-throughput, production-grade service in Node.js and Express, we decouple route definitions, input validation, and business logic into layered tiers.

Here is a complete, resilient implementation featuring connection pooling, Zod validation, and atomic state transitions:

\`\`\`javascript
import express from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// 1. Strict Schema Validation
const CreateOrderSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().positive(),
    unitPrice: z.number().positive(),
  })).min(1, 'Order must contain at least one item'),
  currency: z.enum(['INR', 'USD']).default('INR'),
  metadata: z.record(z.unknown()).optional(),
});

// 2. High-Performance Controller Layer
router.post(
  '/orders',
  asyncHandler(async (req, res) => {
    const validatedData = CreateOrderSchema.parse(req.body);
    logger.info({ customerId: validatedData.customerId }, 'Processing new order transaction');

    // Calculate total amount atomically
    const totalAmount = validatedData.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );

    // Simulated atomic database reservation
    const orderRecord = {
      orderId: \`ord_\${Date.now()}_\${Math.random().toString(36).substring(2, 7)}\`,
      customerId: validatedData.customerId,
      totalAmount,
      currency: validatedData.currency,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };

    return res.status(201).json({
      success: true,
      message: 'Order created successfully with persistent idempotency lock',
      data: orderRecord,
    });
  })
);

export default router;
\`\`\`

#### Key Architectural Considerations:
1. **Sticky Header & Ergonomics:** As you scroll through the multi-line code block above, notice how the code header stays pinned at the top with the language label and **Copy** action.
2. **Zero-Latency Streaming:** Tokens are streamed smoothly with realistic interval delays.
3. **Idempotency Safeguard:** Real-world transaction pipelines prevent double execution through unique order indexes.`;

    return {
      title: 'Production Service Implementation',
      fullText,
      followUps: [
        'How do we add Redis caching to this route?',
        'Explain how connection pooling prevents bottlenecks',
        'Write comprehensive Vitest integration tests for this endpoint',
      ],
    };
  }

  // 12. UI / CSS / Animations / Liquid Blur
  if (
    normalized.includes('css') ||
    normalized.includes('ui') ||
    normalized.includes('animation') ||
    normalized.includes('blur') ||
    normalized.includes('liquid') ||
    normalized.includes('react')
  ) {
    const fullText = `### Liquid Blur Token Reveal & Glassmorphism Design Tokens

Modern AI interfaces achieve an ultra-smooth typing experience using GPU-accelerated CSS animations combined with semantic design tokens.

Here is the modular CSS architecture that powers our liquid blur reveal and sticky glassmorphic code headers:

\`\`\`scss
@use '@/styles/abstracts' as *;

// 1. Liquid Blur Animation for Streaming Tokens
@keyframes tokenLiquidReveal {
  0% {
    opacity: 0.5;
    filter: blur(3px);
    transform: translateY(2px);
  }
  100% {
    opacity: 1;
    filter: blur(0px);
    transform: translateY(0);
  }
}

// 2. Sticky Glassmorphic Code Header
.codeContainer {
  position: relative;
  margin: var(--space-4) 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-bg-surface);
}

.stickyHeader {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-2) var(--space-4);
  background-color: color-mix(in srgb, var(--color-bg-elevated) 92%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--color-border);
  border-top-left-radius: calc(var(--radius-md) - 1px);
  border-top-right-radius: calc(var(--radius-md) - 1px);
}
\`\`\`

#### Visual & Ergonomic Benefits:
* **Hardware Accelerated:** Animations rely on \`transform\` and \`filter\`, running at a steady 60fps on the GPU compositor thread without triggering costly browser layout repaints.
* **Persistent Copy Button:** The copy and language controls remain in immediate view even when navigating through large 100-line scripts.`;

    return {
      title: 'CSS Liquid Blur & Sticky Header',
      fullText,
      followUps: [
        'How does GPU hardware acceleration optimize CSS?',
        'Make this component responsive for mobile viewports',
        'Add keyboard navigation and focus management',
      ],
    };
  }

  // 13. Default Scenario: NexAI Architecture Overview
  const fullText = `### NexAI Architecture & Utility Metering Platform

NexAI transforms traditional AI conversational tools into a **cost-controlled AI SaaS platform** with metered billing, hybrid vector search, and unified knowledge management.

\`\`\`javascript
// Core Token-to-Credit Ledger Calculation
export function tokensToCredits(totalTokens) {
  if (!totalTokens || totalTokens <= 0) return 0;
  const CREDITS_PER_100_TOKENS = 1;
  // credits = ceil(totalTokens / 100)
  return Math.ceil(totalTokens / 100) * CREDITS_PER_100_TOKENS;
}
\`\`\`

#### Key Platform Capabilities:
* **Utility Metering:** Deductions match real Gemini token consumption returned in API telemetry.
* **Hybrid RAG Retrieval:** Combines Pinecone vector embeddings with MongoDB text matching for comprehensive search.
* **Zero Token Cost Simulation:** You are currently testing in **Simulation Mode** (0 Gemini tokens consumed).`;

  return {
    title: 'NexAI Architecture Overview',
    fullText,
    followUps: [
      'Explain the 5 core moats of NexAI for viva',
      'How does real token-based utility metering work?',
      'Show the multi-chunk vector search architecture',
    ],
  };
}

/**
 * Streams simulated response over Server-Sent Events with realistic delays.
 *
 * @param {Object} options
 * @param {import('express').Response} options.res
 * @param {string} options.prompt
 * @param {() => boolean} options.isClientConnected
 * @returns {Promise<{ fullText: string, followUps: string[], title: string }>}
 */
export async function streamChatSimulation({ res, prompt, attachments = [], isClientConnected }) {
  const { title, fullText, followUps } = getSimulatedChatContent(prompt, attachments);

  // Split into realistic word/token chunks
  const chunks = fullText.match(/\S+\s*/g) || [fullText];
  const delayMs = process.env.NODE_ENV === 'test' ? 0 : 15;

  for (let i = 0; i < chunks.length; i++) {
    if (!isClientConnected()) {
      break;
    }

    const chunk = chunks[i];
    sendSse(res, 'token', { text: chunk });

    // Realistic streaming interval in browser (15ms), instant in tests
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return {
    title,
    fullText,
    followUps,
  };
}
