import axios from 'axios';

/**
 * Shared Axios client configured for session cookies and standard error formatting.
 */
export const http = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor
http.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

// Response interceptor: normalize error format to { error: { code, message, details } }
http.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Server responded with an error status
    if (error.response) {
      const data = error.response.data;

      // Check if backend already formatted as { error: { code, message, details } }
      if (data && data.error) {
        return Promise.reject(data.error);
      }

      // Fallback for non-standard error responses
      const normalizedError = {
        code: `HTTP_${error.response.status}`,
        message: data?.message || error.response.statusText || 'Request failed',
        details: data || null,
        statusCode: error.response.status,
      };
      return Promise.reject(normalizedError);
    }

    // Network error / connection refused
    if (error.request) {
      const networkError = {
        code: 'NETWORK_ERROR',
        message: 'Unable to reach the admission server. Please check your connection.',
        details: null,
      };
      return Promise.reject(networkError);
    }

    // Client setup error
    return Promise.reject({
      code: 'CLIENT_ERROR',
      message: error.message || 'An unexpected client error occurred',
      details: null,
    });
  }
);

export const api = {
  get: (url, config = {}) => http.get(url, config),
  post: (url, data = {}, config = {}) => http.post(url, data, config),
  put: (url, data = {}, config = {}) => http.put(url, data, config),
  patch: (url, data = {}, config = {}) => http.patch(url, data, config),
  delete: (url, config = {}) => http.delete(url, config),
};

export default http;
