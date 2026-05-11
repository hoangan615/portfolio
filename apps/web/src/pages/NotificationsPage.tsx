import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, Check } from 'lucide-react'
import { cn, formatRelativeTime } from '@/lib/utils'
import { notificationsApi } from '@/shared/api/notifications'
import { useNotificationStore } from '@/shared/stores/notificationStore'
import { QUERY_KEYS } from '@/lib/constants'
import Avatar from '@/shared/components/Avatar'
import Button from '@/shared/components/Button'
import LoadingSpinner from '@/shared/components/LoadingSpinner'

export default function NotificationsPage() {
  const queryClient = useQueryClient()
  const { setUnreadCount } = useNotificationStore()

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.notifications,
    queryFn: () => notificationsApi.getNotifications(1, 50),
  })

  const markAllMutation = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => {
      setUnreadCount(0)
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications })
    },
  })

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications })
    },
  })

  const notifications = data?.data ?? []
  const unread = notifications.filter((n) => !n.isRead)

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </h1>
          {data?.meta.unreadCount != null && data.meta.unreadCount > 0 && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {data.meta.unreadCount} unread
            </p>
          )}
        </div>

        {unread.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            loading={markAllMutation.isPending}
            onClick={() => markAllMutation.mutate()}
          >
            <Check className="h-3.5 w-3.5" />
            Mark all read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Bell className="h-12 w-12 mb-3 opacity-30" />
          <p className="text-base font-medium">You're all caught up!</p>
          <p className="text-sm mt-1">No notifications yet.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={cn(
                'flex gap-3 px-4 py-4 transition-colors',
                !n.isRead && 'bg-primary/5',
                'hover:bg-accent cursor-pointer'
              )}
              onClick={() => {
                if (!n.isRead) markReadMutation.mutate(n.id)
                if (n.targetUrl) window.location.href = n.targetUrl
              }}
            >
              {n.actor ? (
                <Avatar src={n.actor.avatarUrl} name={n.actor.displayName} size="sm" className="shrink-0 mt-0.5" />
              ) : (
                <div className="h-7 w-7 shrink-0 flex items-center justify-center rounded-full bg-primary/10 mt-0.5">
                  <Bell className="h-3.5 w-3.5 text-primary" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                {n.title && <p className="text-sm font-medium">{n.title}</p>}
                <p className={cn('text-sm', !n.isRead && 'font-medium')}>{n.body}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatRelativeTime(n.createdAt)}
                </p>
              </div>
              {!n.isRead && (
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
