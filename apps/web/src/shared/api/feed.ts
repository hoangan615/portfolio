import apiClient from './client'
import { buildQueryString } from '@/lib/utils'
import { PAGINATION } from '@/lib/constants'
import type { PagedResponse } from './posts'

// FeedItem matches the backend FeedItem schema (flat object, not a discriminated union)
export interface FeedItem {
  id: string
  itemType: string   // "post" or "video" (snake->camel: item_type)
  userId: string
  title: string | null
  slug: string | null
  excerpt: string | null
  coverImageUrl: string | null
  thumbnailUrl: string | null
  viewCount: number
  publishedAt: string | null
  createdAt: string
}

export type FeedPagedResponse = PagedResponse<FeedItem>

export const feedApi = {
  getGlobalFeed: async (page = 1): Promise<FeedPagedResponse> => {
    const qs = buildQueryString({ page, page_size: PAGINATION.defaultLimit })
    const { data } = await apiClient.get<FeedPagedResponse>(`/feed/global${qs}`)
    return data
  },

  getFollowingFeed: async (page = 1): Promise<FeedPagedResponse> => {
    const qs = buildQueryString({ page, page_size: PAGINATION.defaultLimit })
    const { data } = await apiClient.get<FeedPagedResponse>(`/feed${qs}`)
    return data
  },

  getTrendingFeed: async (page = 1): Promise<FeedPagedResponse> => {
    const qs = buildQueryString({ page, page_size: PAGINATION.defaultLimit })
    const { data } = await apiClient.get<FeedPagedResponse>(`/feed/trending${qs}`)
    return data
  },

  getExploreFeed: async (page = 1): Promise<FeedPagedResponse> => {
    const qs = buildQueryString({ page, page_size: PAGINATION.defaultLimit })
    const { data } = await apiClient.get<FeedPagedResponse>(`/feed/explore${qs}`)
    return data
  },
}
