import { InterviewSession } from '../models/InterviewSession.js';
import { LibraryItem } from '../models/LibraryItem.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { setupSse, sendSse, closeSse } from '../utils/sse.js';
import { deductCredits } from '../services/credit.service.js';
import {
  generateInterviewGreeting,
  streamInterviewTurn,
  generateInterviewScorecard,
} from '../agents/interview.agent.js';
import { logger } from '../utils/logger.js';

/**
 * Start a new interview session.
 * Metered with creditCheck & deductCredits.
 * POST /api/interview/start
 */
export const startInterview = asyncHandler(async (req, res) => {
  const { role, difficulty, topic, model: requestedModel } = req.body;
  const model = requestedModel || req.user.settings?.defaultModel || 'flash';
  const userId = req.user._id;

  // Generate greeting and initial question
  const { text: greetingText, tokensUsed } = await generateInterviewGreeting({
    role,
    difficulty,
    topic,
    model,
  });

  // Deduct credits for initial generation
  let creditsDeducted = 0;
  let creditsRemaining = req.user.wallet?.creditsRemaining ?? 0;

  if (tokensUsed > 0) {
    const deduction = await deductCredits({
      userId,
      tokensUsed,
      feature: 'interview',
      model,
    });
    creditsDeducted = deduction.creditsDeducted;
    creditsRemaining = deduction.creditsRemaining;
  }

  // Create session document
  const session = await InterviewSession.create({
    userId,
    role,
    difficulty,
    topic,
    status: 'in_progress',
    messages: [
      {
        role: 'assistant',
        content: greetingText,
        tokensUsed,
        timestamp: new Date(),
      },
    ],
    totalTokensUsed: tokensUsed,
  });

  res.status(201).json({
    session,
    creditsDeducted,
    creditsRemaining,
  });
});

/**
 * Streams interviewer critique & follow-up question via SSE.
 * Metered with creditCheck & deductCredits.
 * POST /api/interview/:id/respond
 */
export const respondInterview = async (req, res) => {
  const { id } = req.params;
  const { content, model: requestedModel } = req.body;
  const model = requestedModel || req.user.settings?.defaultModel || 'flash';
  const userId = req.user._id;

  let sseStarted = false;

  try {
    const session = await InterviewSession.findOne({ _id: id, userId });
    if (!session) {
      throw new ApiError(404, 'INTERVIEW_NOT_FOUND', 'Interview session not found');
    }

    if (session.status === 'completed') {
      throw new ApiError(400, 'INTERVIEW_COMPLETED', 'Interview session is already completed');
    }

    // Append candidate response
    session.messages.push({
      role: 'user',
      content,
      tokensUsed: 0,
      timestamp: new Date(),
    });

    // Initialize SSE streaming
    setupSse(res);
    sseStarted = true;

    let isClientConnected = true;
    req.on('close', () => {
      isClientConnected = false;
    });

    let fullText = '';
    let tokensUsed = 0;

    const stream = streamInterviewTurn({
      messages: session.messages,
      role: session.role,
      difficulty: session.difficulty,
      topic: session.topic,
      model,
    });

    for await (const chunk of stream) {
      if (!isClientConnected) {
        break;
      }

      if (chunk.text) {
        fullText += chunk.text;
        sendSse(res, 'token', { text: chunk.text });
      }

      if (chunk.usageMetadata) {
        const count =
          chunk.usageMetadata.totalTokenCount ??
          (chunk.usageMetadata.promptTokenCount || 0) +
            (chunk.usageMetadata.candidatesTokenCount || 0);
        if (count > 0) {
          tokensUsed = count;
        }
      }
    }

    // Fallback token estimation if usage metadata wasn't provided
    if (tokensUsed <= 0) {
      const totalChars =
        session.messages.reduce((sum, m) => sum + (m.content?.length || 0), 0) + fullText.length;
      tokensUsed = Math.max(1, Math.ceil(totalChars / 4));
    }

    const assistantMsg = {
      role: 'assistant',
      content: fullText,
      tokensUsed,
      timestamp: new Date(),
    };

    session.messages.push(assistantMsg);
    session.totalTokensUsed += tokensUsed;
    await session.save();

    // Deduct credits atomically
    const deduction = await deductCredits({
      userId,
      tokensUsed,
      feature: 'interview',
      model,
    });

    sendSse(res, 'done', {
      message: assistantMsg,
      tokensUsed,
      creditsDeducted: deduction.creditsDeducted,
      creditsRemaining: deduction.creditsRemaining,
    });

    closeSse(res);
  } catch (error) {
    logger.error({ error: error.message }, 'Error in respondInterview SSE stream');

    const cleanMessage =
      error.message?.includes('high demand') ||
      error.message?.includes('503') ||
      error.message?.includes('UNAVAILABLE')
        ? 'The interview model is currently experiencing high demand. Please try again shortly.'
        : error.message || 'An error occurred while streaming interview response';

    if (sseStarted) {
      sendSse(res, 'error', {
        code: error.code || 'INTERVIEW_STREAM_ERROR',
        message: cleanMessage,
      });
      closeSse(res);
    } else {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        error: {
          code: error.code || 'INTERVIEW_ERROR',
          message: cleanMessage,
          details: null,
        },
      });
    }
  }
};

