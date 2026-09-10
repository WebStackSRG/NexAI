import apiClient from "./apiClient";

/**
 * Fetch current user settings
 */
export const fetchSettings = async () => {
  const res = await apiClient.get("/users/settings");
  return res.data.settings;
};

/**
 * Update user settings
 */
export const updateSettings = async (settingsData) => {
  const res = await apiClient.patch("/users/settings", settingsData);
  return res.data.settings;
};

