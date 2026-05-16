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
      reporter: ['text', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/test/**',
        'src/__tests__/**',
        'src/**/*.d.ts',
        'src/main.tsx',
        'src/router.tsx',
        'src/features/**',
        'src/shared/api/client.ts',
        'src/shared/components/VideoPlayer.tsx',
        'src/shared/components/CommentSection.tsx',
        'src/shared/components/Navbar.tsx',
        'src/pages/SettingsPage.tsx',
        'src/pages/DashboardPostsPage.tsx',
        'src/pages/DashboardVideosPage.tsx',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
