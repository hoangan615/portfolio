import DOMPurify from 'dompurify'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import {
  Share2,
  Eye,
  Twitter,
  Link as LinkIcon,
} from 'lucide-react'
import { formatDate, formatNumber } from '@/lib/utils'
import { postsApi } from '@/shared/api/posts'
import { QUERY_KEYS, ROUTES } from '@/lib/constants'
import { toast } from '@/shared/stores/notificationStore'
import Button from '@/shared/components/Button'
import CommentSection from '@/shared/components/CommentSection'
import LoadingSpinner from '@/shared/components/LoadingSpinner'

interface PostDetailProps {
  slug: string
}

export default function PostDetail({ slug }: PostDetailProps) {
  const { data: post, isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.post(slug),
    queryFn: () => postsApi.get(slug),
  })

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Link copied!', 'Post URL copied to clipboard.')
  }

  const shareTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(post?.title ?? '')}&url=${encodeURIComponent(window.location.href)}`
    window.open(url, '_blank')
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="xl" />
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p className="text-lg font-medium">Post not found</p>
        <Link to={ROUTES.community} className="mt-2 text-sm text-primary hover:underline">
          Back to community
        </Link>
      </div>
    )
  }

  return (
    <article className="mx-auto max-w-3xl px-4 py-8">
      {/* Cover image */}
      {post.coverImageUrl && (
        <div className="mb-8 overflow-hidden rounded-xl aspect-video">
          <img
            src={post.coverImageUrl}
            alt={post.title ?? ''}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      {/* Title */}
      <h1 className="mb-4 text-3xl font-bold leading-tight sm:text-4xl">{post.title}</h1>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-4 mb-8 pb-8 border-b border-border">
        <div className="flex items-center gap-3 text-xs text-muted-foreground ml-auto flex-wrap">
          <span>{formatDate(post.publishedAt || post.createdAt, 'MMMM d, yyyy')}</span>
          <span className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" />
            {formatNumber(post.viewCount)} views
          </span>
        </div>
      </div>

      {/* Content */}
      <div
        className="[&>h1]:text-2xl [&>h1]:font-bold [&>h1]:mb-4 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:mb-3 [&>h3]:text-lg [&>h3]:font-semibold [&>h3]:mb-2 [&>p]:mb-4 [&>p]:leading-relaxed [&>ul]:mb-4 [&>ul]:list-disc [&>ul]:pl-6 [&>ol]:mb-4 [&>ol]:list-decimal [&>ol]:pl-6 [&>li]:mb-1 [&>blockquote]:border-l-4 [&>blockquote]:border-primary [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-muted-foreground [&>blockquote]:mb-4 [&>pre]:mb-4 [&>pre]:overflow-x-auto [&>pre]:rounded-lg [&>pre]:bg-muted [&>pre]:p-4 [&>code]:rounded [&>code]:bg-muted [&>code]:px-1 [&>code]:py-0.5 [&>code]:text-sm [&>a]:text-primary [&>a]:underline [&>img]:rounded-lg [&>img]:mb-4 max-w-none mb-10 text-foreground"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content ?? '') }}
      />

      {/* Share bar */}
      <div className="flex flex-wrap items-center gap-3 py-6 border-t border-b border-border mb-10">
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={copyLink} className="gap-2">
            <LinkIcon className="h-4 w-4" />
            Copy link
          </Button>
          <Button variant="ghost" size="sm" onClick={shareTwitter} className="gap-2">
            <Twitter className="h-4 w-4" />
            Tweet
          </Button>
          <Button variant="ghost" size="icon" onClick={copyLink} aria-label="Share">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Comments */}
      <CommentSection contentType="post" contentId={post.id} />
    </article>
  )
}
