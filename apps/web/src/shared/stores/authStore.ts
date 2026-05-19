import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserProfile } from '@/shared/api/auth'

interface AuthState {
  accessToken: string | null
  user: UserProfile | null
  isAuthenticated: boolean

  setAccessToken: (token: string) => void
  setUser: (user: UserProfile) => void
  login: (token: string, user: UserProfile) => void
  logout: () => void
  updateUser: (updates: Partial<UserProfile>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      isAuthenticated: false,

      setAccessToken: (token) =>
        set({ accessToken: token, isAuthenticated: true }),

      setUser: (user) =>
        set({ user }),

      login: (token, user) =>
        set({ accessToken: token, user, isAuthenticated: true }),

      logout: () =>
        set({ accessToken: null, user: null, isAuthenticated: false }),

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken,
      }),
    }
  )
)
