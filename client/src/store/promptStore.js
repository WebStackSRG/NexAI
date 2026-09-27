import { create } from 'zustand';
import { promptApi } from '@/lib/api/prompt.api.js';
import { toast } from './uiStore.js';

export const usePromptStore = create((set, get) => ({
  prompts: [],
  selectedPrompt: null,
  isLoading: false,
  isSaving: false,
  error: null,
  activeTag: null,
  searchQuery: '',
  favoriteOnly: false,

  /**
   * Fetch prompts with optional filters
   * @param {{ tag?: string, search?: string, isFavorite?: boolean }} [customFilters]
   */
  fetchPrompts: async (customFilters) => {
    set({ isLoading: true, error: null });
    try {
      const { activeTag, searchQuery, favoriteOnly } = get();
      const params = {
        ...(activeTag ? { tag: activeTag } : {}),
        ...(searchQuery ? { search: searchQuery } : {}),
        ...(favoriteOnly ? { isFavorite: true } : {}),
        ...customFilters,
      };

      const res = await promptApi.getPrompts(params);
      const prompts = res.data || [];
      set({ prompts, isLoading: false });
      return prompts;
    } catch (err) {
      const message = err.message || 'Failed to load prompts';
      set({ isLoading: false, error: message });
      toast.error(message);
      return [];
    }
  },

  /**
   * Create a new prompt template
   * @param {{ title: string, description?: string, template: string, tags?: string[], isFavorite?: boolean }} data
   */
  createPrompt: async (data) => {
    set({ isSaving: true });
    try {
      const res = await promptApi.createPrompt(data);
      const newPrompt = res.data;
      set((state) => ({
        prompts: [newPrompt, ...state.prompts],
        isSaving: false,
      }));
      toast.success(`Prompt "${newPrompt.title}" saved to vault`);
      return newPrompt;
    } catch (err) {
      const message = err.message || 'Failed to save prompt';
      set({ isSaving: false });
      toast.error(message);
      return null;
    }
  },

  /**
   * Update an existing prompt template
   * @param {string} id
   * @param {object} data
   */
  updatePrompt: async (id, data) => {
    set({ isSaving: true });
    try {
      const res = await promptApi.updatePrompt(id, data);
      const updated = res.data;
      set((state) => ({
        prompts: state.prompts.map((p) => (p._id === id ? { ...p, ...updated } : p)),
        selectedPrompt:
          state.selectedPrompt?._id === id
            ? { ...state.selectedPrompt, ...updated }
            : state.selectedPrompt,
        isSaving: false,
      }));
      toast.success('Prompt updated');
      return updated;
    } catch (err) {
      const message = err.message || 'Failed to update prompt';
      set({ isSaving: false });
      toast.error(message);
      return null;
    }
  },

  /**
   * Toggle prompt favorite status
   * @param {string} id
   */
  toggleFavorite: async (id) => {
    const prompt = get().prompts.find((p) => p._id === id);
    if (!prompt) return null;

    const newFav = !prompt.isFavorite;
    // Optimistic update
    set((state) => ({
      prompts: state.prompts.map((p) => (p._id === id ? { ...p, isFavorite: newFav } : p)),
    }));

    try {
      const res = await promptApi.updatePrompt(id, { isFavorite: newFav });
      const updated = res.data;
      set((state) => ({
        prompts: state.prompts.map((p) => (p._id === id ? { ...p, ...updated } : p)),
      }));
      return updated;
    } catch (err) {
      // Revert on error
      set((state) => ({
        prompts: state.prompts.map((p) =>
          p._id === id ? { ...p, isFavorite: prompt.isFavorite } : p,
        ),
      }));
      const message = err.message || 'Failed to toggle favorite';
      toast.error(message);
      return null;
    }
  },

  /**
   * Delete a prompt template
   * @param {string} id
   */
  deletePrompt: async (id) => {
    try {
      await promptApi.deletePrompt(id);
      set((state) => ({
        prompts: state.prompts.filter((p) => p._id !== id),
        selectedPrompt: state.selectedPrompt?._id === id ? null : state.selectedPrompt,
      }));
      toast.success('Prompt deleted from vault');
      return true;
    } catch (err) {
      const message = err.message || 'Failed to delete prompt';
      toast.error(message);
      return false;
    }
  },

  setActiveTag: (tag) => {
    set({ activeTag: tag });
    get().fetchPrompts();
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  setFavoriteOnly: (favoriteOnly) => {
    set({ favoriteOnly });
    get().fetchPrompts();
  },

  setSelectedPrompt: (prompt) => set({ selectedPrompt: prompt }),
}));
