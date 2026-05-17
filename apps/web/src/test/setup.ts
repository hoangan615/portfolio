import '@testing-library/jest-dom'
import { afterEach, beforeEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// ── localStorage / sessionStorage (jsdom's implementation is broken in some configs) ──
const createStorageMock = () => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
    get length() { return Object.keys(store).length },
    key: (index: number) => Object.keys(store)[index] ?? null,
  }
}

Object.defineProperty(window, 'localStorage', { value: createStorageMock(), writable: true })
Object.defineProperty(window, 'sessionStorage', { value: createStorageMock(), writable: true })

// ── window.matchMedia (not implemented in jsdom) ──────────────────────────────
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// ── window.print (not implemented in jsdom) ───────────────────────────────────
Object.defineProperty(window, 'print', { value: vi.fn(), writable: true })

// ── IntersectionObserver (not implemented in jsdom) ───────────────────────────
// Fires the callback immediately on observe() so animation branches (isVisible)
// get exercised in feature component tests. Tests that need custom behavior
// (useIntersection.test.tsx) override this via vi.stubGlobal in beforeEach.
class MockIntersectionObserver {
  private readonly cb: IntersectionObserverCallback
  disconnect = vi.fn()
  unobserve = vi.fn()
  observe: (element: Element) => void
  constructor(cb: IntersectionObserverCallback, _opts?: IntersectionObserverInit) {
    this.cb = cb
    this.observe = (element: Element) => {
      this.cb(
        [{ isIntersecting: true, target: element } as IntersectionObserverEntry],
        this as unknown as IntersectionObserver
      )
    }
  }
}
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
})

beforeEach(() => {
  window.localStorage.clear()
  window.sessionStorage.clear()
})

afterEach(() => {
  cleanup()
})
