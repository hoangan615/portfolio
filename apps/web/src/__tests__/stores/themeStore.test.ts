import { describe, it, expect, beforeEach, vi } from 'vitest'

// Stub window.matchMedia before importing the store (the store reads it at import time)
const mockMatchMedia = vi.fn().mockReturnValue({
  matches: false, // default: light mode
  addListener: vi.fn(),
  removeListener: vi.fn(),
})
vi.stubGlobal('matchMedia', mockMatchMedia)

// Stub classList to avoid jsdom issues with className manipulation
const classList = { add: vi.fn(), remove: vi.fn(), contains: vi.fn() }
vi.stubGlobal('document', {
  ...global.document,
  documentElement: { classList },
})

import { useThemeStore } from '@/shared/stores/themeStore'

beforeEach(() => {
  classList.add.mockClear()
  classList.remove.mockClear()
  mockMatchMedia.mockReturnValue({ matches: false })
  useThemeStore.setState({ theme: 'system' })
})

describe('useThemeStore', () => {
  it('starts with system theme', () => {
    expect(useThemeStore.getState().theme).toBe('system')
  })

  it('setTheme updates the theme', () => {
    useThemeStore.getState().setTheme('dark')
    expect(useThemeStore.getState().theme).toBe('dark')
  })

  it('setTheme applies the class to documentElement', () => {
    useThemeStore.getState().setTheme('dark')
    expect(classList.add).toHaveBeenCalledWith('dark')
  })

  it('setTheme removes conflicting class before adding new', () => {
    useThemeStore.getState().setTheme('light')
    expect(classList.remove).toHaveBeenCalledWith('light', 'dark')
    expect(classList.add).toHaveBeenCalledWith('light')
  })

  it('resolvedTheme returns light when system is light', () => {
    mockMatchMedia.mockReturnValue({ matches: false }) // light mode
    useThemeStore.setState({ theme: 'system' })
    expect(useThemeStore.getState().resolvedTheme()).toBe('light')
  })

  it('resolvedTheme returns dark when system is dark', () => {
    mockMatchMedia.mockReturnValue({ matches: true }) // dark mode
    useThemeStore.setState({ theme: 'system' })
    expect(useThemeStore.getState().resolvedTheme()).toBe('dark')
  })

  it('resolvedTheme returns the explicit theme when not system', () => {
    useThemeStore.getState().setTheme('dark')
    expect(useThemeStore.getState().resolvedTheme()).toBe('dark')

    useThemeStore.getState().setTheme('light')
    expect(useThemeStore.getState().resolvedTheme()).toBe('light')
  })

  it('supports all three valid themes', () => {
    for (const t of ['light', 'dark', 'system'] as const) {
      useThemeStore.getState().setTheme(t)
      expect(useThemeStore.getState().theme).toBe(t)
    }
  })
})
