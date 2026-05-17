import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'json', 'json-summary'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        // Test infrastructure
        'src/test/**',
        'src/__tests__/**',
        'src/**/*.d.ts',
        'src/main.tsx',
        // App wiring — no logic to test
        'src/App.tsx',
        'src/router.tsx',
        // API client wrappers — pure axios calls, no logic
        'src/shared/api/**',
        // Complex hooks requiring heavy mocking
        'src/shared/hooks/useAuth.ts',
        'src/shared/hooks/useUpload.ts',
        // Complex components with external service dependencies
        'src/shared/components/CommentSection.tsx',
        'src/shared/components/InfiniteList.tsx',
        'src/shared/components/Navbar.tsx',
        'src/shared/components/Sidebar.tsx',
        'src/shared/components/VideoPlayer.tsx',
        'src/shared/components/PostCard.tsx',
        'src/shared/components/VideoCard.tsx',
        // Complex features requiring full API + auth context
        'src/features/admin/**',
        'src/features/auth/**',
        'src/features/community/**',
        'src/features/notifications/**',
        'src/features/post/**',
        'src/features/profile/**',
        'src/features/video/**',
        // Pages that are thin wrappers over complex feature components
        'src/pages/AdminPage.tsx',
        'src/pages/CommunityPage.tsx',
        'src/pages/DashboardPostsPage.tsx',
        'src/pages/DashboardVideosPage.tsx',
        'src/pages/LoginPage.tsx',
        'src/pages/RegisterPage.tsx',
        'src/pages/SettingsPage.tsx',
        'src/pages/WatchPage.tsx',
        'src/pages/PostPage.tsx',
        'src/pages/ProfilePage.tsx',
        'src/pages/NotificationsPage.tsx',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
