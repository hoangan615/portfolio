import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { Hash, TrendingUp, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { videosApi } from '@/shared/api/videos'
import { usersApi } from '@/shared/api/users'
import { useAuthStore } from '@/shared/stores/authStore'
import Avatar from './Avatar'
import Button from './Button'

const TRENDING_TAGS = [
  { tag: 'dotnet', count: 342 },
  { tag: 'reactjs', count: 287 },
  { tag: 'azure', count: 198 },
  { tag: 'typescript', count: 176 },
  { tag: 'webdev', count: 154 },
  { tag: 'ai', count: 143 },
  { tag: 'csharp', count: 121 },
  { tag: 'docker', count: 98 },
]

function TrendingTags() {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Trending Tags</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {TRENDING_TAGS.map(({ tag, count }) => (
          <Link
            key={tag}
            to={`/community?tag=${tag}`}
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
              'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary',
              'transition-colors'
            )}
          >
            <Hash className="h-3 w-3" />
            {tag}
            <span className="text-muted-foreground/60 ml-0.5">{count}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

function SuggestedUsers() {
  const { user: currentUser } = useAuthStore()

  // Use a stable fallback list when API isn't available
  const { data } = useQuery({
    queryKey: ['suggested-users'],
    queryFn: () => usersApi.getFollowing('_suggested'),
    enabled: false, // Replace with real endpoint when available
    retry: false,
  })

  const users = data?.data ?? []

  if (users.length === 0) return null

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Users className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Suggested</h3>
      </div>
      <div className="flex flex-col gap-3">
        {users.slice(0, 5).map((u) => (
          <div key={u.id} className="flex items-center gap-2">
            <Link to={`/u/${u.username}`}>
              <Avatar src={u.avatarUrl} name={u.displayName} size="sm" />
            </Link>
            <div className="flex-1 min-w-0">
              <Link
                to={`/u/${u.username}`}
                className="text-sm font-medium hover:text-primary transition-colors truncate block"
              >
                {u.displayName}
              </Link>
              <p className="text-xs text-muted-foreground truncate">@{u.username}</p>
            </div>
            {currentUser && currentUser.username !== u.username && (
              <Button size="sm" variant="outline" className="shrink-0 text-xs h-7 px-2">
                Follow
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

interface SidebarProps {
  className?: string
}

export default function Sidebar({ className }: SidebarProps) {
  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col gap-4 w-72 shrink-0 py-6 px-4',
        'sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto',
        className
      )}
    >
      <TrendingTags />
      <SuggestedUsers />

      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-xs text-muted-foreground text-center leading-relaxed">
          Built by{' '}
          <a
            href="https://github.com/hoangan615"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium"
          >
            Võ Hoàng An
          </a>
          . Full-Stack Developer & Tech Lead.
        </p>
      </div>
    </aside>
  )
}
