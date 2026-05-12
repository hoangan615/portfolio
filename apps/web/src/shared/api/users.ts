import apiClient from './client'
import { buildQueryString } from '@/lib/utils'
import type { UserProfile } from './auth'
import type { PaginatedResponse } from './posts'
import type { Post } from './posts'
import type { Video } from './videos'

export interface UpdateProfilePayload {
  displayName?: string
  bio?: string
  avatarUrl?: string
  website?: string
  location?: string
}

export const usersApi = {
  getUser: async (username: string): Promise<UserProfile> => {
    const { data } = await apiClient.get<UserProfile>(`/users/${username}`)
    return data
  },

  followUser: async (username: string): Promise<{ following: boolean }> => {
    const { data } = await apiClient.post<{ following: boolean }>(`/users/${username}/follow`)
    return data
  },

  unfollowUser: async (username: string): Promise<{ following: boolean }> => {
    const { data } = await apiClient.delete<{ following: boolean }>(`/users/${username}/follow`)
    return data
  },

  getFollowers: async (
    username: string,
    params?: { page?: number; limit?: number }
  ): Promise<PaginatedResponse<UserProfile>> => {
    const qs = buildQueryString({ page: params?.page ?? 1, limit: params?.limit ?? 20 })
    const { data } = await apiClient.get<PaginatedResponse<UserProfile>>(
      `/users/${username}/followers${qs}`
    )
    return data
  },

  getFollowing: async (
    username: string,
    params?: { page?: number; limit?: number }
  ): Promise<PaginatedResponse<UserProfile>> => {
    const qs = buildQueryString({ page: params?.page ?? 1, limit: params?.limit ?? 20 })
    const { data } = await apiClient.get<PaginatedResponse<UserProfile>>(
      `/users/${username}/following${qs}`
    )
    return data
  },

  updateProfile: async (payload: UpdateProfilePayload): Promise<UserProfile> => {
    const { data } = await apiClient.put<UserProfile>('/users/me', payload)
    return data
  },

  getUserPosts: async (
    username: string,
    params?: { page?: number; limit?: number; cursor?: string }
  ): Promise<PaginatedResponse<Post>> => {
    const qs = buildQueryString({
      page: params?.page ?? 1,
      limit: params?.limit ?? 20,
      cursor: params?.cursor,
    })
    const { data } = await apiClient.get<PaginatedResponse<Post>>(
      `/users/${username}/posts${qs}`
    )
    return data
  },

  getUserVideos: async (
    username: string,
    params?: { page?: number; limit?: number; cursor?: string }
  ): Promise<PaginatedResponse<Video>> => {
    const qs = buildQueryString({
      page: params?.page ?? 1,
      limit: params?.limit ?? 12,
      cursor: params?.cursor,
    })
    const { data } = await apiClient.get<PaginatedResponse<Video>>(
      `/users/${username}/videos${qs}`
    )
    return data
  },
}
