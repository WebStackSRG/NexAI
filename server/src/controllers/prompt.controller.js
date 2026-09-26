import * as promptService from '../services/prompt.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Returns all prompts for the authenticated user with optional filtering.
 * GET /api/prompts
 */
export const getPrompts = asyncHandler(async (req, res) => {
  const { tag, search, isFavorite } = req.query;
  const prompts = await promptService.getPrompts(req.user._id, { tag, search, isFavorite });
  res.status(200).json({ data: prompts });
});

/**
 * Creates a new prompt template.
 * POST /api/prompts
 */
export const createPrompt = asyncHandler(async (req, res) => {
  const prompt = await promptService.createPrompt(req.user._id, req.body);
  res.status(201).json({ data: prompt });
});

/**
 * Returns a specific prompt by ID.
 * GET /api/prompts/:id
 */
export const getPromptById = asyncHandler(async (req, res) => {
  const prompt = await promptService.getPromptById(req.user._id, req.params.id);
  res.status(200).json({ data: prompt });
});

/**
 * Updates an existing prompt template.
 * PATCH /api/prompts/:id
 */
export const updatePrompt = asyncHandler(async (req, res) => {
  const prompt = await promptService.updatePrompt(req.user._id, req.params.id, req.body);
  res.status(200).json({ data: prompt });
});

/**
 * Deletes a prompt template.
 * DELETE /api/prompts/:id
 */
export const deletePrompt = asyncHandler(async (req, res) => {
  const result = await promptService.deletePrompt(req.user._id, req.params.id);
  res.status(200).json({ data: result });
});
