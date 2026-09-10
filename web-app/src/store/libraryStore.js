import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import apiClient from '../lib/apiClient';

const useLibraryStore = create(
  devtools(
    (set) => ({
    (set, get) => ({
      items: [],
      selectedItem: null,
      isLoading: false,
      isSaving: false,
      isConfirming: false,
      error: null,
      filterType: 'all',
      filterStatus: 'all',
      searchQuery: '',
      isLoading: false,
      error: null,
      saveModalOpen: false,
      reviewModalOpen: false,
      pendingReviewItem: null,

      setItems: (items) => set({ items }),
      setSelectedItem: (selectedItem) => set({ selectedItem }),
      setFilterType: (filterType) => set({ filterType }),
      setFilterStatus: (filterStatus) => set({ filterStatus }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error, isLoading: false }),

      openSaveModal: () => set({ saveModalOpen: true, error: null }),
      closeSaveModal: () => set({ saveModalOpen: false }),

      openReviewModal: (item) =>
        set({ reviewModalOpen: true, pendingReviewItem: item, error: null }),
      closeReviewModal: () =>
        set({ reviewModalOpen: false, pendingReviewItem: null }),

      fetchItems: async () => {
        set({ isLoading: true, error: null });
        try {
          const { filterType, filterStatus, searchQuery } = get();
          const params = {};
          if (filterType !== 'all') params.type = filterType;
          if (filterStatus !== 'all') params.status = filterStatus;
          if (searchQuery.trim()) params.search = searchQuery.trim();

          const res = await apiClient.get('/library', { params });
          set({ items: res.data.items || [], isLoading: false });
        } catch (err) {
          set({
            error: err.response?.data?.error || 'Failed to fetch library items',
            isLoading: false,
          });
        }
      },

      // Stage 1: Save (Suggest)
      saveItem: async ({ url, content, type, title }) => {
        set({ isSaving: true, error: null });
        try {
          const res = await apiClient.post('/library/save', {
            url,
            content,
            type,
            title,
          });
          const { item, suggestions } = res.data;

          // Add to local list and immediately open Review Dialog for user confirmation
          set((s) => ({
            items: [item, ...s.items],
            isSaving: false,
            saveModalOpen: false,
            reviewModalOpen: true,
            pendingReviewItem: item,
          }));

          return { item, suggestions };
        } catch (err) {
          const errorMsg =
            err.response?.data?.error || 'Failed to save item to library';
          set({ isSaving: false, error: errorMsg });
          throw new Error(errorMsg);
        }
      },

      // Stage 2: Confirm & index into Pinecone
      confirmItem: async (id, reviewData) => {
        set({ isConfirming: true, error: null });
        try {
          const res = await apiClient.patch(`/library/${id}/confirm`, reviewData);
          const confirmed = res.data.item;

          set((s) => ({
            items: s.items.map((i) =>
              (i._id || i.id) === id ? confirmed : i
            ),
            isConfirming: false,
            reviewModalOpen: false,
            pendingReviewItem: null,
          }));

          return confirmed;
        } catch (err) {
          const errorMsg =
            err.response?.data?.error || 'Failed to confirm library item';
          set({ isConfirming: false, error: errorMsg });
          throw new Error(errorMsg);
        }
      },

      // Optimistic delete with rollback
      deleteItem: async (id) => {
        const prevItems = get().items;
        set((s) => ({
          items: s.items.filter((i) => (i._id || i.id) !== id),
        }));

        try {
          await apiClient.delete(`/library/${id}`);
        } catch (err) {
          set({
            items: prevItems,
            error: err.response?.data?.error || 'Failed to delete library item',
          });
        }
      },
    }),
    { name: 'library-store' }
  )
);

export default useLibraryStore;
