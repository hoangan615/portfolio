import { Link } from 'react-router'
import { Eye, Calendar } from 'lucide-react'
import { cn, formatRelativeTime, formatNumber, truncate } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'
import type { Post } from '@/shared/api/posts'

interface PostCardProps {
  post: Post
  className?: string
  compact?: boolean
}

export default function PostCard({ post, className, compact = false }: PostCardProps) {
  return (
    <article
      className={cn(
        'group overflow-hidden rounded-xl border border-border bg-card text-card-foreground',
        'transition-all duration-200 hover:shadow-md hover:border-border/80',
        className
      )}
    >
      {post.coverImageUrl && !compact && (
        <Link to={ROUTES.post(post.slug)} className="block overflow-hidden aspect-video">
          <img
            src={post.coverImageUrl}
            alt={post.title ?? ''}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </Link>
      )}

      <div className={cn('flex flex-col gap-3 p-4', compact && 'p-3')}>
        {/* Type badge */}
        {post.type && post.type !== 'article' && (
          <div className="flex flex-wrap gap-1.5">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary capitalize">
              {post.type}
            </span>
          </div>
        )}

        {/* Title */}
        <Link to={ROUTES.post(post.slug)}>
          <h2
            className={cn(
              'font-semibold leading-snug text-foreground',
              'hover:text-primary transition-colors',
              compact ? 'text-sm line-clamp-2' : 'text-lg line-clamp-2'
            )}
          >
            {post.title}
          </h2>
        </Link>

        {/* Excerpt */}
        {!compact && post.excerpt && (
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {truncate(post.excerpt, 150)}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {formatRelativeTime(post.publishedAt || post.createdAt)}
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {formatNumber(post.viewCount)}
            </span>
          </div>
        </div>
      </div>
    </article>
  )
}
