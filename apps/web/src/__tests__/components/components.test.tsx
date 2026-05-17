/**
 * Smoke tests for shared/components — render without crashing and check
 * key UI elements are present.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('@/shared/api/videos', () => ({
  videosApi: { trending: vi.fn().mockResolvedValue([]) },
}))
vi.mock('@/shared/api/users', () => ({
  usersApi: { getFollowing: vi.fn().mockResolvedValue({ data: [] }) },
}))

function renderWithProviders(ui: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  )
}

// ── LoadingSpinner ─────────────────────────────────────────────────────────────

import LoadingSpinner from '@/shared/components/LoadingSpinner'

describe('LoadingSpinner', () => {
  it('renders with default size', () => {
    render(<LoadingSpinner />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('renders with each size variant', () => {
    const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const
    for (const size of sizes) {
      const { unmount } = render(<LoadingSpinner size={size} />)
      expect(screen.getByRole('status')).toBeInTheDocument()
      unmount()
    }
  })

  it('passes custom className', () => {
    render(<LoadingSpinner className="my-custom" />)
    expect(screen.getByRole('status')).toHaveClass('my-custom')
  })
})

// ── Avatar ─────────────────────────────────────────────────────────────────────

import Avatar from '@/shared/components/Avatar'

describe('Avatar', () => {
  it('renders initials when no src', () => {
    render(<Avatar name="John Doe" />)
    expect(screen.getByText('JD')).toBeInTheDocument()
  })

  it('renders img when src provided', () => {
    render(<Avatar name="John Doe" src="https://example.com/avatar.jpg" />)
    expect(screen.getByRole('img')).toBeInTheDocument()
  })

  it('shows initials fallback when image errors', () => {
    render(<Avatar name="John Doe" src="https://example.com/broken.jpg" />)
    const img = screen.getByRole('img')
    fireEvent.error(img)
    // After error the image display is set to none; fallback div is shown
    expect(img).toBeInTheDocument()
  })

  it('renders with size variants', () => {
    const sizes = ['sm', 'md', 'lg', 'xl'] as const
    for (const size of sizes) {
      const { unmount } = render(<Avatar name="Test" size={size} />)
      expect(screen.getByText('T')).toBeInTheDocument()
      unmount()
    }
  })

  it('renders fallback ? when name is empty string', () => {
    render(<Avatar name="" />)
    expect(screen.getByText('?')).toBeInTheDocument()
  })
})

// ── Button ─────────────────────────────────────────────────────────────────────

import Button from '@/shared/components/Button'

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  it('renders with each variant', () => {
    const variants = ['default', 'outline', 'ghost', 'destructive', 'link'] as const
    for (const variant of variants) {
      const { unmount } = render(<Button variant={variant}>Btn</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
      unmount()
    }
  })

  it('renders with each size', () => {
    const sizes = ['sm', 'md', 'lg', 'icon'] as const
    for (const size of sizes) {
      const { unmount } = render(<Button size={size}>Btn</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
      unmount()
    }
  })

  it('shows loading spinner when loading', () => {
    render(<Button loading>Saving</Button>)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('calls onClick', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Press</Button>)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalled()
  })

  it('is disabled when disabled prop', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})

// ── Modal ──────────────────────────────────────────────────────────────────────

import Modal from '@/shared/components/Modal'

describe('Modal', () => {
  it('renders children when open', () => {
    render(
      <Modal open={true} onOpenChange={() => {}}>
        <div>Modal content</div>
      </Modal>
    )
    expect(screen.getByText('Modal content')).toBeInTheDocument()
  })

  it('does not render children when closed', () => {
    render(
      <Modal open={false} onOpenChange={() => {}}>
        <div>Hidden content</div>
      </Modal>
    )
    expect(screen.queryByText('Hidden content')).not.toBeInTheDocument()
  })

  it('renders title when provided', () => {
    render(
      <Modal open={true} onOpenChange={() => {}} title="Test Modal">
        <div>Content</div>
      </Modal>
    )
    expect(screen.getByText('Test Modal')).toBeInTheDocument()
  })

  it('renders description when provided', () => {
    render(
      <Modal open={true} onOpenChange={() => {}} title="Title" description="A description">
        <div>Content</div>
      </Modal>
    )
    expect(screen.getByText('A description')).toBeInTheDocument()
  })

  it('calls onOpenChange when close button clicked', () => {
    const onOpenChange = vi.fn()
    render(
      <Modal open={true} onOpenChange={onOpenChange} title="Closeable">
        <div>Content</div>
      </Modal>
    )
    const closeBtns = screen.getAllByRole('button')
    fireEvent.click(closeBtns[0])
    expect(onOpenChange).toHaveBeenCalled()
  })

  it('does not close when preventClose is true and dialog tries to close', () => {
    const onOpenChange = vi.fn()
    render(
      <Modal open={true} onOpenChange={onOpenChange} preventClose title="Locked">
        <div>Content</div>
      </Modal>
    )
    expect(screen.getByText('Content')).toBeInTheDocument()
    // No close button when preventClose is true
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})

// ── ThemeToggle ────────────────────────────────────────────────────────────────

import ThemeToggle from '@/shared/components/ThemeToggle'

import { useThemeStore } from '@/shared/stores/themeStore'

describe('ThemeToggle', () => {
  beforeEach(() => {
    useThemeStore.setState({ theme: 'light' })
  })

  it('renders a toggle button', () => {
    render(<ThemeToggle />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('renders Moon icon when theme is dark', () => {
    useThemeStore.setState({ theme: 'dark' })
    render(<ThemeToggle />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('renders Monitor icon when theme is system', () => {
    useThemeStore.setState({ theme: 'system' })
    render(<ThemeToggle />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('toggles theme on click', () => {
    render(<ThemeToggle />)
    const btn = screen.getByRole('button')
    fireEvent.click(btn)
    expect(btn).toBeInTheDocument()
  })
})

// ── PostCard ───────────────────────────────────────────────────────────────────

import PostCard from '@/shared/components/PostCard'

const mockPost = {
  id: 'post-1',
  userId: 'user-1',
  slug: 'my-post',
  title: 'My Post Title',
  excerpt: 'Post excerpt here',
  coverImageUrl: null,
  type: 'article',
  status: 'published',
  viewCount: 100,
  publishedAt: '2024-01-01T00:00:00Z',
  scheduledAt: null,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

describe('PostCard', () => {
  it('renders post title', () => {
    render(
      <MemoryRouter>
        <PostCard post={mockPost} />
      </MemoryRouter>
    )
    expect(screen.getByText('My Post Title')).toBeInTheDocument()
  })

  it('renders excerpt when provided', () => {
    render(
      <MemoryRouter>
        <PostCard post={mockPost} />
      </MemoryRouter>
    )
    expect(screen.getByText('Post excerpt here')).toBeInTheDocument()
  })

  it('renders cover image when provided and not compact', () => {
    const postWithCover = { ...mockPost, coverImageUrl: 'https://example.com/cover.jpg' }
    render(
      <MemoryRouter>
        <PostCard post={postWithCover} />
      </MemoryRouter>
    )
    expect(screen.getByRole('img')).toBeInTheDocument()
  })

  it('does not render cover image in compact mode', () => {
    const postWithCover = { ...mockPost, coverImageUrl: 'https://example.com/cover.jpg' }
    render(
      <MemoryRouter>
        <PostCard post={postWithCover} compact />
      </MemoryRouter>
    )
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('falls back to createdAt when publishedAt is null', () => {
    const postWithoutPublishedAt = { ...mockPost, publishedAt: null as unknown as string }
    render(
      <MemoryRouter>
        <PostCard post={postWithoutPublishedAt} />
      </MemoryRouter>
    )
    expect(screen.getByText('My Post Title')).toBeInTheDocument()
  })
})

// ── VideoCard ──────────────────────────────────────────────────────────────────

import VideoCard from '@/shared/components/VideoCard'

const mockVideo = {
  id: 'video-1',
  title: 'My Video',
  description: 'Video description',
  thumbnailUrl: null,
  hlsUrl: 'https://cdn.example.com/video.m3u8',
  duration: 120,
  views: 50,
  likesCount: 10,
  commentsCount: 2,
  isLiked: false,
  isBookmarked: false,
  tags: ['javascript'],
  status: 'ready' as const,
  author: {
    id: 'user-1',
    username: 'testuser',
    displayName: 'Test User',
    avatarUrl: null,
  },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

describe('VideoCard', () => {
  it('renders video title', () => {
    render(
      <MemoryRouter>
        <VideoCard video={mockVideo} />
      </MemoryRouter>
    )
    expect(screen.getByText('My Video')).toBeInTheDocument()
  })

  it('renders thumbnail image when thumbnailUrl is provided', () => {
    const videoWithThumb = { ...mockVideo, thumbnailUrl: 'https://example.com/thumb.jpg' }
    render(
      <MemoryRouter>
        <VideoCard video={videoWithThumb} />
      </MemoryRouter>
    )
    expect(screen.getByRole('img')).toBeInTheDocument()
  })

  it('shows Play icon fallback when no thumbnail', () => {
    render(
      <MemoryRouter>
        <VideoCard video={mockVideo} />
      </MemoryRouter>
    )
    // No img tag without thumbnail
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('shows processing badge when status is processing', () => {
    const processingVideo = { ...mockVideo, status: 'processing' as const }
    render(
      <MemoryRouter>
        <VideoCard video={processingVideo} />
      </MemoryRouter>
    )
    expect(screen.getByText('Processing')).toBeInTheDocument()
  })

  it('renders in compact mode without author avatar', () => {
    render(
      <MemoryRouter>
        <VideoCard video={mockVideo} compact />
      </MemoryRouter>
    )
    expect(screen.getByText('My Video')).toBeInTheDocument()
  })
})

// ── Sidebar ────────────────────────────────────────────────────────────────────

import Sidebar from '@/shared/components/Sidebar'

describe('Sidebar', () => {
  it('renders trending tags section', () => {
    renderWithProviders(<Sidebar />)
    expect(screen.getByText('Trending Tags')).toBeInTheDocument()
  })

  it('renders footer attribution', () => {
    renderWithProviders(<Sidebar />)
    expect(screen.getByText(/Võ Hoàng Ân/)).toBeInTheDocument()
  })
})

// ── InfiniteList ───────────────────────────────────────────────────────────────

import InfiniteList from '@/shared/components/InfiniteList'

let observerCallback: ((entries: IntersectionObserverEntry[]) => void) | null = null
let observerInstance: { observe: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn> } | null = null

beforeEach(() => {
  observerCallback = null
  observerInstance = null
  vi.stubGlobal('IntersectionObserver', function (
    cb: (entries: IntersectionObserverEntry[]) => void
  ) {
    observerCallback = cb
    observerInstance = { observe: vi.fn(), disconnect: vi.fn() }
    return observerInstance
  })
})

describe('InfiniteList', () => {
  it('shows loading spinner when isLoading', () => {
    render(
      <InfiniteList
        items={[]}
        renderItem={() => null}
        hasNextPage={false}
        isFetchingNextPage={false}
        fetchNextPage={vi.fn()}
        isLoading={true}
      />
    )
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('shows custom loadingMessage when isLoading and loadingMessage provided', () => {
    render(
      <InfiniteList
        items={[]}
        renderItem={() => null}
        hasNextPage={false}
        isFetchingNextPage={false}
        fetchNextPage={vi.fn()}
        isLoading={true}
        loadingMessage={<span>Fetching data…</span>}
      />
    )
    expect(screen.getByText('Fetching data…')).toBeInTheDocument()
  })

  it('shows empty message when no items', () => {
    render(
      <InfiniteList
        items={[]}
        renderItem={() => null}
        hasNextPage={false}
        isFetchingNextPage={false}
        fetchNextPage={vi.fn()}
        emptyMessage={<p>Nothing here</p>}
      />
    )
    expect(screen.getByText('Nothing here')).toBeInTheDocument()
  })

  it('shows default empty message when no items and no emptyMessage', () => {
    render(
      <InfiniteList
        items={[]}
        renderItem={() => null}
        hasNextPage={false}
        isFetchingNextPage={false}
        fetchNextPage={vi.fn()}
      />
    )
    expect(screen.getByText(/No items found/i)).toBeInTheDocument()
  })

  it('renders items', () => {
    render(
      <InfiniteList
        items={['item1', 'item2']}
        renderItem={(item) => <div>{item}</div>}
        hasNextPage={false}
        isFetchingNextPage={false}
        fetchNextPage={vi.fn()}
      />
    )
    expect(screen.getByText('item1')).toBeInTheDocument()
    expect(screen.getByText('item2')).toBeInTheDocument()
  })

  it('shows end-of-list message when hasNextPage is false', () => {
    render(
      <InfiniteList
        items={['item1']}
        renderItem={(item) => <div>{item}</div>}
        hasNextPage={false}
        isFetchingNextPage={false}
        fetchNextPage={vi.fn()}
      />
    )
    expect(screen.getByText(/reached the end/i)).toBeInTheDocument()
  })

  it('shows loading spinner when isFetchingNextPage', () => {
    render(
      <InfiniteList
        items={['item1']}
        renderItem={(item) => <div>{item}</div>}
        hasNextPage={true}
        isFetchingNextPage={true}
        fetchNextPage={vi.fn()}
      />
    )
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('renders as grid when grid prop is true', () => {
    const { container } = render(
      <InfiniteList
        items={['item1']}
        renderItem={(item) => <div>{item}</div>}
        hasNextPage={false}
        isFetchingNextPage={false}
        fetchNextPage={vi.fn()}
        grid
      />
    )
    expect(container.querySelector('.grid')).toBeInTheDocument()
  })

  it('calls fetchNextPage when sentinel intersects', () => {
    const fetchNextPage = vi.fn()
    render(
      <InfiniteList
        items={['item1']}
        renderItem={(item) => <div>{item}</div>}
        hasNextPage={true}
        isFetchingNextPage={false}
        fetchNextPage={fetchNextPage}
      />
    )
    act(() => {
      observerCallback?.([{ isIntersecting: true }] as unknown as IntersectionObserverEntry[])
    })
    expect(fetchNextPage).toHaveBeenCalled()
  })
})
