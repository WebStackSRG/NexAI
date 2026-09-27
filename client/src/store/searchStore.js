import { create } from 'zustand';
import { searchApi } from '@/lib/api/search.api.js';

const RECENT_SEARCHES_KEY = 'nexai_recent_searches';

function loadRecentSearches() {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecentSearches(searches) {
  try {
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches.slice(0, 10)));
  } catch {
    // Ignore storage errors
  }
}

export const useSearchStore = create((set, get) => ({
  query: '',
  activeTab: 'all', // 'all' | 'library' | 'prompts' | 'chats'
  results: {
    library: [],
    prompts: [],
    chats: [],
  },
  counts: {
    total: 0,
    library: 0,
    prompts: 0,
    chats: 0,
  },
  isLoading: false,
  error: null,
  recentSearches: loadRecentSearches(),

  setQuery: (query) => set({ query }),

  setActiveTab: (activeTab) => {
    set({ activeTab });
    const { query } = get();
    if (query && query.trim()) {
      get().performSearch(query, activeTab);
    }
  },

  performSearch: async (q, tab) => {
    const trimmed = (q || '').trim();
    if (!trimmed) {
      set({
        query: '',
        results: { library: [], prompts: [], chats: [] },
        counts: { total: 0, library: 0, prompts: 0, chats: 0 },
        isLoading: false,
        error: null,
      });
      return;
    }

    const type = tab || get().activeTab || 'all';

    set({ isLoading: true, error: null, query: trimmed });

    try {
      const response = await searchApi.unifiedSearch({ q: trimmed, type });
      const data = response.data?.data || response.data || {};

      set({
        results: {
          library: data.library || [],
          prompts: data.prompts || [],
          chats: data.chats || [],
        },
        counts: data.counts || {
          total: (data.library?.length || 0) + (data.prompts?.length || 0) + (data.chats?.length || 0),
          library: data.library?.length || 0,
          prompts: data.prompts?.length || 0,
          chats: data.chats?.length || 0,
        },
        isLoading: false,
        error: null,
      });

      // Add to recent searches if search returned results
      get().addRecentSearch(trimmed);
    } catch (err) {
      const message =
        err.response?.data?.error?.message ||
        err.message ||
        'Search encountered an unexpected error. Please try again.';
      set({
        isLoading: false,
        error: message,
      });
    }
  },

  clearSearch: () => {
    set({
      query: '',
      results: { library: [], prompts: [], chats: [] },
      counts: { total: 0, library: 0, prompts: 0, chats: 0 },
      isLoading: false,
      error: null,
    });
  },

  addRecentSearch: (term) => {
    if (!term || !term.trim()) return;
    const clean = term.trim();
    const current = get().recentSearches.filter(
      (s) => s.toLowerCase() !== clean.toLowerCase(),
    );
    const updated = [clean, ...current].slice(0, 10);
    set({ recentSearches: updated });
    saveRecentSearches(updated);
  },

  removeRecentSearch: (term) => {
    const updated = get().recentSearches.filter((s) => s !== term);
    set({ recentSearches: updated });
    saveRecentSearches(updated);
  },

  clearRecentSearches: () => {
    set({ recentSearches: [] });
    saveRecentSearches([]);
  },
}));
