import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Contact uses useMutation for form submission — needs QueryClientProvider
vi.mock('@/shared/stores/notificationStore', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
  useNotificationStore: vi.fn(() => ({ notifications: [], dismiss: vi.fn() })),
}))

vi.mock('@/shared/api/portfolio', () => ({
  portfolioApi: {
    createContactMessage: vi.fn().mockResolvedValue({ ok: true }),
  },
}))

import Contact from '@/features/portfolio/Contact'

function renderContact() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <Contact />
    </QueryClientProvider>
  )
}

describe('Contact', () => {
  it('renders "Get In Touch" heading', () => {
    renderContact()
    expect(screen.getByText(/Get In Touch/i)).toBeInTheDocument()
  })

  it('renders "Contact Information" subheading', () => {
    renderContact()
    expect(screen.getByText(/Contact Information/i)).toBeInTheDocument()
  })

  it('renders owner email', () => {
    renderContact()
    const emails = screen.getAllByText(/hoangan615@gmail\.com/i)
    expect(emails.length).toBeGreaterThan(0)
  })

  it('renders GitHub handle', () => {
    renderContact()
    expect(screen.getByText(/github\.com\/hoangan615/i)).toBeInTheDocument()
  })

  it('renders email input in contact form', () => {
    renderContact()
    expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument()
  })

  it('renders send message button', () => {
    renderContact()
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument()
  })

  it('renders inside a section element', () => {
    renderContact()
    expect(document.querySelector('section')).toBeInTheDocument()
  })
})
