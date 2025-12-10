import axios from 'axios';

const backendUrl = import.meta.env.VITE_BACKEND_URL ?? 'http://education.local';
const apiPrefix = import.meta.env.VITE_API_PREFIX ?? '/api/v1';

export const apiClient = axios.create({
  baseURL: `${backendUrl}${apiPrefix}`,
  withCredentials: true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

// Helper to get cookie by name
function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

apiClient.interceptors.request.use((config) => {
  const token = getCookie('XSRF-TOKEN');
  if (token) {
    config.headers['X-XSRF-TOKEN'] = decodeURIComponent(token);
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Allow callers to handle unauthorized state by receiving null data
      error.isAuthError = true;
    }
    return Promise.reject(error);
  },
);

export async function ensureCsrfCookie(): Promise<void> {
  await axios.get(`${backendUrl}/sanctum/csrf-cookie`, { withCredentials: true });
}
