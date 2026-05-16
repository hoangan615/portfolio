import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router'
import {
  Plus,
  FileText,
  Trash2,
  Eye,
  Search,
  Pencil,
} from 'lucide-react'
import { cn, formatRelativeTime, formatNumber } from '@/lib/utils'
import { postsApi } from '@/shared/api/posts'
import { useAuthStore } from '@/shared/stores/authStore'
import { QUERY_KEYS, ROUTES } from '@/lib/constants'
import { toast } from '@/shared/stores/notificationStore'
import Button from '@/shared/components/Button'
import LoadingSpinner from '@/shared/components/LoadingSpinner'
import type { Post } from '@/shared/api/posts'

// Posts from the API may carry a status field not yet in the shared type
type PostStatus = 'draft' | 'pending_review' | 'published' | 'rejected'

interface DashboardPost extends Post {
  status?: PostStatus
}

const STATUS_CONFIG: Record<PostStatus, { label: string; className: string }> = {
  published: {
    label: 'Published',
    className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  },
  draft: {
    label: 'Draft',
    className: 'bg-muted text-muted-foreground',
  },
  pending_review: {
    label: 'Pending review',
    className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-500',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
}

function resolveStatus(post: DashboardPost): PostStatus {
  if (post.status) return post.status
  return post.publishedAt ? 'published' : 'draft'
}

function StatusBadge({ status }: { status: PostStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap', cfg.className)}>
      {cfg.label}
    </span>
  )
}

export default function DashboardPostsPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.posts, 'mine'],
    queryFn: () => postsApi.listMine({ pageSize: 100 }),
    enabled: !!user,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => postsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts })
      toast.success('Post deleted')
    },
    onError: () => toast.error('Failed to delete post'),
  })

  const posts = (data?.items ?? [] as DashboardPost[]).filter((p) =>
    search ? (p.title ?? '').toLowerCase().includes(search.toLowerCase()) : true
  )

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            My Posts
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {data?.total ?? 0} posts total
          </p>
        </div>
        <Button onClick={() => navigate('/post/new')} className="gap-2">
          <Plus className="h-4 w-4" />
          New Post
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search posts…"
          className="w-full rounded-md border border-border bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground rounded-xl border border-dashed border-border">
          <FileText className="h-10 w-10 mb-3 opacity-30" />
          <p className="text-sm font-medium">
            {search ? 'No posts match your search' : "You haven't written any posts yet"}
          </p>
          {!search && (
            <Button size="sm" className="mt-4 gap-2" onClick={() => navigate('/post/new')}>
              <Plus className="h-4 w-4" />
              Write your first post
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden divide-y divide-border bg-card">
          {/* Table header — desktop only */}
          <div className="hidden md:grid grid-cols-[1fr_130px_80px_80px_auto] gap-4 items-center px-5 py-3 bg-muted/30">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Title</span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Views</span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Created</span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide sr-only">Actions</span>
          </div>

          {posts.map((post) => {
            const status = resolveStatus(post as DashboardPost)
            return (
              <div
                key={post.id}
                className="grid grid-cols-1 md:grid-cols-[1fr_130px_80px_80px_auto] gap-2 md:gap-4 items-start md:items-center px-5 py-4 hover:bg-muted/20 transition-colors"
              >
                {/* Title */}
                <div className="min-w-0">
                  <Link
                    to={ROUTES.post(post.slug)}
                    className="text-sm font-semibold hover:text-primary transition-colors line-clamp-1"
                  >
                    {post.title}
                  </Link>
                  {post.excerpt && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{post.excerpt}</p>
                  )}
                  {/* Mobile meta row */}
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 md:hidden text-xs text-muted-foreground">
                    <StatusBadge status={status} />
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {formatNumber(post.viewCount)}
                    </span>
                    <span>{formatRelativeTime(post.createdAt)}</span>
                  </div>
                </div>

                {/* Status — desktop */}
                <div className="hidden md:block">
                  <StatusBadge status={status} />
                </div>

                {/* Views — desktop */}
                <div className="hidden md:flex items-center gap-1 text-sm text-muted-foreground">
                  <Eye className="h-3.5 w-3.5" />
                  {formatNumber(post.viewCount)}
                </div>

                {/* Date — desktop */}
                <div className="hidden md:block text-xs text-muted-foreground whitespace-nowrap">
                  {formatRelativeTime(post.createdAt)}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <Link to={ROUTES.post(post.slug)}>
                    <Button size="sm" variant="ghost" aria-label="View post">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to={`/post/${post.slug}/edit`}>
                    <Button size="sm" variant="ghost" aria-label="Edit post">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    loading={deleteMutation.isPending}
                    aria-label="Delete post"
                    onClick={() => {
                      if (window.confirm('Delete this post? This cannot be undone.')) {
                        deleteMutation.mutate(post.id)
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
