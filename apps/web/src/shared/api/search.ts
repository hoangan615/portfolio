import apiClient from './client'
import { buildQueryString } from '@/lib/utils'

// Matches backend SearchResultPost schema (after camelCase transform)
export interface SearchResultPost {
  id: string
  type: string
  title: string | null
  slug: string
  excerpt: string | null
  coverImageUrl: string | null
  userId: string
  viewCount: number
  publishedAt: string | null
  createdAt: string
}

// Matches backend SearchResultUser schema (after camelCase transform)
export interface SearchResultUser {
  id: string
  username: string
  displayName: string | null
  avatarUrl: string | null
  bio: string | null
  followerCount: number
  createdAt: string
}

// Matches backend SearchResponse schema (after camelCase transform)
export interface SearchResults {
  posts: SearchResultPost[]
  users: SearchResultUser[]
  totalPosts: number
  totalUsers: number
  query: string
  page: number
  pageSize: number
}

export type SearchType = 'post' | 'user' | null

export const searchApi = {
  search: async (q: string, type: SearchType = null, page = 1): Promise<SearchResults> => {
    const params: Record<string, unknown> = { q, page, page_size: 20 }
    if (type) params.type = type
    const qs = buildQueryString(params)
    const { data } = await apiClient.get<SearchResults>(`/search${qs}`)
    return data
  },
}
