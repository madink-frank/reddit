import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Input } from '../Input'

describe('Input Component', () => {
  it('renders with basic props', () => {
    render(<Input placeholder="Enter text" />)
    const input = screen.getByPlaceholderText('Enter text')
    expect(input).toBeInTheDocument()
    expect(input).toHaveClass('border-gray-300')
  })

  it('renders with label', () => {
    render(<Input label="Username" placeholder="Enter username" />)
    expect(screen.getByLabelText('Username')).toBeInTheDocument()
    expect(screen.getByText('Username')).toBeInTheDocument()
  })

  it('shows error state', () => {
    render(<Input error="This field is required" />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('border-red-500')
    expect(screen.getByText('This field is required')).toBeInTheDocument()
  })

  it('handles disabled state', () => {
    render(<Input disabled placeholder="Disabled input" />)
    const input = screen.getByPlaceholderText('Disabled input')
    expect(input).toBeDisabled()
    expect(input).toHaveClass('bg-gray-100')
  })

  it('handles different input types', () => {
    const { rerender } = render(<Input type="email" />)
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email')

    rerender(<Input type="password" />)
    expect(screen.getByLabelText(/password/i)).toHaveAttribute('type', 'password')

    rerender(<Input type="number" />)
    expect(screen.getByRole('spinbutton')).toHaveAttribute('type', 'number')
  })

  it('handles value changes', () => {
    const onChange = vi.fn()
    render(<Input onChange={onChange} />)
    
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'test value' } })
    
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
      target: expect.objectContaining({ value: 'test value' })
    }))
  })

  it('handles focus and blur events', () => {
    const onFocus = vi.fn()
    const onBlur = vi.fn()
    render(<Input onFocus={onFocus} onBlur={onBlur} />)
    
    const input = screen.getByRole('textbox')
    fireEvent.focus(input)
    expect(onFocus).toHaveBeenCalledTimes(1)
    
    fireEvent.blur(input)
    expect(onBlur).toHaveBeenCalledTimes(1)
  })

  it('renders with different sizes', () => {
    const { rerender } = render(<Input size="sm" />)
    expect(screen.getByRole('textbox')).toHaveClass('px-3', 'py-1.5', 'text-sm')

    rerender(<Input size="lg" />)
    expect(screen.getByRole('textbox')).toHaveClass('px-4', 'py-3', 'text-lg')
  })

  it('renders with icon', () => {
    const Icon = () => <svg data-testid="test-icon" />
    render(<Input icon={<Icon />} />)
    expect(screen.getByTestId('test-icon')).toBeInTheDocument()
  })

  it('forwards ref correctly', () => {
    const ref = vi.fn()
    render(<Input ref={ref} />)
    expect(ref).toHaveBeenCalled()
  })

  it('applies custom className', () => {
    render(<Input className="custom-input" />)
    expect(screen.getByRole('textbox')).toHaveClass('custom-input')
  })
})