import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import apiClient from '../lib/apiClient';

const useDevToolsStore = create(
  devtools(
    (set, get) => ({
      activeTab: 'snippets', // 'snippets' | 'json' | 'regex' | 'api'
      snippets: [],
      isLoadingSnippets: false,
      snippetFilterLang: 'all',
      snippetSearch: '',
      snippetModalOpen: false,
      editingSnippet: null,
      error: null,

      setActiveTab: (activeTab) => set({ activeTab }),
      setSnippetFilterLang: (snippetFilterLang) => set({ snippetFilterLang }),
      setSnippetSearch: (snippetSearch) => set({ snippetSearch }),
      openSnippetModal: (editingSnippet = null) =>
        set({ snippetModalOpen: true, editingSnippet, error: null }),
      closeSnippetModal: () =>
        set({ snippetModalOpen: false, editingSnippet: null }),

      fetchSnippets: async () => {
        set({ isLoadingSnippets: true, error: null });
        try {
          const { snippetFilterLang, snippetSearch } = get();
          const params = {};
          if (snippetFilterLang !== 'all') params.language = snippetFilterLang;
          if (snippetSearch.trim()) params.search = snippetSearch.trim();

          const res = await apiClient.get('/snippets', { params });
          set({ snippets: res.data.snippets || [], isLoadingSnippets: false });
        } catch (err) {
          set({
            error: err.response?.data?.error || err.message || 'Failed to fetch snippets',
            isLoadingSnippets: false,
          });
        }
      },

      saveSnippet: async ({ title, language, code, tags, description }) => {
        const { editingSnippet } = get();
        try {
          if (editingSnippet) {
            const id = editingSnippet._id || editingSnippet.id;
            const res = await apiClient.patch(`/snippets/${id}`, {
              title,
              language,
              code,
              tags,
              description,
            });
            const updated = res.data.snippet;
            set((s) => ({
              snippets: s.snippets.map((snip) =>
                (snip._id || snip.id) === id ? updated : snip
              ),
              snippetModalOpen: false,
              editingSnippet: null,
            }));
            return updated;
          } else {
            const res = await apiClient.post('/snippets', {
              title,
              language,
              code,
              tags,
              description,
            });
            const created = res.data.snippet;
            set((s) => ({
              snippets: [created, ...s.snippets],
              snippetModalOpen: false,
            }));
            return created;
          }
        } catch (err) {
          const msg = err.response?.data?.error || err.message || 'Failed to save snippet';
          set({ error: msg });
          throw new Error(msg);
        }
      },

      deleteSnippet: async (id) => {
        const prev = get().snippets;
        set((s) => ({
          snippets: s.snippets.filter((snip) => (snip._id || snip.id) !== id),
        }));
        try {
          await apiClient.delete(`/snippets/${id}`);
        } catch (err) {
          set({
            snippets: prev,
            error: err.response?.data?.error || 'Failed to delete snippet',
          });
        }
      },
    }),
    { name: 'devtools-store' }
  )
);

export default useDevToolsStore;
