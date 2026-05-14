import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  cn,
  formatRelativeTime,
  formatDate,
  formatNumber,
  formatDuration,
  slugify,
  truncate,
  getInitials,
  buildQueryString,
  isValidEmail,
  debounce,
  getAvatarUrl,
} from '@/lib/utils'

// ── cn (class merging) ────────────────────────────────────────────────────────

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b')
  })

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible')
  })

  it('merges Tailwind conflicts correctly', () => {
    // tailwind-merge: last one wins for conflicting utilities
    expect(cn('p-4', 'p-2')).toBe('p-2')
  })
})

// ── formatDate ────────────────────────────────────────────────────────────────

describe('formatDate', () => {
  it('formats ISO date string', () => {
    expect(formatDate('2024-01-15T00:00:00.000Z')).toMatch(/Jan/)
  })

  it('returns empty string for invalid date', () => {
    expect(formatDate('not-a-date')).toBe('')
  })
})

// ── formatRelativeTime ────────────────────────────────────────────────────────

describe('formatRelativeTime', () => {
  it('returns a relative time string', () => {
    const recent = new Date(Date.now() - 60_000).toISOString()
    expect(formatRelativeTime(recent)).toMatch(/minute/)
  })

  it('returns fallback for invalid date', () => {
    expect(formatRelativeTime('invalid')).toBe('unknown time')
  })
})

// ── formatNumber ──────────────────────────────────────────────────────────────

describe('formatNumber', () => {
  it('leaves small numbers as-is', () => {
    expect(formatNumber(42)).toBe('42')
  })

  it('formats thousands with K', () => {
    expect(formatNumber(1500)).toBe('1.5K')
  })

  it('formats millions with M', () => {
    expect(formatNumber(2_500_000)).toBe('2.5M')
  })

  it('handles 0', () => {
    expect(formatNumber(0)).toBe('0')
  })
})

// ── formatDuration ────────────────────────────────────────────────────────────

describe('formatDuration', () => {
  it('formats under a minute', () => {
    expect(formatDuration(45)).toBe('0:45')
  })

  it('formats minutes and seconds', () => {
    expect(formatDuration(125)).toBe('2:05')
  })

  it('formats hours', () => {
    expect(formatDuration(3661)).toBe('1:01:01')
  })

  it('handles zero', () => {
    expect(formatDuration(0)).toBe('0:00')
  })
})

// ── slugify ───────────────────────────────────────────────────────────────────

describe('slugify', () => {
  it('converts spaces to hyphens', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })

  it('removes special chars', () => {
    expect(slugify('Hello, World!')).toBe('hello-world')
  })

  it('handles consecutive spaces', () => {
    expect(slugify('a  b')).toBe('a-b')
  })

  it('strips leading and trailing hyphens', () => {
    expect(slugify('-hello-')).toBe('hello')
  })
})

// ── truncate ──────────────────────────────────────────────────────────────────

describe('truncate', () => {
  it('does not truncate short text', () => {
    expect(truncate('Hi', 10)).toBe('Hi')
  })

  it('truncates and appends ellipsis', () => {
    const result = truncate('Hello, World!', 5)
    expect(result).toHaveLength(6) // 5 chars + '…'
    expect(result.endsWith('…')).toBe(true)
  })

  it('handles exact length', () => {
    expect(truncate('Hello', 5)).toBe('Hello')
  })
})

// ── getInitials ───────────────────────────────────────────────────────────────

describe('getInitials', () => {
  it('extracts initials from two words', () => {
    expect(getInitials('John Doe')).toBe('JD')
  })

  it('handles single word', () => {
    expect(getInitials('Alice')).toBe('A')
  })

  it('uses only first two words', () => {
    expect(getInitials('A B C D')).toBe('AB')
  })

  it('uppercases', () => {
    expect(getInitials('john doe')).toBe('JD')
  })
})

// ── buildQueryString ──────────────────────────────────────────────────────────

describe('buildQueryString', () => {
  it('builds query string from object', () => {
    const qs = buildQueryString({ page: 1, limit: 20 })
    expect(qs).toContain('page=1')
    expect(qs).toContain('limit=20')
  })

  it('omits null and undefined values', () => {
    const qs = buildQueryString({ a: 'x', b: null, c: undefined })
    expect(qs).toContain('a=x')
    expect(qs).not.toContain('b=')
    expect(qs).not.toContain('c=')
  })

  it('returns empty string when all params are null', () => {
    expect(buildQueryString({ a: null })).toBe('')
  })
})

// ── isValidEmail ──────────────────────────────────────────────────────────────

describe('isValidEmail', () => {
  it('accepts valid emails', () => {
    expect(isValidEmail('user@example.com')).toBe(true)
    expect(isValidEmail('a+b@sub.domain.org')).toBe(true)
  })

  it('rejects invalid emails', () => {
    expect(isValidEmail('notanemail')).toBe(false)
    expect(isValidEmail('@domain.com')).toBe(false)
    expect(isValidEmail('user@')).toBe(false)
  })
})

// ── debounce ──────────────────────────────────────────────────────────────────

describe('debounce', () => {
  it('calls function after delay', async () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const debounced = debounce(fn, 100)

    debounced()
    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledOnce()

    vi.useRealTimers()
  })

  it('calls only once for rapid invocations', async () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const debounced = debounce(fn, 200)

    debounced()
    debounced()
    debounced()

    vi.advanceTimersByTime(200)
    expect(fn).toHaveBeenCalledOnce()

    vi.useRealTimers()
  })
})

// ── getAvatarUrl ──────────────────────────────────────────────────────────────

describe('getAvatarUrl', () => {
  it('returns a URL string containing the username', () => {
    const url = getAvatarUrl('johndoe')
    expect(url).toContain('johndoe')
    expect(url).toContain('dicebear')
  })

  it('uses default size 40 when not specified', () => {
    const url = getAvatarUrl('alice')
    expect(url).toContain('size=40')
  })

  it('uses custom size when provided', () => {
    const url = getAvatarUrl('alice', 80)
    expect(url).toContain('size=80')
  })

  it('URL-encodes the username', () => {
    const url = getAvatarUrl('john doe')
    expect(url).toContain('john%20doe')
  })
})
