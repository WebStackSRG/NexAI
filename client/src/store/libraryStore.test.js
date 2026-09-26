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
    generateDocumentDraft: vi.fn(),
    exportDocumentPdf: vi.fn(),
  },
}));

vi.mock('./uiStore', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('libraryStore Zustand Store (Step 8)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useLibraryStore.setState({
      items: [],
      tags: [],
      activeTag: null,
      activeTab: 'all',
      counts: { all: 0, notes_links: 0, documents: 0, files: 0, interviews: 0 },
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
      isDocGenModalOpen: false,
      isGeneratingDoc: false,
      docDraft: null,
      isUploadModalOpen: false,
      isViewDocModalOpen: false,
      viewingDoc: null,
      isExportingPdf: false,
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

  it('fetches library items and updates tags and counts in store', async () => {
    const mockItems = [
      { _id: 'item-1', title: 'React Docs', type: 'note', tags: ['react', 'frontend'] },
      { _id: 'item-2', title: 'Resume 2026', type: 'document', tags: ['resume'] },
    ];
    libraryApi.getItems.mockResolvedValueOnce({
      data: mockItems,
      meta: {
        page: 1,
        total: 2,
        totalPages: 1,
        tags: ['frontend', 'react', 'resume'],
        counts: { all: 2, notes_links: 1, documents: 1, files: 0, interviews: 0 },
      },
    });

    const result = await useLibraryStore.getState().fetchItems();

    expect(result).toEqual(mockItems);
    expect(useLibraryStore.getState().items).toEqual(mockItems);
    expect(useLibraryStore.getState().tags).toEqual(['frontend', 'react', 'resume']);
    expect(useLibraryStore.getState().counts.documents).toBe(1);
    expect(useLibraryStore.getState().isLoading).toBe(false);
  });

  it('filters items by tab when setActiveTab is called', async () => {
    libraryApi.getItems.mockResolvedValueOnce({
      data: [{ _id: 'item-2', title: 'Resume 2026', type: 'document' }],
      meta: { page: 1, total: 1, totalPages: 1 },
    });

    useLibraryStore.getState().setActiveTab('documents');

    expect(useLibraryStore.getState().activeTab).toBe('documents');
    expect(libraryApi.getItems).toHaveBeenCalledWith({ page: 1, limit: 24, tab: 'documents' });
  });

  it('generates AI document draft and updates credits in authStore', async () => {
    const mockDraft = {
      title: 'Full-Stack Engineer Resume',
      category: 'resume',
      summary: 'Experienced developer specializing in React and Node.',
      sections: [{ heading: 'Summary', body: '5 years experience' }],
      tokensUsed: 300,
      creditsDeducted: 3,
      creditsRemaining: 97,
    };
    libraryApi.generateDocumentDraft.mockResolvedValueOnce({ data: mockDraft });

    const result = await useLibraryStore.getState().generateDocDraft({
      prompt: 'Senior developer resume',
      category: 'resume',
    });

    expect(result).toEqual(mockDraft);
    expect(useLibraryStore.getState().docDraft).toEqual(mockDraft);
    expect(useAuthStore.getState().user.wallet.creditsRemaining).toBe(97);
  });

  it('exports document PDF via libraryApi.exportDocumentPdf', async () => {
    libraryApi.exportDocumentPdf.mockResolvedValueOnce(true);

    const docItem = { _id: 'doc-123', title: 'My Architecture Spec' };
    await useLibraryStore.getState().exportPdf(docItem);

    expect(libraryApi.exportDocumentPdf).toHaveBeenCalledWith('doc-123', 'My Architecture Spec');
  });

  it('saves confirmed polymorphic item, updates items array and tab counts, and closes modal', async () => {
    const createdItem = {
      _id: 'new-doc-id',
      type: 'document',
      title: 'Confirmed Doc',
      category: 'spec',
      summary: 'Confirmed spec summary',
      sections: [{ heading: 'Architecture', body: 'Express and MongoDB' }],
      tags: ['spec', 'architecture'],
    };
    libraryApi.createItem.mockResolvedValueOnce({ data: createdItem });

    useLibraryStore.setState({ isDocGenModalOpen: true, docDraft: createdItem });

    const result = await useLibraryStore.getState().saveItem(createdItem);

    expect(result).toEqual(createdItem);
    expect(useLibraryStore.getState().items[0]).toEqual(createdItem);
    expect(useLibraryStore.getState().tags).toContain('architecture');
    expect(useLibraryStore.getState().isDocGenModalOpen).toBe(false);
    expect(useLibraryStore.getState().docDraft).toBeNull();
    expect(useLibraryStore.getState().counts.documents).toBe(1);
  });

  it('deletes library item upon confirmation and decrements counts', async () => {
    const itemToDelete = { _id: 'del-1', title: 'To Delete', type: 'document' };
    useLibraryStore.setState({
      items: [itemToDelete, { _id: 'keep-1', title: 'Keep', type: 'note' }],
      counts: { all: 2, notes_links: 1, documents: 1, files: 0, interviews: 0 },
      total: 2,
      itemToDelete,
      isConfirmDeleteOpen: true,
    });

    libraryApi.deleteItem.mockResolvedValueOnce({ data: { message: 'Deleted' } });

    await useLibraryStore.getState().confirmDeleteItem();

    expect(useLibraryStore.getState().items).toHaveLength(1);
    expect(useLibraryStore.getState().items[0]._id).toBe('keep-1');
    expect(useLibraryStore.getState().counts.documents).toBe(0);
    expect(useLibraryStore.getState().isConfirmDeleteOpen).toBe(false);
    expect(useLibraryStore.getState().itemToDelete).toBeNull();
  });
});
