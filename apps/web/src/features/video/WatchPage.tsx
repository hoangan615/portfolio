import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router'
import { Heart, Bookmark, Share2, Eye, Calendar, Tag } from 'lucide-react'
import { cn, formatNumber, formatDate, formatRelativeTime } from '@/lib/utils'
import { videosApi } from '@/shared/api/videos'
import { postsApi } from '@/shared/api/posts'
import { QUERY_KEYS, ROUTES } from '@/lib/constants'
import { useAuthStore } from '@/shared/stores/authStore'
import { toast } from '@/shared/stores/notificationStore'
import VideoPlayer from '@/shared/components/VideoPlayer'
import VideoCard from '@/shared/components/VideoCard'
import Avatar from '@/shared/components/Avatar'
import Button from '@/shared/components/Button'
import CommentSection from '@/shared/components/CommentSection'
import LoadingSpinner from '@/shared/components/LoadingSpinner'

interface WatchPageProps {
  videoId: string
}

export default function WatchPage({ videoId }: WatchPageProps) {
  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuthStore()

  const { data: video, isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.video(videoId),
    queryFn: () => videosApi.get(videoId),
  })

  const { data: relatedVideos } = useQuery({
    queryKey: QUERY_KEYS.trending,
    queryFn: () => videosApi.trending(8),
    staleTime: 5 * 60 * 1000,
  })

  const likeMutation = useMutation({
    mutationFn: () => videosApi.like(video!.id),
    onSuccess: (result) => {
      queryClient.setQueryData(QUERY_KEYS.video(videoId), (old: typeof video) =>
        old ? { ...old, isLiked: result.liked, likesCount: result.count } : old
      )
    },
  })

  const bookmarkMutation = useMutation({
    mutationFn: () => videosApi.bookmark(video!.id),
    onSuccess: (result) => {
      queryClient.setQueryData(QUERY_KEYS.video(videoId), (old: typeof video) =>
        old ? { ...old, isBookmarked: result.bookmarked } : old
      )
    },
  })

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Link copied!', 'Video URL copied to clipboard.')
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="xl" />
      </div>
    )
  }

  if (error || !video) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p className="text-lg font-medium">Video not found</p>
        <Link to={ROUTES.community} className="mt-2 text-sm text-primary hover:underline">
          Back to community
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Main column */}
        <div className="space-y-5">
          {/* Player */}
          <VideoPlayer
            src={video.hlsUrl}
            poster={video.thumbnailUrl}
            title={video.title}
          />

          {/* Title */}
          <h1 className="text-xl font-bold leading-snug sm:text-2xl">{video.title}</h1>

          {/* Author + actions */}
          <div className="flex flex-wrap items-center gap-4 pb-5 border-b border-border">
            <Link
              to={ROUTES.profile(video.author.username)}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <Avatar src={video.author.avatarUrl} name={video.author.displayName} size="md" />
              <div>
                <p className="text-sm font-semibold">{video.author.displayName}</p>
                <p className="text-xs text-muted-foreground">@{video.author.username}</p>
              </div>
            </Link>

            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Button
                variant={video.isLiked ? 'default' : 'outline'}
                size="sm"
                className="gap-2"
                disabled={!isAuthenticated}
                loading={likeMutation.isPending}
                onClick={() => likeMutation.mutate()}
              >
                <Heart className={cn('h-4 w-4', video.isLiked && 'fill-current')} />
                {formatNumber(video.likesCount)}
              </Button>

              <Button
                variant={video.isBookmarked ? 'default' : 'outline'}
                size="sm"
                className="gap-2"
                disabled={!isAuthenticated}
                loading={bookmarkMutation.isPending}
                onClick={() => bookmarkMutation.mutate()}
              >
                <Bookmark className={cn('h-4 w-4', video.isBookmarked && 'fill-current')} />
                Save
              </Button>

              <Button variant="ghost" size="sm" onClick={copyLink} className="gap-2">
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </div>
          </div>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Eye className="h-4 w-4" />
              {formatNumber(video.views)} views
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {formatDate(video.publishedAt || video.createdAt, 'MMMM d, yyyy')}
            </span>
          </div>

          {/* Tags */}
          {video.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {video.tags.map((tag) => (
                <Link
                  key={tag}
                  to={`/community?tag=${tag}`}
                  className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  <Tag className="h-3 w-3" />
                  {tag}
                </Link>
              ))}
            </div>
          )}

          {/* Description */}
          {video.description && (
            <div className="rounded-xl bg-muted/40 p-4">
              <p className="text-sm leading-relaxed whitespace-pre-line">{video.description}</p>
            </div>
          )}

          {/* Comments */}
          <CommentSection contentType="video" contentId={video.id} />
        </div>

        {/* Sidebar – Related videos */}
        <aside className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            More videos
          </h3>
          <div className="space-y-4">
            {relatedVideos
              ?.filter((v) => v.id !== videoId)
              .slice(0, 7)
              .map((v) => (
                <VideoCard key={v.id} video={v} compact />
              ))}
          </div>
        </aside>
      </div>
    </div>
  )
}
