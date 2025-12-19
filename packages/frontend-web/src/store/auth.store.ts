import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@streamus/shared';
import { authApi, userApi } from '@/lib/api';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  setTokens: (accessToken: string, refreshToken: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      isAuthenticated: false,

      setTokens: (accessToken: string, refreshToken: string) => {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        set({ accessToken, refreshToken, isAuthenticated: true });
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await authApi.login({ email, password });
          const { accessToken, refreshToken } = response.data;
          
          get().setTokens(accessToken, refreshToken);
          await get().loadUser();
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (email: string, username: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await authApi.register({ email, username, password });
          const { accessToken, refreshToken } = response.data;
          
          get().setTokens(accessToken, refreshToken);
          await get().loadUser();
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      loadUser: async () => {
        const { accessToken } = get();
        if (!accessToken) {
          set({ isLoading: false, isAuthenticated: false });
          return;
        }

        try {
          const response = await userApi.getProfile();
          set({
            user: response.data,
            isLoading: false,
            isAuthenticated: true,
          });
        } catch (error) {
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isLoading: false,
            isAuthenticated: false,
          });
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      },

      logout: async () => {
        try {
          await authApi.logout();
        } catch (error) {
          // Ignore logout errors
        } finally {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);
