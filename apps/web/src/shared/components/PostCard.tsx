import { Link } from 'react-router'
import { Eye, Heart, MessageCircle, Calendar } from 'lucide-react'
import { cn, formatRelativeTime, formatNumber, truncate } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'
import Avatar from './Avatar'
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
      {post.coverImage && !compact && (
        <Link to={ROUTES.post(post.slug)} className="block overflow-hidden aspect-video">
          <img
            src={post.coverImage}
            alt={post.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </Link>
      )}

      <div className={cn('flex flex-col gap-3 p-4', compact && 'p-3')}>
        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {post.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
              >
                #{tag}
              </span>
            ))}
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
          <Link
            to={ROUTES.profile(post.author.username)}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <Avatar
              src={post.author.avatarUrl}
              name={post.author.displayName}
              size="sm"
            />
            <span className="text-xs text-muted-foreground font-medium">
              {post.author.displayName}
            </span>
          </Link>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {formatNumber(post.viewsCount)}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="h-3 w-3" />
              {formatNumber(post.likesCount)}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-3 w-3" />
              {formatNumber(post.commentsCount)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {formatRelativeTime(post.publishedAt || post.createdAt)}
        </div>
      </div>
    </article>
  )
}
