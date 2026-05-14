import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import CVPage from '@/pages/CVPage'

// CVPage uses useEffect for document.title and window.print via Printer button.
// It is fully static (no API calls), so no mocking of apiClient needed.

function renderCVPage() {
  return render(
    <MemoryRouter>
      <CVPage />
    </MemoryRouter>
  )
}

describe('CVPage', () => {
  it('renders owner name', () => {
    renderCVPage()
    // The CV hardcodes "Võ Hoàng Ân" as the owner name
    expect(screen.getByText(/Võ Hoàng Ân/i)).toBeInTheDocument()
  })

  it('renders current role / company', () => {
    renderCVPage()
    // FPT Software appears in multiple places (role title + bio text)
    const matches = screen.getAllByText(/FPT Software/i)
    expect(matches.length).toBeGreaterThan(0)
  })

  it('renders contact email', () => {
    renderCVPage()
    expect(screen.getByText(/hoangan615@gmail\.com/i)).toBeInTheDocument()
  })

  it('renders GitHub handle', () => {
    renderCVPage()
    expect(screen.getByText(/github\.com\/hoangan615/i)).toBeInTheDocument()
  })

  it('renders experience section', () => {
    renderCVPage()
    // At least one Sub Project Lead entry expected
    const roles = screen.getAllByText(/Sub Project Lead/i)
    expect(roles.length).toBeGreaterThan(0)
  })

  it('renders skills section', () => {
    renderCVPage()
    // Section heading is "Technical Skills"
    expect(screen.getByText(/Technical Skills/i)).toBeInTheDocument()
  })

  it('has a print button', () => {
    renderCVPage()
    // Button text is "Save as PDF"
    const printBtn = screen.getByRole('button', { name: /save as pdf/i })
    expect(printBtn).toBeInTheDocument()
  })

  it('has a back link to home', () => {
    renderCVPage()
    const backLink = screen.getByRole('link', { name: /back/i })
    expect(backLink).toBeInTheDocument()
    expect(backLink.getAttribute('href')).toBe('/')
  })
})
