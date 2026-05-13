import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router'

// Mock portfolioApi so no real HTTP request is made
vi.mock('@/shared/api/portfolio', () => ({
  portfolioApi: {
    getPortfolio: vi.fn().mockResolvedValue(null), // simulate empty API → use defaults
  },
}))

import Hero from '@/features/portfolio/Hero'

function renderHero() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <Hero />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('Hero — default profile (Võ Hoàng Ân)', () => {
  it('renders the owner name', async () => {
    renderHero()
    // DEFAULT_PROFILE.name = 'Võ Hoàng Ân'
    const name = await screen.findByText(/Võ Hoàng Ân/i)
    expect(name).toBeInTheDocument()
  })

  it('renders the current role', async () => {
    renderHero()
    const role = await screen.findByText(/Full-Stack Developer/i)
    expect(role).toBeInTheDocument()
  })

  it('renders FPT Software', async () => {
    renderHero()
    const company = await screen.findByText(/FPT Software/i)
    expect(company).toBeInTheDocument()
  })

  it('renders GitHub link', async () => {
    renderHero()
    const ghLink = await screen.findByRole('link', { name: /github/i })
    expect(ghLink).toHaveAttribute('href', 'https://github.com/hoangan615')
  })

  it('renders LinkedIn link', async () => {
    renderHero()
    const liLink = await screen.findByRole('link', { name: /linkedin/i })
    expect(liLink).toHaveAttribute('href', 'https://www.linkedin.com/in/an-vo-012359159/')
  })
})
