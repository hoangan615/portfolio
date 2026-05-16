import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router') as Record<string, unknown>
  return {
    ...actual,
    RouterProvider: () => <div data-testid="router-provider" />,
  }
})

vi.mock('@/shared/hooks/useAuth', () => ({
  useThemeInit: vi.fn(),
}))

vi.mock('@/router', () => ({ router: {} }))

import App from '@/App'

describe('App', () => {
  it('renders RouterProvider without crashing', () => {
    render(<App />)
    expect(screen.getByTestId('router-provider')).toBeInTheDocument()
  })
})
