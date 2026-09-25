import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useLibraryStore } from './libraryStore';
import { useAuthStore } from './authStore';
import { libraryApi } from '@/lib/api/library.api';

vi.mock('@/lib/api/library.api', () => ({
  libraryApi: {
    getItems: vi.fn(),
    getItemById: vi.fn(),
    searchItems: vi.fn(),
    suggestItem: vi.fn(),
    createItem: vi.fn(),
    updateItem: vi.fn(),
    deleteItem: vi.fn(),
  },
}));

vi.mock('./uiStore', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('libraryStore Zustand Store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useLibraryStore.setState({
      items: [],
      tags: [],
      activeTag: null,
      searchQuery: '',
      isLoading: false,
      isSearching: false,
      error: null,
      page: 1,
      totalPages: 1,
      total: 0,
      isAddModalOpen: false,
      isSuggesting: false,
      suggestError: null,
      suggestion: null,
      isSaving: false,
      isEditModalOpen: false,
      editingItem: null,
      isUpdating: false,
      isConfirmDeleteOpen: false,
      itemToDelete: null,
      isDeleting: false,
    });

    useAuthStore.setState({
      user: {
        _id: 'user-123',
        email: 'tester@nexai.test',
        wallet: { creditsRemaining: 100 },
      },
      accessToken: 'token-xyz',
    });
  });

  it('fetches library items and updates tags in store', async () => {
    const mockItems = [
      { _id: 'item-1', title: 'React Docs', tags: ['react', 'frontend'] },
      { _id: 'item-2', title: 'Docker Guide', tags: ['docker', 'devops'] },
    ];
    libraryApi.getItems.mockResolvedValueOnce({
      data: mockItems,
      meta: { page: 1, total: 2, totalPages: 1, tags: ['devops', 'docker', 'frontend', 'react'] },
    });

    const result = await useLibraryStore.getState().fetchItems();

    expect(result).toEqual(mockItems);
    expect(useLibraryStore.getState().items).toEqual(mockItems);
    expect(useLibraryStore.getState().tags).toEqual(['devops', 'docker', 'frontend', 'react']);
    expect(useLibraryStore.getState().isLoading).toBe(false);
  });

  it('filters items by tag when setActiveTag is called', async () => {
    libraryApi.getItems.mockResolvedValueOnce({
      data: [{ _id: 'item-1', title: 'React Docs', tags: ['react'] }],
      meta: { page: 1, total: 1, totalPages: 1 },
    });

    useLibraryStore.getState().setActiveTag('react');

    expect(useLibraryStore.getState().activeTag).toBe('react');
    expect(libraryApi.getItems).toHaveBeenCalledWith({ page: 1, limit: 24, tag: 'react' });
  });

  it('performs semantic search when search query is entered', async () => {
    const searchMatches = [{ _id: 'item-1', title: 'Neural Networks Overview', tags: ['ai'] }];
    libraryApi.searchItems.mockResolvedValueOnce({ data: searchMatches });

    const result = await useLibraryStore.getState().searchItems('deep learning');

    expect(result).toEqual(searchMatches);
    expect(useLibraryStore.getState().items).toEqual(searchMatches);
    expect(useLibraryStore.getState().searchQuery).toBe('deep learning');
  });

  it('suggests metadata, updates suggestion in store, and synchronizes credits to authStore', async () => {
    libraryApi.suggestItem.mockResolvedValueOnce({
      data: {
        type: 'note',
        title: 'Microservices with Node',
        summary: 'Architecting distributed services with Express and RabbitMQ.',
        tags: ['nodejs', 'microservices', 'backend'],
        tokensUsed: 120,
        creditsDeducted: 2,
        creditsRemaining: 98,
      },
    });

    const result = await useLibraryStore.getState().suggestItem({
      type: 'note',
      content: 'Distributed services in Node.js with message queues...',
    });

    expect(result.title).toBe('Microservices with Node');
    expect(useLibraryStore.getState().suggestion).toEqual(result);
    // Credit sync: authStore creditsRemaining updated without page reload!
    expect(useAuthStore.getState().user.wallet.creditsRemaining).toBe(98);
  });

  it('saves confirmed item, updates items array and tag list, and closes modal', async () => {
    const createdItem = {
      _id: 'new-id',
      type: 'note',
      title: 'Confirmed Item',
      summary: 'Confirmed summary',
      tags: ['javascript', 'es6'],
    };
    libraryApi.createItem.mockResolvedValueOnce({ data: createdItem });

    useLibraryStore.setState({ isAddModalOpen: true, suggestion: { title: 'Temp' } });

    const result = await useLibraryStore.getState().saveItem(createdItem);

    expect(result).toEqual(createdItem);
    expect(useLibraryStore.getState().items[0]).toEqual(createdItem);
    expect(useLibraryStore.getState().tags).toContain('javascript');
    expect(useLibraryStore.getState().isAddModalOpen).toBe(false);
    expect(useLibraryStore.getState().suggestion).toBeNull();
  });

  it('deletes library item upon confirmation', async () => {
    const itemToDelete = { _id: 'del-1', title: 'To Delete' };
    useLibraryStore.setState({
      items: [itemToDelete, { _id: 'keep-1', title: 'Keep' }],
      total: 2,
      itemToDelete,
      isConfirmDeleteOpen: true,
    });

    libraryApi.deleteItem.mockResolvedValueOnce({ data: { message: 'Deleted' } });

    await useLibraryStore.getState().confirmDeleteItem();

    expect(useLibraryStore.getState().items).toHaveLength(1);
    expect(useLibraryStore.getState().items[0]._id).toBe('keep-1');
    expect(useLibraryStore.getState().isConfirmDeleteOpen).toBe(false);
    expect(useLibraryStore.getState().itemToDelete).toBeNull();
  });
});
