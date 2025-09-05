import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = 'https://content-management-platform-4fn0.onrender.com/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const cookieToken = Cookies.get('accessToken');
  const lsToken = (typeof window !== 'undefined' ? (localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')) : undefined) || undefined;
  const rawToken = cookieToken || lsToken;
  if (rawToken) {
    const value = rawToken.startsWith('Bearer ') ? rawToken : `Bearer ${rawToken}`;
    config.headers.Authorization = value;
  }
  return config;
});

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Clear tokens and redirect to login
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
      try { localStorage.removeItem('accessToken'); } catch {}
      try { sessionStorage.removeItem('accessToken'); } catch {}
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;