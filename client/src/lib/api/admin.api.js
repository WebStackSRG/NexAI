import { apiClient } from './client.js';

export const adminApi = {
  /**
   * Fetches platform KPI overview stats.
   */
  getStats() {
    return apiClient.get('/admin/stats');
  },

  /**
   * Fetches daily usage time-series and model breakdown.
   * @param {{ range?: '7d' | '30d' }} [params]
   */
  getUsage(params = {}) {
    return apiClient.get('/admin/usage', { params });
  },

  /**
   * Fetches paginated platform transactions.
   * @param {{ page?: number, limit?: number }} [params]
   */
  getTransactions(params = {}) {
    return apiClient.get('/admin/transactions', { params });
  },

  /**
   * Fetches paginated platform error telemetry.
   * @param {{ page?: number, limit?: number }} [params]
   */
  getErrors(params = {}) {
    return apiClient.get('/admin/errors', { params });
  },

  /**
   * Fetches current platform governance config and live Gemini API quota telemetry.
   */
  getConfig() {
    return apiClient.get('/admin/config');
  },

  /**
   * Updates platform governance config (billingEnforcementMode / dailyGeminiQuotaLimit).
   * @param {{ billingEnforcementMode?: 'quota_free' | 'credit_strict', dailyGeminiQuotaLimit?: number }} data
   */
  updateConfig(data) {
    return apiClient.patch('/admin/config', data);
  },
};
