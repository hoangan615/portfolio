import axios from 'axios'
import apiClient from './client'
import { buildQueryString } from '@/lib/utils'

export interface ReactionOut {
  id: string
  contentType: string
  contentId: string
  userId: string
  emoji: string
  createdAt: string
}

export interface ReactionSummary {
  emoji: string
  count: number
}

export function isConflictError(err: unknown): boolean {
  return axios.isAxiosError(err) && err.response?.status === 409
}

export const reactionsApi = {
  addReaction: async (
    contentType: string,
    contentId: string,
    emoji: string
  ): Promise<ReactionOut> => {
    const { data } = await apiClient.post<ReactionOut>('/reactions', {
      content_type: contentType,
      content_id: contentId,
      emoji,
    })
    return data
  },

  removeReaction: async (reactionId: string): Promise<void> => {
    await apiClient.delete(`/reactions/${reactionId}`)
  },

  getSummary: async (
    contentType: string,
    contentId: string
  ): Promise<ReactionSummary[]> => {
    const qs = buildQueryString({ content_type: contentType, content_id: contentId })
    const { data } = await apiClient.get<ReactionSummary[]>(`/reactions/summary${qs}`)
    return data
  },
}
