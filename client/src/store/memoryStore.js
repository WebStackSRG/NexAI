import { create } from 'zustand';
import { memoryApi } from '@/lib/api/memory.api.js';
import { toast } from './uiStore.js';

export const useMemoryStore = create((set, get) => ({
  memories: [],
  isLoading: false,
  isSaving: false,
  error: null,

  /**
   * Fetch all user memories
   */
  fetchMemories: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await memoryApi.getMemories();
      const memories = response.data || [];
      set({ memories, isLoading: false });
      return memories;
    } catch (err) {
      const message = err.message || 'Failed to load memories';
      set({ isLoading: false, error: message });
      return [];
    }
  },

  /**
   * Add a new memory manually
   * @param {{ fact: string, category?: string, pinned?: boolean }} data
   */
  addMemory: async (data) => {
    set({ isSaving: true });
    try {
      const response = await memoryApi.createMemory(data);
      const newMemory = response.data;
      set((state) => ({
        memories: [newMemory, ...state.memories],
        isSaving: false,
      }));
      toast.success('Memory saved to persistent profile');
      return newMemory;
    } catch (err) {
      const message = err.message || 'Failed to save memory';
      set({ isSaving: false });
      toast.error(message);
      return null;
    }
  },

  /**
   * Delete a single memory
   * @param {string} id
   */
  deleteMemory: async (id) => {
    try {
      await memoryApi.deleteMemory(id);
      set((state) => ({
        memories: state.memories.filter((m) => m._id !== id),
      }));
      toast.success('Memory deleted');
      return true;
    } catch (err) {
      const message = err.message || 'Failed to delete memory';
      toast.error(message);
      return false;
    }
  },

  /**
   * Toggle pinned state for a memory
   * @param {string} id
   */
  togglePin: async (id) => {
    const memory = get().memories.find((m) => m._id === id);
    if (!memory) return false;
    const nextPinned = !memory.pinned;
    try {
      const response = await memoryApi.updateMemory(id, { pinned: nextPinned });
      const updated = response.data;
      set((state) => ({
        memories: state.memories.map((m) => (m._id === id ? { ...m, pinned: updated.pinned } : m)),
      }));
      return true;
    } catch (err) {
      toast.error('Failed to update memory pin state');
      return false;
    }
  },

  /**
   * Clear all user memories
   */
  clearAll: async () => {
    try {
      await memoryApi.clearAllMemories();
      set({ memories: [] });
      toast.success('All memories cleared');
      return true;
    } catch (err) {
      const message = err.message || 'Failed to clear memories';
      toast.error(message);
      return false;
    }
  },
}));
