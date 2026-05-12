import { useParams } from 'react-router'
import WatchFeature from '@/features/video/WatchPage'
import NotFoundPage from './NotFoundPage'

export default function WatchPage() {
  const { id } = useParams<{ id: string }>()
  if (!id) return <NotFoundPage />
  return <WatchFeature videoId={id} />
}
