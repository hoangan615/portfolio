import { create } from 'zustand'

export interface ToastNotification {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  title: string
  description?: string
  duration?: number
}

interface NotificationState {
  toasts: ToastNotification[]
  unreadCount: number

  addToast: (toast: Omit<ToastNotification, 'id'>) => void
  removeToast: (id: string) => void
  clearToasts: () => void
  setUnreadCount: (count: number) => void
  decrementUnread: () => void
}

let toastIdCounter = 0

export const useNotificationStore = create<NotificationState>((set) => ({
  toasts: [],
  unreadCount: 0,

  addToast: (toast) => {
    const id = `toast-${++toastIdCounter}`
    const duration = toast.duration ?? 5000

    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }))

    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }))
      }, duration)
    }
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  clearToasts: () => set({ toasts: [] }),

  setUnreadCount: (count) => set({ unreadCount: count }),

  decrementUnread: () =>
    set((state) => ({
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),
}))

// Convenience helpers
export const toast = {
  success: (title: string, description?: string) =>
    useNotificationStore.getState().addToast({ type: 'success', title, description }),
  error: (title: string, description?: string) =>
    useNotificationStore.getState().addToast({ type: 'error', title, description }),
  info: (title: string, description?: string) =>
    useNotificationStore.getState().addToast({ type: 'info', title, description }),
  warning: (title: string, description?: string) =>
    useNotificationStore.getState().addToast({ type: 'warning', title, description }),
}
