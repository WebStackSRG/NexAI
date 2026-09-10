import apiClient from "./apiClient";

/**
 * Execute unified global search
 */
export const searchGlobal = async (q, limit = 5) => {
  const res = await apiClient.get("/search", {
    params: { q, limit },
  });
  return res.data;
};

