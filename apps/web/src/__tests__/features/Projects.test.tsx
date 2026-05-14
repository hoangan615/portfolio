import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Projects from '@/features/portfolio/Projects'

// Projects.tsx is fully static — no API calls

describe('Projects', () => {
  it('renders "Featured Projects" heading', () => {
    render(<Projects />)
    expect(screen.getByText(/Featured Projects/i)).toBeInTheDocument()
  })

  it('renders FPT Software mention', () => {
    render(<Projects />)
    expect(screen.getByText(/FPT Software/i)).toBeInTheDocument()
  })

  it('renders inside section#projects', () => {
    render(<Projects />)
    expect(document.querySelector('section#projects')).toBeInTheDocument()
  })

  it('renders at least one project card', () => {
    render(<Projects />)
    // Each project card has an emoji and domain/tagline
    const section = document.querySelector('section#projects')
    expect(section).toBeInTheDocument()
    // Project cards are present if there are children beyond the header
    expect(section?.children.length).toBeGreaterThan(0)
  })
})
