import React from 'react';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

interface SortOption {
  value: string;
  label: string;
}

interface PostSortingProps {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  className?: string;
}

const SORT_OPTIONS: SortOption[] = [
  { value: 'created_utc', label: 'Date Posted' },
  { value: 'score', label: 'Score' },
  { value: 'num_comments', label: 'Comments' },
  { value: 'crawled_at', label: 'Date Crawled' }
];

export const PostSorting: React.FC<PostSortingProps> = ({
  sortBy,
  sortOrder,
  onSortChange,
  className = ''
}) => {
  const handleSortByChange = (value: string | number | (string | number)[]) => {
    if (typeof value === 'string') {
      onSortChange(value, sortOrder);
    }
  };

  const toggleSortOrder = () => {
    onSortChange(sortBy, sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const getSortLabel = () => {
    const option = SORT_OPTIONS.find(opt => opt.value === sortBy);
    return option?.label || 'Date Posted';
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <span className="text-sm font-medium text-gray-700">Sort by:</span>
      
      <div className="flex items-center space-x-2">
        <Select
          value={sortBy}
          onChange={handleSortByChange}
          className="min-w-[140px]"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        
        <Button
          variant="outline"
          size="sm"
          onClick={toggleSortOrder}
          className="px-2"
          title={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
        >
          {sortOrder === 'asc' ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          )}
        </Button>
      </div>
      
      <span className="text-sm text-gray-500">
        ({getSortLabel()} - {sortOrder === 'asc' ? 'Ascending' : 'Descending'})
      </span>
    </div>
  );
};