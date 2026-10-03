import { asyncHandler } from '../utils/asyncHandler.js';
import { adminService } from '../services/admin.service.js';
import { systemConfigService } from '../services/systemConfig.service.js';

export const getStats = asyncHandler(async (req, res) => {
  const stats = await adminService.getPlatformStats();
  res.status(200).json({
    data: {
      message: 'Admin authorization verified',
      ...stats,
    },
  });
});

export const getUsage = asyncHandler(async (req, res) => {
  const { range } = req.query;
  const usage = await adminService.getUsageTimeSeries(range || '7d');
  res.status(200).json({
    data: usage,
  });
});

export const getTransactions = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await adminService.getAdminTransactions({
    page: Number(page) || 1,
    limit: Number(limit) || 20,
  });
  res.status(200).json({
    data: result,
  });
});

export const getErrors = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await adminService.getAdminErrors({
    page: Number(page) || 1,
    limit: Number(limit) || 20,
  });
  res.status(200).json({
    data: result,
  });
});

export const getConfig = asyncHandler(async (_req, res) => {
  const [config, telemetry] = await Promise.all([
    systemConfigService.getConfig(),
    systemConfigService.getGeminiTelemetry(),
  ]);

  res.status(200).json({
    data: {
      config,
      telemetry,
    },
  });
});

export const updateConfig = asyncHandler(async (req, res) => {
  const { billingEnforcementMode, dailyGeminiQuotaLimit } = req.body;
  const config = await systemConfigService.updateConfig({
    billingEnforcementMode,
    dailyGeminiQuotaLimit,
    updatedBy: req.user?._id,
  });
  const telemetry = await systemConfigService.getGeminiTelemetry();

  res.status(200).json({
    data: {
      message: 'Governance configuration updated successfully',
      config,
      telemetry,
    },
  });
});
