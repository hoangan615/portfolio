import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Users,
  FileText,
  Video,
  Eye,
  TrendingUp,
  Shield,
  Flag,
  CheckCircle2,
  XCircle,
  Clock,
  MoreHorizontal,
} from 'lucide-react'
import { cn, formatNumber, formatRelativeTime } from '@/lib/utils'
import { adminApi } from '@/shared/api/admin'
import { QUERY_KEYS } from '@/lib/constants'
import { toast } from '@/shared/stores/notificationStore'
import Avatar from '@/shared/components/Avatar'
import Button from '@/shared/components/Button'
import LoadingSpinner from '@/shared/components/LoadingSpinner'

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string
  value: string | number
  sub?: string
  icon: typeof Users
  color: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', color)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="text-2xl font-bold">{typeof value === 'number' ? formatNumber(value) : value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

function UsersTable() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.adminUsers,
    queryFn: () => adminApi.getUsers({ limit: 20 }),
  })

  const banMutation = useMutation({
    mutationFn: (id: string) => adminApi.banUser(id),
    onSuccess: () => {
      toast.success('User banned')
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminUsers })
    },
  })

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      adminApi.updateUserRole(id, role),
    onSuccess: () => {
      toast.success('Role updated')
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminUsers })
    },
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="overflow-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
              User
            </th>
            <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Role
            </th>
            <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Status
            </th>
            <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Joined
            </th>
            <th className="py-3 px-4 text-right text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data?.data.map((user) => (
            <tr key={user.id} className="hover:bg-muted/30 transition-colors">
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <Avatar src={user.avatarUrl} name={user.displayName} size="sm" />
                  <div>
                    <p className="font-medium">{user.displayName}</p>
                    <p className="text-xs text-muted-foreground">@{user.username}</p>
                  </div>
                </div>
              </td>
              <td className="py-3 px-4">
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs font-medium',
                    user.role === 'admin'
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      : user.role === 'moderator'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {user.role}
                </span>
              </td>
              <td className="py-3 px-4">
                {user.isBanned ? (
                  <span className="flex items-center gap-1 text-xs text-destructive">
                    <XCircle className="h-3.5 w-3.5" />
                    Banned
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Active
                  </span>
                )}
              </td>
              <td className="py-3 px-4 text-xs text-muted-foreground">
                {formatRelativeTime(user.createdAt)}
              </td>
              <td className="py-3 px-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  {!user.isBanned && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive text-xs"
                      loading={banMutation.isPending}
                      onClick={() => banMutation.mutate(user.id)}
                    >
                      Ban
                    </Button>
                  )}
                  {user.role !== 'moderator' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs"
                      onClick={() => roleMutation.mutate({ id: user.id, role: 'moderator' })}
                    >
                      Promote
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {(!data?.data || data.data.length === 0) && (
        <p className="py-8 text-center text-sm text-muted-foreground">No users found.</p>
      )}
    </div>
  )
}

function PendingContentQueue() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'pending'],
    queryFn: adminApi.getContentPending,
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    )
  }

  if (!data?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <CheckCircle2 className="h-8 w-8 mb-2 text-green-500" />
        <p className="text-sm">All caught up! No pending content.</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-border">
      {data.map((item) => (
        <div key={item.id} className="flex items-center gap-3 py-3 px-4">
          <div
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-md',
              item.type === 'post'
                ? 'bg-blue-500/10 text-blue-500'
                : 'bg-purple-500/10 text-purple-500'
            )}
          >
            {item.type === 'post' ? (
              <FileText className="h-4 w-4" />
            ) : (
              <Video className="h-4 w-4" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{item.title}</p>
            <p className="text-xs text-muted-foreground">
              by {item.author.displayName} · {formatRelativeTime(item.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="ghost"
              className="text-green-600 dark:text-green-400 text-xs"
              onClick={() => adminApi.approveContent(item.type, item.id)}
            >
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive text-xs"
              onClick={() => adminApi.rejectContent(item.type, item.id)}
            >
              <XCircle className="h-3.5 w-3.5 mr-1" />
              Reject
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function AdminDashboard() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: QUERY_KEYS.adminStats,
    queryFn: adminApi.getAnalytics,
  })

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          Admin Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Platform overview and moderation tools.
        </p>
      </div>

      {/* Stats grid */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Users"
            value={analytics?.totalUsers ?? 0}
            sub={`+${analytics?.newUsersToday ?? 0} today`}
            icon={Users}
            color="bg-blue-500/10 text-blue-500"
          />
          <StatCard
            label="Total Posts"
            value={analytics?.totalPosts ?? 0}
            icon={FileText}
            color="bg-green-500/10 text-green-500"
          />
          <StatCard
            label="Total Videos"
            value={analytics?.totalVideos ?? 0}
            icon={Video}
            color="bg-purple-500/10 text-purple-500"
          />
          <StatCard
            label="Total Views"
            value={analytics?.totalViews ?? 0}
            sub={`${analytics?.activeUsersLast7Days ?? 0} active this week`}
            icon={Eye}
            color="bg-orange-500/10 text-orange-500"
          />
        </div>
      )}

      {/* Users table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </h2>
        </div>
        <UsersTable />
      </div>

      {/* Pending content */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-yellow-500" />
            Pending Content Review
          </h2>
        </div>
        <PendingContentQueue />
      </div>
    </div>
  )
}
