import apiClient from './client'
import { buildQueryString } from '@/lib/utils'
import type { Post } from './posts'
import type { Video } from './videos'
import type { UserProfile } from './auth'

export type SearchType = 'all' | 'posts' | 'videos' | 'users' | 'tags'

export interface SearchResults {
  posts: Post[]
  videos: Video[]
  users: UserProfile[]
  tags: string[]
  meta: {
    total: number
    page: number
    limit: number
    hasMore: boolean
  }
}

export const searchApi = {
  search: async (q: string, type: SearchType = 'all', page = 1): Promise<SearchResults> => {
    const qs = buildQueryString({ q, type, page, limit: 20 })
    const { data } = await apiClient.get<SearchResults>(`/search${qs}`)
    return data
  },
}
