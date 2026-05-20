import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as Tabs from '@radix-ui/react-tabs'
import {
  Users,
  FileText,
  Video,
  Eye,
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Flag,
} from 'lucide-react'
import { cn, formatNumber, formatRelativeTime } from '@/lib/utils'
import { adminApi } from '@/shared/api/admin'
import { QUERY_KEYS } from '@/lib/constants'
import { toast } from '@/shared/stores/notificationStore'
import Avatar from '@/shared/components/Avatar'
import Button from '@/shared/components/Button'
import LoadingSpinner from '@/shared/components/LoadingSpinner'

type AdminTab = 'overview' | 'users' | 'reports'

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
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', color)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="text-2xl font-bold">
        {typeof value === 'number' ? formatNumber(value) : value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

function PendingContentQueue() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'pending'],
    queryFn: adminApi.getContentPending,
  })

  const approveMutation = useMutation({
    mutationFn: ({ type, id }: { type: string; id: string }) =>
      adminApi.approveContent(type, id),
    onSuccess: () => {
      toast.success('Content approved')
      queryClient.invalidateQueries({ queryKey: ['admin', 'pending'] })
    },
    onError: () => toast.error('Failed to approve content'),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ type, id }: { type: string; id: string }) =>
      adminApi.rejectContent(type, id),
    onSuccess: () => {
      toast.success('Content rejected')
      queryClient.invalidateQueries({ queryKey: ['admin', 'pending'] })
    },
    onError: () => toast.error('Failed to reject content'),
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
      <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
        <CheckCircle2 className="h-9 w-9 mb-2 text-green-500" />
        <p className="text-sm font-medium">All caught up!</p>
        <p className="text-xs mt-0.5">No content pending review.</p>
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
              className="text-green-600 dark:text-green-400 text-xs gap-1"
              loading={approveMutation.isPending}
              onClick={() => approveMutation.mutate({ type: item.type, id: item.id })}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive text-xs gap-1"
              loading={rejectMutation.isPending}
              onClick={() => rejectMutation.mutate({ type: item.type, id: item.id })}
            >
              <XCircle className="h-3.5 w-3.5" />
              Reject
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}

function UsersPanel() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const handleSearch = (v: string) => {
    setSearch(v)
    clearTimeout((handleSearch as { _t?: ReturnType<typeof setTimeout> })._t)
    ;(handleSearch as { _t?: ReturnType<typeof setTimeout> })._t = setTimeout(
      () => setDebouncedSearch(v),
      300
    )
  }

  const { data, isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.adminUsers, debouncedSearch],
    queryFn: () => adminApi.getUsers({ limit: 30, search: debouncedSearch || undefined }),
  })

  const banMutation = useMutation({
    mutationFn: (id: string) => adminApi.banUser(id),
    onSuccess: () => {
      toast.success('User banned')
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminUsers })
    },
    onError: () => toast.error('Failed to ban user'),
  })

  const unbanMutation = useMutation({
    mutationFn: (id: string) => adminApi.unbanUser(id),
    onSuccess: () => {
      toast.success('User unbanned')
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminUsers })
    },
    onError: () => toast.error('Failed to unban user'),
  })

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      adminApi.updateUserRole(id, role),
    onSuccess: () => {
      toast.success('Role updated')
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminUsers })
    },
    onError: () => toast.error('Failed to update role'),
  })

  return (
    <div>
      {/* Search */}
      <div className="px-4 py-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by name or username…"
            className="w-full rounded-md border border-border bg-background pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['User', 'Role', 'Status', 'Joined', 'Actions'].map((h, i) => (
                  <th
                    key={h}
                    className={cn(
                      'py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wide',
                      i === 4 ? 'text-right' : 'text-left'
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data?.data.map((user) => (
                <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Avatar src={user.avatarUrl ?? null} name={user.displayName ?? user.username} size="sm" />
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
                    {user.createdAt ? formatRelativeTime(user.createdAt) : '—'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {user.isBanned ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-green-600 text-xs"
                          loading={unbanMutation.isPending}
                          onClick={() => unbanMutation.mutate(user.id)}
                        >
                          Unban
                        </Button>
                      ) : (
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
                      {user.role !== 'moderator' && user.role !== 'admin' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs"
                          loading={roleMutation.isPending}
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
      )}
    </div>
  )
}

function ReportsPanel() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.adminReports,
    queryFn: () => adminApi.getReports({ status: 'pending' }),
  })

  const dismissMutation = useMutation({
    mutationFn: (_id: string) => Promise.resolve(),
    onSuccess: () => {
      toast.success('Report dismissed')
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminReports })
    },
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    )
  }

  if (!data?.data?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
        <Flag className="h-9 w-9 mb-2 opacity-30" />
        <p className="text-sm font-medium">No pending reports</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-border">
      {data.data.map((report) => (
        <div key={report.id} className="flex items-start gap-3 py-4 px-4">
          <Avatar
            src={report.reporter.avatarUrl ?? null}
            name={report.reporter.displayName ?? report.reporter.username}
            size="sm"
            className="shrink-0 mt-0.5"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium">{report.reporter.displayName}</span>
              <span className="text-xs text-muted-foreground">reported a {report.contentType}</span>
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs font-medium',
                  report.status === 'pending'
                    ? 'bg-yellow-500/10 text-yellow-600'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {report.status}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Reason: <span className="font-medium text-foreground">{report.reason}</span>
            </p>
            {report.contentSnippet && (
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2 italic">
                "{report.contentSnippet}"
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              {formatRelativeTime(report.createdAt)}
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="text-xs shrink-0"
            loading={dismissMutation.isPending}
            onClick={() => dismissMutation.mutate(report.id)}
          >
            Dismiss
          </Button>
        </div>
      ))}
    </div>
  )
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview')

  const { data: analytics, isLoading } = useQuery({
    queryKey: QUERY_KEYS.adminStats,
    queryFn: adminApi.getAnalytics,
  })

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          Admin Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Platform overview and moderation tools.</p>
      </div>

      {/* Stats */}
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

      {/* Tabbed panels */}
      <Tabs.Root
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as AdminTab)}
      >
        <Tabs.List className="flex gap-1 rounded-xl bg-muted p-1 mb-6 w-full sm:w-auto sm:inline-flex">
          {(
            [
              { value: 'overview', label: 'Pending Review', icon: Clock },
              { value: 'users', label: 'Users', icon: Users },
              { value: 'reports', label: 'Reports', icon: Flag },
            ] as const
          ).map(({ value, label, icon: Icon }) => (
            <Tabs.Trigger
              key={value}
              value={value}
              className={cn(
                'flex flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                'text-muted-foreground hover:text-foreground',
                'data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content value="overview" className="outline-none">
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
              <Clock className="h-4 w-4 text-yellow-500" />
              <h2 className="text-base font-semibold">Pending Content Review</h2>
            </div>
            <PendingContentQueue />
          </div>
        </Tabs.Content>

        <Tabs.Content value="users" className="outline-none">
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
              <Users className="h-4 w-4" />
              <h2 className="text-base font-semibold">Users</h2>
            </div>
            <UsersPanel />
          </div>
        </Tabs.Content>

        <Tabs.Content value="reports" className="outline-none">
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
              <Flag className="h-4 w-4 text-red-500" />
              <h2 className="text-base font-semibold">Reports</h2>
            </div>
            <ReportsPanel />
          </div>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  )
}
