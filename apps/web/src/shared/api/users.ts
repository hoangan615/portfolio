import apiClient from './client'
import { buildQueryString } from '@/lib/utils'
import type { UserProfile } from './auth'
import type { PagedResponse } from './posts'
import type { Post } from './posts'
import type { Video } from './videos'

export interface UpdateProfilePayload {
  displayName?: string
  bio?: string
  websiteUrl?: string
  location?: string
}

export interface FollowStatus {
  isFollowing: boolean
  followerCount: number
}

export const usersApi = {
  getUser: async (username: string): Promise<UserProfile> => {
    const { data } = await apiClient.get<UserProfile>(`/users/${username}`)
    return data
  },

  followUser: async (userId: string): Promise<void> => {
    await apiClient.post(`/users/${userId}/follow`)
  },

  unfollowUser: async (userId: string): Promise<void> => {
    await apiClient.delete(`/users/${userId}/follow`)
  },

  getFollowStatus: async (userId: string): Promise<FollowStatus> => {
    const { data } = await apiClient.get<FollowStatus>(`/users/${userId}/follow-status`)
    return data
  },

  getFollowers: async (
    userId: string,
    params?: { page?: number; pageSize?: number }
  ): Promise<PagedResponse<UserProfile>> => {
    const qs = buildQueryString({ page: params?.page ?? 1, page_size: params?.pageSize ?? 20 })
    const { data } = await apiClient.get<PagedResponse<UserProfile>>(
      `/users/${userId}/followers${qs}`
    )
    return data
  },

  getFollowing: async (
    userId: string,
    params?: { page?: number; pageSize?: number }
  ): Promise<PagedResponse<UserProfile>> => {
    const qs = buildQueryString({ page: params?.page ?? 1, page_size: params?.pageSize ?? 20 })
    const { data } = await apiClient.get<PagedResponse<UserProfile>>(
      `/users/${userId}/following${qs}`
    )
    return data
  },

  updateProfile: async (payload: UpdateProfilePayload): Promise<UserProfile> => {
    // Backend expects snake_case request body (transformer only applies to responses)
    const body: Record<string, unknown> = {}
    if (payload.displayName !== undefined) body.display_name = payload.displayName
    if (payload.bio !== undefined) body.bio = payload.bio
    if (payload.websiteUrl !== undefined) body.website_url = payload.websiteUrl
    if (payload.location !== undefined) body.location = payload.location
    const { data } = await apiClient.patch<UserProfile>('/users/me', body)
    return data
  },

  getUserVideos: async (
    userId: string,
    params?: { page?: number; pageSize?: number }
  ): Promise<PagedResponse<Video>> => {
    const qs = buildQueryString({
      page: params?.page ?? 1,
      page_size: params?.pageSize ?? 12,
      user_id: userId,
    })
    const { data } = await apiClient.get<PagedResponse<Video>>(`/videos${qs}`)
    return data
  },

  // User posts are fetched via /posts?user_id=<uuid>
  getUserPosts: async (
    userId: string,
    params?: { page?: number; pageSize?: number }
  ): Promise<PagedResponse<Post>> => {
    const qs = buildQueryString({
      page: params?.page ?? 1,
      page_size: params?.pageSize ?? 20,
      user_id: userId,
    })
    const { data } = await apiClient.get<PagedResponse<Post>>(`/posts${qs}`)
    return data
  },
}
