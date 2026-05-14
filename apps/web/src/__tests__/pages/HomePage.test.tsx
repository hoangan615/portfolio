import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'

// Mock all portfolio feature sections — HomePage is a composition-only page
vi.mock('@/features/portfolio/Hero', () => ({ default: () => <section data-testid="hero" /> }))
vi.mock('@/features/portfolio/About', () => ({ default: () => <section data-testid="about" /> }))
vi.mock('@/features/portfolio/Skills', () => ({ default: () => <section data-testid="skills" /> }))
vi.mock('@/features/portfolio/Experience', () => ({ default: () => <section data-testid="experience" /> }))
vi.mock('@/features/portfolio/Projects', () => ({ default: () => <section data-testid="projects" /> }))
vi.mock('@/features/portfolio/Contact', () => ({ default: () => <section data-testid="contact" /> }))

import HomePage from '@/pages/HomePage'

describe('HomePage', () => {
  it('renders all portfolio sections', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    )
    expect(screen.getByTestId('hero')).toBeInTheDocument()
    expect(screen.getByTestId('about')).toBeInTheDocument()
    expect(screen.getByTestId('skills')).toBeInTheDocument()
    expect(screen.getByTestId('experience')).toBeInTheDocument()
    expect(screen.getByTestId('projects')).toBeInTheDocument()
    expect(screen.getByTestId('contact')).toBeInTheDocument()
  })

  it('wraps everything in a main element', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    )
    expect(screen.getByRole('main')).toBeInTheDocument()
  })
})
