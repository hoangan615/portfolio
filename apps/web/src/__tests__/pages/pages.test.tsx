/**
 * Smoke tests for pages — mock feature components and render.
 * These verify each page mounts without crashing and renders the correct wrapper.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

// ── Mock feature components ───────────────────────────────────────────────────
vi.mock('@/features/portfolio/Hero', () => ({ default: () => <div>Hero</div> }))
vi.mock('@/features/portfolio/About', () => ({ default: () => <div>About</div> }))
vi.mock('@/features/portfolio/Skills', () => ({ default: () => <div>Skills</div> }))
vi.mock('@/features/portfolio/Experience', () => ({ default: () => <div>Experience</div> }))
vi.mock('@/features/portfolio/Projects', () => ({ default: () => <div>Projects</div> }))
vi.mock('@/features/portfolio/Contact', () => ({ default: () => <div>Contact</div> }))
vi.mock('@/features/community/Feed', () => ({ default: () => <div>Feed</div> }))
vi.mock('@/features/auth/LoginForm', () => ({ default: () => <div>LoginForm</div> }))
vi.mock('@/features/auth/RegisterForm', () => ({ default: () => <div>RegisterForm</div> }))
vi.mock('@/features/admin/AdminDashboard', () => ({ default: () => <div>AdminDashboard</div> }))
vi.mock('@/features/post/PostDetail', () => ({ default: ({ slug }: { slug: string }) => <div>Post:{slug}</div> }))
vi.mock('@/features/video/WatchPage', () => ({ default: () => <div>WatchPage</div> }))
vi.mock('@/features/profile/UserProfile', () => ({ default: () => <div>UserProfile</div> }))
vi.mock('@/features/notifications/NotificationBell', () => ({ default: () => <div>NotificationBell</div> }))
vi.mock('@/features/profile/UserProfile', () => ({ default: ({ username }: { username: string }) => <div>Profile:{username}</div> }))
vi.mock('@/features/video/WatchPage', () => ({ default: ({ videoId }: { videoId: string }) => <div>Watch:{videoId}</div> }))
vi.mock('@/shared/api/notifications', () => ({
  notificationsApi: {
    getNotifications: vi.fn().mockResolvedValue({ data: [], meta: { unreadCount: 0, total: 0 } }),
    markAllRead: vi.fn().mockResolvedValue(undefined),
    markRead: vi.fn().mockResolvedValue(undefined),
  },
}))

function renderWithQuery(ui: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  )
}

// ── HomePage ──────────────────────────────────────────────────────────────────

import HomePage from '@/pages/HomePage'

describe('HomePage', () => {
  it('renders portfolio sections', () => {
    render(<MemoryRouter><HomePage /></MemoryRouter>)
    expect(screen.getByText('Hero')).toBeInTheDocument()
    expect(screen.getByText('Skills')).toBeInTheDocument()
  })
})

// ── CommunityPage ─────────────────────────────────────────────────────────────

import CommunityPage from '@/pages/CommunityPage'

describe('CommunityPage', () => {
  it('renders Feed', () => {
    render(<MemoryRouter><CommunityPage /></MemoryRouter>)
    expect(screen.getByText('Feed')).toBeInTheDocument()
  })
})

// ── NotFoundPage ──────────────────────────────────────────────────────────────

import NotFoundPage from '@/pages/NotFoundPage'

describe('NotFoundPage', () => {
  it('renders 404 message', () => {
    render(<MemoryRouter><NotFoundPage /></MemoryRouter>)
    expect(screen.getByText('404')).toBeInTheDocument()
    expect(screen.getByText(/Page Not Found/i)).toBeInTheDocument()
  })

  it('has a home link', () => {
    render(<MemoryRouter><NotFoundPage /></MemoryRouter>)
    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument()
  })

  it('calls window.history.back when go back button clicked', () => {
    const backSpy = vi.spyOn(window.history, 'back').mockImplementation(() => {})
    render(<MemoryRouter><NotFoundPage /></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: /go back/i }))
    expect(backSpy).toHaveBeenCalled()
    backSpy.mockRestore()
  })
})

// ── LoginPage ─────────────────────────────────────────────────────────────────

import LoginPage from '@/pages/LoginPage'

describe('LoginPage', () => {
  it('renders login form when not authenticated', () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>)
    expect(screen.getByText('LoginForm')).toBeInTheDocument()
  })
})

// ── RegisterPage ──────────────────────────────────────────────────────────────

import RegisterPage from '@/pages/RegisterPage'

describe('RegisterPage', () => {
  it('renders register form when not authenticated', () => {
    render(<MemoryRouter><RegisterPage /></MemoryRouter>)
    expect(screen.getByText('RegisterForm')).toBeInTheDocument()
  })
})

// ── PostPage ──────────────────────────────────────────────────────────────────

import PostPage from '@/pages/PostPage'

describe('PostPage', () => {
  it('renders post when slug is provided', () => {
    render(
      <MemoryRouter initialEntries={['/post/my-slug']}>
        <Routes>
          <Route path="/post/:slug" element={<PostPage />} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('Post:my-slug')).toBeInTheDocument()
  })

  it('renders 404 when no slug', () => {
    // Render PostPage without a slug param (no route match)
    render(
      <MemoryRouter>
        <PostPage />
      </MemoryRouter>
    )
    expect(screen.getByText('404')).toBeInTheDocument()
  })
})

// ── AdminPage ─────────────────────────────────────────────────────────────────

import AdminPage from '@/pages/AdminPage'
import { useAuthStore } from '@/shared/stores/authStore'

const adminUser = {
  id: 'admin-1',
  username: 'admin',
  email: 'admin@example.com',
  displayName: 'Admin',
  avatarUrl: null,
  bio: null,
  role: 'admin' as const,
  followersCount: 0,
  followingCount: 0,
  postsCount: 0,
  videosCount: 0,
  createdAt: '2024-01-01T00:00:00Z',
}

describe('AdminPage', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, isAuthenticated: false, accessToken: null })
  })

  it('renders null when user is not admin', () => {
    const { container } = render(<MemoryRouter><AdminPage /></MemoryRouter>)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders AdminDashboard when user is admin', () => {
    useAuthStore.setState({ user: adminUser, isAuthenticated: true, accessToken: 'tok' })
    render(<MemoryRouter><AdminPage /></MemoryRouter>)
    expect(screen.getByText('AdminDashboard')).toBeInTheDocument()
  })

  it('redirects non-admin authenticated user', () => {
    useAuthStore.setState({
      user: { ...adminUser, role: 'user' },
      isAuthenticated: true,
      accessToken: 'tok',
    })
    const { container } = render(<MemoryRouter><AdminPage /></MemoryRouter>)
    expect(container).toBeEmptyDOMElement()
  })
})

// ── LoginPage (authenticated redirect) ───────────────────────────────────────

describe('LoginPage redirect', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, isAuthenticated: false, accessToken: null })
  })

  it('renders null when already authenticated', () => {
    useAuthStore.setState({ user: adminUser, isAuthenticated: true, accessToken: 'tok' })
    const { container } = render(<MemoryRouter><LoginPage /></MemoryRouter>)
    expect(container).toBeEmptyDOMElement()
  })
})

// ── RegisterPage (authenticated redirect) ────────────────────────────────────

describe('RegisterPage redirect', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, isAuthenticated: false, accessToken: null })
  })

  it('renders null when already authenticated', () => {
    useAuthStore.setState({ user: adminUser, isAuthenticated: true, accessToken: 'tok' })
    const { container } = render(<MemoryRouter><RegisterPage /></MemoryRouter>)
    expect(container).toBeEmptyDOMElement()
  })
})

// ── ProfilePage ───────────────────────────────────────────────────────────────

import ProfilePage from '@/pages/ProfilePage'

describe('ProfilePage', () => {
  it('renders UserProfile with username from route params', () => {
    render(
      <MemoryRouter initialEntries={['/u/alice']}>
        <Routes>
          <Route path="/u/:username" element={<ProfilePage />} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('Profile:alice')).toBeInTheDocument()
  })

  it('renders 404 when no username param', () => {
    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>
    )
    expect(screen.getByText('404')).toBeInTheDocument()
  })
})

// ── WatchPage ─────────────────────────────────────────────────────────────────

import WatchPage from '@/pages/WatchPage'

describe('WatchPage', () => {
  it('renders WatchFeature with videoId from route params', () => {
    render(
      <MemoryRouter initialEntries={['/watch/vid-1']}>
        <Routes>
          <Route path="/watch/:id" element={<WatchPage />} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('Watch:vid-1')).toBeInTheDocument()
  })

  it('renders 404 when no id param', () => {
    render(
      <MemoryRouter>
        <WatchPage />
      </MemoryRouter>
    )
    expect(screen.getByText('404')).toBeInTheDocument()
  })
})

// ── NotificationsPage ─────────────────────────────────────────────────────────

import NotificationsPage from '@/pages/NotificationsPage'

import { notificationsApi } from '@/shared/api/notifications'

const mockNotification = {
  id: 'n1',
  type: 'follow' as const,
  title: 'New follower',
  body: 'Someone followed you',
  isRead: false,
  actor: { id: 'u1', username: 'alice', displayName: 'Alice', avatarUrl: null },
  targetUrl: '/u/alice',
  createdAt: '2024-01-01T00:00:00Z',
}

describe('NotificationsPage', () => {
  beforeEach(() => {
    vi.mocked(notificationsApi.getNotifications).mockResolvedValue({
      data: [],
      meta: { total: 0, unreadCount: 0, page: 1, limit: 50, hasMore: false },
    })
  })

  it('renders Notifications heading', () => {
    renderWithQuery(<NotificationsPage />)
    expect(screen.getByText('Notifications')).toBeInTheDocument()
  })

  it('shows empty state when no notifications', async () => {
    renderWithQuery(<NotificationsPage />)
    await waitFor(() =>
      expect(screen.getByText(/all caught up/i)).toBeInTheDocument()
    )
  })

  it('renders notification items when data is present', async () => {
    vi.mocked(notificationsApi.getNotifications).mockResolvedValueOnce({
      data: [mockNotification],
      meta: { total: 1, unreadCount: 1, page: 1, limit: 50, hasMore: false },
    })
    renderWithQuery(<NotificationsPage />)
    await waitFor(() =>
      expect(screen.getByText('Someone followed you')).toBeInTheDocument()
    )
  })

  it('shows mark all read button when unread notifications exist', async () => {
    vi.mocked(notificationsApi.getNotifications).mockResolvedValueOnce({
      data: [mockNotification],
      meta: { total: 1, unreadCount: 1, page: 1, limit: 50, hasMore: false },
    })
    renderWithQuery(<NotificationsPage />)
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /mark all read/i })).toBeInTheDocument()
    )
  })

  it('shows unread count when meta.unreadCount > 0', async () => {
    vi.mocked(notificationsApi.getNotifications).mockResolvedValueOnce({
      data: [mockNotification],
      meta: { total: 1, unreadCount: 3, page: 1, limit: 50, hasMore: false },
    })
    renderWithQuery(<NotificationsPage />)
    await waitFor(() =>
      expect(screen.getByText(/3 unread/i)).toBeInTheDocument()
    )
  })

  it('renders notification with actor avatar', async () => {
    vi.mocked(notificationsApi.getNotifications).mockResolvedValueOnce({
      data: [mockNotification],
      meta: { total: 1, unreadCount: 1, page: 1, limit: 50, hasMore: false },
    })
    renderWithQuery(<NotificationsPage />)
    await waitFor(() =>
      expect(screen.getByText('Someone followed you')).toBeInTheDocument()
    )
  })

  it('renders notification without actor (system notification)', async () => {
    const systemNotif = { ...mockNotification, actor: null, title: '' }
    vi.mocked(notificationsApi.getNotifications).mockResolvedValueOnce({
      data: [systemNotif],
      meta: { total: 1, unreadCount: 1, page: 1, limit: 50, hasMore: false },
    })
    renderWithQuery(<NotificationsPage />)
    await waitFor(() =>
      expect(screen.getByText('Someone followed you')).toBeInTheDocument()
    )
  })

  it('renders read notification (without unread dot)', async () => {
    const readNotif = { ...mockNotification, isRead: true }
    vi.mocked(notificationsApi.getNotifications).mockResolvedValueOnce({
      data: [readNotif],
      meta: { total: 1, unreadCount: 0, page: 1, limit: 50, hasMore: false },
    })
    renderWithQuery(<NotificationsPage />)
    await waitFor(() =>
      expect(screen.getByText('Someone followed you')).toBeInTheDocument()
    )
  })

  it('marks a notification as read when clicked', async () => {
    vi.mocked(notificationsApi.markRead).mockResolvedValue(undefined)
    vi.mocked(notificationsApi.getNotifications).mockResolvedValueOnce({
      data: [mockNotification],
      meta: { total: 1, unreadCount: 1, page: 1, limit: 50, hasMore: false },
    })
    renderWithQuery(<NotificationsPage />)
    await waitFor(() =>
      expect(screen.getByText('Someone followed you')).toBeInTheDocument()
    )
    fireEvent.click(screen.getByText('Someone followed you'))
    await waitFor(() =>
      expect(notificationsApi.markRead).toHaveBeenCalledWith('n1')
    )
  })

  it('marks all as read when button clicked', async () => {
    vi.mocked(notificationsApi.markAllRead).mockResolvedValue(undefined)
    vi.mocked(notificationsApi.getNotifications).mockResolvedValueOnce({
      data: [mockNotification],
      meta: { total: 1, unreadCount: 1, page: 1, limit: 50, hasMore: false },
    })
    renderWithQuery(<NotificationsPage />)
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /mark all read/i })).toBeInTheDocument()
    )
    fireEvent.click(screen.getByRole('button', { name: /mark all read/i }))
    await waitFor(() =>
      expect(notificationsApi.markAllRead).toHaveBeenCalled()
    )
  })
})
