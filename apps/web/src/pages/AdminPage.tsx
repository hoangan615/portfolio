import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import AdminDashboard from '@/features/admin/AdminDashboard'
import { useAuthStore } from '@/shared/stores/authStore'

export default function AdminPage() {
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const navigate = useNavigate()

  const isAdmin = user?.role === 'admin' || user?.role === 'moderator'

  useEffect(() => {
    if (isAuthenticated && !isAdmin) {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, isAdmin, navigate])

  if (!isAdmin) return null

  return <AdminDashboard />
}
