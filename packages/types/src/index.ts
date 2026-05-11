// ─── Enums / Union Types ──────────────────────────────────────────────────────

export type UserRole = 'owner' | 'admin' | 'moderator' | 'member' | 'restricted' | 'banned' | 'guest'
export type PostType = 'article' | 'short' | 'gallery' | 'til'
export type PostStatus = 'draft' | 'pending_review' | 'published' | 'rejected' | 'archived'
export type VideoStatus = 'uploading' | 'processing' | 'ready' | 'failed'
export type VideoVisibility = 'public' | 'unlisted' | 'private'

// ─── Core Entities ────────────────────────────────────────────────────────────

export interface User {
  id: string
  username: string
  email: string
  display_name: string | null
  avatar_url: string | null
  cover_url: string | null
  bio: string | null
  role: UserRole
  follower_count: number
  following_count: number
  post_count: number
  created_at: string
}

export interface Post {
  id: string
  user_id: string
  author: User
  type: PostType
  title: string
  slug: string
  content: string
  excerpt: string | null
  cover_image_url: string | null
  status: PostStatus
  view_count: number
  published_at: string | null
  created_at: string
  tags: Tag[]
}

export interface Video {
  id: string
  user_id: string
  uploader: User
  title: string
  description: string | null
  status: VideoStatus
  visibility: VideoVisibility
  hls_manifest_url: string | null
  thumbnail_url: string | null
  preview_gif_url: string | null
  duration_seconds: number | null
  view_count: number
  allow_comment: boolean
  allow_embed: boolean
  created_at: string
  tags: Tag[]
}

export interface Comment {
  id: string
  user_id: string
  author: User
  body: string
  parent_id: string | null
  edited_at: string | null
  created_at: string
  replies?: Comment[]
}

export interface Notification {
  id: string
  type: string
  actor: User | null
  content_type: string | null
  content_id: string | null
  payload_json: Record<string, unknown>
  read: boolean
  created_at: string
}

export interface Tag {
  id: string
  name: string
  slug: string
  usage_count: number
}

export interface Category {
  id: string
  name: string
  slug: string
}

// ─── Portfolio ────────────────────────────────────────────────────────────────

export interface PortfolioProfile {
  id: string
  user_id: string
  headline: string | null
  about: string | null
  cv_url: string | null
}

export interface Skill {
  id: string
  name: string
  category: string
  level: number
  icon_url: string | null
  sort_order: number
}

export interface Experience {
  id: string
  type: 'work' | 'education'
  company: string
  title: string
  location: string | null
  start_date: string
  end_date: string | null
  description: string | null
  logo_url: string | null
}

export interface Project {
  id: string
  title: string
  description: string
  tech_stack: string[]
  thumbnail_url: string | null
  repo_url: string | null
  live_url: string | null
  featured: boolean
  sort_order: number
}

// ─── Pagination & Auth ────────────────────────────────────────────────────────

export interface PagedResponse<T> {
  items: T[]
  total: number
  page: number
  per_page: number
  has_next: boolean
}

export interface AuthTokens {
  access_token: string
  token_type: string
}
