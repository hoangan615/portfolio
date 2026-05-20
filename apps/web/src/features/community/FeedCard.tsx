import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Heart, MessageCircle, Share2, Eye, Play } from 'lucide-react'
import { cn, formatRelativeTime, formatNumber } from '@/lib/utils'
import { ROUTES, QUERY_KEYS } from '@/lib/constants'
import { reactionsApi, isConflictError } from '@/shared/api/reactions'
import { useAuthStore } from '@/shared/stores/authStore'
import { toast } from '@/shared/stores/notificationStore'
import Avatar from '@/shared/components/Avatar'
import CommentSection from '@/shared/components/CommentSection'
import type { FeedItem } from '@/shared/api/feed'

function LikeButton({
  contentType,
  contentId,
}: {
  contentType: 'post' | 'video'
  contentId: string
}) {
  const { isAuthenticated } = useAuthStore()
  const [liked, setLiked] = useState(false)
  const [reactionId, setReactionId] = useState<string | null>(null)
  const [likeCount, setLikeCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const { data: summaryData } = useQuery({
    queryKey: QUERY_KEYS.reactionSummary(contentType, contentId),
    queryFn: () => reactionsApi.getSummary(contentType, contentId),
    staleTime: 30_000,
  })

  useEffect(() => {
    if (summaryData && !liked) {
      const heart = summaryData.find((s) => s.emoji === '❤️')
      setLikeCount(heart?.count ?? 0)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summaryData])

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast.error('Sign in required', 'Please sign in to like posts.')
      return
    }
    if (loading) return
    setLoading(true)

    try {
      if (!liked) {
        try {
          const reaction = await reactionsApi.addReaction(contentType, contentId, '❤️')
          setReactionId(reaction.id)
          setLiked(true)
          setLikeCount((c) => c + 1)
        } catch (err) {
          if (isConflictError(err)) {
            setLiked(true)
          } else {
            toast.error('Could not like', 'Please try again.')
          }
        }
      } else {
        if (reactionId) {
          await reactionsApi.removeReaction(reactionId)
          setReactionId(null)
          setLiked(false)
          setLikeCount((c) => Math.max(0, c - 1))
        } else {
          setLiked(false)
        }
      }
    } catch {
      toast.error('Could not unlike', 'Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleLike}
      disabled={loading}
      aria-pressed={liked}
      className={cn(
        'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium',
        'transition-colors hover:bg-accent',
        liked
          ? 'text-rose-500 hover:text-rose-600'
          : 'text-muted-foreground hover:text-foreground',
        'disabled:opacity-50 disabled:pointer-events-none'
      )}
    >
      <Heart className={cn('h-4 w-4', liked && 'fill-rose-500 text-rose-500')} />
      <span>{likeCount > 0 ? formatNumber(likeCount) : 'Like'}</span>
    </button>
  )
}

function ActionBar({
  item,
  onCommentClick,
  commentOpen,
}: {
  item: FeedItem
  onCommentClick: () => void
  commentOpen: boolean
}) {
  const handleShare = () => {
    const path =
      item.itemType === 'post'
        ? ROUTES.post(item.slug!)
        : ROUTES.watch(item.id)
    const url = `${window.location.origin}${path}`
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Link copied!', 'Post URL copied to clipboard.')
    })
  }

  return (
    <div className="flex items-center gap-1 pt-3 border-t border-border/50 mt-3">
      <LikeButton
        contentType={item.itemType as 'post' | 'video'}
        contentId={item.id}
      />

      <button
        onClick={onCommentClick}
        aria-pressed={commentOpen}
        className={cn(
          'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium',
          'transition-colors hover:bg-accent',
          commentOpen
            ? 'text-blue-500 hover:text-blue-600'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <MessageCircle
          className={cn('h-4 w-4', commentOpen && 'fill-blue-500/20 text-blue-500')}
        />
        <span>Comment</span>
      </button>

      <button
        onClick={handleShare}
        className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      >
        <Share2 className="h-4 w-4" />
        <span>Share</span>
      </button>

      <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground px-1">
        <Eye className="h-3.5 w-3.5" />
        <span>{formatNumber(item.viewCount)}</span>
      </div>
    </div>
  )
}

function FeedPostCard({ item }: { item: FeedItem }) {
  const [commentOpen, setCommentOpen] = useState(false)
  const displayName = `User ${item.userId.slice(0, 8)}`

  return (
    <article className="rounded-2xl border border-border bg-card text-card-foreground overflow-hidden">
      <div className="flex items-center gap-2.5 p-4 pb-3">
        <Avatar src={null} name={displayName} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-none truncate">{displayName}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatRelativeTime(item.publishedAt ?? item.createdAt)}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-500">
          Post
        </span>
      </div>

      {item.coverImageUrl && (
        <a href={ROUTES.post(item.slug!)} className="block aspect-video overflow-hidden">
          <img
            src={item.coverImageUrl}
            alt={item.title ?? ''}
            loading="lazy"
            className="h-full w-full object-cover hover:scale-[1.02] transition-transform duration-300"
          />
        </a>
      )}

      <div className="px-4 pt-3">
        <a href={ROUTES.post(item.slug!)} className="block group">
          <h2 className="font-semibold text-base leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2">
            {item.title}
          </h2>
        </a>
        {item.excerpt && (
          <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {item.excerpt}
          </p>
        )}
      </div>

      <div className="px-4 pb-4">
        <ActionBar
          item={item}
          onCommentClick={() => setCommentOpen((v) => !v)}
          commentOpen={commentOpen}
        />
      </div>

      {commentOpen && (
        <div className="border-t border-border/50 px-4 py-4 bg-muted/20">
          <CommentSection contentType="post" contentId={item.id} />
        </div>
      )}
    </article>
  )
}

function FeedVideoCard({ item }: { item: FeedItem }) {
  const [commentOpen, setCommentOpen] = useState(false)
  const displayName = `User ${item.userId.slice(0, 8)}`

  return (
    <article className="rounded-2xl border border-border bg-card text-card-foreground overflow-hidden">
      <div className="flex items-center gap-2.5 p-4 pb-3">
        <Avatar src={null} name={displayName} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-none truncate">{displayName}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatRelativeTime(item.publishedAt ?? item.createdAt)}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-rose-500">
          Video
        </span>
      </div>

      <a
        href={ROUTES.watch(item.id)}
        className="group relative block aspect-video overflow-hidden bg-black"
      >
        {item.thumbnailUrl ? (
          <img
            src={item.thumbnailUrl}
            alt={item.title ?? ''}
            loading="lazy"
            className="h-full w-full object-cover opacity-90 group-hover:opacity-75 transition-opacity duration-200"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <Play className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm transition-transform duration-200 group-hover:scale-110">
            <Play className="h-6 w-6 fill-white text-white ml-0.5" />
          </div>
        </div>
      </a>

      <div className="px-4 pt-3">
        <a href={ROUTES.watch(item.id)} className="block group">
          <h2 className="font-semibold text-base leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2">
            {item.title}
          </h2>
        </a>
        {item.excerpt && (
          <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {item.excerpt}
          </p>
        )}
      </div>

      <div className="px-4 pb-4">
        <ActionBar
          item={item}
          onCommentClick={() => setCommentOpen((v) => !v)}
          commentOpen={commentOpen}
        />
      </div>

      {commentOpen && (
        <div className="border-t border-border/50 px-4 py-4 bg-muted/20">
          <CommentSection contentType="video" contentId={item.id} />
        </div>
      )}
    </article>
  )
}

export default function FeedCard({ item }: { item: FeedItem }) {
  if (item.itemType === 'video') return <FeedVideoCard item={item} />
  return <FeedPostCard item={item} />
}
