import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSearchStore } from './searchStore';
import { searchApi } from '@/lib/api/search.api';

vi.mock('@/lib/api/search.api', () => ({
  searchApi: {
    unifiedSearch: vi.fn(),
  },
}));

describe('searchStore Zustand Store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSearchStore.setState({
      query: '',
      activeTab: 'all',
      results: { library: [], prompts: [], chats: [] },
      counts: { total: 0, library: 0, prompts: 0, chats: 0 },
      isLoading: false,
      error: null,
      recentSearches: [],
    });
  });

  it('updates query string', () => {
    useSearchStore.getState().setQuery('mongodb');
    expect(useSearchStore.getState().query).toBe('mongodb');
  });

  it('performSearch handles empty or blank query by resetting results', async () => {
    await useSearchStore.getState().performSearch('   ');
    expect(useSearchStore.getState().query).toBe('');
    expect(useSearchStore.getState().results.library).toEqual([]);
    expect(useSearchStore.getState().counts.total).toBe(0);
  });

  it('performSearch populates results and updates recent searches', async () => {
    const mockData = {
      query: 'react',
      type: 'all',
      counts: { total: 2, library: 1, prompts: 1, chats: 0 },
      library: [{ _id: 'lib-1', title: 'React Hooks Guide', type: 'note' }],
      prompts: [{ _id: 'p-1', title: 'React Refactor Prompt' }],
      chats: [],
    };

    searchApi.unifiedSearch.mockResolvedValueOnce({ data: mockData });

    await useSearchStore.getState().performSearch('react', 'all');

    const state = useSearchStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.results.library).toHaveLength(1);
    expect(state.results.prompts).toHaveLength(1);
    expect(state.counts.total).toBe(2);
    expect(state.recentSearches).toContain('react');
  });

  it('clearSearch resets query and active results', () => {
    useSearchStore.setState({
      query: 'test',
      results: { library: [{ id: 1 }], prompts: [], chats: [] },
      counts: { total: 1, library: 1, prompts: 0, chats: 0 },
    });

    useSearchStore.getState().clearSearch();

    expect(useSearchStore.getState().query).toBe('');
    expect(useSearchStore.getState().results.library).toEqual([]);
    expect(useSearchStore.getState().counts.total).toBe(0);
  });

  it('manages recent search items', () => {
    useSearchStore.setState({ recentSearches: ['gemini', 'react'] });

    useSearchStore.getState().removeRecentSearch('gemini');
    expect(useSearchStore.getState().recentSearches).toEqual(['react']);

    useSearchStore.getState().clearRecentSearches();
    expect(useSearchStore.getState().recentSearches).toEqual([]);
  });
});
