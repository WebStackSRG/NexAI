import { create } from 'zustand';
import { adminApi } from '@/lib/api/admin.api.js';

export const useAdminStore = create((set, get) => ({
  stats: null,
  usageData: null,
  range: '7d',
  transactions: {
    list: [],
    total: 0,
    page: 1,
    totalPages: 1,
  },
  errors: {
    list: [],
    total: 0,
    page: 1,
    totalPages: 1,
  },
  isLoading: false,
  isLoadingTransactions: false,
  isLoadingErrors: false,
  error: null,

  setRange: (range) => {
    set({ range });
    get().fetchUsage(range);
  },

  fetchOverview: async () => {
    set({ isLoading: true, error: null });
    try {
      const currentRange = get().range;
      const [statsRes, usageRes] = await Promise.all([
        adminApi.getStats(),
        adminApi.getUsage({ range: currentRange }),
      ]);

      set({
        stats: statsRes.data?.data || statsRes.data,
        usageData: usageRes.data?.data || usageRes.data,
        isLoading: false,
      });
    } catch (err) {
      set({
        error: err.response?.data?.error?.message || err.message || 'Failed to load admin overview',
        isLoading: false,
      });
    }
  },

  fetchUsage: async (rangeOverride) => {
    const range = rangeOverride || get().range;
    try {
      const res = await adminApi.getUsage({ range });
      set({
        usageData: res.data?.data || res.data,
      });
    } catch (err) {
      set({
        error: err.response?.data?.error?.message || err.message,
      });
    }
  },

  fetchTransactions: async (page = 1) => {
    set({ isLoadingTransactions: true });
    try {
      const res = await adminApi.getTransactions({ page, limit: 10 });
      const payload = res.data?.data || res.data || {};
      set({
        transactions: {
          list: payload.transactions || [],
          total: payload.total || 0,
          page: payload.page || page,
          totalPages: payload.totalPages || 1,
        },
        isLoadingTransactions: false,
      });
    } catch {
      set({ isLoadingTransactions: false });
    }
  },

  fetchErrors: async (page = 1) => {
    set({ isLoadingErrors: true });
    try {
      const res = await adminApi.getErrors({ page, limit: 10 });
      const payload = res.data?.data || res.data || {};
      set({
        errors: {
          list: payload.errors || [],
          total: payload.total || 0,
          page: payload.page || page,
          totalPages: payload.totalPages || 1,
        },
        isLoadingErrors: false,
      });
    } catch {
      set({ isLoadingErrors: false });
    }
  },
}));
