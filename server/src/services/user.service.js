import User from "../models/User.js";
import { getDbStatus } from "../config/db.js";
import { getUserById } from "./auth.service.js";

/**
 * Retrieve user settings and profile
 */
export const getUserSettings = async (userId) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  return {
    _id: user._id || user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    preferences: user.preferences || {
      sidebarMode: "general",
      theme: "dark",
      language: "en",
      streamingEnabled: true,
    },
    globalInstructions: user.globalInstructions || "",
    onboardingComplete: user.onboardingComplete ?? false,
    quietHours: user.quietHours || {
      enabled: false,
      startTime: "22:00",
      endTime: "08:00",
    },
    notificationPrefs: user.notificationPrefs || {
      pushEnabled: false,
      emailEnabled: false,
      brokenLinks: true,
      weeklyDigest: true,
      reminders: true,
    },
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

/**
 * Update user settings and preferences
 */
export const updateUserSettings = async (userId, updateData) => {
  const { globalInstructions, preferences, quietHours, notificationPrefs, onboardingComplete } =
    updateData;

  const updateFields = {
    updatedAt: new Date(),
  };

  if (onboardingComplete !== undefined) {
    updateFields.onboardingComplete = Boolean(onboardingComplete);
  }

  if (globalInstructions !== undefined) {
    updateFields.globalInstructions = globalInstructions;
  }

  if (preferences) {
    if (preferences.sidebarMode !== undefined)
      updateFields["preferences.sidebarMode"] = preferences.sidebarMode;
    if (preferences.theme !== undefined)
      updateFields["preferences.theme"] = preferences.theme;
    if (preferences.language !== undefined)
      updateFields["preferences.language"] = preferences.language;
    if (preferences.streamingEnabled !== undefined)
      updateFields["preferences.streamingEnabled"] =
        preferences.streamingEnabled;
  }

  if (quietHours) {
    if (quietHours.enabled !== undefined)
      updateFields["quietHours.enabled"] = quietHours.enabled;
    if (quietHours.startTime !== undefined)
      updateFields["quietHours.startTime"] = quietHours.startTime;
    if (quietHours.endTime !== undefined)
      updateFields["quietHours.endTime"] = quietHours.endTime;
  }

  if (notificationPrefs) {
    if (notificationPrefs.pushEnabled !== undefined)
      updateFields["notificationPrefs.pushEnabled"] =
        notificationPrefs.pushEnabled;
    if (notificationPrefs.emailEnabled !== undefined)
      updateFields["notificationPrefs.emailEnabled"] =
        notificationPrefs.emailEnabled;
    if (notificationPrefs.brokenLinks !== undefined)
      updateFields["notificationPrefs.brokenLinks"] =
        notificationPrefs.brokenLinks;
    if (notificationPrefs.weeklyDigest !== undefined)
      updateFields["notificationPrefs.weeklyDigest"] =
        notificationPrefs.weeklyDigest;
    if (notificationPrefs.reminders !== undefined)
      updateFields["notificationPrefs.reminders"] =
        notificationPrefs.reminders;
  }

  let updatedUser = null;

  if (getDbStatus().isConnected) {
    try {
      updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updateFields },
        { returnDocument: "after", runValidators: true },
      ).lean();
    } catch (err) {
      console.error(
        "[UserService] MongoDB error updating user settings:",
        err.message,
      );
    }
  }

  if (!updatedUser) {
    // In-memory fallback
    const existing = await getUserById(userId);
    if (!existing) {
      throw new Error("User not found");
    }

    if (onboardingComplete !== undefined) {
      existing.onboardingComplete = Boolean(onboardingComplete);
    }
    if (globalInstructions !== undefined) {
      existing.globalInstructions = globalInstructions;
    }
    if (preferences) {
      existing.preferences = {
        ...(existing.preferences || {}),
        ...preferences,
      };
    }
    if (quietHours) {
      existing.quietHours = {
        ...(existing.quietHours || {}),
        ...quietHours,
      };
    }
    if (notificationPrefs) {
      existing.notificationPrefs = {
        ...(existing.notificationPrefs || {}),
        ...notificationPrefs,
      };
    }
    existing.updatedAt = new Date();
    updatedUser = existing;
  }

  return {
    _id: updatedUser._id || updatedUser.id,
    name: updatedUser.name,
    email: updatedUser.email,
    avatar: updatedUser.avatar,
    preferences: updatedUser.preferences,
    globalInstructions: updatedUser.globalInstructions,
    onboardingComplete: updatedUser.onboardingComplete ?? false,
    quietHours: updatedUser.quietHours,
    notificationPrefs: updatedUser.notificationPrefs,
    updatedAt: updatedUser.updatedAt,
  };
};

