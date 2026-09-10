import Flashcard from '../models/Flashcard.js';
import { calculateSM2 } from '../services/sm2.service.js';
import { generateFlashcardDeck } from '../services/learning.service.js';
import {
  createFlashcardSchema,
  reviewFlashcardSchema,
  generateFlashcardsSchema,
} from '../schemas/flashcard.schema.js';
import mongoose from 'mongoose';

// Shared memory fallback
export const devFlashcardsMap = new Map();

export async function getFlashcards(req, res, next) {
  try {
    const userId = req.user?.id || req.user?._id;
    const { dueOnly, topic } = req.query;

    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const query = { userId };
      if (dueOnly === 'true') {
        query.nextReviewAt = { $lte: new Date() };
      }
      if (topic && topic !== 'all') {
        query.topic = topic;
      }

      const cards = await Flashcard.find(query).sort({ nextReviewAt: 1 }).lean();
      return res.json({ flashcards: cards });
    }

    // Memory fallback
    let list = Array.from(devFlashcardsMap.values()).filter(
      (c) => String(c.userId) === String(userId)
    );

    if (dueOnly === 'true') {
      const now = new Date();
      list = list.filter((c) => new Date(c.nextReviewAt) <= now);
    }
    if (topic && topic !== 'all') {
      list = list.filter((c) => c.topic?.toLowerCase() === topic.toLowerCase());
    }

    list.sort((a, b) => new Date(a.nextReviewAt) - new Date(b.nextReviewAt));
    return res.json({ flashcards: list });
  } catch (err) {
    next(err);
  }
}

export async function createFlashcard(req, res, next) {
  try {
    const userId = req.user?.id || req.user?._id;
    const validated = createFlashcardSchema.parse(req.body);

    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const card = await Flashcard.create({
        ...validated,
        userId,
      });
      return res.status(201).json({ flashcard: card });
    }

    // Memory fallback
    const mockId = 'card_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const mockCard = {
      _id: mockId,
      id: mockId,
      userId,
      ...validated,
      easeFactor: 2.5,
      interval: 1,
      repetitions: 0,
      nextReviewAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    devFlashcardsMap.set(mockId, mockCard);
    return res.status(201).json({ flashcard: mockCard });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: err.errors[0]?.message });
    }
    next(err);
  }
}

export async function reviewFlashcard(req, res, next) {
  try {
    const userId = req.user?.id || req.user?._id;
    const { id } = req.params;
    const { grade } = reviewFlashcardSchema.parse(req.body);

    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const card = await Flashcard.findOne({ _id: id, userId });
      if (!card) return res.status(404).json({ error: 'Flashcard not found' });

      const sm2Update = calculateSM2({
        easeFactor: card.easeFactor,
        interval: card.interval,
        repetitions: card.repetitions,
        grade,
      });

      card.easeFactor = sm2Update.easeFactor;
      card.interval = sm2Update.interval;
      card.repetitions = sm2Update.repetitions;
      card.nextReviewAt = sm2Update.nextReviewAt;
      await card.save();

      return res.json({ flashcard: card, reviewResult: sm2Update });
    }

    // Memory fallback
    const card = devFlashcardsMap.get(id);
    if (!card || String(card.userId) !== String(userId)) {
      return res.status(404).json({ error: 'Flashcard not found' });
    }

    const sm2Update = calculateSM2({
      easeFactor: card.easeFactor,
      interval: card.interval,
      repetitions: card.repetitions,
      grade,
    });

    const updated = {
      ...card,
      easeFactor: sm2Update.easeFactor,
      interval: sm2Update.interval,
      repetitions: sm2Update.repetitions,
      nextReviewAt: sm2Update.nextReviewAt.toISOString(),
    };
    devFlashcardsMap.set(id, updated);
    return res.json({ flashcard: updated, reviewResult: sm2Update });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: err.errors[0]?.message });
    }
    next(err);
  }
}

export async function generateDeck(req, res, next) {
  try {
    const userId = req.user?.id || req.user?._id;
    const { topic, content, count } = generateFlashcardsSchema.parse(req.body);

    const deck = await generateFlashcardDeck({ topic, content, count });

    const createdCards = [];
    const isDbConnected = mongoose.connection.readyState === 1;

    for (const item of deck) {
      if (isDbConnected) {
        const card = await Flashcard.create({
          userId,
          topic,
          sourceType: 'ai-generated',
          question: item.question,
          answer: item.answer,
        });
        createdCards.push(card);
      } else {
        const mockId = 'card_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
        const mockCard = {
          _id: mockId,
          id: mockId,
          userId,
          topic,
          sourceType: 'ai-generated',
          question: item.question,
          answer: item.answer,
          easeFactor: 2.5,
          interval: 1,
          repetitions: 0,
          nextReviewAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        };
        devFlashcardsMap.set(mockId, mockCard);
        createdCards.push(mockCard);
      }
    }

    return res.status(201).json({ flashcards: createdCards });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: err.errors[0]?.message });
    }
    next(err);
  }
}

export async function deleteFlashcard(req, res, next) {
  try {
    const userId = req.user?.id || req.user?._id;
    const { id } = req.params;

    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const result = await Flashcard.deleteOne({ _id: id, userId });
      if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'Flashcard not found' });
      }
      return res.json({ success: true, message: 'Flashcard deleted' });
    }

    const card = devFlashcardsMap.get(id);
    if (!card || String(card.userId) !== String(userId)) {
      return res.status(404).json({ error: 'Flashcard not found' });
    }
    devFlashcardsMap.delete(id);
    return res.json({ success: true, message: 'Flashcard deleted' });
  } catch (err) {
    next(err);
  }
}
