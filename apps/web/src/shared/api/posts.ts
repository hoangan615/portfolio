import apiClient from './client'
import { PAGINATION } from '@/lib/constants'
import { buildQueryString } from '@/lib/utils'

export interface Post {
  id: string
  userId: string
  type: string
  title: string | null
  slug: string
  excerpt: string | null
  coverImageUrl: string | null
  status: string
  viewCount: number
  publishedAt: string | null
  scheduledAt: string | null
  createdAt: string
  updatedAt: string
  content?: string | null
  reviewNote?: string | null
}

// Matches backend CommentOut schema (after camelCase transform)
export interface Comment {
  id: string
  contentType: string
  contentId: string
  userId: string
  parentId: string | null
  body: string
  editedAt: string | null
  deletedAt: string | null
  createdAt: string
}

// Backend PagedResponse shape (after camelCase transform)
export interface PagedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  pages: number
  hasNext: boolean
  hasPrev: boolean
}

// Legacy alias kept for backward compat with old code
export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    hasMore: boolean
    nextCursor?: string
  }
}

export interface CreatePostPayload {
  type?: string  // article|short|gallery|til
  title?: string
  content?: string
  excerpt?: string
  coverImageUrl?: string
  categoryIds?: string[]
  tagIds?: string[]
}

export const postsApi = {
  list: async (params?: {
    page?: number
    pageSize?: number
    postType?: string
    userId?: string
  }): Promise<PagedResponse<Post>> => {
    const qs = buildQueryString({
      page: params?.page ?? 1,
      page_size: params?.pageSize ?? PAGINATION.defaultLimit,
      post_type: params?.postType,
      user_id: params?.userId,
    })
    const { data } = await apiClient.get<PagedResponse<Post>>(`/posts${qs}`)
    return data
  },

  listMine: async (params?: { page?: number; pageSize?: number }): Promise<PagedResponse<Post>> => {
    const qs = buildQueryString({
      page: params?.page ?? 1,
      page_size: params?.pageSize ?? 100,
    })
    const { data } = await apiClient.get<PagedResponse<Post>>(`/posts/mine${qs}`)
    return data
  },

  get: async (slug: string): Promise<Post> => {
    const { data } = await apiClient.get<Post>(`/posts/${slug}`)
    return data
  },

  create: async (payload: CreatePostPayload): Promise<Post> => {
    const body: Record<string, unknown> = {
      type: payload.type ?? 'article',
    }
    if (payload.title !== undefined) body.title = payload.title
    if (payload.content !== undefined) body.content = payload.content
    if (payload.excerpt !== undefined) body.excerpt = payload.excerpt
    if (payload.coverImageUrl !== undefined) body.cover_image_url = payload.coverImageUrl
    if (payload.categoryIds !== undefined) body.category_ids = payload.categoryIds
    if (payload.tagIds !== undefined) body.tag_ids = payload.tagIds
    const { data } = await apiClient.post<Post>('/posts', body)
    return data
  },

  update: async (id: string, payload: Partial<CreatePostPayload>): Promise<Post> => {
    const body: Record<string, unknown> = {}
    if (payload.type !== undefined) body.type = payload.type
    if (payload.title !== undefined) body.title = payload.title
    if (payload.content !== undefined) body.content = payload.content
    if (payload.excerpt !== undefined) body.excerpt = payload.excerpt
    if (payload.coverImageUrl !== undefined) body.cover_image_url = payload.coverImageUrl
    if (payload.categoryIds !== undefined) body.category_ids = payload.categoryIds
    if (payload.tagIds !== undefined) body.tag_ids = payload.tagIds
    const { data } = await apiClient.put<Post>(`/posts/${id}`, body)
    return data
  },

  submit: async (id: string): Promise<Post> => {
    const { data } = await apiClient.post<Post>(`/posts/${id}/submit`)
    return data
  },

  publish: async (id: string): Promise<Post> => {
    const { data } = await apiClient.post<Post>(`/posts/${id}/publish`)
    return data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/posts/${id}`)
  },

}
