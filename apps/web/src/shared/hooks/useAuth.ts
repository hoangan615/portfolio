import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { authApi, type LoginCredentials, type RegisterCredentials } from '@/shared/api/auth'
import { useAuthStore } from '@/shared/stores/authStore'
import { useThemeStore } from '@/shared/stores/themeStore'
import { QUERY_KEYS } from '@/lib/constants'
import { toast } from '@/shared/stores/notificationStore'

export function useAuth() {
  const { user, isAuthenticated, accessToken, login, logout: storeLogout } = useAuthStore()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  // Silently restore session on app load
  const { isLoading: isLoadingMe } = useQuery({
    queryKey: QUERY_KEYS.me,
    queryFn: authApi.me,
    enabled: isAuthenticated && !accessToken,
    retry: false,
    staleTime: Infinity,
  })

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => authApi.login(credentials),
    onSuccess: (data) => {
      login(data.accessToken, data.user)
      queryClient.setQueryData(QUERY_KEYS.me, data.user)
      toast.success('Welcome back!', `Logged in as ${data.user.displayName}`)
      navigate('/')
    },
    onError: () => {
      toast.error('Login failed', 'Invalid email or password.')
    },
  })

  const registerMutation = useMutation({
    mutationFn: (credentials: RegisterCredentials) => authApi.register(credentials),
    onSuccess: () => {
      toast.success('Account created!', 'Please check your email to verify your account.')
      navigate('/login')
    },
    onError: () => {
      toast.error('Registration failed', 'Please check your details and try again.')
    },
  })

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      storeLogout()
      queryClient.clear()
      navigate('/login')
    },
  })

  return {
    user,
    isAuthenticated,
    isLoadingMe,
    isAdmin: user?.role === 'admin',
    isModerator: user?.role === 'moderator' || user?.role === 'admin',
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    register: registerMutation.mutate,
    isRegistering: registerMutation.isPending,
    registerError: registerMutation.error,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  }
}

// Theme initialization hook - call once at App root
export function useThemeInit() {
  const { theme } = useThemeStore()

  useEffect(() => {
    const root = document.documentElement
    const applyTheme = () => {
      const resolved =
        theme === 'system'
          ? window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light'
          : theme
      root.classList.remove('light', 'dark')
      root.classList.add(resolved)
    }

    applyTheme()

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      mq.addEventListener('change', applyTheme)
      return () => mq.removeEventListener('change', applyTheme)
    }
  }, [theme])
}
