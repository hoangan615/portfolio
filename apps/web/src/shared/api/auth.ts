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

export interface UserProfile {
  id: string
  username: string
  email: string
  displayName: string | null
  avatarUrl: string | null
  coverUrl?: string | null
  bio?: string | null
  websiteUrl?: string | null
  location?: string | null
  role: string
  followerCount?: number
  followingCount?: number
  postCount?: number
  createdAt?: string
  isFollowing?: boolean
  // Legacy aliases kept for backward compat
  followersCount?: number
  followingCount_?: number
  postsCount?: number
  videosCount?: number
}

export interface AuthResponse {
  accessToken: string
  refreshToken?: string
  tokenType?: string
  expiresIn?: number
  user: UserProfile
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/login', credentials)
    return data
  },

  register: async (credentials: RegisterCredentials): Promise<{ message: string }> => {
    const { data } = await apiClient.post<{ message: string }>('/auth/register', {
      username: credentials.username,
      email: credentials.email,
      password: credentials.password,
      display_name: credentials.displayName,
    })
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
    const { data } = await apiClient.get<UserProfile>('/users/me')
    return data
  },

  updatePassword: async (payload: {
    currentPassword: string
    newPassword: string
  }): Promise<void> => {
    await apiClient.post('/users/me/change-password', {
      current_password: payload.currentPassword,
      new_password: payload.newPassword,
    })
  },

  forgotPassword: async (email: string): Promise<void> => {
    await apiClient.post('/auth/forgot-password', { email })
  },

  resetPassword: async (token: string, password: string): Promise<void> => {
    await apiClient.post('/auth/reset-password', { token, new_password: password })
  },
}
