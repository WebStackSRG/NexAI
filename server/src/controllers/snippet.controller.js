import Snippet from '../models/Snippet.js';
import { createSnippetSchema, updateSnippetSchema } from '../schemas/snippet.schema.js';
import mongoose from 'mongoose';

// Shared memory fallback for dev/offline resilience
export const devSnippetsMap = new Map();

export async function getSnippets(req, res, next) {
  try {
    const userId = req.user?.id || req.user?._id;
    const { language, tag, search } = req.query;

    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const query = { userId };
      if (language && language !== 'all') {
        query.language = language.toLowerCase();
      }
      if (tag) {
        query.tags = tag.toLowerCase();
      }
      if (search && search.trim()) {
        query.$or = [
          { title: { $regex: search.trim(), $options: 'i' } },
          { code: { $regex: search.trim(), $options: 'i' } },
          { description: { $regex: search.trim(), $options: 'i' } },
        ];
      }

      const snippets = await Snippet.find(query).sort({ updatedAt: -1 }).lean();
      return res.json({ snippets });
    }

    // Shared in-memory fallback
    let list = Array.from(devSnippetsMap.values()).filter(
      (s) => String(s.userId) === String(userId)
    );

    if (language && language !== 'all') {
      list = list.filter((s) => s.language?.toLowerCase() === language.toLowerCase());
    }
    if (tag) {
      list = list.filter((s) => s.tags?.some((t) => t.toLowerCase() === tag.toLowerCase()));
    }
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.title?.toLowerCase().includes(q) ||
          s.code?.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    return res.json({ snippets: list });
  } catch (err) {
    next(err);
  }
}

export async function createSnippet(req, res, next) {
  try {
    const userId = req.user?.id || req.user?._id;
    const validated = createSnippetSchema.parse(req.body);

    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const snippet = await Snippet.create({
        ...validated,
        userId,
        language: validated.language.toLowerCase(),
        tags: validated.tags ? validated.tags.map((t) => t.trim().toLowerCase()) : [],
      });
      return res.status(201).json({ snippet });
    }

    // Memory fallback
    const mockId = 'snip_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const mockSnippet = {
      _id: mockId,
      id: mockId,
      userId,
      ...validated,
      language: validated.language.toLowerCase(),
      tags: validated.tags ? validated.tags.map((t) => t.trim().toLowerCase()) : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    devSnippetsMap.set(mockId, mockSnippet);

    return res.status(201).json({ snippet: mockSnippet });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: err.errors[0]?.message || 'Validation error' });
    }
    next(err);
  }
}

export async function updateSnippet(req, res, next) {
  try {
    const userId = req.user?.id || req.user?._id;
    const { id } = req.params;
    const validated = updateSnippetSchema.parse(req.body);

    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const updateData = { ...validated, updatedAt: new Date() };
      if (validated.language) updateData.language = validated.language.toLowerCase();
      if (validated.tags) updateData.tags = validated.tags.map((t) => t.trim().toLowerCase());

      const snippet = await Snippet.findOneAndUpdate(
        { _id: id, userId },
        { $set: updateData },
        { new: true }
      ).lean();

      if (!snippet) {
        return res.status(404).json({ error: 'Snippet not found' });
      }
      return res.json({ snippet });
    }

    // Memory fallback
    const existing = devSnippetsMap.get(id);
    if (!existing || String(existing.userId) !== String(userId)) {
      return res.status(404).json({ error: 'Snippet not found' });
    }

    const updated = {
      ...existing,
      ...validated,
      language: validated.language ? validated.language.toLowerCase() : existing.language,
      tags: validated.tags ? validated.tags.map((t) => t.trim().toLowerCase()) : existing.tags,
      updatedAt: new Date().toISOString(),
    };
    devSnippetsMap.set(id, updated);
    return res.json({ snippet: updated });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: err.errors[0]?.message || 'Validation error' });
    }
    next(err);
  }
}

export async function deleteSnippet(req, res, next) {
  try {
    const userId = req.user?.id || req.user?._id;
    const { id } = req.params;

    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const result = await Snippet.deleteOne({ _id: id, userId });
      if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'Snippet not found' });
      }
      return res.json({ success: true, message: 'Snippet deleted' });
    }

    // Memory fallback
    const existing = devSnippetsMap.get(id);
    if (!existing || String(existing.userId) !== String(userId)) {
      return res.status(404).json({ error: 'Snippet not found' });
    }
    devSnippetsMap.delete(id);
    return res.json({ success: true, message: 'Snippet deleted' });
  } catch (err) {
    next(err);
  }
}
