import apiClient from './client'
import { buildQueryString } from '@/lib/utils'
import type { UserProfile } from './auth'
import type { PaginatedResponse } from './posts'

export interface AnalyticsData {
  totalUsers: number
  newUsersToday: number
  totalPosts: number
  totalVideos: number
  totalViews: number
  totalComments: number
  activeUsersLast7Days: number
  topTags: { tag: string; count: number }[]
  dailyStats: {
    date: string
    users: number
    posts: number
    videos: number
    views: number
  }[]
}

export interface AdminUser extends UserProfile {
  isBanned: boolean
  lastLoginAt: string | null
}

export interface GetUsersParams {
  page?: number
  limit?: number
  role?: string
  search?: string
  banned?: boolean
}

export interface ContentReport {
  id: string
  reason: string
  status: 'pending' | 'reviewed' | 'dismissed'
  reporter: {
    id: string
    username: string
    displayName: string
    avatarUrl: string | null
  }
  contentType: 'post' | 'video' | 'comment'
  contentId: string
  contentSnippet: string
  createdAt: string
}

export interface PendingContent {
  id: string
  type: 'post' | 'video'
  title: string
  author: {
    id: string
    username: string
    displayName: string
    avatarUrl: string | null
  }
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

export const adminApi = {
  getAnalytics: async (): Promise<AnalyticsData> => {
    const { data } = await apiClient.get<AnalyticsData>('/admin/analytics')
    return data
  },

  getUsers: async (params?: GetUsersParams): Promise<PaginatedResponse<AdminUser>> => {
    const qs = buildQueryString({
      page: params?.page ?? 1,
      limit: params?.limit ?? 20,
      role: params?.role,
      search: params?.search,
      banned: params?.banned,
    })
    const { data } = await apiClient.get<PaginatedResponse<AdminUser>>(`/admin/users${qs}`)
    return data
  },

  updateUserRole: async (id: string, role: string): Promise<AdminUser> => {
    const { data } = await apiClient.put<AdminUser>(`/admin/users/${id}/role`, { role })
    return data
  },

  banUser: async (id: string, reason?: string): Promise<void> => {
    await apiClient.post(`/admin/users/${id}/ban`, { reason })
  },

  unbanUser: async (id: string): Promise<void> => {
    await apiClient.post(`/admin/users/${id}/unban`)
  },

  getReports: async (params?: {
    page?: number
    status?: string
  }): Promise<PaginatedResponse<ContentReport>> => {
    const qs = buildQueryString({ page: params?.page ?? 1, status: params?.status })
    const { data } = await apiClient.get<PaginatedResponse<ContentReport>>(`/admin/reports${qs}`)
    return data
  },

  getContentPending: async (): Promise<PendingContent[]> => {
    const { data } = await apiClient.get<PendingContent[]>('/admin/content/pending')
    return data
  },

  approveContent: async (type: string, id: string): Promise<void> => {
    await apiClient.post(`/admin/content/${type}/${id}/approve`)
  },

  rejectContent: async (type: string, id: string, reason?: string): Promise<void> => {
    await apiClient.post(`/admin/content/${type}/${id}/reject`, { reason })
  },
}
