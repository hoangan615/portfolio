import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Modal from '@/shared/components/Modal'

function renderModal(props: Partial<Parameters<typeof Modal>[0]> = {}) {
  const defaults = {
    open: true,
    onOpenChange: vi.fn(),
    children: <p>Modal body</p>,
  }
  return render(<Modal {...defaults} {...props} />)
}

describe('Modal', () => {
  it('renders children when open', () => {
    renderModal()
    expect(screen.getByText('Modal body')).toBeInTheDocument()
  })

  it('does not render content when closed', () => {
    renderModal({ open: false })
    expect(screen.queryByText('Modal body')).not.toBeInTheDocument()
  })

  it('renders title when provided', () => {
    renderModal({ title: 'My Title' })
    expect(screen.getByText('My Title')).toBeInTheDocument()
  })

  it('renders description when provided', () => {
    renderModal({ description: 'My description' })
    expect(screen.getByText('My description')).toBeInTheDocument()
  })

  it('renders both title and description together', () => {
    renderModal({ title: 'Title', description: 'Description' })
    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(screen.getByText('Description')).toBeInTheDocument()
  })

  it('shows close button by default', () => {
    renderModal()
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument()
  })

  it('hides close button when preventClose=true', () => {
    renderModal({ preventClose: true })
    expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument()
  })

  it('calls onOpenChange(false) when close button is clicked', async () => {
    const onOpenChange = vi.fn()
    renderModal({ onOpenChange })
    await userEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('applies custom className to content', () => {
    renderModal({ className: 'max-w-lg' })
    // The dialog content should have the custom class
    const content = document.querySelector('[role="dialog"]')
    expect(content?.className).toContain('max-w-lg')
  })
})
