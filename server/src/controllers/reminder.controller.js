import Reminder from '../models/Reminder.js';
import WorkspaceSession from '../models/WorkspaceSession.js';
import User from '../models/User.js';
import {
  createReminderSchema,
  updateReminderSchema,
  createWorkspaceSessionSchema,
  updateQuietHoursSchema,
} from '../schemas/reminder.schema.js';
import mongoose from 'mongoose';

export const devRemindersMap = new Map();
export const devSessionsMap = new Map();

// -------------------------------------------------------------
// REMINDERS
// -------------------------------------------------------------
export async function getReminders(req, res, next) {
  try {
    const userId = req.user?.id || req.user?._id;
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const reminders = await Reminder.find({ userId }).sort({ remindAt: 1 }).lean();
      return res.json({ reminders });
    }

    const list = Array.from(devRemindersMap.values())
      .filter((r) => String(r.userId) === String(userId))
      .sort((a, b) => new Date(a.remindAt) - new Date(b.remindAt));

    return res.json({ reminders: list });
  } catch (err) {
    next(err);
  }
}

export async function createReminder(req, res, next) {
  try {
    const userId = req.user?.id || req.user?._id;
    const validated = createReminderSchema.parse(req.body);
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const reminder = await Reminder.create({
        userId,
        title: validated.title,
        remindAt: new Date(validated.remindAt),
        itemType: validated.itemType || 'custom',
        itemId: validated.itemId,
      });
      return res.status(201).json({ reminder });
    }

    const mockId = `rem_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const mockReminder = {
      _id: mockId,
      id: mockId,
      userId: String(userId),
      title: validated.title,
      remindAt: new Date(validated.remindAt).toISOString(),
      itemType: validated.itemType || 'custom',
      itemId: validated.itemId,
      isCompleted: false,
      notified: false,
      createdAt: new Date().toISOString(),
    };

    devRemindersMap.set(mockId, mockReminder);
    return res.status(201).json({ reminder: mockReminder });
  } catch (err) {
    next(err);
  }
}

export async function updateReminder(req, res, next) {
  try {
    const userId = req.user?.id || req.user?._id;
    const { id } = req.params;
    const validated = updateReminderSchema.parse(req.body);
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const updateData = { ...validated };
      if (updateData.remindAt) updateData.remindAt = new Date(updateData.remindAt);

      const reminder = await Reminder.findOneAndUpdate(
        { _id: id, userId },
        { $set: updateData },
        { new: true }
      ).lean();

      if (!reminder) {
        return res.status(404).json({ error: 'Reminder not found' });
      }
      return res.json({ reminder });
    }

    const existing = devRemindersMap.get(id);
    if (!existing || String(existing.userId) !== String(userId)) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    const updated = {
      ...existing,
      ...validated,
      remindAt: validated.remindAt ? new Date(validated.remindAt).toISOString() : existing.remindAt,
    };
    devRemindersMap.set(id, updated);
    return res.json({ reminder: updated });
  } catch (err) {
    next(err);
  }
}

export async function deleteReminder(req, res, next) {
  try {
    const userId = req.user?.id || req.user?._id;
    const { id } = req.params;
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const reminder = await Reminder.findOneAndDelete({ _id: id, userId });
      if (!reminder) {
        return res.status(404).json({ error: 'Reminder not found' });
      }
      return res.json({ success: true, message: 'Reminder deleted' });
    }

    const existing = devRemindersMap.get(id);
    if (!existing || String(existing.userId) !== String(userId)) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    devRemindersMap.delete(id);
    return res.json({ success: true, message: 'Reminder deleted' });
  } catch (err) {
    next(err);
  }
}

// -------------------------------------------------------------
// WORKSPACE SESSIONS
// -------------------------------------------------------------
export async function getWorkspaceSessions(req, res, next) {
  try {
    const userId = req.user?.id || req.user?._id;
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const sessions = await WorkspaceSession.find({ userId }).sort({ createdAt: -1 }).lean();
      return res.json({ sessions });
    }

    const list = Array.from(devSessionsMap.values())
      .filter((s) => String(s.userId) === String(userId))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.json({ sessions: list });
  } catch (err) {
    next(err);
  }
}

export async function createWorkspaceSession(req, res, next) {
  try {
    const userId = req.user?.id || req.user?._id;
    const validated = createWorkspaceSessionSchema.parse(req.body);
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const session = await WorkspaceSession.create({
        userId,
        name: validated.name,
        description: validated.description,
        links: validated.links,
      });
      return res.status(201).json({ session });
    }

    const mockId = `ws_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const mockSession = {
      _id: mockId,
      id: mockId,
      userId: String(userId),
      name: validated.name,
      description: validated.description || '',
      links: validated.links,
      createdAt: new Date().toISOString(),
    };

    devSessionsMap.set(mockId, mockSession);
    return res.status(201).json({ session: mockSession });
  } catch (err) {
    next(err);
  }
}

export async function deleteWorkspaceSession(req, res, next) {
  try {
    const userId = req.user?.id || req.user?._id;
    const { id } = req.params;
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const session = await WorkspaceSession.findOneAndDelete({ _id: id, userId });
      if (!session) {
        return res.status(404).json({ error: 'Workspace session not found' });
      }
      return res.json({ success: true, message: 'Workspace session deleted' });
    }

    const existing = devSessionsMap.get(id);
    if (!existing || String(existing.userId) !== String(userId)) {
      return res.status(404).json({ error: 'Workspace session not found' });
    }

    devSessionsMap.delete(id);
    return res.json({ success: true, message: 'Workspace session deleted' });
  } catch (err) {
    next(err);
  }
}

// -------------------------------------------------------------
// QUIET HOURS
// -------------------------------------------------------------
export async function updateQuietHours(req, res, next) {
  try {
    const userId = req.user?.id || req.user?._id;
    const validated = updateQuietHoursSchema.parse(req.body);
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      await User.findByIdAndUpdate(userId, {
        $set: { 'settings.quietHours': validated },
      });
    }

    return res.json({
      success: true,
      quietHours: validated,
      message: 'Quiet hours updated',
    });
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
