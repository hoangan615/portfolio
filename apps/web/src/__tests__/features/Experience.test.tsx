import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('@/shared/api/portfolio', () => ({
  portfolioApi: {
    getExperiences: vi.fn().mockResolvedValue(null),
  },
}))

import Experience from '@/features/portfolio/Experience'

function renderExperience() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  // Pre-populate the cache so isLoading=false on first render and ExperienceCard renders synchronously
  client.setQueryData(['experiences'], null)
  return render(
    <QueryClientProvider client={client}>
      <Experience />
    </QueryClientProvider>
  )
}

describe('Experience', () => {
  it('shows loading spinner before data loads', () => {
    // No pre-populated cache → isLoading=true → LoadingSpinner shows
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(<QueryClientProvider client={client}><Experience /></QueryClientProvider>)
    expect(document.querySelector('.py-12')).toBeInTheDocument()
  })

  it('renders "Work Experience" heading', async () => {
    renderExperience()
    expect(await screen.findByText(/Work Experience/i)).toBeInTheDocument()
  })

  it('renders FPT Software as employer', async () => {
    renderExperience()
    const items = await screen.findAllByText(/FPT Software/i)
    expect(items.length).toBeGreaterThan(0)
  })

  it('renders Sub Project Lead role', async () => {
    renderExperience()
    const roles = await screen.findAllByText(/Sub Project Lead/i)
    expect(roles.length).toBeGreaterThan(0)
  })

  it('renders inside a section element', () => {
    renderExperience()
    expect(document.querySelector('section')).toBeInTheDocument()
  })
})
