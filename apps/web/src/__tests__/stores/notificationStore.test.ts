import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useNotificationStore, toast } from '@/shared/stores/notificationStore'

beforeEach(() => {
  useNotificationStore.setState({ toasts: [], unreadCount: 0 })
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useNotificationStore', () => {
  // ── addToast ──────────────────────────────────────────────────────────────

  it('adds a toast with generated id', () => {
    useNotificationStore.getState().addToast({ type: 'success', title: 'Done' })
    const { toasts } = useNotificationStore.getState()
    expect(toasts).toHaveLength(1)
    expect(toasts[0].id).toMatch(/^toast-/)
    expect(toasts[0].type).toBe('success')
    expect(toasts[0].title).toBe('Done')
  })

  it('adds multiple toasts in order', () => {
    useNotificationStore.getState().addToast({ type: 'info', title: 'First' })
    useNotificationStore.getState().addToast({ type: 'error', title: 'Second' })
    const { toasts } = useNotificationStore.getState()
    expect(toasts).toHaveLength(2)
    expect(toasts[0].title).toBe('First')
    expect(toasts[1].title).toBe('Second')
  })

  it('auto-removes toast after default duration (5s)', () => {
    useNotificationStore.getState().addToast({ type: 'success', title: 'Bye' })
    expect(useNotificationStore.getState().toasts).toHaveLength(1)
    vi.advanceTimersByTime(5000)
    expect(useNotificationStore.getState().toasts).toHaveLength(0)
  })

  it('respects custom duration', () => {
    useNotificationStore.getState().addToast({ type: 'info', title: 'Custom', duration: 2000 })
    vi.advanceTimersByTime(1999)
    expect(useNotificationStore.getState().toasts).toHaveLength(1)
    vi.advanceTimersByTime(1)
    expect(useNotificationStore.getState().toasts).toHaveLength(0)
  })

  it('duration=0 keeps toast indefinitely', () => {
    useNotificationStore.getState().addToast({ type: 'warning', title: 'Sticky', duration: 0 })
    vi.advanceTimersByTime(60_000)
    expect(useNotificationStore.getState().toasts).toHaveLength(1)
  })

  // ── removeToast ───────────────────────────────────────────────────────────

  it('removes toast by id', () => {
    useNotificationStore.getState().addToast({ type: 'success', title: 'Remove me' })
    const { toasts } = useNotificationStore.getState()
    useNotificationStore.getState().removeToast(toasts[0].id)
    expect(useNotificationStore.getState().toasts).toHaveLength(0)
  })

  it('ignores removeToast for unknown id', () => {
    useNotificationStore.getState().addToast({ type: 'success', title: 'Keep me' })
    useNotificationStore.getState().removeToast('non-existent-id')
    expect(useNotificationStore.getState().toasts).toHaveLength(1)
  })

  // ── clearToasts ───────────────────────────────────────────────────────────

  it('clearToasts removes all', () => {
    useNotificationStore.getState().addToast({ type: 'success', title: 'A' })
    useNotificationStore.getState().addToast({ type: 'error', title: 'B' })
    useNotificationStore.getState().clearToasts()
    expect(useNotificationStore.getState().toasts).toHaveLength(0)
  })

  // ── unreadCount ───────────────────────────────────────────────────────────

  it('setUnreadCount updates count', () => {
    useNotificationStore.getState().setUnreadCount(5)
    expect(useNotificationStore.getState().unreadCount).toBe(5)
  })

  it('decrementUnread decreases by 1', () => {
    useNotificationStore.setState({ unreadCount: 3 })
    useNotificationStore.getState().decrementUnread()
    expect(useNotificationStore.getState().unreadCount).toBe(2)
  })

  it('decrementUnread does not go below 0', () => {
    useNotificationStore.setState({ unreadCount: 0 })
    useNotificationStore.getState().decrementUnread()
    expect(useNotificationStore.getState().unreadCount).toBe(0)
  })
})

describe('toast helpers', () => {
  it('toast.success adds a success toast', () => {
    toast.success('All good', 'Details here')
    const { toasts } = useNotificationStore.getState()
    expect(toasts[0].type).toBe('success')
    expect(toasts[0].title).toBe('All good')
    expect(toasts[0].description).toBe('Details here')
  })

  it('toast.error adds an error toast', () => {
    toast.error('Something broke')
    expect(useNotificationStore.getState().toasts[0].type).toBe('error')
  })

  it('toast.info adds an info toast', () => {
    toast.info('FYI')
    expect(useNotificationStore.getState().toasts[0].type).toBe('info')
  })

  it('toast.warning adds a warning toast', () => {
    toast.warning('Watch out')
    expect(useNotificationStore.getState().toasts[0].type).toBe('warning')
  })
})
