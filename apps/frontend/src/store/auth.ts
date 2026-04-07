import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '@/lib/api/client';
import { User } from '@/types';
import {
  clearAuthCookiesAction,
  loginAction,
} from '@/app/actions/auth-actions';

interface AuthState {
  user: User | null;
  token: string | null;
  sessionToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void; // Helper baru untuk onboarding
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      sessionToken: null,
      isLoading: false,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const result = await loginAction(email, password);
          if (!result.ok) {
            throw new Error(result.message);
          }

          set({
            user: result.user,
            token: result.accessToken,
            sessionToken: result.sessionToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await apiClient.delete('/auth/sessions/current');
        } catch (error) {
          console.error('Gagal mencabut sesi', error);
        }
        await clearAuthCookiesAction();
        
        set({
          user: null,
          token: null,
          sessionToken: null,
          isAuthenticated: false,
        });
        window.location.href = '/login';
      },

      checkAuth: async () => {
        set({ isLoading: true });
        try {
          const { data } = await apiClient.get<User>('/users/profile');
          set({
            user: data,
            isAuthenticated: true,
            isLoading: false
          });
        } catch {
          set({ isAuthenticated: false, user: null, token: null, sessionToken: null, isLoading: false });
        }
      },

      updateUser: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null
      })),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;