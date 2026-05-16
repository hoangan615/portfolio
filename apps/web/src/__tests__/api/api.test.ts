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

  it('me gets /auth/me', async () => {
    mockGet.mockResolvedValueOnce({ data: { id: '1', username: 'u' } })
    const result = await authApi.me()
    expect(mockGet).toHaveBeenCalledWith('/auth/me')
    expect(result.id).toBe('1')
  })

  it('forgotPassword posts to /auth/forgot-password', async () => {
    await authApi.forgotPassword('test@example.com')
    expect(mockPost).toHaveBeenCalledWith('/auth/forgot-password', { email: 'test@example.com' })
  })

  it('resetPassword posts to /auth/reset-password', async () => {
    await authApi.resetPassword('tok123', 'newpass')
    expect(mockPost).toHaveBeenCalledWith('/auth/reset-password', { token: 'tok123', password: 'newpass' })
  })

  it('updatePassword puts to /auth/password', async () => {
    await authApi.updatePassword({ currentPassword: 'old', newPassword: 'new' })
    expect(mockPut).toHaveBeenCalledWith('/auth/password', { currentPassword: 'old', newPassword: 'new' })
  })
})

// ── feedApi ───────────────────────────────────────────────────────────────────

describe('feedApi', () => {
  it('getGlobalFeed calls /feed/global with page param', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [], meta: {} } })
    await feedApi.getGlobalFeed(1)
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('/feed/global'))
  })

  it('getFollowingFeed calls /feed/following', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [], meta: {} } })
    await feedApi.getFollowingFeed()
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('/feed/following'))
  })

  it('getTrendingFeed calls /feed/trending', async () => {
    mockGet.mockResolvedValueOnce({ data: [] })
    await feedApi.getTrendingFeed()
    expect(mockGet).toHaveBeenCalledWith('/feed/trending')
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

  it('followUser posts to /users/:username/follow', async () => {
    mockPost.mockResolvedValueOnce({ data: { following: true } })
    await usersApi.followUser('testuser')
    expect(mockPost).toHaveBeenCalledWith('/users/testuser/follow')
  })

  it('unfollowUser deletes /users/:username/follow', async () => {
    mockDelete.mockResolvedValueOnce({ data: { following: false } })
    await usersApi.unfollowUser('testuser')
    expect(mockDelete).toHaveBeenCalledWith('/users/testuser/follow')
  })

  it('getFollowers calls with pagination', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [], meta: {} } })
    await usersApi.getFollowers('testuser', { page: 2 })
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('/users/testuser/followers'))
  })

  it('updateProfile puts to /users/me', async () => {
    mockPut.mockResolvedValueOnce({ data: {} })
    await usersApi.updateProfile({ displayName: 'New Name' })
    expect(mockPut).toHaveBeenCalledWith('/users/me', { displayName: 'New Name' })
  })

  it('getFollowing calls /users/:username/following', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [], meta: {} } })
    await usersApi.getFollowing('testuser', { page: 1 })
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('/users/testuser/following'))
  })

  it('getFollowing without params uses defaults', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [], meta: {} } })
    await usersApi.getFollowing('testuser')
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('/users/testuser/following'))
  })

  it('getFollowers with explicit limit', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [], meta: {} } })
    await usersApi.getFollowers('testuser', { page: 1, limit: 10 })
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('/users/testuser/followers'))
  })

  it('getFollowers without params uses defaults', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [], meta: {} } })
    await usersApi.getFollowers('testuser')
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('/users/testuser/followers'))
  })

  it('getUserPosts calls /users/:username/posts', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [], meta: {} } })
    await usersApi.getUserPosts('testuser')
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('/users/testuser/posts'))
  })

  it('getUserPosts with explicit params', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [], meta: {} } })
    await usersApi.getUserPosts('testuser', { page: 2, limit: 10, cursor: 'abc' })
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('/users/testuser/posts'))
  })

  it('getUserVideos calls /users/:username/videos', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [], meta: {} } })
    await usersApi.getUserVideos('testuser')
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('/users/testuser/videos'))
  })

  it('getUserVideos with explicit params', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [], meta: {} } })
    await usersApi.getUserVideos('testuser', { page: 2, limit: 8, cursor: 'xyz' })
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('/users/testuser/videos'))
  })
})
