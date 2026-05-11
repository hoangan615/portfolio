import { RouterProvider } from 'react-router'
import { router } from './router'
import { useThemeInit } from '@/shared/hooks/useAuth'

export default function App() {
  useThemeInit()
  return <RouterProvider router={router} />
}
