import { createBrowserRouter, Navigate, Outlet } from 'react-router'
import { Suspense, lazy } from 'react'
import { useAuthStore } from '@/shared/stores/authStore'
import LoadingSpinner from '@/shared/components/LoadingSpinner'
import Navbar from '@/shared/components/Navbar'
import Sidebar from '@/shared/components/Sidebar'

// Lazy-loaded pages
const HomePage = lazy(() => import('@/pages/HomePage'))
const CommunityPage = lazy(() => import('@/pages/CommunityPage'))
const WatchPage = lazy(() => import('@/pages/WatchPage'))
const PostPage = lazy(() => import('@/pages/PostPage'))
const ProfilePage = lazy(() => import('@/pages/ProfilePage'))
const LoginPage = lazy(() => import('@/pages/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/RegisterPage'))
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'))
const AdminPage = lazy(() => import('@/pages/AdminPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

const DashboardPostsPage = lazy(() => import('@/pages/DashboardPostsPage'))
const DashboardVideosPage = lazy(() => import('@/pages/DashboardVideosPage'))
const CVPage = lazy(() => import('@/pages/CVPage'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <LoadingSpinner size="lg" />
    </div>
  )
}

// Root layout with Navbar
function RootLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
    </div>
  )
}

// App layout with Sidebar (for community/dashboard pages)
function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 min-w-0">
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  )
}

// Auth-only layout
function AuthLayout() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
    </div>
  )
}

// Protected route wrapper
function ProtectedRoute({ adminOnly = false }: { adminOnly?: boolean }) {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (adminOnly && user?.role !== 'admin' && user?.role !== 'moderator') {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

export const router = createBrowserRouter([
  // Auth pages (no navbar)
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },

  // App layout with sidebar
  {
    element: <AppLayout />,
    children: [
      { path: '/community', element: <CommunityPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          { path: '/notifications', element: <NotificationsPage /> },
          { path: '/settings', element: <SettingsPage /> },
          { path: '/dashboard/posts', element: <DashboardPostsPage /> },
          { path: '/dashboard/videos', element: <DashboardVideosPage /> },
        ],
      },
      {
        element: <ProtectedRoute adminOnly />,
        children: [{ path: '/admin', element: <AdminPage /> }],
      },
    ],
  },

  // CV page — no navbar, print-optimised
  {
    path: '/cv',
    element: (
      <div className="min-h-screen bg-gray-50">
        <Suspense fallback={<PageLoader />}>
          <CVPage />
        </Suspense>
      </div>
    ),
  },

  // Root layout (just navbar)
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/watch/:id', element: <WatchPage /> },
      { path: '/post/:slug', element: <PostPage /> },
      { path: '/u/:username', element: <ProfilePage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
