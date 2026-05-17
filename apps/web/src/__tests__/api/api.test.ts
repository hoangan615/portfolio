/**
 * Tests for shared/api/* — mocks apiClient to verify each function hits
 * the right endpoint with the right method and payload.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── mock the axios client ─────────────────────────────────────────────────────
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
import { authApi } from '@/shared/api/auth'
import { feedApi } from '@/shared/api/feed'
import { usersApi } from '@/shared/api/users'

const mockGet = vi.mocked(apiClient.get)
const mockPost = vi.mocked(apiClient.post)
const mockPut = vi.mocked(apiClient.put)
const mockDelete = vi.mocked(apiClient.delete)
const mockPatch = vi.mocked(apiClient.patch)

beforeEach(() => {
  vi.clearAllMocks()
})

// ── authApi ───────────────────────────────────────────────────────────────────

describe('authApi', () => {
  it('login posts to /auth/login', async () => {
    mockPost.mockResolvedValueOnce({ data: { accessToken: 'tok', user: {} } })
    await authApi.login({ email: 'a@b.com', password: 'pass' })
    expect(mockPost).toHaveBeenCalledWith('/auth/login', { email: 'a@b.com', password: 'pass' })
  })

  it('register posts to /auth/register', async () => {
    mockPost.mockResolvedValueOnce({ data: { accessToken: 'tok', user: {} } })
    await authApi.register({ username: 'u', email: 'e@mail.com', password: 'p' })
    expect(mockPost).toHaveBeenCalledWith('/auth/register', expect.objectContaining({ email: 'e@mail.com' }))
  })

  it('logout posts to /auth/logout', async () => {
    await authApi.logout()
    expect(mockPost).toHaveBeenCalledWith('/auth/logout')
  })

  it('refresh posts to /auth/refresh', async () => {
    mockPost.mockResolvedValueOnce({ data: { accessToken: 'new' } })
    const result = await authApi.refresh()
    expect(mockPost).toHaveBeenCalledWith('/auth/refresh')
    expect(result.accessToken).toBe('new')
  })

  it('me gets /users/me', async () => {
    mockGet.mockResolvedValueOnce({ data: { id: '1', username: 'u' } })
    const result = await authApi.me()
    expect(mockGet).toHaveBeenCalledWith('/users/me')
    expect(result.id).toBe('1')
  })

  it('forgotPassword posts to /auth/forgot-password', async () => {
    await authApi.forgotPassword('test@example.com')
    expect(mockPost).toHaveBeenCalledWith('/auth/forgot-password', { email: 'test@example.com' })
  })

  it('resetPassword posts to /auth/reset-password', async () => {
    await authApi.resetPassword('tok123', 'newpass')
    expect(mockPost).toHaveBeenCalledWith('/auth/reset-password', { token: 'tok123', new_password: 'newpass' })
  })

  it('updatePassword posts to /users/me/change-password', async () => {
    await authApi.updatePassword({ currentPassword: 'old', newPassword: 'new' })
    expect(mockPost).toHaveBeenCalledWith('/users/me/change-password', {
      current_password: 'old',
      new_password: 'new',
    })
  })
})

// ── feedApi ───────────────────────────────────────────────────────────────────

describe('feedApi', () => {
  it('getGlobalFeed calls /feed/global with page param', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [], meta: {} } })
    await feedApi.getGlobalFeed(1)
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('/feed/global'))
  })

  it('getFollowingFeed calls /feed', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [], meta: {} } })
    await feedApi.getFollowingFeed()
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('/feed'))
  })

  it('getTrendingFeed calls /feed/trending', async () => {
    mockGet.mockResolvedValueOnce({ data: [] })
    await feedApi.getTrendingFeed()
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('/feed/trending'))
  })

  it('getExploreFeed calls /feed/explore', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [], meta: {} } })
    await feedApi.getExploreFeed()
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('/feed/explore'))
  })
})

// ── usersApi ──────────────────────────────────────────────────────────────────

describe('usersApi', () => {
  it('getUser gets /users/:username', async () => {
    mockGet.mockResolvedValueOnce({ data: { id: '1' } })
    await usersApi.getUser('testuser')
    expect(mockGet).toHaveBeenCalledWith('/users/testuser')
  })

  it('followUser posts to /users/:userId/follow', async () => {
    mockPost.mockResolvedValueOnce({ data: { following: true } })
    await usersApi.followUser('testuser')
    expect(mockPost).toHaveBeenCalledWith('/users/testuser/follow')
  })

  it('unfollowUser deletes /users/:userId/follow', async () => {
    mockDelete.mockResolvedValueOnce({ data: { following: false } })
    await usersApi.unfollowUser('testuser')
    expect(mockDelete).toHaveBeenCalledWith('/users/testuser/follow')
  })

  it('getFollowers calls with pagination', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [], meta: {} } })
    await usersApi.getFollowers('testuser', { page: 2 })
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('/users/testuser/followers'))
  })

  it('updateProfile patches /users/me with snake_case body', async () => {
    mockPatch.mockResolvedValueOnce({ data: {} })
    await usersApi.updateProfile({ displayName: 'New Name' })
    expect(mockPatch).toHaveBeenCalledWith('/users/me', { display_name: 'New Name' })
  })

  it('getFollowing calls /users/:userId/following', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [], meta: {} } })
    await usersApi.getFollowing('testuser', { page: 1 })
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('/users/testuser/following'))
  })

  it('getFollowing without params uses defaults', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [], meta: {} } })
    await usersApi.getFollowing('testuser')
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('/users/testuser/following'))
  })

  it('getFollowers with explicit pageSize', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [], meta: {} } })
    await usersApi.getFollowers('testuser', { page: 1, pageSize: 10 })
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('/users/testuser/followers'))
  })

  it('getFollowers without params uses defaults', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [], meta: {} } })
    await usersApi.getFollowers('testuser')
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('/users/testuser/followers'))
  })

  it('getUserPosts calls /posts with user_id query param', async () => {
    mockGet.mockResolvedValueOnce({ data: { items: [], total: 0 } })
    await usersApi.getUserPosts('user-uuid')
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('/posts'))
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('user_id=user-uuid'))
  })

  it('getUserPosts with explicit params', async () => {
    mockGet.mockResolvedValueOnce({ data: { items: [], total: 0 } })
    await usersApi.getUserPosts('user-uuid', { page: 2, pageSize: 10 })
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('page=2'))
  })
})
