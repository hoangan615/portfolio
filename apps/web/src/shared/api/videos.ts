import apiClient from './client'
import { PAGINATION } from '@/lib/constants'
import { buildQueryString } from '@/lib/utils'
import type { PaginatedResponse, Comment } from './posts'

export interface Video {
  id: string
  title: string
  description: string | null
  thumbnailUrl: string | null
  hlsUrl: string
  duration: number
  views: number
  likesCount: number
  commentsCount: number
  isLiked: boolean
  isBookmarked: boolean
  tags: string[]
  status: 'processing' | 'ready' | 'error'
  author: {
    id: string
    username: string
    displayName: string
    avatarUrl: string | null
  }
  publishedAt: string
  createdAt: string
}

export interface VideoQualityLevel {
  height: number
  bitrate: number
  url: string
}

export const videosApi = {
  list: async (params?: {
    page?: number
    limit?: number
    tag?: string
    authorId?: string
    cursor?: string
  }): Promise<PaginatedResponse<Video>> => {
    const qs = buildQueryString({
      page: params?.page ?? 1,
      limit: params?.limit ?? PAGINATION.videoLimit,
      tag: params?.tag,
      authorId: params?.authorId,
      cursor: params?.cursor,
    })
    const { data } = await apiClient.get<PaginatedResponse<Video>>(`/videos${qs}`)
    return data
  },

  get: async (id: string): Promise<Video> => {
    const { data } = await apiClient.get<Video>(`/videos/${id}`)
    return data
  },

  trending: async (limit = 10): Promise<Video[]> => {
    const { data } = await apiClient.get<Video[]>(`/videos/trending?limit=${limit}`)
    return data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/videos/${id}`)
  },

  update: async (id: string, payload: { title?: string; description?: string; tags?: string[] }): Promise<Video> => {
    const { data } = await apiClient.put<Video>(`/videos/${id}`, payload)
    return data
  },

  like: async (id: string): Promise<{ liked: boolean; count: number }> => {
    const { data } = await apiClient.post(`/videos/${id}/like`)
    return data
  },

  bookmark: async (id: string): Promise<{ bookmarked: boolean }> => {
    const { data } = await apiClient.post(`/videos/${id}/bookmark`)
    return data
  },

  incrementView: async (id: string): Promise<void> => {
    await apiClient.post(`/videos/${id}/view`)
  },

  getComments: async (
    videoId: string,
    params?: { page?: number; limit?: number }
  ): Promise<PaginatedResponse<Comment>> => {
    const qs = buildQueryString({
      page: params?.page ?? 1,
      limit: params?.limit ?? PAGINATION.commentLimit,
    })
    const { data } = await apiClient.get<PaginatedResponse<Comment>>(
      `/videos/${videoId}/comments${qs}`
    )
    return data
  },

  addComment: async (videoId: string, content: string, parentId?: string): Promise<Comment> => {
    const { data } = await apiClient.post<Comment>(`/videos/${videoId}/comments`, {
      content,
      parentId,
    })
    return data
  },

  deleteComment: async (videoId: string, commentId: string): Promise<void> => {
    await apiClient.delete(`/videos/${videoId}/comments/${commentId}`)
  },
}
