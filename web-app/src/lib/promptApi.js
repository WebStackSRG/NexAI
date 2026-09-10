import apiClient from "./apiClient";

/**
 * List prompts with optional search and tag filter
 */
export const fetchPrompts = async (params = {}) => {
  const res = await apiClient.get("/prompts", { params });
  return res.data.prompts;
};

/**
 * Get prompt by ID
 */
export const fetchPromptById = async (id) => {
  const res = await apiClient.get(`/prompts/${id}`);
  return res.data.prompt;
};

/**
 * Create prompt
 */
export const createPrompt = async (data) => {
  const res = await apiClient.post("/prompts", data);
  return res.data.prompt;
};

/**
 * Update prompt
 */
export const updatePrompt = async (id, data) => {
  const res = await apiClient.patch(`/prompts/${id}`, data);
  return res.data.prompt;
};

/**
 * Delete prompt
 */
export const deletePrompt = async (id) => {
  const res = await apiClient.delete(`/prompts/${id}`);
  return res.data;
};

/**
 * Use prompt with variable replacements
 */
export const usePromptWithVariables = async (id, variables = {}) => {
  const res = await apiClient.post(`/prompts/${id}/use`, { variables });
  return res.data;
};
