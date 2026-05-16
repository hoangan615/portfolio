import { Link } from 'react-router'
import { Eye, Play } from 'lucide-react'
import { cn, formatRelativeTime, formatNumber, formatDuration } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'
import Avatar from './Avatar'
import type { Video } from '@/shared/api/videos'

interface VideoCardProps {
  video: Video
  className?: string
  compact?: boolean
}

export default function VideoCard({ video, className, compact = false }: VideoCardProps) {
  return (
    <article className={cn('group flex flex-col gap-3', className)}>
      {/* Thumbnail */}
      <Link
        to={ROUTES.watch(video.id)}
        className={cn(
          'relative overflow-hidden rounded-xl bg-muted',
          'aspect-video'
        )}
      >
        {video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <Play className="h-12 w-12 text-muted-foreground" />
          </div>
        )}

        {/* Duration overlay */}
        <span className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white">
          {formatDuration(video.duration)}
        </span>

        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm">
            <Play className="h-5 w-5 fill-white text-white ml-0.5" />
          </div>
        </div>

        {video.status === 'processing' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="rounded-full bg-yellow-500 px-2 py-0.5 text-xs font-medium text-black">
              Processing
            </span>
          </div>
        )}
      </Link>

      {/* Info */}
      <div className={cn('flex gap-2', 'items-start')}>
        {!compact && (
          <Link to={ROUTES.profile(video.author.username)} className="shrink-0">
            <Avatar src={video.author.avatarUrl} name={video.author.displayName} size="sm" />
          </Link>
        )}

        <div className="flex-1 min-w-0">
          <Link to={ROUTES.watch(video.id)}>
            <h3
              className={cn(
                'font-medium leading-snug text-foreground line-clamp-2',
                'hover:text-primary transition-colors',
                compact ? 'text-xs' : 'text-sm'
              )}
            >
              {video.title}
            </h3>
          </Link>

          <div className={cn('mt-1 flex flex-col gap-0.5', 'text-xs')}>
            <Link
              to={ROUTES.profile(video.author.username)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {video.author.displayName}
            </Link>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span className="flex items-center gap-0.5">
                <Eye className="h-3 w-3" />
                {formatNumber(video.views)}
              </span>
              <span>·</span>
              <span>{formatRelativeTime(video.publishedAt || video.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}
