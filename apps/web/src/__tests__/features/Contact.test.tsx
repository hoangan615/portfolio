import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
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
import { toast } from '@/shared/stores/notificationStore'
import { portfolioApi } from '@/shared/api/portfolio'

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

  it('calls toast.success after successful form submission', async () => {
    renderContact()
    fireEvent.change(screen.getByRole('textbox', { name: /^name/i }), { target: { value: 'Jane Doe' } })
    fireEvent.change(screen.getByRole('textbox', { name: /email/i }), { target: { value: 'jane@example.com' } })
    fireEvent.change(screen.getByRole('textbox', { name: /message/i }), { target: { value: 'Hello, this is a test message longer than twenty chars.' } })
    fireEvent.click(screen.getByRole('button', { name: /send/i }))
    await waitFor(() => expect(toast.success).toHaveBeenCalled())
  })

  it('calls toast.error after failed form submission', async () => {
    vi.mocked(portfolioApi.createContactMessage).mockRejectedValueOnce(new Error('Network error'))
    renderContact()
    fireEvent.change(screen.getByRole('textbox', { name: /^name/i }), { target: { value: 'Jane Doe' } })
    fireEvent.change(screen.getByRole('textbox', { name: /email/i }), { target: { value: 'jane@example.com' } })
    fireEvent.change(screen.getByRole('textbox', { name: /message/i }), { target: { value: 'Hello, this is a test message longer than twenty chars.' } })
    fireEvent.click(screen.getByRole('button', { name: /send/i }))
    await waitFor(() => expect(toast.error).toHaveBeenCalled())
  })

  it('shows validation errors when required fields are empty', async () => {
    renderContact()
    fireEvent.click(screen.getByRole('button', { name: /send/i }))
    await waitFor(() => expect(screen.getByText(/Name is required/i)).toBeInTheDocument())
    expect(screen.getByText(/Email is required/i)).toBeInTheDocument()
    expect(screen.getByText(/Message is required/i)).toBeInTheDocument()
  })
})
