import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from '@/shared/stores/authStore'

const mockUser = {
  id: 'user-123',
  username: 'testuser',
  email: 'test@example.com',
  displayName: 'Test User',
  avatarUrl: null,
  bio: null,
  role: 'user' as const,
  followersCount: 0,
  followingCount: 0,
  postsCount: 0,
  videosCount: 0,
  createdAt: '2024-01-01T00:00:00Z',
}

describe('authStore', () => {
  beforeEach(() => {
    // Reset store to initial state between tests
    useAuthStore.setState({
      accessToken: null,
      user: null,
      isAuthenticated: false,
    })
  })

  // ── Initial state ───────────────────────────────────────────────────────────

  it('starts unauthenticated', () => {
    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.accessToken).toBeNull()
    expect(state.user).toBeNull()
  })

  // ── login ───────────────────────────────────────────────────────────────────

  it('login sets token, user, and isAuthenticated', () => {
    useAuthStore.getState().login('my-token', mockUser)
    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(true)
    expect(state.accessToken).toBe('my-token')
    expect(state.user).toEqual(mockUser)
  })

  // ── setAccessToken ──────────────────────────────────────────────────────────

  it('setAccessToken updates token and marks authenticated', () => {
    useAuthStore.getState().setAccessToken('new-token')
    const state = useAuthStore.getState()
    expect(state.accessToken).toBe('new-token')
    expect(state.isAuthenticated).toBe(true)
  })

  // ── setUser ─────────────────────────────────────────────────────────────────

  it('setUser updates the user object', () => {
    useAuthStore.getState().setUser(mockUser)
    expect(useAuthStore.getState().user).toEqual(mockUser)
  })

  // ── logout ──────────────────────────────────────────────────────────────────

  it('logout clears token, user, and sets isAuthenticated false', () => {
    useAuthStore.getState().login('token', mockUser)
    useAuthStore.getState().logout()
    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.accessToken).toBeNull()
    expect(state.user).toBeNull()
  })

  // ── updateUser ──────────────────────────────────────────────────────────────

  it('updateUser merges partial updates', () => {
    useAuthStore.getState().login('token', mockUser)
    useAuthStore.getState().updateUser({ displayName: 'Updated Name', bio: 'Hello' })
    const user = useAuthStore.getState().user!
    expect(user.displayName).toBe('Updated Name')
    expect(user.bio).toBe('Hello')
    // Other fields should remain unchanged
    expect(user.username).toBe('testuser')
  })

  it('updateUser does nothing when user is null', () => {
    useAuthStore.getState().updateUser({ displayName: 'X' })
    expect(useAuthStore.getState().user).toBeNull()
  })

  // ── Multiple state transitions ──────────────────────────────────────────────

  it('handles login → update → logout cycle', () => {
    const store = useAuthStore.getState()

    store.login('token-abc', mockUser)
    expect(useAuthStore.getState().isAuthenticated).toBe(true)

    useAuthStore.getState().updateUser({ bio: 'Updated bio' })
    expect(useAuthStore.getState().user?.bio).toBe('Updated bio')

    useAuthStore.getState().logout()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(useAuthStore.getState().user).toBeNull()
  })
})