/**
 * Conclude interview, generate performance scorecard, and auto-archive to Library.
 * Metered with creditCheck & deductCredits.
 * POST /api/interview/:id/conclude
 */
export const concludeInterview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { model: requestedModel } = req.body || {};
  const model = requestedModel || req.user.settings?.defaultModel || 'flash';
  const userId = req.user._id;

  const session = await InterviewSession.findOne({ _id: id, userId });
  if (!session) {
    throw new ApiError(404, 'INTERVIEW_NOT_FOUND', 'Interview session not found');
  }

  // If already completed and has scorecard, return it without duplicate charge
  if (session.status === 'completed' && session.scorecard) {
    const existingLibItem = await LibraryItem.findOne({
      userId,
      type: 'interview',
      'scorecard.overallScore': session.scorecard.overallScore,
      role: session.role,
    }).sort({ createdAt: -1 });

    return res.json({
      session,
      libraryItem: existingLibItem,
      creditsDeducted: 0,
      creditsRemaining: req.user.wallet?.creditsRemaining ?? 0,
    });
  }

  // Generate scorecard
  const { scorecard, tokensUsed } = await generateInterviewScorecard({
    session,
    model,
  });

  let creditsDeducted = 0;
  let creditsRemaining = req.user.wallet?.creditsRemaining ?? 0;

  if (tokensUsed > 0) {
    const deduction = await deductCredits({
      userId,
      tokensUsed,
      feature: 'interview',
      model,
    });
    creditsDeducted = deduction.creditsDeducted;
    creditsRemaining = deduction.creditsRemaining;
  }

  session.scorecard = scorecard;
  session.status = 'completed';
  session.totalTokensUsed += tokensUsed;
  await session.save();

  // Auto-archive scorecard & transcript to Library under polymorphic type 'interview'
  const cleanTags = Array.from(
    new Set([
      session.role.toLowerCase(),
      session.difficulty.toLowerCase(),
      'interview',
      ...(scorecard.recommendedTopics || []).map((t) => t.toLowerCase()),
    ]),
  ).slice(0, 5);

  const libraryItem = await LibraryItem.create({
    userId,
    type: 'interview',
    title: `Mock Interview: ${session.role} (${session.topic})`,
    summary:
      scorecard.summary ||
      `Comprehensive scorecard for ${session.role} mock interview. Rated ${scorecard.rating} with ${scorecard.overallScore}/100.`,
    tags: cleanTags,
    role: session.role,
    difficulty: session.difficulty,
    topic: session.topic,
    scorecard,
    transcript: session.messages.map((m) => ({
      role: m.role,
      content: m.content,
      timestamp: m.timestamp,
    })),
  });

  res.json({
    session,
    libraryItem,
    creditsDeducted,
    creditsRemaining,
  });
});

/**
 * List all interview sessions for the logged in user.
 * GET /api/interview
 */
export const getInterviews = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const sessions = await InterviewSession.find({ userId }).sort({ createdAt: -1 });

  res.json({
    interviews: sessions,
  });
});

/**
 * Get single interview session by ID.
 * GET /api/interview/:id
 */
export const getInterviewById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const session = await InterviewSession.findOne({ _id: id, userId });
  if (!session) {
    throw new ApiError(404, 'INTERVIEW_NOT_FOUND', 'Interview session not found');
  }

  res.json({
    interview: session,
  });
});
