import Prompt from "../models/Prompt.js";
import { getDbStatus } from "../config/db.js";

// In-memory dev storage fallback for prompts
const devPromptsMap = new Map();

/**
 * Extract variable names from template text: {{variableName}}
 */
export const extractVariables = (template = "") => {
  const matches = template.match(/\{\{([a-zA-Z0-9_]+)\}\}/g) || [];
  const uniqueVars = [
    ...new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, "").trim())),
  ];
  return uniqueVars;
};

/**
 * List prompts for user with optional search and tag filter
 */
export const getUserPrompts = async (userId, { search = "", tag = "" } = {}) => {
  const uId = userId.toString();

  if (getDbStatus().isConnected) {
    try {
      const query = { userId };
      if (tag) {
        query.tags = tag;
      }
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: "i" } },
          { template: { $regex: search, $options: "i" } },
          { tags: { $regex: search, $options: "i" } },
        ];
      }
      return await Prompt.find(query)
        .sort({ pinned: -1, lastUsedAt: -1, createdAt: -1 })
        .lean();
    } catch (err) {
      console.warn("[PromptService] Mongo find failed:", err.message);
    }
  }

  // Fallback in-memory query
  let list = Array.from(devPromptsMap.values()).filter((p) => p.userId === uId);

  if (tag) {
    list = list.filter((p) => (p.tags || []).includes(tag));
  }
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.template.toLowerCase().includes(q) ||
        (p.tags || []).some((t) => t.toLowerCase().includes(q)),
    );
  }

  return list.sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
};

/**
 * Get prompt by ID
 */
export const getPromptById = async (promptId, userId) => {
  const uId = userId.toString();
  if (getDbStatus().isConnected) {
    try {
      const prompt = await Prompt.findOne({ _id: promptId, userId }).lean();
      if (prompt) return prompt;
    } catch (err) {
      // Fall through to dev map
    }
  }

  const prompt = devPromptsMap.get(promptId);
  if (prompt && prompt.userId === uId) {
    return prompt;
  }
  return null;
};

/**
 * Create new prompt template
 */
export const createPrompt = async (
  userId,
  { title, template, tags = [], pinned = false },
) => {
  const uId = userId.toString();
  const variables = extractVariables(template);

  if (getDbStatus().isConnected) {
    try {
      const prompt = new Prompt({
        userId,
        title,
        template,
        variables,
        tags,
        pinned,
        useCount: 0,
      });
      await prompt.save();
      return prompt.toObject();
    } catch (err) {
      console.warn("[PromptService] Mongo save failed:", err.message);
    }
  }

  const mockId = `dev-prompt-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const newPrompt = {
    _id: mockId,
    id: mockId,
    userId: uId,
    title,
    template,
    variables,
    tags,
    pinned,
    useCount: 0,
    lastUsedAt: null,
    createdAt: new Date(),
  };

  devPromptsMap.set(mockId, newPrompt);
  return newPrompt;
};

/**
 * Update existing prompt
 */
export const updatePrompt = async (
  promptId,
  userId,
  { title, template, tags, pinned },
) => {
  const uId = userId.toString();
  const updates = {};

  if (title !== undefined) updates.title = title;
  if (template !== undefined) {
    updates.template = template;
    updates.variables = extractVariables(template);
  }
  if (tags !== undefined) updates.tags = tags;
  if (pinned !== undefined) updates.pinned = pinned;

  if (getDbStatus().isConnected) {
    try {
      const updated = await Prompt.findOneAndUpdate(
        { _id: promptId, userId },
        { $set: updates },
        { returnDocument: "after" },
      ).lean();
      if (updated) return updated;
    } catch (err) {
      console.warn("[PromptService] Mongo update failed:", err.message);
    }
  }

  const prompt = devPromptsMap.get(promptId);
  if (prompt && prompt.userId === uId) {
    Object.assign(prompt, updates);
    return prompt;
  }

  return null;
};

/**
 * Delete prompt
 */
export const deletePrompt = async (promptId, userId) => {
  const uId = userId.toString();

  if (getDbStatus().isConnected) {
    try {
      const res = await Prompt.deleteOne({ _id: promptId, userId });
      return res.deletedCount > 0;
    } catch (err) {
      console.warn("[PromptService] Mongo delete failed:", err.message);
    }
  }

  const prompt = devPromptsMap.get(promptId);
  if (prompt && prompt.userId === uId) {
    devPromptsMap.delete(promptId);
    return true;
  }
  return false;
};

/**
 * Record prompt usage and interpolate variables
 */
export const recordPromptUse = async (
  promptId,
  userId,
  variablesInput = {},
) => {
  const prompt = await getPromptById(promptId, userId);
  if (!prompt) {
    throw new Error("Prompt not found");
  }

  // Interpolate variables
  let filledPrompt = prompt.template;
  for (const [key, val] of Object.entries(variablesInput)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
    filledPrompt = filledPrompt.replace(regex, val);
  }

  // Increment use count and record timestamp
  if (getDbStatus().isConnected) {
    try {
      await Prompt.findByIdAndUpdate(promptId, {
        $inc: { useCount: 1 },
        $set: { lastUsedAt: new Date() },
      });
    } catch (err) {
      console.warn("[PromptService] Mongo recordUse failed:", err.message);
    }
  }

  prompt.useCount = (prompt.useCount || 0) + 1;
  prompt.lastUsedAt = new Date();

  return {
    prompt,
    filledPrompt,
  };
};
