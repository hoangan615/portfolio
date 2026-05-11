import apiClient from './client'
import { buildQueryString } from '@/lib/utils'
import { PAGINATION } from '@/lib/constants'
import type { PaginatedResponse } from './posts'
import type { Post } from './posts'
import type { Video } from './videos'

export type FeedItem =
  | { type: 'post'; data: Post }
  | { type: 'video'; data: Video }

export interface FeedResponse extends PaginatedResponse<FeedItem> {}

export const feedApi = {
  getGlobalFeed: async (page = 1): Promise<FeedResponse> => {
    const qs = buildQueryString({ page, limit: PAGINATION.defaultLimit })
    const { data } = await apiClient.get<FeedResponse>(`/feed/global${qs}`)
    return data
  },

  getFollowingFeed: async (page = 1): Promise<FeedResponse> => {
    const qs = buildQueryString({ page, limit: PAGINATION.defaultLimit })
    const { data } = await apiClient.get<FeedResponse>(`/feed/following${qs}`)
    return data
  },

  getTrendingFeed: async (): Promise<FeedItem[]> => {
    const { data } = await apiClient.get<FeedItem[]>('/feed/trending')
    return data
  },

  getExploreFeed: async (page = 1): Promise<FeedResponse> => {
    const qs = buildQueryString({ page, limit: PAGINATION.defaultLimit })
    const { data } = await apiClient.get<FeedResponse>(`/feed/explore${qs}`)
    return data
  },
}
