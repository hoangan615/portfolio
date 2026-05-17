import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { Share2, Eye, Calendar } from 'lucide-react'
import { cn, formatNumber, formatDate } from '@/lib/utils'
import { videosApi } from '@/shared/api/videos'
import { QUERY_KEYS, ROUTES } from '@/lib/constants'
import { toast } from '@/shared/stores/notificationStore'
import VideoPlayer from '@/shared/components/VideoPlayer'
import Button from '@/shared/components/Button'
import CommentSection from '@/shared/components/CommentSection'
import LoadingSpinner from '@/shared/components/LoadingSpinner'

interface WatchPageProps {
  videoId: string
}

export default function WatchPage({ videoId }: WatchPageProps) {
  const { data: video, isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.video(videoId),
    queryFn: () => videosApi.get(videoId),
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
            src={video.hlsManifestUrl ?? ''}
            poster={video.thumbnailUrl ?? undefined}
            title={video.title}
          />

          {/* Title */}
          <h1 className="text-xl font-bold leading-snug sm:text-2xl">{video.title}</h1>

          {/* Actions */}
          <div className={cn('flex flex-wrap items-center gap-4 pb-5 border-b border-border')}>
            <div className="ml-auto flex flex-wrap items-center gap-2">
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
              {formatNumber(video.viewCount)} views
            </span>
            {(video.publishedAt || video.createdAt) && (
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {formatDate(video.publishedAt || video.createdAt, 'MMMM d, yyyy')}
              </span>
            )}
          </div>

          {/* Description */}
          {video.description && (
            <div className="rounded-xl bg-muted/40 p-4">
              <p className="text-sm leading-relaxed whitespace-pre-line">{video.description}</p>
            </div>
          )}

          {/* Comments */}
          {video.allowComment && (
            <CommentSection contentType="video" contentId={video.id} />
          )}
        </div>

        {/* Sidebar – status info */}
        <aside className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-semibold mb-2">Video Info</h3>
            <dl className="space-y-1 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <dt>Status</dt>
                <dd className="capitalize">{video.status}</dd>
              </div>
              {video.durationSeconds != null && (
                <div className="flex justify-between">
                  <dt>Duration</dt>
                  <dd>{Math.floor(video.durationSeconds / 60)}m {Math.floor(video.durationSeconds % 60)}s</dd>
                </div>
              )}
            </dl>
          </div>
        </aside>
      </div>
    </div>
  )
}
