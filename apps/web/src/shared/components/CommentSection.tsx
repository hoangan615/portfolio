import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Trash2, Edit2, Reply, ChevronDown } from 'lucide-react'
import { cn, formatRelativeTime } from '@/lib/utils'
import { commentsApi, type ContentType } from '@/shared/api/comments'
import { useAuthStore } from '@/shared/stores/authStore'
import { QUERY_KEYS } from '@/lib/constants'
import Avatar from './Avatar'
import Button from './Button'
import type { Comment } from '@/shared/api/posts'

interface CommentSectionProps {
  contentType: ContentType
  contentId: string
  className?: string
}

interface CommentFormValues {
  body: string
}

function CommentForm({
  contentType,
  contentId,
  parentId,
  onSuccess,
  onCancel,
  placeholder = 'Write a comment…',
  compact = false,
}: {
  contentType: ContentType
  contentId: string
  parentId?: string
  onSuccess?: () => void
  onCancel?: () => void
  placeholder?: string
  compact?: boolean
}) {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<CommentFormValues>()

  const mutation = useMutation({
    mutationFn: ({ body }: CommentFormValues) =>
      commentsApi.addComment(contentType, contentId, body, parentId),
    onSuccess: () => {
      reset()
      queryClient.invalidateQueries({
        queryKey: contentType === 'post'
          ? QUERY_KEYS.postComments(contentId)
          : QUERY_KEYS.videoComments(contentId),
      })
      onSuccess?.()
    },
  })

  if (!user) return null

  return (
    <form
      onSubmit={handleSubmit((data) => mutation.mutate(data))}
      className={cn('flex gap-2', compact ? 'mt-2' : 'mt-0')}
    >
      <Avatar src={user.avatarUrl} name={user.displayName} size="sm" className="mt-0.5 shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <textarea
          {...register('body', { required: true, minLength: 1 })}
          rows={compact ? 2 : 3}
          placeholder={placeholder}
          className={cn(
            'w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm',
            'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring',
            'transition-colors'
          )}
        />
        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" size="sm" loading={isSubmitting || mutation.isPending}>
            {parentId ? 'Reply' : 'Comment'}
          </Button>
        </div>
      </div>
    </form>
  )
}

function CommentItem({
  comment,
  contentType,
  contentId,
  replies = [],
  depth = 0,
}: {
  comment: Comment
  contentType: ContentType
  contentId: string
  replies?: Comment[]
  depth?: number
}) {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [showReply, setShowReply] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(comment.body)
  const [showReplies, setShowReplies] = useState(depth === 0)

  const isOwner = user?.id === comment.userId
  const queryKey = contentType === 'post'
    ? QUERY_KEYS.postComments(contentId)
    : QUERY_KEYS.videoComments(contentId)

  const deleteMutation = useMutation({
    mutationFn: () => commentsApi.deleteComment(comment.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  const editMutation = useMutation({
    mutationFn: (body: string) => commentsApi.editComment(comment.id, body),
    onSuccess: () => {
      setIsEditing(false)
      queryClient.invalidateQueries({ queryKey })
    },
  })

  // Display name fallback: use userId short string since backend CommentOut has no author embed
  const displayName = `User ${comment.userId.slice(0, 8)}`

  return (
    <div className={cn('flex gap-2.5', depth > 0 && 'ml-8 mt-2')}>
      <Avatar src={null} name={displayName} size="sm" className="shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="rounded-xl bg-muted/50 px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{displayName}</span>
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(comment.createdAt)}
            </span>
            {comment.editedAt && (
              <span className="text-xs text-muted-foreground">(edited)</span>
            )}
          </div>

          {comment.deletedAt ? (
            <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground italic">
              [deleted]
            </p>
          ) : isEditing ? (
            <div className="mt-1 flex flex-col gap-2">
              <textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                rows={2}
                className="w-full resize-none rounded-md border border-border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  loading={editMutation.isPending}
                  onClick={() => editMutation.mutate(editValue)}
                >
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="mt-0.5 text-sm leading-relaxed">{comment.body}</p>
          )}
        </div>

        {/* Actions */}
        {!comment.deletedAt && (
          <div className="mt-1 flex items-center gap-3 px-1">
            {depth === 0 && user && (
              <button
                onClick={() => setShowReply((v) => !v)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Reply className="h-3.5 w-3.5" />
                Reply
              </button>
            )}

            {isOwner && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  Edit
                </button>
                <button
                  onClick={() => deleteMutation.mutate()}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </>
            )}
          </div>
        )}

        {/* Reply form */}
        {showReply && (
          <CommentForm
            contentType={contentType}
            contentId={contentId}
            parentId={comment.id}
            onSuccess={() => setShowReply(false)}
            onCancel={() => setShowReply(false)}
            placeholder="Write a reply…"
            compact
          />
        )}

        {/* Nested replies (depth === 0 only, max 1 level) */}
        {replies.length > 0 && depth === 0 && (
          <div className="mt-2">
            {!showReplies ? (
              <button
                onClick={() => setShowReplies(true)}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <ChevronDown className="h-3.5 w-3.5" />
                {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
              </button>
            ) : (
              <>
                <button
                  onClick={() => setShowReplies(false)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-1"
                >
                  <ChevronDown className="h-3.5 w-3.5 rotate-180" />
                  Hide replies
                </button>
                {replies.map((reply) => (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    contentType={contentType}
                    contentId={contentId}
                    depth={1}
                  />
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function CommentSection({ contentType, contentId, className }: CommentSectionProps) {
  const queryKey = contentType === 'post'
    ? QUERY_KEYS.postComments(contentId)
    : QUERY_KEYS.videoComments(contentId)

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => commentsApi.getComments(contentType, contentId),
  })

  // Backend returns flat list; group by parentId
  const allComments = data?.items ?? []
  const topLevel = allComments.filter((c) => !c.parentId)
  const getReplies = (parentId: string) => allComments.filter((c) => c.parentId === parentId)

  return (
    <section className={cn('flex flex-col gap-4', className)}>
      <h3 className="text-lg font-semibold">
        Comments {data?.total ? `(${data.total})` : ''}
      </h3>

      <CommentForm contentType={contentType} contentId={contentId} />

      {isLoading ? (
        <p className="text-sm text-muted-foreground py-4">Loading comments…</p>
      ) : topLevel.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No comments yet. Be the first!
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {topLevel.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              contentType={contentType}
              contentId={contentId}
              replies={getReplies(comment.id)}
            />
          ))}
        </div>
      )}
    </section>
  )
}
