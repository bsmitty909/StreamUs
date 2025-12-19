import axios from 'axios';
import type { CreateUserDto, LoginDto, AuthTokens, User, UpdateUserDto } from '@streamus/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh`, null, {
            headers: { Authorization: `Bearer ${refreshToken}` },
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/auth/login';
      }
    }

    return Promise.reject(error);
  }
);

export const authApi = {
  register: (data: CreateUserDto) => api.post<AuthTokens>('/auth/register', data),
  login: (data: LoginDto) => api.post<AuthTokens>('/auth/login', data),
  logout: () => api.post('/auth/logout'),
};

export const userApi = {
  getProfile: () => api.get<User>('/users/me'),
  updateProfile: (data: UpdateUserDto) => api.patch<User>('/users/me', data),
};

export const streamsApi = {
  create: (data: { title: string; description?: string }) =>
    api.post('/streams', data),
  list: () => api.get('/streams'),
  get: (id: string) => api.get(`/streams/${id}`),
  getToken: (id: string) => api.post<{ token: string }>(`/streams/${id}/token`),
  delete: (id: string) => api.delete(`/streams/${id}`),
};

export { api };
export default api;
