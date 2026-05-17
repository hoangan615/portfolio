import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import NotFoundPage from '@/pages/NotFoundPage'

function renderPage() {
  return render(
    <MemoryRouter>
      <NotFoundPage />
    </MemoryRouter>
  )
}

describe('NotFoundPage', () => {
  it('renders 404 heading', () => {
    renderPage()
    expect(screen.getByText('404')).toBeInTheDocument()
  })

  it('renders "Page Not Found" title', () => {
    renderPage()
    expect(screen.getByText('Page Not Found')).toBeInTheDocument()
  })

  it('renders descriptive message', () => {
    renderPage()
    expect(screen.getByText(/doesn't exist/i)).toBeInTheDocument()
  })

  it('renders a Home link pointing to /', () => {
    renderPage()
    const homeLink = screen.getByRole('link', { name: /home/i })
    expect(homeLink).toBeInTheDocument()
    expect(homeLink.getAttribute('href')).toBe('/')
  })

  it('renders a Go back button', () => {
    renderPage()
    expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument()
  })

  it('calls window.history.back when Go back is clicked', async () => {
    const backSpy = vi.spyOn(window.history, 'back').mockImplementation(() => {})
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: /go back/i }))
    expect(backSpy).toHaveBeenCalledOnce()
    backSpy.mockRestore()
  })
})
