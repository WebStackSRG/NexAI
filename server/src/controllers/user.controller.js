import * as userService from "../services/user.service.js";

/**
 * GET /users/settings — Fetch authenticated user settings and profile
 */
export const getSettings = async (req, res, next) => {
  try {
    const settings = await userService.getUserSettings(req.user._id);
    return res.json({ settings });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /users/settings — Update user settings and preferences
 */
export const updateSettings = async (req, res, next) => {
  try {
    const updated = await userService.updateUserSettings(
      req.user._id,
      req.body,
    );
    return res.json({
      message: "Settings updated successfully",
      settings: updated,
    });
  } catch (error) {
    next(error);
  }
};
