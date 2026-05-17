import apiClient from './client'
import { buildQueryString } from '@/lib/utils'
import { PAGINATION } from '@/lib/constants'
import type { Comment, PagedResponse } from './posts'

export type ContentType = 'post' | 'video'

export const commentsApi = {
  getComments: async (
    contentType: ContentType,
    id: string,
    params?: { page?: number; pageSize?: number }
  ): Promise<PagedResponse<Comment>> => {
    const qs = buildQueryString({
      content_type: contentType,
      content_id: id,
      page: params?.page ?? 1,
      page_size: params?.pageSize ?? PAGINATION.commentLimit,
    })
    const { data } = await apiClient.get<PagedResponse<Comment>>(`/comments${qs}`)
    return data
  },

  addComment: async (
    contentType: ContentType,
    id: string,
    body: string,
    parentId?: string
  ): Promise<Comment> => {
    const { data } = await apiClient.post<Comment>(`/comments`, {
      content_type: contentType,
      content_id: id,
      body,
      parent_id: parentId ?? null,
    })
    return data
  },

  deleteComment: async (id: string): Promise<void> => {
    await apiClient.delete(`/comments/${id}`)
  },

  editComment: async (id: string, body: string): Promise<Comment> => {
    const { data } = await apiClient.put<Comment>(`/comments/${id}`, { body })
    return data
  },

  likeComment: async (_id: string): Promise<{ liked: boolean; count: number }> => {
    // Comment likes are handled via the reactions API
    return { liked: false, count: 0 }
  },
}
