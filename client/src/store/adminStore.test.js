import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAdminStore } from './adminStore';
import { adminApi } from '@/lib/api/admin.api';

vi.mock('@/lib/api/admin.api', () => ({
  adminApi: {
    getStats: vi.fn(),
    getUsage: vi.fn(),
    getTransactions: vi.fn(),
    getErrors: vi.fn(),
  },
}));

describe('adminStore Zustand Store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAdminStore.setState({
      stats: null,
      usageData: null,
      range: '7d',
      transactions: { list: [], total: 0, page: 1, totalPages: 1 },
      errors: { list: [], total: 0, page: 1, totalPages: 1 },
      isLoading: false,
      isLoadingTransactions: false,
      isLoadingErrors: false,
      error: null,
    });
  });

  it('fetchOverview populates stats and usageData', async () => {
    const mockStats = {
      totalTokens: 50000,
      activeUsers: 15,
      totalRevenue: 2490,
      totalErrors: 2,
    };
    const mockUsage = {
      range: '7d',
      timeSeries: [{ date: '2026-09-20', totalTokens: 1000 }],
      modelSplit: [{ model: 'flash', tokens: 800, percentage: 80 }],
    };

    adminApi.getStats.mockResolvedValueOnce({ data: { data: mockStats } });
    adminApi.getUsage.mockResolvedValueOnce({ data: { data: mockUsage } });

    await useAdminStore.getState().fetchOverview();

    const state = useAdminStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.stats).toEqual(mockStats);
    expect(state.usageData).toEqual(mockUsage);
  });

  it('setRange updates range and triggers fetchUsage', async () => {
    const mockUsage30d = {
      range: '30d',
      timeSeries: [],
      modelSplit: [],
    };
    adminApi.getUsage.mockResolvedValueOnce({ data: { data: mockUsage30d } });

    useAdminStore.getState().setRange('30d');

    expect(useAdminStore.getState().range).toBe('30d');
    expect(adminApi.getUsage).toHaveBeenCalledWith({ range: '30d' });
  });

  it('fetchTransactions updates transactions list and pagination', async () => {
    const mockTx = [
      { _id: 'tx1', amountINR: 499, creditsAdded: 500, status: 'success' },
    ];
    adminApi.getTransactions.mockResolvedValueOnce({
      data: {
        data: {
          transactions: mockTx,
          total: 1,
          page: 1,
          totalPages: 1,
        },
      },
    });

    await useAdminStore.getState().fetchTransactions(1);

    const state = useAdminStore.getState();
    expect(state.transactions.list).toEqual(mockTx);
    expect(state.transactions.total).toBe(1);
    expect(state.isLoadingTransactions).toBe(false);
  });

  it('fetchErrors updates error logs list and pagination', async () => {
    const mockErrors = [
      { _id: 'err1', route: '/api/chats', method: 'POST', status: 500, message: 'Server crash' },
    ];
    adminApi.getErrors.mockResolvedValueOnce({
      data: {
        data: {
          errors: mockErrors,
          total: 1,
          page: 1,
          totalPages: 1,
        },
      },
    });

    await useAdminStore.getState().fetchErrors(1);

    const state = useAdminStore.getState();
    expect(state.errors.list).toEqual(mockErrors);
    expect(state.errors.total).toBe(1);
    expect(state.isLoadingErrors).toBe(false);
  });
});
