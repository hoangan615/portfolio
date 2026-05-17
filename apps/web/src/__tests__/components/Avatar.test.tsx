import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Avatar from '@/shared/components/Avatar'

describe('Avatar', () => {
  it('shows initials when no src is provided', () => {
    render(<Avatar name="John Doe" />)
    expect(screen.getByText('JD')).toBeInTheDocument()
  })

  it('shows single initial for single-word name', () => {
    render(<Avatar name="Alice" />)
    expect(screen.getByText('A')).toBeInTheDocument()
  })

  it('renders img element when src is provided', () => {
    render(<Avatar name="John" src="https://example.com/avatar.png" />)
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.png')
    expect(img).toHaveAttribute('alt', 'John')
  })

  it('applies sm size class', () => {
    const { container } = render(<Avatar name="A" size="sm" />)
    expect(container.firstChild as HTMLElement).toHaveClass('h-7')
  })

  it('applies md size class (default)', () => {
    const { container } = render(<Avatar name="A" />)
    expect(container.firstChild as HTMLElement).toHaveClass('h-9')
  })

  it('applies lg size class', () => {
    const { container } = render(<Avatar name="A" size="lg" />)
    expect(container.firstChild as HTMLElement).toHaveClass('h-12')
  })

  it('applies xl size class', () => {
    const { container } = render(<Avatar name="A" size="xl" />)
    expect(container.firstChild as HTMLElement).toHaveClass('h-20')
  })

  it('merges custom className', () => {
    const { container } = render(<Avatar name="A" className="border-2" />)
    expect(container.firstChild as HTMLElement).toHaveClass('border-2')
  })

  it('handles empty name gracefully', () => {
    render(<Avatar name="" />)
    expect(screen.getByText('?')).toBeInTheDocument()
  })

  it('applies consistent color for same name', () => {
    const { container: c1 } = render(<Avatar name="Alice" />)
    const { container: c2 } = render(<Avatar name="Alice" />)
    const bg1 = (c1.querySelector('[class*="bg-"]') as HTMLElement)?.className
    const bg2 = (c2.querySelector('[class*="bg-"]') as HTMLElement)?.className
    expect(bg1).toBe(bg2)
  })
})
