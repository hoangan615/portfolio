import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { TrendingUp, Hash, Flame, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import { videosApi } from '@/shared/api/videos'
import { QUERY_KEYS } from '@/lib/constants'
import VideoCard from '@/shared/components/VideoCard'

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

function HotVideosWidget() {
  const { data: videos, isLoading } = useQuery({
    queryKey: QUERY_KEYS.trending,
    queryFn: () => videosApi.trending(3),
    staleTime: 5 * 60 * 1000,
  })

  if (!videos?.length && !isLoading) return null

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-4">
        <Flame className="h-4 w-4 text-orange-500" />
        <h3 className="text-sm font-semibold">Hot Videos</h3>
      </div>
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse flex gap-2">
              <div className="aspect-video w-24 rounded-md bg-muted" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-3 bg-muted rounded w-full" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {videos?.map((video) => (
            <VideoCard key={video.id} video={video} compact />
          ))}
        </div>
      )}
    </div>
  )
}

export default function TrendingWidget() {
  return (
    <div className="space-y-4">
      <TagsWidget />
      <HotVideosWidget />
    </div>
  )
}
