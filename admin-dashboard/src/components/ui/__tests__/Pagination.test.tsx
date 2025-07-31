import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Pagination } from '../Pagination'

describe('Pagination Component', () => {
  const defaultProps = {
    currentPage: 1,
    totalPages: 10,
    onPageChange: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders pagination controls', () => {
    render(<Pagination {...defaultProps} />)
    
    expect(screen.getByLabelText(/previous page/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/next page/i)).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('disables previous button on first page', () => {
    render(<Pagination {...defaultProps} currentPage={1} />)
    
    const prevButton = screen.getByLabelText(/previous page/i)
    expect(prevButton).toBeDisabled()
  })

  it('disables next button on last page', () => {
    render(<Pagination {...defaultProps} currentPage={10} totalPages={10} />)
    
    const nextButton = screen.getByLabelText(/next page/i)
    expect(nextButton).toBeDisabled()
  })

  it('calls onPageChange when page number is clicked', () => {
    const onPageChange = vi.fn()
    render(<Pagination {...defaultProps} onPageChange={onPageChange} />)
    
    fireEvent.click(screen.getByText('2'))
    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it('calls onPageChange when next button is clicked', () => {
    const onPageChange = vi.fn()
    render(<Pagination {...defaultProps} currentPage={5} onPageChange={onPageChange} />)
    
    fireEvent.click(screen.getByLabelText(/next page/i))
    expect(onPageChange).toHaveBeenCalledWith(6)
  })

  it('calls onPageChange when previous button is clicked', () => {
    const onPageChange = vi.fn()
    render(<Pagination {...defaultProps} currentPage={5} onPageChange={onPageChange} />)
    
    fireEvent.click(screen.getByLabelText(/previous page/i))
    expect(onPageChange).toHaveBeenCalledWith(4)
  })

  it('shows ellipsis for large page counts', () => {
    render(<Pagination {...defaultProps} currentPage={5} totalPages={20} />)
    
    expect(screen.getByText('...')).toBeInTheDocument()
  })

  it('highlights current page', () => {
    render(<Pagination {...defaultProps} currentPage={3} />)
    
    const currentPageButton = screen.getByText('3')
    expect(currentPageButton).toHaveClass('bg-blue-600', 'text-white')
  })

  it('shows page info when showInfo is true', () => {
    render(
      <Pagination 
        {...defaultProps} 
        currentPage={3} 
        totalPages={10} 
        showInfo={true}
        totalItems={100}
        itemsPerPage={10}
      />
    )
    
    expect(screen.getByText(/showing 21 to 30 of 100 results/i)).toBeInTheDocument()
  })

  it('handles single page correctly', () => {
    render(<Pagination {...defaultProps} totalPages={1} />)
    
    expect(screen.getByLabelText(/previous page/i)).toBeDisabled()
    expect(screen.getByLabelText(/next page/i)).toBeDisabled()
  })
})