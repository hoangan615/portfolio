import { useParams } from 'react-router'
import UserProfile from '@/features/profile/UserProfile'
import NotFoundPage from './NotFoundPage'

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>()
  if (!username) return <NotFoundPage />
  return <UserProfile username={username} />
}
