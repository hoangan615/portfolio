import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('@/shared/api/portfolio', () => ({
  portfolioApi: {
    getPortfolio: vi.fn().mockResolvedValue(null),
  },
}))

import About from '@/features/portfolio/About'

function renderAbout() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <About />
    </QueryClientProvider>
  )
}

describe('About', () => {
  it('renders "Who Am I?" heading', () => {
    renderAbout()
    // Heading is always rendered unconditionally
    expect(screen.getByText(/Who Am I\?/i)).toBeInTheDocument()
  })

  it('renders "About Me" label', () => {
    renderAbout()
    expect(screen.getByText(/About Me/i)).toBeInTheDocument()
  })

  it('renders experience highlight', () => {
    renderAbout()
    expect(screen.getByText(/10\+ Years/i)).toBeInTheDocument()
  })

  it('renders default bio paragraphs', () => {
    renderAbout()
    // DEFAULT_BIO is always rendered - check for ASCII content from paragraph
    expect(screen.getByText(/Full-Stack Software Engineer/i)).toBeInTheDocument()
  })

  it('renders language proficiency section', () => {
    renderAbout()
    expect(screen.getByText(/Language Proficiency/i)).toBeInTheDocument()
  })

  it('renders Vietnamese language entry', () => {
    renderAbout()
    expect(screen.getByText('Vietnamese')).toBeInTheDocument()
  })

  it('renders inside section#about', () => {
    renderAbout()
    expect(document.querySelector('section#about')).toBeInTheDocument()
  })
})
