import { useParams } from 'react-router'
import PostDetail from '@/features/post/PostDetail'
import NotFoundPage from './NotFoundPage'

export default function PostPage() {
  const { slug } = useParams<{ slug: string }>()
  if (!slug) return <NotFoundPage />
  return <PostDetail slug={slug} />
}
