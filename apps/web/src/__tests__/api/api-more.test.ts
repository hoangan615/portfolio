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
    mockGet.mockResolvedValueOnce({ data: { items: [], total: 0 } })
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

  it('list with explicit params', async () => {
    mockGet.mockResolvedValueOnce({ data: { items: [], total: 0 } })
    await postsApi.list({ page: 2, pageSize: 10, postType: 'article', userId: 'u1' })
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('page=2'))
  })

  it('listMine gets /posts/mine', async () => {
    mockGet.mockResolvedValueOnce({ data: { items: [], total: 0 } })
    await postsApi.listMine()
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('/posts/mine'))
  })

  it('submit posts to /posts/:id/submit', async () => {
    mockPost.mockResolvedValueOnce({ data: { id: 'post-id' } })
    await postsApi.submit('post-id')
    expect(mockPost).toHaveBeenCalledWith('/posts/post-id/submit')
  })
})

// ── videosApi ─────────────────────────────────────────────────────────────────

describe('videosApi', () => {
  it('list gets /videos', async () => {
    mockGet.mockResolvedValueOnce({ data: { items: [], total: 0 } })
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
    mockGet.mockResolvedValueOnce({ data: { items: [], total: 0 } })
    await videosApi.list({ page: 1, pageSize: 6 })
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('/videos'))
  })

  it('update puts to /videos/:id', async () => {
    mockPut.mockResolvedValueOnce({ data: {} })
    await videosApi.update('v1', { title: 'New Title' })
    expect(mockPut).toHaveBeenCalledWith('/videos/v1', { title: 'New Title' })
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
    mockGet.mockResolvedValueOnce({ data: { items: [], total: 0 } })
    await notificationsApi.getNotifications()
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('/notifications'))
  })

  it('markRead puts to /notifications/:id/read', async () => {
    mockPut.mockResolvedValueOnce({ data: {} })
    await notificationsApi.markRead('notif-id')
    expect(mockPut).toHaveBeenCalledWith('/notifications/notif-id/read')
  })

  it('markAllRead puts to /notifications/read-all', async () => {
    await notificationsApi.markAllRead()
    expect(mockPut).toHaveBeenCalledWith('/notifications/read-all')
  })
})

// ── commentsApi ───────────────────────────────────────────────────────────────

describe('commentsApi', () => {
  it('getComments gets /comments', async () => {
    mockGet.mockResolvedValueOnce({ data: { items: [], total: 0 } })
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

  it('getComments with explicit params passes page_size', async () => {
    mockGet.mockResolvedValueOnce({ data: { items: [], total: 0 } })
    await commentsApi.getComments('post', 'post-id', { page: 2, pageSize: 5 })
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('/comments'))
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('page=2'))
  })

  it('addComment with parentId sends parent_id and body', async () => {
    mockPost.mockResolvedValueOnce({ data: {} })
    await commentsApi.addComment('post', 'post-id', 'Reply!', 'parent-id')
    expect(mockPost).toHaveBeenCalledWith(
      '/comments',
      expect.objectContaining({ body: 'Reply!', parent_id: 'parent-id' })
    )
  })

  it('editComment puts to /comments/:id with body field', async () => {
    mockPut.mockResolvedValueOnce({ data: {} })
    await commentsApi.editComment('comment-id', 'edited content')
    expect(mockPut).toHaveBeenCalledWith('/comments/comment-id', { body: 'edited content' })
  })

  it('likeComment returns stub result (reactions API handles likes)', async () => {
    const result = await commentsApi.likeComment('comment-id')
    expect(result).toEqual({ liked: false, count: 0 })
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
