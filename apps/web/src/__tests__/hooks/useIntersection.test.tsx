import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, act, screen, renderHook } from '@testing-library/react'
import { useIntersection } from '@/shared/hooks/useIntersection'

// jsdom doesn't implement IntersectionObserver — we stub it here.
// The hook only creates an observer when the ref is attached to a DOM element,
// so we use a wrapper component instead of renderHook.
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
      thresholds: options?.threshold !== undefined ? [options.threshold as number] : [],
      takeRecords: () => [],
    }
  }
)

function TestBox({ options }: { options?: IntersectionObserverInit } = {}) {
  const { ref, isVisible } = useIntersection(options)
  return <div ref={ref} data-testid="box" data-visible={String(isVisible)} />
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

describe('useIntersection', () => {
  it('returns isVisible=false initially', () => {
    render(<TestBox />)
    expect(screen.getByTestId('box').getAttribute('data-visible')).toBe('false')
  })

  it('creates an IntersectionObserver on mount', () => {
    render(<TestBox />)
    expect(MockIntersectionObserver).toHaveBeenCalledOnce()
  })

  it('sets isVisible to true when element intersects', () => {
    render(<TestBox />)
    act(() => {
      capturedCallback([{ isIntersecting: true } as IntersectionObserverEntry])
    })
    expect(screen.getByTestId('box').getAttribute('data-visible')).toBe('true')
  })

  it('does not set isVisible when element is not intersecting', () => {
    render(<TestBox />)
    act(() => {
      capturedCallback([{ isIntersecting: false } as IntersectionObserverEntry])
    })
    expect(screen.getByTestId('box').getAttribute('data-visible')).toBe('false')
  })

  it('disconnects after first intersection (fires once)', () => {
    render(<TestBox />)
    act(() => {
      capturedCallback([{ isIntersecting: true } as IntersectionObserverEntry])
    })
    expect(mockDisconnect).toHaveBeenCalledOnce()
  })

  it('disconnects observer on unmount', () => {
    const { unmount } = render(<TestBox />)
    unmount()
    expect(mockDisconnect).toHaveBeenCalled()
  })

  it('passes custom options to IntersectionObserver', () => {
    render(<TestBox options={{ threshold: 0.5, rootMargin: '10px' }} />)
    const [, opts] = MockIntersectionObserver.mock.calls[0] as [unknown, IntersectionObserverInit]
    expect(opts.threshold).toBe(0.5)
    expect(opts.rootMargin).toBe('10px')
  })

  it('stays visible after becoming visible (does not reset on false entry)', () => {
    render(<TestBox />)
    act(() => { capturedCallback([{ isIntersecting: true } as IntersectionObserverEntry]) })
    act(() => { capturedCallback([{ isIntersecting: false } as IntersectionObserverEntry]) })
    expect(screen.getByTestId('box').getAttribute('data-visible')).toBe('true')
  })

  it('returns early when ref is not attached (null ref)', () => {
    const { result } = renderHook(() => useIntersection())
    expect(result.current.isVisible).toBe(false)
    expect(MockIntersectionObserver).not.toHaveBeenCalled()
  })
})
