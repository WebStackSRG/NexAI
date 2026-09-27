import { asyncHandler } from '../utils/asyncHandler.js';
import { adminService } from '../services/admin.service.js';

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
