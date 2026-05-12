import apiClient from './client'
import { PAGINATION } from '@/lib/constants'
import { buildQueryString } from '@/lib/utils'

export interface Post {
  id: string
  slug: string
  title: string
  content: string
  excerpt: string
  coverImage: string | null
  author: {
    id: string
    username: string
    displayName: string
    avatarUrl: string | null
  }
  tags: string[]
  likesCount: number
  commentsCount: number
  viewsCount: number
  isLiked: boolean
  isBookmarked: boolean
  publishedAt: string
  createdAt: string
  updatedAt: string
}

export interface Comment {
  id: string
  content: string
  author: {
    id: string
    username: string
    displayName: string
    avatarUrl: string | null
  }
  likesCount: number
  isLiked: boolean
  parentId: string | null
  replies?: Comment[]
  createdAt: string
}

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
  title: string
  content: string
  excerpt?: string
  coverImage?: string
  tags?: string[]
  published?: boolean
}

export const postsApi = {
  list: async (params?: {
    page?: number
    limit?: number
    tag?: string
    authorId?: string
    cursor?: string
  }): Promise<PaginatedResponse<Post>> => {
    const qs = buildQueryString({
      page: params?.page ?? 1,
      limit: params?.limit ?? PAGINATION.defaultLimit,
      tag: params?.tag,
      authorId: params?.authorId,
      cursor: params?.cursor,
    })
    const { data } = await apiClient.get<PaginatedResponse<Post>>(`/posts${qs}`)
    return data
  },

  get: async (slug: string): Promise<Post> => {
    const { data } = await apiClient.get<Post>(`/posts/${slug}`)
    return data
  },

  create: async (payload: CreatePostPayload): Promise<Post> => {
    const { data } = await apiClient.post<Post>('/posts', payload)
    return data
  },

  update: async (id: string, payload: Partial<CreatePostPayload>): Promise<Post> => {
    const { data } = await apiClient.put<Post>(`/posts/${id}`, payload)
    return data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/posts/${id}`)
  },

  like: async (id: string): Promise<{ liked: boolean; count: number }> => {
    const { data } = await apiClient.post(`/posts/${id}/like`)
    return data
  },

  bookmark: async (id: string): Promise<{ bookmarked: boolean }> => {
    const { data } = await apiClient.post(`/posts/${id}/bookmark`)
    return data
  },

  // Comments
  getComments: async (
    postId: string,
    params?: { page?: number; limit?: number }
  ): Promise<PaginatedResponse<Comment>> => {
    const qs = buildQueryString({
      page: params?.page ?? 1,
      limit: params?.limit ?? PAGINATION.commentLimit,
    })
    const { data } = await apiClient.get<PaginatedResponse<Comment>>(
      `/posts/${postId}/comments${qs}`
    )
    return data
  },

  addComment: async (postId: string, content: string, parentId?: string): Promise<Comment> => {
    const { data } = await apiClient.post<Comment>(`/posts/${postId}/comments`, {
      content,
      parentId,
    })
    return data
  },

  deleteComment: async (postId: string, commentId: string): Promise<void> => {
    await apiClient.delete(`/posts/${postId}/comments/${commentId}`)
  },

  likeComment: async (postId: string, commentId: string): Promise<{ liked: boolean; count: number }> => {
    const { data } = await apiClient.post(`/posts/${postId}/comments/${commentId}/like`)
    return data
  },
}
