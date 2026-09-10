import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import apiClient from '../lib/apiClient';

const useAnalyticsStore = create(
  devtools(
    (set) => ({
      stats: null,
      isLoading: false,
      error: null,

      fetchStats: async () => {
        set({ isLoading: true, error: null });
        try {
          const res = await apiClient.get('/analytics/stats');
          set({ stats: res.data.stats, isLoading: false });
        } catch (err) {
          set({
            error: err.response?.data?.error || err.message || 'Failed to load analytics',
            isLoading: false,
          });
        }
      },
    }),
    { name: 'analytics-store' }
  )
);

export default useAnalyticsStore;
