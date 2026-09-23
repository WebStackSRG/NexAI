import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const errorResponse = error.response?.data?.error || {
      code: error.code || 'NETWORK_ERROR',
      message: error.message || 'Unable to connect to the server',
      details: null,
    };
    return Promise.reject(errorResponse);
  },
);
