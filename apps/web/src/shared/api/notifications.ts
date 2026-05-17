import apiClient from './client'
import { buildQueryString } from '@/lib/utils'
import type { PagedResponse } from './posts'

// Matches backend NotificationOut schema (after camelCase transform)
export interface Notification {
  id: string
  userId: string
  type: string
  actorId: string | null
  contentType: string | null
  contentId: string | null
  payloadJson: Record<string, unknown> | null
  read: boolean
  createdAt: string
}

export interface UnreadCountResponse {
  unreadCount: number
}

export const notificationsApi = {
  getNotifications: async (page = 1, pageSize = 20): Promise<PagedResponse<Notification>> => {
    const qs = buildQueryString({ page, page_size: pageSize })
    const { data } = await apiClient.get<PagedResponse<Notification>>(`/notifications${qs}`)
    return data
  },

  getUnreadCount: async (): Promise<UnreadCountResponse> => {
    const { data } = await apiClient.get<UnreadCountResponse>('/notifications/unread-count')
    return data
  },

  markAllRead: async (): Promise<void> => {
    await apiClient.put('/notifications/read-all')
  },

  markRead: async (id: string): Promise<Notification> => {
    const { data } = await apiClient.put<Notification>(`/notifications/${id}/read`)
    return data
  },
}
