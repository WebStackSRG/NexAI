import * as promptService from "../services/prompt.service.js";

/**
 * GET /prompts — List user prompts
 */
export const listPrompts = async (req, res, next) => {
  try {
    const { search, tag } = req.query;
    const prompts = await promptService.getUserPrompts(req.user._id, {
      search,
      tag,
    });
    return res.json({ prompts });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /prompts — Create prompt
 */
export const createPrompt = async (req, res, next) => {
  try {
    const prompt = await promptService.createPrompt(req.user._id, req.body);
    return res.status(201).json({ prompt });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /prompts/:id — Get single prompt
 */
export const getPrompt = async (req, res, next) => {
  try {
    const prompt = await promptService.getPromptById(
      req.params.id,
      req.user._id,
    );
    if (!prompt) {
      return res.status(404).json({ error: "Prompt not found" });
    }
    return res.json({ prompt });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /prompts/:id — Update prompt
 */
export const updatePrompt = async (req, res, next) => {
  try {
    const prompt = await promptService.updatePrompt(
      req.params.id,
      req.user._id,
      req.body,
    );
    if (!prompt) {
      return res.status(404).json({ error: "Prompt not found" });
    }
    return res.json({ prompt });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /prompts/:id — Delete prompt
 */
export const deletePrompt = async (req, res, next) => {
  try {
    const success = await promptService.deletePrompt(
      req.params.id,
      req.user._id,
    );
    if (!success) {
      return res.status(404).json({ error: "Prompt not found" });
    }
    return res.json({ message: "Prompt deleted successfully" });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /prompts/:id/use — Record usage and interpolate variables
 */
export const usePrompt = async (req, res, next) => {
  try {
    const result = await promptService.recordPromptUse(
      req.params.id,
      req.user._id,
      req.body.variables || {},
    );
    return res.json(result);
  } catch (err) {
    next(err);
  }
};
