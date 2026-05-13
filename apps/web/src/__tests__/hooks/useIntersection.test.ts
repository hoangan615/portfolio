import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useIntersection } from '@/shared/hooks/useIntersection'

// jsdom doesn't implement IntersectionObserver — we stub it here
const mockObserve = vi.fn()
const mockDisconnect = vi.fn()

let capturedCallback: (entries: IntersectionObserverEntry[]) => void

const MockIntersectionObserver = vi.fn((callback: IntersectionObserverCallback) => {
  capturedCallback = (entries) => callback(entries, {} as IntersectionObserver)
  return {
    observe: mockObserve,
    disconnect: mockDisconnect,
    unobserve: vi.fn(),
    root: null,
    rootMargin: '',
    thresholds: [],
    takeRecords: () => [],
  }
})

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
  it('returns ref and isVisible=false initially', () => {
    const { result } = renderHook(() => useIntersection())
    expect(result.current.isVisible).toBe(false)
    expect(result.current.ref).toBeDefined()
  })

  it('creates an IntersectionObserver on mount', () => {
    renderHook(() => useIntersection())
    // observer.observe is called when ref is attached — we can verify the
    // constructor was called with a callback
    expect(MockIntersectionObserver).toHaveBeenCalledOnce()
  })

  it('sets isVisible to true when element intersects', () => {
    const { result } = renderHook(() => useIntersection())

    act(() => {
      capturedCallback([{ isIntersecting: true } as IntersectionObserverEntry])
    })

    expect(result.current.isVisible).toBe(true)
  })

  it('does not set isVisible when element is not intersecting', () => {
    const { result } = renderHook(() => useIntersection())

    act(() => {
      capturedCallback([{ isIntersecting: false } as IntersectionObserverEntry])
    })

    expect(result.current.isVisible).toBe(false)
  })

  it('disconnects after first intersection (fires once)', () => {
    renderHook(() => useIntersection())

    act(() => {
      capturedCallback([{ isIntersecting: true } as IntersectionObserverEntry])
    })

    expect(mockDisconnect).toHaveBeenCalledOnce()
  })

  it('disconnects observer on unmount', () => {
    const { unmount } = renderHook(() => useIntersection())
    unmount()
    expect(mockDisconnect).toHaveBeenCalled()
  })

  it('passes custom options to IntersectionObserver', () => {
    renderHook(() => useIntersection({ threshold: 0.5, rootMargin: '10px' }))
    const [, options] = MockIntersectionObserver.mock.calls[0] as [unknown, IntersectionObserverInit]
    expect(options.threshold).toBe(0.5)
    expect(options.rootMargin).toBe('10px')
  })

  it('stays visible after becoming visible (does not reset)', () => {
    const { result } = renderHook(() => useIntersection())

    act(() => {
      capturedCallback([{ isIntersecting: true } as IntersectionObserverEntry])
    })
    expect(result.current.isVisible).toBe(true)

    // Firing again (even if observer wasn't disconnected) should keep isVisible true
    act(() => {
      capturedCallback([{ isIntersecting: false } as IntersectionObserverEntry])
    })
    expect(result.current.isVisible).toBe(true)
  })
})
