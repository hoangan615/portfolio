/**
 * Tests for remaining API modules: posts, videos, search, notifications,
 * comments, admin, portfolio.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/shared/api/client', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: {} }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    put: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
  },
}))

import apiClient from '@/shared/api/client'
import { postsApi } from '@/shared/api/posts'
import { videosApi } from '@/shared/api/videos'
import { searchApi } from '@/shared/api/search'
import { notificationsApi } from '@/shared/api/notifications'
import { commentsApi } from '@/shared/api/comments'
import { adminApi } from '@/shared/api/admin'
import { portfolioApi } from '@/shared/api/portfolio'

const mockGet = vi.mocked(apiClient.get)
const mockPost = vi.mocked(apiClient.post)
const mockPut = vi.mocked(apiClient.put)
const mockDelete = vi.mocked(apiClient.delete)
const mockPatch = vi.mocked(apiClient.patch)

beforeEach(() => vi.clearAllMocks())

// ── postsApi ──────────────────────────────────────────────────────────────────

describe('postsApi', () => {
  it('list gets /posts', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [], meta: {} } })
    await postsApi.list()
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('/posts'))
  })

  it('get gets /posts/:slug', async () => {
    mockGet.mockResolvedValueOnce({ data: { id: '1', slug: 'my-post' } })
    await postsApi.get('my-post')
    expect(mockGet).toHaveBeenCalledWith('/posts/my-post')
  })

  it('create posts to /posts', async () => {
    mockPost.mockResolvedValueOnce({ data: { id: '2' } })
    await postsApi.create({ title: 'T', content: 'C', type: 'article' })
    expect(mockPost).toHaveBeenCalledWith('/posts', expect.objectContaining({ title: 'T' }))
  })

  it('update puts to /posts/:id', async () => {
    mockPut.mockResolvedValueOnce({ data: {} })
    await postsApi.update('post-id', { title: 'Updated' })
    expect(mockPut).toHaveBeenCalledWith('/posts/post-id', { title: 'Updated' })
  })

  it('delete deletes /posts/:id', async () => {
    await postsApi.delete('post-id')
    expect(mockDelete).toHaveBeenCalledWith('/posts/post-id')
  })

  it('like posts to /posts/:id/like', async () => {
    mockPost.mockResolvedValueOnce({ data: {} })
    await postsApi.like('post-id')
    expect(mockPost).toHaveBeenCalledWith(expect.stringContaining('post-id'))
  })

  it('bookmark posts to /posts/:id/bookmark', async () => {
    mockPost.mockResolvedValueOnce({ data: {} })
    await postsApi.bookmark('post-id')
    expect(mockPost).toHaveBeenCalledWith(expect.stringContaining('post-id'))
  })

  it('list with explicit params', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [], meta: {} } })
    await postsApi.list({ page: 2, limit: 10, tag: 'react', authorId: 'u1', cursor: 'abc' })
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('page=2'))
  })

  it('getComments gets /posts/:id/comments', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [], meta: {} } })
    await postsApi.getComments('post-id')
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('/posts/post-id/comments'))
  })

  it('getComments with explicit params', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [], meta: {} } })
    await postsApi.getComments('post-id', { page: 2, limit: 5 })
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('/posts/post-id/comments'))
  })

  it('addComment posts to /posts/:id/comments', async () => {
    mockPost.mockResolvedValueOnce({ data: {} })
    await postsApi.addComment('post-id', 'Nice!')
    expect(mockPost).toHaveBeenCalledWith(expect.stringContaining('/posts/post-id/comments'), expect.any(Object))
  })

  it('deleteComment deletes /posts/:postId/comments/:id', async () => {
    await postsApi.deleteComment('post-id', 'comment-id')
    expect(mockDelete).toHaveBeenCalledWith(expect.stringContaining('/posts/post-id/comments/comment-id'))
  })

  it('likeComment posts to /posts/:postId/comments/:id/like', async () => {
    mockPost.mockResolvedValueOnce({ data: { liked: true, count: 1 } })
    await postsApi.likeComment('post-id', 'comment-id')
    expect(mockPost).toHaveBeenCalledWith(expect.stringContaining('comment-id'))
  })
})

// ── videosApi ─────────────────────────────────────────────────────────────────

describe('videosApi', () => {
  it('list gets /videos', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [], meta: {} } })
    await videosApi.list()
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('/videos'))
  })

  it('get gets /videos/:id', async () => {
    mockGet.mockResolvedValueOnce({ data: { id: 'v1' } })
    await videosApi.get('v1')
    expect(mockGet).toHaveBeenCalledWith('/videos/v1')
  })

  it('delete deletes /videos/:id', async () => {
    await videosApi.delete('v1')
    expect(mockDelete).toHaveBeenCalledWith('/videos/v1')
  })

  it('list with explicit params', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [], meta: {} } })
    await videosApi.list({ page: 1, limit: 6, tag: 'js', authorId: 'u1', cursor: 'xyz' })
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('/videos'))
  })

  it('trending calls /videos/trending', async () => {
    mockGet.mockResolvedValueOnce({ data: [] })
    await videosApi.trending()
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('/videos/trending'))
  })

  it('trending with explicit limit', async () => {
    mockGet.mockResolvedValueOnce({ data: [] })
    await videosApi.trending(5)
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('limit=5'))
  })

  it('getComments with explicit params', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [], meta: {} } })
    await videosApi.getComments('v1', { page: 2, limit: 5 })
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('/videos/v1/comments'))
  })

  it('addComment with parentId', async () => {
    mockPost.mockResolvedValueOnce({ data: {} })
    await videosApi.addComment('v1', 'Reply', 'parent-id')
    expect(mockPost).toHaveBeenCalledWith(
      expect.stringContaining('/videos/v1/comments'),
      expect.objectContaining({ parentId: 'parent-id' })
    )
  })

  it('update puts to /videos/:id', async () => {
    mockPut.mockResolvedValueOnce({ data: {} })
    await videosApi.update('v1', { title: 'New Title' })
    expect(mockPut).toHaveBeenCalledWith('/videos/v1', { title: 'New Title' })
  })

  it('like posts to /videos/:id/like', async () => {
    mockPost.mockResolvedValueOnce({ data: {} })
    await videosApi.like('v1')
    expect(mockPost).toHaveBeenCalledWith(expect.stringContaining('/videos/v1/like'))
  })

  it('bookmark posts to /videos/:id/bookmark', async () => {
    mockPost.mockResolvedValueOnce({ data: {} })
    await videosApi.bookmark('v1')
    expect(mockPost).toHaveBeenCalledWith(expect.stringContaining('/videos/v1/bookmark'))
  })

  it('incrementView posts to /videos/:id/view', async () => {
    await videosApi.incrementView('v1')
    expect(mockPost).toHaveBeenCalledWith(expect.stringContaining('/videos/v1/view'))
  })

  it('getComments gets /videos/:id/comments', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [], meta: {} } })
    await videosApi.getComments('v1')
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('/videos/v1/comments'))
  })

  it('addComment posts to /videos/:id/comments', async () => {
    mockPost.mockResolvedValueOnce({ data: {} })
    await videosApi.addComment('v1', 'Great video!')
    expect(mockPost).toHaveBeenCalledWith(expect.stringContaining('/videos/v1/comments'), expect.any(Object))
  })

  it('deleteComment deletes /videos/:videoId/comments/:id', async () => {
    await videosApi.deleteComment('v1', 'c1')
    expect(mockDelete).toHaveBeenCalledWith(expect.stringContaining('/videos/v1/comments/c1'))
  })
})

// ── searchApi ─────────────────────────────────────────────────────────────────

describe('searchApi', () => {
  it('search calls /search with query', async () => {
    mockGet.mockResolvedValueOnce({ data: { posts: [], videos: [], users: [], tags: [], meta: {} } })
    await searchApi.search('hello')
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('/search'))
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('hello'))
  })
})

// ── notificationsApi ──────────────────────────────────────────────────────────

describe('notificationsApi', () => {
  it('getNotifications gets /notifications', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [], meta: {} } })
    await notificationsApi.getNotifications()
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('/notifications'))
  })

  it('markRead posts to notification read endpoint', async () => {
    await notificationsApi.markRead('notif-id')
    expect(mockPost).toHaveBeenCalledWith('/notifications/notif-id/read')
  })

  it('markAllRead posts to read-all endpoint', async () => {
    await notificationsApi.markAllRead()
    expect(mockPost).toHaveBeenCalledWith('/notifications/read-all')
  })
})

// ── commentsApi ───────────────────────────────────────────────────────────────

describe('commentsApi', () => {
  it('getComments gets /comments', async () => {
    mockGet.mockResolvedValueOnce({ data: [] })
    await commentsApi.getComments('post', 'post-id')
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('/comments'))
  })

  it('addComment posts a comment', async () => {
    mockPost.mockResolvedValueOnce({ data: {} })
    await commentsApi.addComment('post', 'post-id', 'Nice post!')
    expect(mockPost).toHaveBeenCalled()
  })

  it('deleteComment deletes /comments/:id', async () => {
    await commentsApi.deleteComment('comment-id')
    expect(mockDelete).toHaveBeenCalledWith('/comments/comment-id')
  })

  it('getComments with explicit params', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [], meta: {} } })
    await commentsApi.getComments('post', 'post-id', { page: 2, limit: 5 })
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('/posts/post-id/comments'))
  })

  it('addComment with parentId', async () => {
    mockPost.mockResolvedValueOnce({ data: {} })
    await commentsApi.addComment('post', 'post-id', 'Reply!', 'parent-id')
    expect(mockPost).toHaveBeenCalledWith(
      expect.stringContaining('/posts/post-id/comments'),
      expect.objectContaining({ parentId: 'parent-id' })
    )
  })

  it('editComment puts to /comments/:id', async () => {
    mockPut.mockResolvedValueOnce({ data: {} })
    await commentsApi.editComment('comment-id', 'edited content')
    expect(mockPut).toHaveBeenCalledWith('/comments/comment-id', { content: 'edited content' })
  })

  it('likeComment posts to /comments/:id/like', async () => {
    mockPost.mockResolvedValueOnce({ data: { liked: true, count: 1 } })
    await commentsApi.likeComment('comment-id')
    expect(mockPost).toHaveBeenCalledWith('/comments/comment-id/like')
  })
})

// ── adminApi ──────────────────────────────────────────────────────────────────

describe('adminApi', () => {
  it('getAnalytics gets /admin/analytics', async () => {
    mockGet.mockResolvedValueOnce({ data: {} })
    await adminApi.getAnalytics()
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('/admin'))
  })

  it('getUsers gets /admin/users', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [], meta: {} } })
    await adminApi.getUsers()
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('/admin/users'))
  })

  it('updateUserRole puts to /admin/users/:id/role', async () => {
    mockPut.mockResolvedValueOnce({ data: {} })
    await adminApi.updateUserRole('user-id', 'moderator')
    expect(mockPut).toHaveBeenCalledWith('/admin/users/user-id/role', { role: 'moderator' })
  })

  it('banUser posts to /admin/users/:id/ban', async () => {
    await adminApi.banUser('user-id', 'spam')
    expect(mockPost).toHaveBeenCalledWith('/admin/users/user-id/ban', { reason: 'spam' })
  })

  it('unbanUser posts to /admin/users/:id/unban', async () => {
    await adminApi.unbanUser('user-id')
    expect(mockPost).toHaveBeenCalledWith('/admin/users/user-id/unban')
  })

  it('getReports gets /admin/reports', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [], meta: {} } })
    await adminApi.getReports()
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('/admin/reports'))
  })

  it('getUsers with explicit params', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [], meta: {} } })
    await adminApi.getUsers({ page: 2, limit: 10, role: 'admin', search: 'test', banned: true })
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('/admin/users'))
  })

  it('getReports with explicit params', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [], meta: {} } })
    await adminApi.getReports({ page: 2, status: 'pending' })
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('/admin/reports'))
  })

  it('getContentPending gets /admin/content/pending', async () => {
    mockGet.mockResolvedValueOnce({ data: [] })
    await adminApi.getContentPending()
    expect(mockGet).toHaveBeenCalledWith('/admin/content/pending')
  })

  it('approveContent posts to /admin/content/:type/:id/approve', async () => {
    await adminApi.approveContent('post', 'post-id')
    expect(mockPost).toHaveBeenCalledWith('/admin/content/post/post-id/approve')
  })

  it('rejectContent posts to /admin/content/:type/:id/reject', async () => {
    await adminApi.rejectContent('post', 'post-id', 'off-topic')
    expect(mockPost).toHaveBeenCalledWith('/admin/content/post/post-id/reject', { reason: 'off-topic' })
  })
})

// ── portfolioApi ──────────────────────────────────────────────────────────────

describe('portfolioApi', () => {
  it('getPortfolio gets /portfolio', async () => {
    mockGet.mockResolvedValueOnce({ data: {} })
    await portfolioApi.getPortfolio()
    expect(mockGet).toHaveBeenCalledWith('/portfolio')
  })

  it('getSkills gets /portfolio/skills', async () => {
    mockGet.mockResolvedValueOnce({ data: [] })
    await portfolioApi.getSkills()
    expect(mockGet).toHaveBeenCalledWith('/portfolio/skills')
  })

  it('getExperiences gets /portfolio/experiences', async () => {
    mockGet.mockResolvedValueOnce({ data: [] })
    await portfolioApi.getExperiences()
    expect(mockGet).toHaveBeenCalledWith('/portfolio/experiences')
  })

  it('getProjects gets /portfolio/projects', async () => {
    mockGet.mockResolvedValueOnce({ data: [] })
    await portfolioApi.getProjects()
    expect(mockGet).toHaveBeenCalledWith('/portfolio/projects')
  })

  it('createContactMessage posts to /contact', async () => {
    mockPost.mockResolvedValueOnce({ data: {} })
    await portfolioApi.createContactMessage({ name: 'John', email: 'j@ex.com', message: 'Hi' })
    expect(mockPost).toHaveBeenCalledWith('/contact', expect.any(Object))
  })

  it('updatePortfolio puts to /portfolio', async () => {
    mockPut.mockResolvedValueOnce({ data: {} })
    await portfolioApi.updatePortfolio({ name: 'Updated Name' })
    expect(mockPut).toHaveBeenCalledWith('/portfolio', { name: 'Updated Name' })
  })

  it('createSkill posts to /portfolio/skills', async () => {
    mockPost.mockResolvedValueOnce({ data: {} })
    await portfolioApi.createSkill({ name: 'TypeScript', category: 'lang', level: 90 })
    expect(mockPost).toHaveBeenCalledWith('/portfolio/skills', expect.any(Object))
  })

  it('updateSkill puts to /portfolio/skills/:id', async () => {
    mockPut.mockResolvedValueOnce({ data: {} })
    await portfolioApi.updateSkill('skill-1', { level: 95 })
    expect(mockPut).toHaveBeenCalledWith('/portfolio/skills/skill-1', { level: 95 })
  })

  it('deleteSkill deletes /portfolio/skills/:id', async () => {
    await portfolioApi.deleteSkill('skill-1')
    expect(mockDelete).toHaveBeenCalledWith('/portfolio/skills/skill-1')
  })
})
