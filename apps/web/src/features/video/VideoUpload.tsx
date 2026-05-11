import { useState, useCallback, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { Upload, X, Film, CheckCircle2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useVideoUpload } from '@/shared/hooks/useUpload'
import { ROUTES, UPLOAD } from '@/lib/constants'
import Button from '@/shared/components/Button'

interface UploadMetadataForm {
  title: string
  description: string
  tags: string
  visibility: 'public' | 'private' | 'unlisted'
}

export default function VideoUpload() {
  const navigate = useNavigate()
  const { state, upload, cancel, reset } = useVideoUpload()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<UploadMetadataForm>({
    defaultValues: { visibility: 'public' },
  })

  const handleFileSelect = useCallback((file: File) => {
    if (!UPLOAD.allowedVideoTypes.includes(file.type)) {
      alert('Please select a valid video file (MP4, WebM, OGG, MOV).')
      return
    }
    if (file.size > UPLOAD.maxFileSize) {
      alert('File is too large. Maximum size is 500 MB.')
      return
    }
    setSelectedFile(file)
  }, [])

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFileSelect(file)
    },
    [handleFileSelect]
  )

  const onSubmit = (formData: UploadMetadataForm) => {
    if (!selectedFile) return
    upload(selectedFile, {
      title: formData.title,
      description: formData.description,
      tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
    })
  }

  // After upload completes, navigate to the video
  if (state.status === 'done' && state.videoId) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
        <CheckCircle2 className="h-16 w-16 text-green-500" />
        <h2 className="text-xl font-semibold">Upload complete!</h2>
        <p className="text-sm text-muted-foreground">
          Your video is processing and will be available shortly.
        </p>
        <div className="flex gap-3">
          <Button onClick={reset} variant="outline">Upload another</Button>
          <Button onClick={() => navigate(ROUTES.watch(state.videoId!))}>
            View video
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-8 px-4">
      <div>
        <h1 className="text-2xl font-bold">Upload Video</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Share your video with the community. Max 500 MB.
        </p>
      </div>

      {/* File drop zone */}
      {!selectedFile ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'flex flex-col items-center justify-center gap-4',
            'rounded-xl border-2 border-dashed border-border bg-muted/30 p-12',
            'cursor-pointer transition-colors hover:bg-muted/50',
            isDragging && 'border-primary bg-primary/5'
          )}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Film className="h-8 w-8 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">
              Drag and drop your video here, or{' '}
              <span className="text-primary">browse files</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              MP4, WebM, OGG, MOV · Max 500 MB
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={UPLOAD.allowedVideoTypes.join(',')}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFileSelect(file)
            }}
          />
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <Film className="h-8 w-8 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{selectedFile.name}</p>
            <p className="text-xs text-muted-foreground">
              {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
            </p>
          </div>
          {state.status === 'idle' && (
            <button
              onClick={() => setSelectedFile(null)}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* Upload progress */}
      {(state.status === 'uploading' || state.status === 'processing') && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              {state.status === 'processing' ? 'Processing…' : `Uploading… ${state.progress}%`}
            </span>
            <Button variant="ghost" size="sm" onClick={cancel} className="text-destructive">
              Cancel
            </Button>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-300',
                state.status === 'processing' ? 'bg-yellow-500 animate-pulse' : 'bg-primary'
              )}
              style={{ width: `${state.progress}%` }}
            />
          </div>
          {state.status === 'processing' && (
            <p className="text-xs text-muted-foreground">
              Your video is being transcoded. This may take a few minutes.
            </p>
          )}
        </div>
      )}

      {/* Error */}
      {state.status === 'error' && (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
          <div>
            <p className="text-sm font-medium text-destructive">Upload failed</p>
            <p className="text-xs text-destructive/80">{state.error}</p>
          </div>
          <Button variant="outline" size="sm" className="ml-auto shrink-0" onClick={reset}>
            Retry
          </Button>
        </div>
      )}

      {/* Metadata form */}
      {selectedFile && state.status === 'idle' && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="video-title" className="block text-sm font-medium">
              Title <span className="text-destructive">*</span>
            </label>
            <input
              id="video-title"
              type="text"
              placeholder="Give your video a great title"
              className={cn(
                'w-full rounded-md border border-border bg-background px-3 py-2 text-sm',
                'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring',
                errors.title && 'border-destructive'
              )}
              {...register('title', { required: 'Title is required', minLength: { value: 3, message: 'Min 3 chars' } })}
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="video-desc" className="block text-sm font-medium">
              Description
            </label>
            <textarea
              id="video-desc"
              rows={3}
              placeholder="Tell viewers about your video…"
              className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              {...register('description')}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="video-tags" className="block text-sm font-medium">
              Tags{' '}
              <span className="text-xs text-muted-foreground">(comma-separated)</span>
            </label>
            <input
              id="video-tags"
              type="text"
              placeholder="react, dotnet, tutorial"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              {...register('tags')}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="video-visibility" className="block text-sm font-medium">
              Visibility
            </label>
            <select
              id="video-visibility"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              {...register('visibility')}
            >
              <option value="public">Public – Anyone can watch</option>
              <option value="unlisted">Unlisted – Only people with the link</option>
              <option value="private">Private – Only you</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => { setSelectedFile(null); reset() }}>
              Cancel
            </Button>
            <Button type="submit" className="gap-2">
              <Upload className="h-4 w-4" />
              Start Upload
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
