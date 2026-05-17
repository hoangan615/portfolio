import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router'
import {
  Plus,
  Video,
  Trash2,
  Eye,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { cn, formatRelativeTime, formatNumber, formatDuration } from '@/lib/utils'
import { videosApi } from '@/shared/api/videos'
import { useAuthStore } from '@/shared/stores/authStore'
import { QUERY_KEYS, ROUTES } from '@/lib/constants'
import { toast } from '@/shared/stores/notificationStore'
import Button from '@/shared/components/Button'
import LoadingSpinner from '@/shared/components/LoadingSpinner'
import Modal from '@/shared/components/Modal'
import VideoUpload from '@/features/video/VideoUpload'

type VideoStatus = 'processing' | 'ready' | 'error'

function StatusBadge({ status }: { status: string }) {
  const normalised = (['processing', 'ready', 'error'].includes(status)
    ? status
    : 'ready') as VideoStatus

  const config: Record<VideoStatus, { icon: typeof Loader2; label: string; className: string; iconClass: string }> = {
    processing: {
      icon: Loader2,
      label: 'Processing',
      className: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
      iconClass: 'animate-spin',
    },
    ready: {
      icon: CheckCircle2,
      label: 'Ready',
      className: 'bg-green-500/10 text-green-600 dark:text-green-400',
      iconClass: '',
    },
    error: {
      icon: AlertCircle,
      label: 'Error',
      className: 'bg-destructive/10 text-destructive',
      iconClass: '',
    },
  }

  const { icon: Icon, label, className, iconClass } = config[normalised]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        className
      )}
    >
      <Icon className={cn('h-3 w-3', iconClass)} />
      {label}
    </span>
  )
}

export default function DashboardVideosPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [uploadOpen, setUploadOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.videos, 'mine'],
    queryFn: () => videosApi.list({ pageSize: 50 }),
    enabled: !!user,
    refetchInterval: (query) => {
      // Refetch every 10s if any video is processing
      const hasProcessing = query.state.data?.items.some((v) => v.status === 'processing')
      return hasProcessing ? 10_000 : false
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => videosApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.videos })
      toast.success('Video deleted')
    },
    onError: () => toast.error('Failed to delete video'),
  })

  const videos = data?.items ?? []

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Modal
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        className="max-w-2xl"
      >
        <VideoUpload />
      </Modal>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Video className="h-5 w-5" />
            My Videos
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {data?.total ?? 0} videos total
          </p>
        </div>
        <Button onClick={() => setUploadOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Upload Video
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground rounded-xl border border-dashed border-border">
          <Video className="h-10 w-10 mb-3 opacity-30" />
          <p className="text-sm font-medium">No videos yet</p>
          <p className="text-xs text-muted-foreground mt-1">Upload your first video to get started</p>
          <Button size="sm" className="mt-4 gap-2" onClick={() => setUploadOpen(true)}>
            <Plus className="h-4 w-4" />
            Upload video
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => (
            <div
              key={video.id}
              className="group rounded-xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-all"
            >
              {/* Thumbnail */}
              <div className="relative aspect-video bg-muted overflow-hidden">
                {video.thumbnailUrl ? (
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Video className="h-10 w-10 text-muted-foreground opacity-40" />
                  </div>
                )}
                {video.durationSeconds != null && (
                  <span className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white">
                    {formatDuration(video.durationSeconds)}
                  </span>
                )}
                <div className="absolute top-2 left-2">
                  <StatusBadge status={video.status} />
                </div>
              </div>

              {/* Info */}
              <div className="p-3">
                <Link to={ROUTES.watch(video.id)}>
                  <h3 className="text-sm font-semibold line-clamp-2 hover:text-primary transition-colors">
                    {video.title}
                  </h3>
                </Link>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span>{formatRelativeTime(video.createdAt)}</span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {formatNumber(video.viewCount)}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <Link to={ROUTES.watch(video.id)} className="flex-1">
                    <Button size="sm" variant="outline" className="w-full gap-2 text-xs">
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive shrink-0"
                    loading={deleteMutation.isPending}
                    onClick={() => {
                      if (window.confirm('Delete this video?')) deleteMutation.mutate(video.id)
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
