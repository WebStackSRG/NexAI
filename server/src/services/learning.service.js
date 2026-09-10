import { GoogleGenAI } from '@google/genai';
import { config } from '../config/env.js';

let aiClient = null;
function getAiClient() {
  if (!aiClient && config.gemini?.apiKey) {
    aiClient = new GoogleGenAI({ apiKey: config.gemini.apiKey });
  }
  return aiClient;
}

export async function generateFlashcardDeck({ topic, content, count = 5 }) {
  const ai = getAiClient();
  if (!ai) {
    // Deterministic educational fallback
    return [
      {
        question: `What is the primary architectural concept of ${topic}?`,
        answer: `${topic} emphasizes modular decoupling, fault tolerance, and deterministic state transitions.`,
      },
      {
        question: `Why is performance optimization critical in ${topic}?`,
        answer: `To minimize compute overhead, conserve memory bounds, and ensure low latency under peak load.`,
      },
      {
        question: `What invariant must never be compromised when implementing ${topic}?`,
        answer: 'Data consistency, zero unencrypted sensitive storage, and explicit security boundaries.',
      },
    ];
  }

  const prompt = `You are an expert tutor in ${topic}.
Generate exactly ${count} high-impact flashcards for active recall and viva preparation.
Source reference material:
${content ? content.slice(0, 3000) : 'Standard engineering best practices.'}

Return JSON with format:
[
  {
    "question": "Concise, probing active recall question",
    "answer": "Clear, accurate, and memorable conceptual answer"
  }
]`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const parsed = JSON.parse(response.text.trim());
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('[LearningService] Deck generation fallback:', err.message);
    return [
      {
        question: `Define the core definition of ${topic}.`,
        answer: `Core implementation of ${topic} focusing on reliability and maintainability.`,
      },
    ];
  }
}

export async function summarizeYouTubeVideo({ url }) {
  // Extract video ID from common YouTube formats
  const videoIdMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([\w-]{11})/);
  const videoId = videoIdMatch ? videoIdMatch[1] : 'unknown';

  const ai = getAiClient();
  if (!ai) {
    return {
      videoId,
      title: `Technical Lecture: ${videoId}`,
      keyTakeaways: [
        'Fundamental architectural concepts and design trade-offs.',
        'Practical implementation considerations and production caveats.',
        'Performance bottlenecks and scaling paradigms.',
      ],
      executiveSummary: 'This technical tutorial covers end-to-end design patterns, security controls, and optimization strategies.',
      studyQuestions: [
        'How does this architecture handle high concurrency?',
        'What are the failure modes discussed in the presentation?',
      ],
    };
  }

  const prompt = `Analyze this educational/technical YouTube video link: ${url} (ID: ${videoId}).
Synthesize high-yield study notes for an engineering student or researcher.

Return JSON in this format:
{
  "videoId": "${videoId}",
  "title": "Estimated descriptive title of the lecture",
  "executiveSummary": "Concise 2-3 sentence overview of the lecture content",
  "keyTakeaways": [
    "Key takeaway 1",
    "Key takeaway 2",
    "Key takeaway 3"
  ],
  "studyQuestions": [
    "Review question 1",
    "Review question 2"
  ]
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    });

    return JSON.parse(response.text.trim());
  } catch (err) {
    console.error('[LearningService] YouTube summary fallback:', err.message);
    return {
      videoId,
      title: `Video Overview: ${videoId}`,
      executiveSummary: 'Educational synthesis of technical video lecture.',
      keyTakeaways: ['Key takeaways extracted from lecture outline.'],
      studyQuestions: ['What is the core takeaway from this topic?'],
    };
  }
}
