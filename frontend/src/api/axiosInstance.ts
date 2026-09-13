import axios from 'axios';

/**
 * Single axios instance for every call to the API.
 *
 * Replaces the hardcoded `http://localhost:3000` that was repeated at each call
 * site, and moves the Authorization header into one interceptor so pages no
 * longer rebuild it by hand (and cannot forget to).
 */
// Exported so the WebSocket hook (useTransactionUpdates) connects to the same
// origin as every REST call, instead of maintaining its own copy of this.
export const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

/** Attach the bearer token, when there is one, to every outgoing request. */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * A 401 now means the token is missing, malformed or expired (the guard used to
 * answer 403 for all of these). Either way the stored token is useless, so drop
 * it and send the user to the login page.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    if (status === 401 || status === 403) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }

    return Promise.reject(error);
  },
);

/**
 * Pull a displayable message out of an axios error. The API returns
 * `{ message, errors? }`, where `errors` is the list of failed validation
 * constraints — showing those is far more useful than a generic failure notice.
 */
export function apiErrorMessage(error: any, fallback = 'Something went wrong'): string {
  const data = error?.response?.data;
  if (!data) return fallback;
  if (Array.isArray(data.errors) && data.errors.length > 0) {
    return data.errors.join('\n');
  }
  return data.message || fallback;
}

export default api;
