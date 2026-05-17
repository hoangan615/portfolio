import { Link } from 'react-router'
import { Hash } from 'lucide-react'
import { cn } from '@/lib/utils'

const TRENDING_TAGS = [
  { tag: 'dotnet', count: 342 },
  { tag: 'reactjs', count: 287 },
  { tag: 'azure', count: 198 },
  { tag: 'typescript', count: 176 },
  { tag: 'ai', count: 143 },
  { tag: 'csharp', count: 121 },
  { tag: 'docker', count: 98 },
  { tag: 'webdev', count: 87 },
]

function TagsWidget() {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Hash className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Trending Tags</h3>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {TRENDING_TAGS.map(({ tag, count }) => (
          <Link
            key={tag}
            to={`/community?tag=${tag}`}
            className={cn(
              'flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
              'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary',
              'transition-colors group'
            )}
          >
            <Hash className="h-3 w-3" />
            {tag}
            <span className="text-muted-foreground/60 group-hover:text-primary/60 ml-0.5">
              {count}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default function TrendingWidget() {
  return (
    <div className="space-y-4">
      <TagsWidget />
    </div>
  )
}
