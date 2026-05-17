import apiClient from './client'
import { PAGINATION } from '@/lib/constants'
import { buildQueryString } from '@/lib/utils'
import type { PagedResponse } from './posts'

// Matches backend VideoOut schema (after camelCase transform)
export interface Video {
  id: string
  userId: string
  title: string
  description: string | null
  status: string
  visibility: string
  hlsManifestUrl: string | null
  thumbnailUrl: string | null
  previewGifUrl: string | null
  durationSeconds: number | null
  fileSizeBytes: number | null
  allowComment: boolean
  allowEmbed: boolean
  viewCount: number
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

// VideoDetail extends VideoOut with raw key and qualities
export interface VideoDetail extends Video {
  rawS3Key: string | null
  qualities: VideoQualityLevel[]
}

export interface VideoQualityLevel {
  id: string
  label: string
  width: number | null
  height: number | null
  bitrate: number | null
  s3Key: string
  createdAt: string
}

export const videosApi = {
  list: async (params?: {
    page?: number
    pageSize?: number
  }): Promise<PagedResponse<Video>> => {
    const qs = buildQueryString({
      page: params?.page ?? 1,
      page_size: params?.pageSize ?? PAGINATION.videoLimit,
    })
    const { data } = await apiClient.get<PagedResponse<Video>>(`/videos${qs}`)
    return data
  },

  get: async (id: string): Promise<VideoDetail> => {
    const { data } = await apiClient.get<VideoDetail>(`/videos/${id}`)
    return data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/videos/${id}`)
  },

  update: async (id: string, payload: { title?: string; description?: string; visibility?: string; allowComment?: boolean; allowEmbed?: boolean }): Promise<Video> => {
    const body: Record<string, unknown> = {}
    if (payload.title !== undefined) body.title = payload.title
    if (payload.description !== undefined) body.description = payload.description
    if (payload.visibility !== undefined) body.visibility = payload.visibility
    if (payload.allowComment !== undefined) body.allow_comment = payload.allowComment
    if (payload.allowEmbed !== undefined) body.allow_embed = payload.allowEmbed
    const { data } = await apiClient.put<Video>(`/videos/${id}`, body)
    return data
  },
}
