import apiClient from './client'
import { buildQueryString } from '@/lib/utils'
import { PAGINATION } from '@/lib/constants'
import type { Comment, PaginatedResponse } from './posts'

export type ContentType = 'post' | 'video'

export const commentsApi = {
  getComments: async (
    contentType: ContentType,
    id: string,
    params?: { page?: number; limit?: number }
  ): Promise<PaginatedResponse<Comment>> => {
    const qs = buildQueryString({
      page: params?.page ?? 1,
      limit: params?.limit ?? PAGINATION.commentLimit,
    })
    const { data } = await apiClient.get<PaginatedResponse<Comment>>(
      `/${contentType}s/${id}/comments${qs}`
    )
    return data
  },

  addComment: async (
    contentType: ContentType,
    id: string,
    body: string,
    parentId?: string
  ): Promise<Comment> => {
    const { data } = await apiClient.post<Comment>(`/${contentType}s/${id}/comments`, {
      content: body,
      parentId,
    })
    return data
  },

  deleteComment: async (id: string): Promise<void> => {
    await apiClient.delete(`/comments/${id}`)
  },

  editComment: async (id: string, body: string): Promise<Comment> => {
    const { data } = await apiClient.put<Comment>(`/comments/${id}`, { content: body })
    return data
  },

  likeComment: async (id: string): Promise<{ liked: boolean; count: number }> => {
    const { data } = await apiClient.post<{ liked: boolean; count: number }>(
      `/comments/${id}/like`
    )
    return data
  },
}
