export const APP_NAME = import.meta.env.VITE_APP_NAME ?? 'Portfolio & Tech Takeaway'
export const APP_URL = import.meta.env.VITE_APP_URL ?? 'http://localhost'
// Empty string = relative URLs (works behind nginx proxy in Docker)
// Set VITE_API_URL=http://localhost:8000 for local dev without Docker
export const API_URL = import.meta.env.VITE_API_URL ?? ''

export const QUERY_KEYS = {
  // Auth
  me: ['me'] as const,

  // Feed
  feed: ['feed'] as const,
  feedInfinite: (filter?: string) => ['feed', 'infinite', filter] as const,

  // Posts
  posts: ['posts'] as const,
  post: (slug: string) => ['posts', slug] as const,
  postComments: (postId: string) => ['posts', postId, 'comments'] as const,

  // Videos
  videos: ['videos'] as const,
  video: (id: string) => ['videos', id] as const,
  videoComments: (videoId: string) => ['videos', videoId, 'comments'] as const,
  trending: ['videos', 'trending'] as const,

  // Users
  users: ['users'] as const,
  user: (username: string) => ['users', username] as const,
  userPosts: (username: string) => ['users', username, 'posts'] as const,
  userVideos: (username: string) => ['users', username, 'videos'] as const,
  followers: (username: string) => ['users', username, 'followers'] as const,
  following: (username: string) => ['users', username, 'following'] as const,

  // Notifications
  notifications: ['notifications'] as const,
  notificationsUnread: ['notifications', 'unread'] as const,

  // Admin
  adminStats: ['admin', 'stats'] as const,
  adminUsers: ['admin', 'users'] as const,
  adminReports: ['admin', 'reports'] as const,
} as const

export const ROUTES = {
  home: '/',
  community: '/community',
  watch: (id: string) => `/watch/${id}`,
  post: (slug: string) => `/post/${slug}`,
  profile: (username: string) => `/u/${username}`,
  login: '/login',
  register: '/register',
  settings: '/settings',
  notifications: '/notifications',
  admin: '/admin',
  dashboardPosts: '/dashboard/posts',
  dashboardVideos: '/dashboard/videos',
  cv: '/cv',
} as const

export const PAGINATION = {
  defaultLimit: 20,
  videoLimit: 12,
  commentLimit: 10,
} as const

export const UPLOAD = {
  maxFileSize: 500 * 1024 * 1024, // 500 MB
  chunkSize: 5 * 1024 * 1024, // 5 MB
  allowedVideoTypes: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
} as const

export const ROLES = {
  user: 'user',
  moderator: 'moderator',
  admin: 'admin',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]
