import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import LoadingSpinner from '@/shared/components/LoadingSpinner'

describe('LoadingSpinner', () => {
  it('renders with role=status and aria-label', () => {
    render(<LoadingSpinner />)
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByLabelText('Loading')).toBeInTheDocument()
  })

  it('applies default md size class', () => {
    render(<LoadingSpinner />)
    const el = screen.getByRole('status')
    expect(el.className).toContain('h-6')
    expect(el.className).toContain('w-6')
  })

  it('applies xs size class', () => {
    render(<LoadingSpinner size="xs" />)
    expect(screen.getByRole('status').className).toContain('h-3')
  })

  it('applies sm size class', () => {
    render(<LoadingSpinner size="sm" />)
    expect(screen.getByRole('status').className).toContain('h-4')
  })

  it('applies lg size class', () => {
    render(<LoadingSpinner size="lg" />)
    expect(screen.getByRole('status').className).toContain('h-8')
  })

  it('applies xl size class', () => {
    render(<LoadingSpinner size="xl" />)
    expect(screen.getByRole('status').className).toContain('h-12')
  })

  it('merges custom className', () => {
    render(<LoadingSpinner className="text-red-500" />)
    expect(screen.getByRole('status').className).toContain('text-red-500')
  })
})
