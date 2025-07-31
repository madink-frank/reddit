import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Modal } from '../Modal'

describe('Modal Component', () => {
  it('renders when open', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    )
    
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Test Modal')).toBeInTheDocument()
    expect(screen.getByText('Modal content')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(
      <Modal isOpen={false} onClose={vi.fn()} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    )
    
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(
      <Modal isOpen={true} onClose={onClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    )
    
    fireEvent.click(screen.getByLabelText(/close modal/i))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when overlay is clicked', () => {
    const onClose = vi.fn()
    render(
      <Modal isOpen={true} onClose={onClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    )
    
    // Click on the overlay (backdrop) - find by class since it's the backdrop div
    const backdrop = document.querySelector('.bg-gray-500.bg-opacity-75')
    fireEvent.click(backdrop!)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not close when modal content is clicked', () => {
    const onClose = vi.fn()
    render(
      <Modal isOpen={true} onClose={onClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    )
    
    fireEvent.click(screen.getByText('Modal content'))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('has proper accessibility attributes', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    )
    
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title')
  })

  it('renders with different sizes', () => {
    const { rerender } = render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test Modal" size="sm">
        <p>Small modal</p>
      </Modal>
    )
    
    expect(screen.getByRole('dialog')).toHaveClass('max-w-md')
    
    rerender(
      <Modal isOpen={true} onClose={vi.fn()} title="Test Modal" size="xl">
        <p>Extra large modal</p>
      </Modal>
    )
    
    expect(screen.getByRole('dialog')).toHaveClass('max-w-4xl')
  })

  it('renders content correctly', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
        <div data-testid="modal-content">Modal content</div>
      </Modal>
    )
    
    expect(screen.getByTestId('modal-content')).toBeInTheDocument()
  })

  it('renders with correct size classes', () => {
    const { rerender } = render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test Modal" size="sm">
        <p>Small modal</p>
      </Modal>
    )
    
    expect(screen.getByRole('dialog')).toHaveClass('max-w-md')
    
    rerender(
      <Modal isOpen={true} onClose={vi.fn()} title="Test Modal" size="lg">
        <p>Large modal</p>
      </Modal>
    )
    
    expect(screen.getByRole('dialog')).toHaveClass('max-w-2xl')
  })
})