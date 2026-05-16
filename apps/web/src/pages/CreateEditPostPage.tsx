import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import { ArrowLeft, Send } from 'lucide-react'
import { postsApi } from '@/shared/api/posts'
import { toast } from '@/shared/stores/notificationStore'
import Button from '@/shared/components/Button'
import LoadingSpinner from '@/shared/components/LoadingSpinner'
import PostEditor from '@/features/post/PostEditor'

const POST_TYPES = [
  { value: 'article', label: 'Article' },
  { value: 'short', label: 'Short' },
  { value: 'gallery', label: 'Gallery' },
  { value: 'til', label: "Today I Learned" },
] as const

export default function CreateEditPostPage() {
  const { slug } = useParams<{ slug?: string }>()
  const navigate = useNavigate()
  const isEditing = Boolean(slug)

  const [title, setTitle] = useState('')
  const [type, setType] = useState<string>('article')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [postId, setPostId] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(!isEditing)

  // Load existing post when editing
  const { data: existingPost, isLoading: isLoadingPost } = useQuery({
    queryKey: ['post', slug],
    queryFn: () => postsApi.get(slug!),
    enabled: isEditing,
    staleTime: 0,
  })

  // Populate form fields once the post loads
  useEffect(() => {
    if (existingPost && !initialized) {
      setTitle(existingPost.title ?? '')
      setType(existingPost.type)
      setExcerpt(existingPost.excerpt ?? '')
      setContent(existingPost.content ?? '')
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
    <div className="mx-auto max-w-4xl px-4 py-8">
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

      {/* Form */}
      <div className="space-y-6">
        {/* Type */}
        <div>
          <label className="block text-sm font-medium mb-1.5" htmlFor="post-type">
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

        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-1.5" htmlFor="post-title">
            Title
          </label>
          <input
            id="post-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter your post title…"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Excerpt */}
        <div>
          <label className="block text-sm font-medium mb-1.5" htmlFor="post-excerpt">
            Excerpt{' '}
            <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <textarea
            id="post-excerpt"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="A short summary of your post…"
            rows={3}
            maxLength={500}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
          <p className="mt-1 text-xs text-muted-foreground text-right">
            {excerpt.length}/500
          </p>
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-medium mb-1.5">
            Content
          </label>
          <PostEditor
            value={content}
            onChange={setContent}
            placeholder="Write your post content here…"
          />
        </div>
      </div>
    </div>
  )
}
