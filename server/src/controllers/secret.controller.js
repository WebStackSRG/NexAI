import { z } from "zod";
import mongoose from "mongoose";
import Secret from "../models/Secret.js";

export const devSecretsMap = new Map();

const createSecretSchema = z.object({
  label: z.string().min(1).max(100),
  category: z.enum(["api_key", "password", "crypto", "note", "other"]).default("api_key"),
  ciphertext: z.string().min(1),
  iv: z.string().min(1),
  salt: z.string().min(1),
});

const updateSecretSchema = z.object({
  label: z.string().min(1).max(100).optional(),
  category: z.enum(["api_key", "password", "crypto", "note", "other"]).optional(),
  ciphertext: z.string().min(1).optional(),
  iv: z.string().min(1).optional(),
  salt: z.string().min(1).optional(),
});

export const getSecrets = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const secrets = await Secret.find({ userId }).sort({ createdAt: -1 }).lean();
      return res.json({ success: true, secrets });
    }

    const list = Array.from(devSecretsMap.values())
      .filter((s) => String(s.userId) === String(userId))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.json({ success: true, secrets: list });
  } catch (error) {
    next(error);
  }
};

export const createSecret = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const parsed = createSecretSchema.parse(req.body);
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const secret = await Secret.create({
        ...parsed,
        userId,
      });
      return res.status(201).json({ success: true, secret });
    }

    const mockId = `sec_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const mockSecret = {
      _id: mockId,
      id: mockId,
      userId: String(userId),
      ...parsed,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    devSecretsMap.set(mockId, mockSecret);
    return res.status(201).json({ success: true, secret: mockSecret });
  } catch (error) {
    next(error);
  }
};

export const updateSecret = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { id } = req.params;
    const parsed = updateSecretSchema.parse(req.body);
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const secret = await Secret.findOneAndUpdate(
        { _id: id, userId },
        { ...parsed, updatedAt: Date.now() },
        { new: true }
      );
      if (!secret) {
        return res.status(404).json({ success: false, message: "Secret not found" });
      }
      return res.json({ success: true, secret });
    }

    const existing = devSecretsMap.get(id);
    if (!existing || String(existing.userId) !== String(userId)) {
      return res.status(404).json({ success: false, message: "Secret not found" });
    }

    const updated = {
      ...existing,
      ...parsed,
      updatedAt: new Date().toISOString(),
    };
    devSecretsMap.set(id, updated);
    return res.json({ success: true, secret: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteSecret = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { id } = req.params;
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const deleted = await Secret.findOneAndDelete({ _id: id, userId });
      if (!deleted) {
        return res.status(404).json({ success: false, message: "Secret not found" });
      }
      return res.json({ success: true, message: "Secret deleted successfully" });
    }

    const existing = devSecretsMap.get(id);
    if (!existing || String(existing.userId) !== String(userId)) {
      return res.status(404).json({ success: false, message: "Secret not found" });
    }

    devSecretsMap.delete(id);
    return res.json({ success: true, message: "Secret deleted successfully" });
  } catch (error) {
    next(error);
  }
};
