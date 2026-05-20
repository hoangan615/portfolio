import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import { ArrowLeft, Send, ImageIcon, X } from 'lucide-react'
import { postsApi } from '@/shared/api/posts'
import { toast } from '@/shared/stores/notificationStore'
import { useImageUpload } from '@/shared/hooks/useUpload'
import Button from '@/shared/components/Button'
import LoadingSpinner from '@/shared/components/LoadingSpinner'
import PostEditor from '@/features/post/PostEditor'
import { cn } from '@/lib/utils'

const POST_TYPES = [
  { value: 'article', label: 'Article' },
  { value: 'short', label: 'Short' },
  { value: 'gallery', label: 'Gallery' },
  { value: 'til', label: 'Today I Learned' },
] as const

function CoverImageUpload({
  value,
  onChange,
}: {
  value: string
  onChange: (url: string) => void
}) {
  const { uploadImage, isUploading } = useImageUpload()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = await uploadImage(file)
    if (url) onChange(url)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium">Cover Image</label>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {value ? (
        <div className="relative group rounded-lg overflow-hidden aspect-video bg-muted">
          <img src={value} alt="Cover" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-md bg-white/90 px-3 py-1.5 text-xs font-medium text-gray-800 hover:bg-white transition-colors"
            >
              Change
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              className="rounded-md bg-white/90 p-1.5 text-gray-800 hover:bg-white transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <LoadingSpinner size="md" />
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className={cn(
            'flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border',
            'aspect-video text-muted-foreground transition-colors',
            'hover:border-primary/50 hover:text-foreground hover:bg-muted/50',
            'disabled:opacity-50 disabled:pointer-events-none'
          )}
        >
          {isUploading ? (
            <LoadingSpinner size="md" />
          ) : (
            <>
              <ImageIcon className="h-8 w-8 opacity-50" />
              <span className="text-xs font-medium">Upload cover image</span>
            </>
          )}
        </button>
      )}
    </div>
  )
}

export default function CreateEditPostPage() {
  const { slug } = useParams<{ slug?: string }>()
  const navigate = useNavigate()
  const isEditing = Boolean(slug)

  const [title, setTitle] = useState('')
  const [type, setType] = useState<string>('article')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [postId, setPostId] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(!isEditing)

  const { data: existingPost, isLoading: isLoadingPost } = useQuery({
    queryKey: ['post', slug],
    queryFn: () => postsApi.get(slug!),
    enabled: isEditing,
    staleTime: 0,
  })

  useEffect(() => {
    if (existingPost && !initialized) {
      setTitle(existingPost.title ?? '')
      setType(existingPost.type)
      setExcerpt(existingPost.excerpt ?? '')
      setContent(existingPost.content ?? '')
      setCoverImageUrl(existingPost.coverImageUrl ?? '')
      setPostId(existingPost.id)
      setInitialized(true)
    }
  }, [existingPost, initialized])

  const createMutation = useMutation({
    mutationFn: () =>
      postsApi.create({
        type,
        title: title || undefined,
        content: content || undefined,
        excerpt: excerpt || undefined,
        coverImageUrl: coverImageUrl || undefined,
      }),
    onSuccess: () => {
      toast.success('Post created', 'Your post has been saved as a draft.')
      navigate('/dashboard/posts')
    },
    onError: () => {
      toast.error('Failed to create post', 'Please try again.')
    },
  })

  const updateMutation = useMutation({
    mutationFn: () =>
      postsApi.update(postId!, {
        type,
        title: title || undefined,
        content: content || undefined,
        excerpt: excerpt || undefined,
        coverImageUrl: coverImageUrl || undefined,
      }),
    onSuccess: () => {
      toast.success('Post updated', 'Your changes have been saved.')
      navigate('/dashboard/posts')
    },
    onError: () => {
      toast.error('Failed to update post', 'Please try again.')
    },
  })

  const submitMutation = useMutation({
    mutationFn: () => postsApi.submit(postId!),
    onSuccess: () => {
      toast.success('Post submitted', 'Your post is now pending review.')
      navigate('/dashboard/posts')
    },
    onError: () => {
      toast.error('Failed to submit post', 'Please save first, then try again.')
    },
  })

  const handleSave = () => {
    if (isEditing && postId) {
      updateMutation.mutate()
    } else {
      createMutation.mutate()
    }
  }

  const handleSubmit = () => {
    if (!postId) {
      toast.error('Save first', 'Please save your post before submitting for review.')
      return
    }
    submitMutation.mutate()
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  if (isEditing && isLoadingPost) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="xl" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard/posts')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-xl font-bold">
            {isEditing ? 'Edit Post' : 'New Post'}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {isEditing && postId && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              loading={submitMutation.isPending}
              disabled={isSaving}
              onClick={handleSubmit}
            >
              <Send className="h-4 w-4" />
              Submit for Review
            </Button>
          )}
          <Button
            size="sm"
            loading={isSaving}
            disabled={submitMutation.isPending}
            onClick={handleSave}
          >
            {isEditing ? 'Save Changes' : 'Create Post'}
          </Button>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
        {/* Left: Title + Editor */}
        <div className="space-y-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Post title…"
            className="w-full bg-transparent text-2xl font-bold placeholder:text-muted-foreground/50 focus:outline-none border-b border-border pb-3"
          />
          <PostEditor
            value={content}
            onChange={setContent}
            placeholder="Write your post content here…"
          />
        </div>

        {/* Right: Settings panel */}
        <div className="lg:sticky lg:top-6 rounded-xl border border-border bg-card p-5 space-y-5">
          {/* Post Type */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium" htmlFor="post-type">
              Post Type
            </label>
            <select
              id="post-type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {POST_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Cover Image */}
          <CoverImageUpload value={coverImageUrl} onChange={setCoverImageUrl} />

          {/* Excerpt */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium" htmlFor="post-excerpt">
              Excerpt{' '}
              <span className="text-muted-foreground font-normal text-xs">(optional)</span>
            </label>
            <textarea
              id="post-excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="A short summary of your post…"
              rows={4}
              maxLength={500}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">{excerpt.length}/500</p>
          </div>
        </div>
      </div>
    </div>
  )
}
