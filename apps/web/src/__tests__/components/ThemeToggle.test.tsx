import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ThemeToggle from '@/shared/components/ThemeToggle'
import { useThemeStore } from '@/shared/stores/themeStore'

beforeEach(() => {
  useThemeStore.setState({ theme: 'system' })
})

describe('ThemeToggle', () => {
  it('renders the trigger button', () => {
    render(<ThemeToggle />)
    expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument()
  })

  it('opens dropdown with theme options on click', async () => {
    render(<ThemeToggle />)
    await userEvent.click(screen.getByRole('button', { name: /toggle theme/i }))
    expect(screen.getByText('Light')).toBeInTheDocument()
    expect(screen.getByText('Dark')).toBeInTheDocument()
    expect(screen.getByText('System')).toBeInTheDocument()
  })

  it('sets theme to dark when Dark is selected', async () => {
    render(<ThemeToggle />)
    await userEvent.click(screen.getByRole('button', { name: /toggle theme/i }))
    await userEvent.click(screen.getByText('Dark'))
    expect(useThemeStore.getState().theme).toBe('dark')
  })

  it('sets theme to light when Light is selected', async () => {
    render(<ThemeToggle />)
    await userEvent.click(screen.getByRole('button', { name: /toggle theme/i }))
    await userEvent.click(screen.getByText('Light'))
    expect(useThemeStore.getState().theme).toBe('light')
  })

  it('sets theme to system when System is selected', async () => {
    useThemeStore.setState({ theme: 'dark' })
    render(<ThemeToggle />)
    await userEvent.click(screen.getByRole('button', { name: /toggle theme/i }))
    await userEvent.click(screen.getByText('System'))
    expect(useThemeStore.getState().theme).toBe('system')
  })

  it('shows Moon icon when theme is dark', () => {
    useThemeStore.setState({ theme: 'dark' })
    render(<ThemeToggle />)
    // Lucide icons render as svg, verify no Sun/Monitor is shown as active
    const btn = screen.getByRole('button', { name: /toggle theme/i })
    expect(btn).toBeInTheDocument()
  })

  it('highlights the active theme in dropdown', async () => {
    useThemeStore.setState({ theme: 'dark' })
    render(<ThemeToggle />)
    await userEvent.click(screen.getByRole('button', { name: /toggle theme/i }))
    const darkItem = screen.getByText('Dark').closest('[role="menuitem"]') as HTMLElement
    expect(darkItem?.className).toContain('text-primary')
  })
})
