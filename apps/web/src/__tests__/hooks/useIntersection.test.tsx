import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, renderHook } from '@testing-library/react'
import { useIntersection } from '@/shared/hooks/useIntersection'

// jsdom doesn't implement IntersectionObserver — we stub it here
const mockObserve = vi.fn()
const mockDisconnect = vi.fn()
const mockUnobserve = vi.fn()

let capturedCallback: (entries: IntersectionObserverEntry[]) => void
let capturedOptions: IntersectionObserverInit | undefined

const MockIntersectionObserver = vi.fn(
  (callback: IntersectionObserverCallback, options?: IntersectionObserverInit) => {
    capturedCallback = (entries) => callback(entries, {} as IntersectionObserver)
    capturedOptions = options
    return {
      observe: mockObserve,
      disconnect: mockDisconnect,
      unobserve: mockUnobserve,
      root: null,
      rootMargin: '',
      thresholds: [],
      takeRecords: () => [],
    }
  },
)

// Wrapper component that actually attaches ref to a DOM element
function TestComponent({ options }: { options?: IntersectionObserverInit }) {
  const { ref, isVisible } = useIntersection(options)
  return (
    <div data-testid="target" ref={ref}>
      {isVisible ? 'visible' : 'hidden'}
    </div>
  )
}

beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
  mockObserve.mockClear()
  mockDisconnect.mockClear()
  mockUnobserve.mockClear()
  MockIntersectionObserver.mockClear()
  capturedOptions = undefined
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useIntersection', () => {
  it('returns ref and isVisible=false initially', () => {
    render(<TestComponent />)
    expect(screen.getByTestId('target')).toHaveTextContent('hidden')
  })

  it('creates an IntersectionObserver on mount and calls observe', () => {
    render(<TestComponent />)
    expect(MockIntersectionObserver).toHaveBeenCalledOnce()
    expect(mockObserve).toHaveBeenCalledOnce()
  })

  it('sets isVisible to true when element intersects', () => {
    render(<TestComponent />)

    act(() => {
      capturedCallback([{ isIntersecting: true } as IntersectionObserverEntry])
    })

    expect(screen.getByTestId('target')).toHaveTextContent('visible')
  })

  it('does not set isVisible when element is not intersecting', () => {
    render(<TestComponent />)

    act(() => {
      capturedCallback([{ isIntersecting: false } as IntersectionObserverEntry])
    })

    expect(screen.getByTestId('target')).toHaveTextContent('hidden')
  })

  it('disconnects after first intersection (fires once)', () => {
    render(<TestComponent />)

    act(() => {
      capturedCallback([{ isIntersecting: true } as IntersectionObserverEntry])
    })

    expect(mockDisconnect).toHaveBeenCalledOnce()
  })

  it('disconnects observer on unmount', () => {
    const { unmount } = render(<TestComponent />)
    unmount()
    expect(mockDisconnect).toHaveBeenCalled()
  })

  it('passes custom options to IntersectionObserver', () => {
    render(<TestComponent options={{ threshold: 0.5, rootMargin: '10px' }} />)
    expect(capturedOptions?.threshold).toBe(0.5)
    expect(capturedOptions?.rootMargin).toBe('10px')
  })

  it('stays visible after becoming visible (does not reset)', () => {
    render(<TestComponent />)

    act(() => {
      capturedCallback([{ isIntersecting: true } as IntersectionObserverEntry])
    })
    expect(screen.getByTestId('target')).toHaveTextContent('visible')

    // Firing again with false should not change anything (observer already disconnected)
    act(() => {
      capturedCallback([{ isIntersecting: false } as IntersectionObserverEntry])
    })
    expect(screen.getByTestId('target')).toHaveTextContent('visible')
  })

  it('returns early when ref is not attached (null ref — covers if (!el) return)', () => {
    const { result } = renderHook(() => useIntersection())
    expect(result.current.isVisible).toBe(false)
    expect(MockIntersectionObserver).not.toHaveBeenCalled()
  })
})
