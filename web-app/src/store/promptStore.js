import { create } from "zustand";
import { devtools } from "zustand/middleware";
import * as promptApi from "../lib/promptApi";

const usePromptStore = create(
  devtools(
    (set, get) => ({
      prompts: [],
      activePrompt: null,
      searchQuery: "",
      selectedTag: "all",
      viewMode: "grid", // 'grid' | 'list'
      isLoading: false,
      error: null,

      // Modals
      isCreateModalOpen: false,
      isFillModalOpen: false,
      targetPromptForFill: null,

      setViewMode: (viewMode) => set({ viewMode }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setSelectedTag: (selectedTag) => set({ selectedTag }),
      setActivePrompt: (activePrompt) => set({ activePrompt }),

      openCreateModal: (prompt = null) =>
        set({ isCreateModalOpen: true, activePrompt: prompt }),
      closeCreateModal: () =>
        set({ isCreateModalOpen: false, activePrompt: null }),

      openFillModal: (prompt) =>
        set({ isFillModalOpen: true, targetPromptForFill: prompt }),
      closeFillModal: () =>
        set({ isFillModalOpen: false, targetPromptForFill: null }),

      loadPrompts: async () => {
        set({ isLoading: true, error: null });
        try {
          const { searchQuery, selectedTag } = get();
          const params = {};
          if (searchQuery.trim()) params.search = searchQuery.trim();
          if (selectedTag !== "all") params.tag = selectedTag;

          const prompts = await promptApi.fetchPrompts(params);
          set({ prompts, isLoading: false });
          return prompts;
        } catch (err) {
          set({
            error: err.response?.data?.error || err.message,
            isLoading: false,
          });
          return [];
        }
      },

      savePrompt: async ({ id, title, template, tags, pinned }) => {
        try {
          let saved;
          if (id) {
            saved = await promptApi.updatePrompt(id, {
              title,
              template,
              tags,
              pinned,
            });
            set((state) => ({
              prompts: state.prompts.map((p) =>
                (p._id || p.id) === (saved._id || saved.id) ? saved : p,
              ),
              isCreateModalOpen: false,
              activePrompt: null,
            }));
          } else {
            saved = await promptApi.createPrompt({
              title,
              template,
              tags,
              pinned,
            });
            set((state) => ({
              prompts: [saved, ...state.prompts],
              isCreateModalOpen: false,
              activePrompt: null,
            }));
          }
          return saved;
        } catch (err) {
          set({ error: err.response?.data?.error || err.message });
          throw err;
        }
      },

      togglePin: async (prompt) => {
        const id = prompt._id || prompt.id;
        const newPinned = !prompt.pinned;
        try {
          const updated = await promptApi.updatePrompt(id, {
            pinned: newPinned,
          });
          set((state) => ({
            prompts: state.prompts
              .map((p) => ((p._id || p.id) === id ? updated : p))
              .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)),
          }));
        } catch (err) {
          set({ error: err.response?.data?.error || err.message });
        }
      },

      removePrompt: async (id) => {
        try {
          await promptApi.deletePrompt(id);
          set((state) => ({
            prompts: state.prompts.filter((p) => (p._id || p.id) !== id),
          }));
        } catch (err) {
          set({ error: err.response?.data?.error || err.message });
        }
      },

      executePrompt: async (id, variables) => {
        try {
          const result = await promptApi.usePromptWithVariables(id, variables);
          // Increment use count in local state
          set((state) => ({
            prompts: state.prompts.map((p) =>
              (p._id || p.id) === id
                ? { ...p, useCount: (p.useCount || 0) + 1, lastUsedAt: new Date() }
                : p,
            ),
          }));
          return result;
        } catch (err) {
          set({ error: err.response?.data?.error || err.message });
          throw err;
        }
      },
    }),
    { name: "prompt-store" },
  ),
);

export default usePromptStore;

