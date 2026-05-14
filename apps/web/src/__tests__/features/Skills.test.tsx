import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('@/shared/api/portfolio', () => ({
  portfolioApi: {
    getSkills: vi.fn().mockResolvedValue(null),
  },
}))

import Skills from '@/features/portfolio/Skills'

function renderSkills() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <Skills />
    </QueryClientProvider>
  )
}

describe('Skills', () => {
  it('renders "Technical Skills" heading', async () => {
    renderSkills()
    expect(await screen.findByText(/Technical Skills/i)).toBeInTheDocument()
  })

  it('renders at least one skill category', async () => {
    renderSkills()
    // DEFAULT_SKILLS has Backend, Frontend, etc.
    expect(await screen.findByText(/Backend/i)).toBeInTheDocument()
  })

  it('renders skill items', async () => {
    renderSkills()
    // .NET/C# is in default backend skills
    expect(await screen.findByText(/\.NET/i)).toBeInTheDocument()
  })

  it('renders inside a section element', () => {
    renderSkills()
    expect(document.querySelector('section#skills')).toBeInTheDocument()
  })
})
