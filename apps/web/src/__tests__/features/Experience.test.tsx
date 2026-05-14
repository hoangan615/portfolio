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
  return render(
    <QueryClientProvider client={client}>
      <Experience />
    </QueryClientProvider>
  )
}

describe('Experience', () => {
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
