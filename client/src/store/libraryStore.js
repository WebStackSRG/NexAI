import { create } from 'zustand';
import { libraryApi } from '@/lib/api/library.api.js';
import { useAuthStore } from './authStore.js';
import { toast } from './uiStore.js';

export const useLibraryStore = create((set, get) => ({
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

  // Add / Suggest modal state
  isAddModalOpen: false,
  isSuggesting: false,
  suggestError: null,
  suggestion: null,
  isSaving: false,

  // Edit modal state
  isEditModalOpen: false,
  editingItem: null,
  isUpdating: false,

  // Delete dialog state
  isConfirmDeleteOpen: false,
  itemToDelete: null,
  isDeleting: false,

  /**
   * Fetches paginated library items, optionally filtering by active tag.
   */
  fetchItems: async ({ tag = get().activeTag, page = 1 } = {}) => {
    set({ isLoading: true, error: null });
    try {
      const params = { page, limit: 24 };
      if (tag) {
        params.tag = tag;
      }
      const response = await libraryApi.getItems(params);
      const items = response.data || [];
      const meta = response.meta || {};

      set({
        items,
        tags: meta.tags || get().tags,
        page: meta.page || 1,
        totalPages: meta.totalPages || 1,
        total: meta.total || items.length,
        isLoading: false,
        error: null,
      });
      return items;
    } catch (err) {
      const message = err.message || 'Failed to load library items';
      set({ isLoading: false, error: message });
      toast.error(message);
      return [];
    }
  },

  /**
   * Performs semantic search over library items.
   */
  searchItems: async (query) => {
    const trimmed = query?.trim() || '';
    set({ searchQuery: trimmed });

    if (!trimmed) {
      return get().fetchItems({ tag: get().activeTag });
    }

    set({ isSearching: true, error: null });
    try {
      const response = await libraryApi.searchItems(trimmed);
      const items = response.data || [];
      set({ items, isSearching: false, error: null });
      return items;
    } catch (err) {
      const message = err.message || 'Search failed';
      set({ isSearching: false, error: message });
      toast.error(message);
      return [];
    }
  },

  /**
   * Sets active tag filter and refetches items.
   */
  setActiveTag: (tag) => {
    const newTag = get().activeTag === tag ? null : tag;
    set({ activeTag: newTag, searchQuery: '' });
    get().fetchItems({ tag: newTag, page: 1 });
  },

  /**
   * Modal actions
   */
  openAddModal: () => {
    set({
      isAddModalOpen: true,
      isSuggesting: false,
      suggestError: null,
      suggestion: null,
      isSaving: false,
    });
  },

  closeAddModal: () => {
    set({
      isAddModalOpen: false,
      suggestion: null,
      suggestError: null,
      isSuggesting: false,
      isSaving: false,
    });
  },

  /**
   * Generates AI suggestion (Suggest step in Suggest -> Review -> Confirm).
   */
  suggestItem: async ({ type, url, content }) => {
    set({ isSuggesting: true, suggestError: null });
    try {
      const response = await libraryApi.suggestItem({ type, url, content });
      const data = response.data;

      // Update credit balance in live auth store
      if (typeof data.creditsRemaining === 'number') {
        useAuthStore.getState().updateCredits(data.creditsRemaining);
      }

      set({
        suggestion: data,
        isSuggesting: false,
        suggestError: null,
      });
      return data;
    } catch (err) {
      const message = err.message || 'Failed to generate suggestion';
      set({ isSuggesting: false, suggestError: message });
      if (err.code === 'INSUFFICIENT_CREDITS' || err.status === 402) {
        toast.error('Insufficient credits. Please recharge your wallet.');
      } else {
        toast.error(message);
      }
      throw err;
    }
  },

  /**
   * Saves confirmed item to MongoDB and vector DB (Confirm step).
   */
  saveItem: async (itemData) => {
    set({ isSaving: true });
    try {
      const response = await libraryApi.createItem(itemData);
      const newItem = response.data;

      set((state) => {
        const updatedTags = Array.from(new Set([...state.tags, ...(newItem.tags || [])])).sort();
        return {
          items: [newItem, ...state.items],
          tags: updatedTags,
          total: state.total + 1,
          isSaving: false,
          isAddModalOpen: false,
          suggestion: null,
        };
      });

      toast.success('Saved to Library');
      return newItem;
    } catch (err) {
      const message = err.message || 'Failed to save item';
      set({ isSaving: false });
      toast.error(message);
      throw err;
    }
  },

  /**
   * Edit item actions
   */
  openEditModal: (item) => {
    set({ isEditModalOpen: true, editingItem: item, isUpdating: false });
  },

  closeEditModal: () => {
    set({ isEditModalOpen: false, editingItem: null, isUpdating: false });
  },

  updateItem: async (id, itemData) => {
    set({ isUpdating: true });
    try {
      const response = await libraryApi.updateItem(id, itemData);
      const updated = response.data;

      set((state) => {
        const updatedItems = state.items.map((it) => (it._id === id ? updated : it));
        const updatedTags = Array.from(new Set([...state.tags, ...(updated.tags || [])])).sort();
        return {
          items: updatedItems,
          tags: updatedTags,
          isUpdating: false,
          isEditModalOpen: false,
          editingItem: null,
        };
      });

      toast.success('Library item updated');
      return updated;
    } catch (err) {
      const message = err.message || 'Failed to update item';
      set({ isUpdating: false });
      toast.error(message);
      throw err;
    }
  },

  /**
   * Delete item actions
   */
  openDeleteDialog: (item) => {
    set({ isConfirmDeleteOpen: true, itemToDelete: item });
  },

  closeDeleteDialog: () => {
    set({ isConfirmDeleteOpen: false, itemToDelete: null, isDeleting: false });
  },

  confirmDeleteItem: async () => {
    const { itemToDelete } = get();
    if (!itemToDelete) return;

    set({ isDeleting: true });
    try {
      await libraryApi.deleteItem(itemToDelete._id);

      set((state) => ({
        items: state.items.filter((it) => it._id !== itemToDelete._id),
        total: Math.max(0, state.total - 1),
        isDeleting: false,
        isConfirmDeleteOpen: false,
        itemToDelete: null,
      }));

      toast.success('Library item deleted');
    } catch (err) {
      const message = err.message || 'Failed to delete item';
      set({ isDeleting: false });
      toast.error(message);
    }
  },
}));
