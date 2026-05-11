import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import LoginForm from '@/features/auth/LoginForm'
import { useAuthStore } from '@/shared/stores/authStore'

export default function LoginPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, navigate])

  if (isAuthenticated) return null

  return (
    <div className="w-full flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
            An Vo
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Portfolio & Community</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
