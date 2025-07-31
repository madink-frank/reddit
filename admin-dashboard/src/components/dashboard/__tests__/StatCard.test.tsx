import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { User } from 'lucide-react'
import { StatCard } from '../StatCard'

describe('StatCard Component', () => {
  const defaultProps = {
    title: 'Total Users',
    value: '1,234',
    icon: User,
  }

  it('renders with basic props', () => {
    render(<StatCard {...defaultProps} />)
    
    expect(screen.getByText('Total Users')).toBeInTheDocument()
    expect(screen.getByText('1,234')).toBeInTheDocument()
    // Icon is rendered as SVG with lucide classes
    expect(document.querySelector('.lucide')).toBeInTheDocument()
  })

  it('renders with change indicator', () => {
    render(
      <StatCard 
        {...defaultProps} 
        change={{ value: 12.5, type: 'increase' }}
      />
    )
    
    expect(screen.getByText('+12.5%')).toBeInTheDocument()
    // Updated to match new semantic color class
    expect(screen.getByText('+12.5%').closest('div')).toHaveClass('text-success')
  })

  it('renders with decrease change', () => {
    render(
      <StatCard 
        {...defaultProps} 
        change={{ value: 5.2, type: 'decrease' }}
      />
    )
    
    expect(screen.getByText('-5.2%')).toBeInTheDocument()
    // Updated to match new semantic color class
    expect(screen.getByText('-5.2%').closest('div')).toHaveClass('text-error')
  })

  it('renders with neutral change', () => {
    render(
      <StatCard 
        {...defaultProps} 
        change={{ value: 0, type: 'neutral' }}
      />
    )
    
    expect(screen.getByText('0%')).toBeInTheDocument()
    expect(screen.getByText('0%').closest('div')).toHaveClass('text-secondary')
  })

  it('renders with custom icon color', () => {
    render(
      <StatCard 
        {...defaultProps} 
        iconColor="text-red-500"
      />
    )
    
    const icon = document.querySelector('.lucide')
    expect(icon).toHaveClass('text-red-500')
  })

  it('renders loading state', () => {
    render(<StatCard {...defaultProps} loading={true} />)
    
    // Check for loading skeleton elements with new classes
    expect(document.querySelector('.animate-shimmer')).toBeInTheDocument()
    expect(document.querySelector('.skeleton')).toBeInTheDocument()
  })

  it('formats numeric values correctly', () => {
    render(<StatCard {...defaultProps} value={1234567} />)
    
    expect(screen.getByText('1,234,567')).toBeInTheDocument()
  })

  it('renders string values as-is', () => {
    render(<StatCard {...defaultProps} value="Active" />)
    
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('has proper structure and classes', () => {
    render(<StatCard {...defaultProps} />)
    
    // Updated to match new card class structure
    const card = screen.getByText('Total Users').closest('.card')
    expect(card).toHaveClass('card', 'hover-lift', 'gpu-accelerated', 'animate-fade-in-up')
  })

  it('renders with trend indicator', () => {
    render(<StatCard {...defaultProps} trend="up" />)
    
    expect(screen.getByText('Increasing')).toBeInTheDocument()
    expect(screen.getByText('Increasing')).toHaveClass('text-success')
  })

  it('has proper accessibility attributes', () => {
    render(<StatCard {...defaultProps} />)
    
    const card = screen.getByRole('article')
    expect(card).toHaveAttribute('aria-labelledby', 'stat-total-users')
    
    const title = screen.getByText('Total Users')
    expect(title).toHaveAttribute('id', 'stat-total-users')
  })

  it('includes screen reader text for change indicators', () => {
    render(
      <StatCard 
        {...defaultProps} 
        change={{ value: 12.5, type: 'increase' }}
      />
    )
    
    expect(screen.getByText('Increased by 12.5 percent')).toHaveClass('sr-only')
  })
})