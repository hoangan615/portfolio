import apiClient from './client'

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  username: string
  email: string
  password: string
  displayName?: string
}

export interface AuthResponse {
  accessToken: string
  user: UserProfile
}

export interface UserProfile {
  id: string
  username: string
  email: string
  displayName: string
  avatarUrl: string | null
  bio: string | null
  role: 'user' | 'moderator' | 'admin'
  followersCount: number
  followingCount: number
  postsCount: number
  videosCount: number
  createdAt: string
  isFollowing?: boolean
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/login', credentials)
    return data
  },

  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/register', credentials)
    return data
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout')
  },

  refresh: async (): Promise<{ accessToken: string }> => {
    const { data } = await apiClient.post<{ accessToken: string }>('/auth/refresh')
    return data
  },

  me: async (): Promise<UserProfile> => {
    const { data } = await apiClient.get<UserProfile>('/auth/me')
    return data
  },

  updatePassword: async (payload: {
    currentPassword: string
    newPassword: string
  }): Promise<void> => {
    await apiClient.put('/auth/password', payload)
  },

  forgotPassword: async (email: string): Promise<void> => {
    await apiClient.post('/auth/forgot-password', { email })
  },

  resetPassword: async (token: string, password: string): Promise<void> => {
    await apiClient.post('/auth/reset-password', { token, password })
  },
}
