import axios from 'axios';
import { TOKEN_KEY } from '../constants.js';

// Point this at your deployed API Gateway URL via VITE_API_URL (see .env.example).
const API_URL = import.meta.env.VITE_API_URL;
if (!API_URL) {
  // eslint-disable-next-line no-console
  console.error('VITE_API_URL is not set — configure it to your API Gateway URL in frontend/.env');
}

export const api = axios.create({ baseURL: API_URL });

// Attach the bearer token to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, drop the stale token so the app returns to the login screen.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) localStorage.removeItem(TOKEN_KEY);
    return Promise.reject(err);
  }
);

/** API origin (without the /api suffix) — used to resolve relative asset URLs. */
export const API_ORIGIN = (API_URL || '').replace(/\/api\/?$/, '');

/** Resolve a possibly-relative asset path (e.g. local /files/...) to absolute. */
export const assetUrl = (u) => (!u ? '' : /^https?:\/\//.test(u) ? u : `${API_ORIGIN}${u}`);

/** Unwrap the { success, data } envelope. */
export const unwrap = (res) => res.data?.data;

/** Human-readable message from an axios error. */
export const apiError = (err) =>
  err?.response?.data?.error?.message || err?.message || 'Something went wrong';

export default api;
