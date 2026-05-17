/**
 * Tests for shared hooks: useThemeInit, useAuth, useInfiniteScroll,
 * useVideoUpload, useImageUpload.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, renderHook, act, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

// ── useThemeInit ──────────────────────────────────────────────────────────────

import { useThemeInit } from '@/shared/hooks/useAuth'
import { useThemeStore } from '@/shared/stores/themeStore'

describe('useThemeInit', () => {
  afterEach(() => {
    document.documentElement.classList.remove('light', 'dark')
    vi.restoreAllMocks()
  })

  it('applies light theme on mount', () => {
    useThemeStore.setState({ theme: 'light' })
    renderHook(() => useThemeInit())
    expect(document.documentElement.classList.contains('light')).toBe(true)
  })

  it('applies dark theme on mount', () => {
    useThemeStore.setState({ theme: 'dark' })
    renderHook(() => useThemeInit())
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('applies system theme dark via matchMedia', () => {
    const mockMQ = {
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }
    vi.spyOn(window, 'matchMedia').mockReturnValue(mockMQ as unknown as MediaQueryList)
    useThemeStore.setState({ theme: 'system' })
    renderHook(() => useThemeInit())
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('applies system theme light via matchMedia', () => {
    const mockMQ = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }
    vi.spyOn(window, 'matchMedia').mockReturnValue(mockMQ as unknown as MediaQueryList)
    useThemeStore.setState({ theme: 'system' })
    renderHook(() => useThemeInit())
    expect(document.documentElement.classList.contains('light')).toBe(true)
  })

  it('adds and removes system theme change listener', () => {
    const mockMQ = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }
    vi.spyOn(window, 'matchMedia').mockReturnValue(mockMQ as unknown as MediaQueryList)
    useThemeStore.setState({ theme: 'system' })

    const { unmount } = renderHook(() => useThemeInit())

    expect(mockMQ.addEventListener).toHaveBeenCalledWith('change', expect.any(Function))
    unmount()
    expect(mockMQ.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function))
  })
})

// ── useAuth ───────────────────────────────────────────────────────────────────

vi.mock('@/shared/api/auth', () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    me: vi.fn().mockResolvedValue({ id: '1' }),
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
    updatePassword: vi.fn(),
  },
}))

import { useAuth } from '@/shared/hooks/useAuth'
import { authApi } from '@/shared/api/auth'
import { useAuthStore } from '@/shared/stores/authStore'

const mockUser = {
  id: '1',
  username: 'test',
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

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={qc}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    )
  }
}

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({ user: null, isAuthenticated: false, accessToken: null })
  })

  it('returns unauthenticated state by default', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })
    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.isAdmin).toBe(false)
    expect(result.current.isModerator).toBe(false)
  })

  it('identifies admin user', () => {
    useAuthStore.setState({
      user: { ...mockUser, role: 'admin' },
      isAuthenticated: true,
      accessToken: 'tok',
    })
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })
    expect(result.current.isAdmin).toBe(true)
    expect(result.current.isModerator).toBe(true)
  })

  it('identifies moderator user', () => {
    useAuthStore.setState({
      user: { ...mockUser, role: 'moderator' },
      isAuthenticated: true,
      accessToken: 'tok',
    })
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })
    expect(result.current.isAdmin).toBe(false)
    expect(result.current.isModerator).toBe(true)
  })

  it('exposes login, register, logout functions', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })
    expect(typeof result.current.login).toBe('function')
    expect(typeof result.current.register).toBe('function')
    expect(typeof result.current.logout).toBe('function')
  })

  it('calls authApi.login when login mutation fires successfully', async () => {
    vi.mocked(authApi.login).mockResolvedValue({ accessToken: 'tok', user: mockUser })
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.login({ email: 'a@b.com', password: 'pass' })
    })

    expect(authApi.login).toHaveBeenCalledWith({ email: 'a@b.com', password: 'pass' })
  })

  it('calls authApi.register when register mutation fires successfully', async () => {
    vi.mocked(authApi.register).mockResolvedValue({ accessToken: 'tok', user: mockUser })
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.register({ username: 'u', email: 'e@x.com', password: 'p' })
    })

    expect(authApi.register).toHaveBeenCalled()
  })

  it('calls authApi.logout when logout mutation fires', async () => {
    vi.mocked(authApi.logout).mockResolvedValue(undefined)
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.logout()
    })

    expect(authApi.logout).toHaveBeenCalled()
  })

  it('handles login error without throwing', async () => {
    vi.mocked(authApi.login).mockRejectedValue(new Error('Invalid credentials'))
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.login({ email: 'a@b.com', password: 'wrong' })
    })

    expect(result.current.user).toBeNull()
  })

  it('handles register error without throwing', async () => {
    vi.mocked(authApi.register).mockRejectedValue(new Error('Email taken'))
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.register({ username: 'u', email: 'taken@x.com', password: 'p' })
    })

    expect(result.current.user).toBeNull()
  })
})

// ── useInfiniteScroll ─────────────────────────────────────────────────────────

import { useInfiniteScroll } from '@/shared/hooks/useInfiniteScroll'

let capturedIOCallback: ((entries: IntersectionObserverEntry[]) => void) | null = null
let mockIOInstance: { observe: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn> } | null = null

beforeEach(() => {
  capturedIOCallback = null
  mockIOInstance = null
  vi.stubGlobal(
    'IntersectionObserver',
    function (cb: (entries: IntersectionObserverEntry[]) => void) {
      capturedIOCallback = cb
      mockIOInstance = { observe: vi.fn(), disconnect: vi.fn() }
      return mockIOInstance
    }
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function InfiniteScrollTestComponent({
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: {
  hasNextPage: boolean
  isFetchingNextPage: boolean
  fetchNextPage: () => void
}) {
  const { sentinelRef } = useInfiniteScroll({ hasNextPage, isFetchingNextPage, fetchNextPage })
  return <div ref={sentinelRef} data-testid="sentinel" />
}

describe('useInfiniteScroll', () => {
  it('returns a sentinelRef', () => {
    const { result } = renderHook(() =>
      useInfiniteScroll({ hasNextPage: false, isFetchingNextPage: false, fetchNextPage: vi.fn() })
    )
    expect(result.current.sentinelRef).toBeDefined()
  })

  it('observes the sentinel element when attached to DOM', () => {
    render(
      <InfiniteScrollTestComponent
        hasNextPage={true}
        isFetchingNextPage={false}
        fetchNextPage={vi.fn()}
      />
    )
    expect(mockIOInstance?.observe).toHaveBeenCalledWith(
      expect.objectContaining({ dataset: expect.objectContaining({ testid: 'sentinel' }) })
    )
  })

  it('calls fetchNextPage when intersecting and hasNextPage is true', () => {
    const fetchNextPage = vi.fn()
    render(
      <InfiniteScrollTestComponent
        hasNextPage={true}
        isFetchingNextPage={false}
        fetchNextPage={fetchNextPage}
      />
    )
    act(() => {
      capturedIOCallback?.([{ isIntersecting: true }] as unknown as IntersectionObserverEntry[])
    })
    expect(fetchNextPage).toHaveBeenCalled()
  })

  it('does not call fetchNextPage when not intersecting', () => {
    const fetchNextPage = vi.fn()
    render(
      <InfiniteScrollTestComponent
        hasNextPage={true}
        isFetchingNextPage={false}
        fetchNextPage={fetchNextPage}
      />
    )
    act(() => {
      capturedIOCallback?.([{ isIntersecting: false }] as unknown as IntersectionObserverEntry[])
    })
    expect(fetchNextPage).not.toHaveBeenCalled()
  })

  it('does not call fetchNextPage when isFetchingNextPage is true', () => {
    const fetchNextPage = vi.fn()
    render(
      <InfiniteScrollTestComponent
        hasNextPage={true}
        isFetchingNextPage={true}
        fetchNextPage={fetchNextPage}
      />
    )
    act(() => {
      capturedIOCallback?.([{ isIntersecting: true }] as unknown as IntersectionObserverEntry[])
    })
    expect(fetchNextPage).not.toHaveBeenCalled()
  })

  it('disconnects observer on unmount', () => {
    const { unmount } = render(
      <InfiniteScrollTestComponent
        hasNextPage={true}
        isFetchingNextPage={false}
        fetchNextPage={vi.fn()}
      />
    )
    unmount()
    expect(mockIOInstance?.disconnect).toHaveBeenCalled()
  })
})

// ── useVideoUpload ────────────────────────────────────────────────────────────

vi.mock('@/shared/api/client', () => ({
  apiClient: {
    post: vi.fn().mockResolvedValue({ data: { uploadId: 'up-1', totalChunks: 1, videoId: 'vid-1', status: 'processing' } }),
  },
  default: {
    post: vi.fn().mockResolvedValue({ data: {} }),
    get: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
    put: vi.fn().mockResolvedValue({ data: {} }),
  },
}))

import { useVideoUpload, useImageUpload } from '@/shared/hooks/useUpload'
import { apiClient } from '@/shared/api/client'

describe('useVideoUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('starts with idle state', () => {
    const { result } = renderHook(() => useVideoUpload())
    expect(result.current.state.status).toBe('idle')
    expect(result.current.state.progress).toBe(0)
  })

  it('cancel resets state to idle', () => {
    const { result } = renderHook(() => useVideoUpload())
    act(() => {
      result.current.cancel()
    })
    expect(result.current.state.status).toBe('idle')
  })

  it('reset returns to idle state', () => {
    const { result } = renderHook(() => useVideoUpload())
    act(() => {
      result.current.reset()
    })
    expect(result.current.state.status).toBe('idle')
  })

  it('rejects invalid video file type', async () => {
    const { result } = renderHook(() => useVideoUpload())
    const badFile = new File(['data'], 'test.txt', { type: 'text/plain' })

    await act(async () => {
      await result.current.upload(badFile, { title: 'Test' })
    })

    expect(result.current.state.status).toBe('idle')
    expect(apiClient.post).not.toHaveBeenCalled()
  })

  it('rejects file that is too large', async () => {
    const { result } = renderHook(() => useVideoUpload())
    const bigFile = new File(['data'], 'video.mp4', { type: 'video/mp4' })
    Object.defineProperty(bigFile, 'size', { value: 600 * 1024 * 1024 })

    await act(async () => {
      await result.current.upload(bigFile, { title: 'Big Video' })
    })

    expect(result.current.state.status).toBe('idle')
    expect(apiClient.post).not.toHaveBeenCalled()
  })

  it('uploads a valid video file through all steps', async () => {
    vi.mocked(apiClient.post)
      .mockResolvedValueOnce({ data: { uploadId: 'up-1', totalChunks: 1 } })
      .mockResolvedValueOnce({ data: {} })
      .mockResolvedValueOnce({ data: { videoId: 'vid-1', status: 'processing' } })

    const { result } = renderHook(() => useVideoUpload())
    const file = new File(['chunk'], 'video.mp4', { type: 'video/mp4' })

    await act(async () => {
      await result.current.upload(file, { title: 'My Video', description: 'desc', tags: ['ts'] })
    })

    expect(result.current.state.status).toBe('done')
    expect(result.current.state.videoId).toBe('vid-1')
  })

  it('handles upload error gracefully', async () => {
    vi.mocked(apiClient.post).mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useVideoUpload())
    const file = new File(['data'], 'video.mp4', { type: 'video/mp4' })

    await act(async () => {
      await result.current.upload(file, { title: 'Test' })
    })

    expect(result.current.state.status).toBe('error')
    expect(result.current.state.error).toBe('Network error')
  })

  it('handles non-Error thrown value (string) — uses fallback message', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(apiClient.post).mockRejectedValue('raw string error' as any)

    const { result } = renderHook(() => useVideoUpload())
    const file = new File(['data'], 'video.mp4', { type: 'video/mp4' })

    await act(async () => {
      await result.current.upload(file, { title: 'Test' })
    })

    expect(result.current.state.status).toBe('error')
    expect(result.current.state.error).toBe('Upload failed')
  })

  it('silently returns when error message is Upload cancelled', async () => {
    vi.mocked(apiClient.post).mockRejectedValue(new Error('Upload cancelled'))

    const { result } = renderHook(() => useVideoUpload())
    const file = new File(['data'], 'video.mp4', { type: 'video/mp4' })

    await act(async () => {
      await result.current.upload(file, { title: 'Test' })
    })

    // state stays at uploading (no error set) because the cancel guard returns early
    expect(result.current.state.status).toBe('uploading')
    expect(result.current.state.error).toBeNull()
  })

  it('aborts an in-progress upload when cancel is called', async () => {
    let resolvePost!: () => void
    vi.mocked(apiClient.post).mockReturnValueOnce(
      new Promise((resolve) => { resolvePost = () => resolve({ data: { uploadId: 'up-x', totalChunks: 1 } }) })
    )

    const { result } = renderHook(() => useVideoUpload())
    const file = new File(['data'], 'video.mp4', { type: 'video/mp4' })

    act(() => {
      result.current.upload(file, { title: 'Test' })
    })

    act(() => {
      result.current.cancel()
    })

    expect(result.current.state.status).toBe('idle')
    resolvePost()
  })
})

// ── useImageUpload ────────────────────────────────────────────────────────────

describe('useImageUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('starts with isUploading=false', () => {
    const { result } = renderHook(() => useImageUpload())
    expect(result.current.isUploading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('rejects invalid image type', async () => {
    const { result } = renderHook(() => useImageUpload())
    const badFile = new File(['data'], 'file.txt', { type: 'text/plain' })

    let returnValue: string | null = 'default'
    await act(async () => {
      returnValue = await result.current.uploadImage(badFile)
    })

    expect(returnValue).toBeNull()
    expect(result.current.error).toBe('Invalid image type')
  })

  it('uploads a valid image and returns URL', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { url: 'https://cdn.example.com/img.jpg' } })

    const { result } = renderHook(() => useImageUpload())
    const file = new File(['data'], 'avatar.jpg', { type: 'image/jpeg' })

    let returnValue: string | null = null
    await act(async () => {
      returnValue = await result.current.uploadImage(file)
    })

    expect(returnValue).toBe('https://cdn.example.com/img.jpg')
    expect(result.current.isUploading).toBe(false)
  })

  it('returns null and sets error on upload failure', async () => {
    vi.mocked(apiClient.post).mockRejectedValue(new Error('Server error'))

    const { result } = renderHook(() => useImageUpload())
    const file = new File(['data'], 'avatar.png', { type: 'image/png' })

    let returnValue: string | null = 'default'
    await act(async () => {
      returnValue = await result.current.uploadImage(file)
    })

    expect(returnValue).toBeNull()
    expect(result.current.error).toBe('Failed to upload image')
  })
})
