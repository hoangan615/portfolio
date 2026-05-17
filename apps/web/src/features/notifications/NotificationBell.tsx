import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, Check, ExternalLink } from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { cn, formatRelativeTime } from '@/lib/utils'
import { notificationsApi } from '@/shared/api/notifications'
import { useNotificationStore } from '@/shared/stores/notificationStore'
import { QUERY_KEYS, ROUTES } from '@/lib/constants'

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const { unreadCount, setUnreadCount } = useNotificationStore()

  const { data } = useQuery({
    queryKey: QUERY_KEYS.notifications,
    queryFn: () => notificationsApi.getNotifications(1, 10),
    refetchInterval: 30_000,
  })

  const markAllMutation = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => {
      setUnreadCount(0)
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications })
    },
  })

  // Update unread count from items
  useEffect(() => {
    if (data?.items) {
      const unread = data.items.filter((n) => !n.read).length
      setUnreadCount(unread)
    }
  }, [data, setUnreadCount])

  const notifications = data?.items ?? []

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <button
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
          className={cn(
            'relative inline-flex h-9 w-9 items-center justify-center rounded-md',
            'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
          )}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className={cn(
            'z-50 w-80 overflow-hidden rounded-xl border border-border',
            'bg-popover text-popover-foreground shadow-xl',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllMutation.mutate()}
                disabled={markAllMutation.isPending}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Check className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <Bell className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => {
                const payload = n.payloadJson ?? {}
                const actorName = (payload.actor_name as string) ?? (payload.actorName as string) ?? null

                return (
                  <DropdownMenu.Item key={n.id} asChild>
                    <div
                      className={cn(
                        'flex gap-3 px-4 py-3 text-sm outline-none cursor-pointer',
                        'hover:bg-accent transition-colors',
                        !n.read && 'bg-primary/5'
                      )}
                      onClick={() => {
                        if (!n.read) {
                          notificationsApi.markRead(n.id).then(() => {
                            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications })
                          })
                        }
                        setOpen(false)
                      }}
                    >
                      <div className="h-7 w-7 shrink-0 flex items-center justify-center rounded-full bg-primary/10 mt-0.5">
                        <Bell className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn('leading-snug', !n.read && 'font-medium')}>
                          {actorName
                            ? `${actorName} — ${n.type.replace(/_/g, ' ')}`
                            : n.type.replace(/_/g, ' ')}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatRelativeTime(n.createdAt)}
                        </p>
                      </div>
                      {!n.read && (
                        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      )}
                    </div>
                  </DropdownMenu.Item>
                )
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border p-2">
            <DropdownMenu.Item asChild>
              <Link
                to={ROUTES.notifications}
                className={cn(
                  'flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm',
                  'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  'transition-colors outline-none cursor-pointer'
                )}
                onClick={() => setOpen(false)}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View all notifications
              </Link>
            </DropdownMenu.Item>
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
