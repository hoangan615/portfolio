import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, act, screen } from '@testing-library/react'
import { useInfiniteScroll } from '@/shared/hooks/useInfiniteScroll'

const mockObserve = vi.fn()
const mockDisconnect = vi.fn()

let capturedCallback: (entries: IntersectionObserverEntry[]) => void

const MockIntersectionObserver = vi.fn(
  (callback: IntersectionObserverCallback, options?: IntersectionObserverInit) => {
    capturedCallback = (entries) => callback(entries, {} as IntersectionObserver)
    return {
      observe: mockObserve,
      disconnect: mockDisconnect,
      unobserve: vi.fn(),
      root: null,
      rootMargin: options?.rootMargin ?? '',
      thresholds: [],
      takeRecords: () => [],
    }
  }
)

function Sentinel({
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

beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
  mockObserve.mockClear()
  mockDisconnect.mockClear()
  MockIntersectionObserver.mockClear()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useInfiniteScroll', () => {
  it('returns a sentinelRef', () => {
    const fetchNextPage = vi.fn()
    render(<Sentinel hasNextPage fetchNextPage={fetchNextPage} isFetchingNextPage={false} />)
    expect(screen.getByTestId('sentinel')).toBeInTheDocument()
  })

  it('creates an IntersectionObserver on mount', () => {
    render(
      <Sentinel hasNextPage fetchNextPage={vi.fn()} isFetchingNextPage={false} />
    )
    expect(MockIntersectionObserver).toHaveBeenCalledOnce()
  })

  it('calls fetchNextPage when sentinel intersects and has next page', () => {
    const fetchNextPage = vi.fn()
    render(
      <Sentinel hasNextPage fetchNextPage={fetchNextPage} isFetchingNextPage={false} />
    )
    act(() => {
      capturedCallback([{ isIntersecting: true } as IntersectionObserverEntry])
    })
    expect(fetchNextPage).toHaveBeenCalledOnce()
  })

  it('does not call fetchNextPage when no next page', () => {
    const fetchNextPage = vi.fn()
    render(
      <Sentinel hasNextPage={false} fetchNextPage={fetchNextPage} isFetchingNextPage={false} />
    )
    act(() => {
      capturedCallback([{ isIntersecting: true } as IntersectionObserverEntry])
    })
    expect(fetchNextPage).not.toHaveBeenCalled()
  })

  it('does not call fetchNextPage while already fetching', () => {
    const fetchNextPage = vi.fn()
    render(
      <Sentinel hasNextPage fetchNextPage={fetchNextPage} isFetchingNextPage={true} />
    )
    act(() => {
      capturedCallback([{ isIntersecting: true } as IntersectionObserverEntry])
    })
    expect(fetchNextPage).not.toHaveBeenCalled()
  })

  it('does not call fetchNextPage when entry is not intersecting', () => {
    const fetchNextPage = vi.fn()
    render(
      <Sentinel hasNextPage fetchNextPage={fetchNextPage} isFetchingNextPage={false} />
    )
    act(() => {
      capturedCallback([{ isIntersecting: false } as IntersectionObserverEntry])
    })
    expect(fetchNextPage).not.toHaveBeenCalled()
  })

  it('disconnects observer on unmount', () => {
    const { unmount } = render(
      <Sentinel hasNextPage fetchNextPage={vi.fn()} isFetchingNextPage={false} />
    )
    unmount()
    expect(mockDisconnect).toHaveBeenCalled()
  })

  it('passes rootMargin and threshold options to observer', () => {
    function CustomSentinel() {
      const { sentinelRef } = useInfiniteScroll({
        hasNextPage: true,
        isFetchingNextPage: false,
        fetchNextPage: vi.fn(),
        rootMargin: '100px',
        threshold: 0.5,
      })
      return <div ref={sentinelRef} />
    }
    render(<CustomSentinel />)
    const [, opts] = MockIntersectionObserver.mock.calls[0] as [unknown, IntersectionObserverInit]
    expect(opts.rootMargin).toBe('100px')
    expect(opts.threshold).toBe(0.5)
  })
})
