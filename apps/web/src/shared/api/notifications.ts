import apiClient from './client'

export interface Notification {
  id: string
  type:
    | 'follow'
    | 'like_post'
    | 'like_video'
    | 'comment_post'
    | 'comment_video'
    | 'reply'
    | 'mention'
    | 'system'
  title: string
  body: string
  isRead: boolean
  actor: {
    id: string
    username: string
    displayName: string
    avatarUrl: string | null
  } | null
  targetUrl: string | null
  createdAt: string
}

export interface NotificationsResponse {
  data: Notification[]
  meta: {
    total: number
    unreadCount: number
    page: number
    limit: number
    hasMore: boolean
  }
}

export const notificationsApi = {
  getNotifications: async (page = 1, limit = 20): Promise<NotificationsResponse> => {
    const { data } = await apiClient.get<NotificationsResponse>(
      `/notifications?page=${page}&limit=${limit}`
    )
    return data
  },

  markAllRead: async (): Promise<void> => {
    await apiClient.post('/notifications/read-all')
  },

  markRead: async (id: string): Promise<void> => {
    await apiClient.post(`/notifications/${id}/read`)
  },
}
