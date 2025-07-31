import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';

export interface SearchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'size'> {
  onSearch?: (query: string) => void;
  onChange?: (query: string) => void;
  onClear?: () => void;
  loading?: boolean;
  suggestions?: string[];
  onSuggestionSelect?: (suggestion: string) => void;
  showSuggestions?: boolean;
  debounceMs?: number;
  clearable?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const searchSizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-5 py-3 text-lg',
};

export const Search = React.forwardRef<HTMLInputElement, SearchProps>(
  ({
    className,
    onSearch,
    onChange,
    onClear,
    loading = false,
    suggestions = [],
    onSuggestionSelect,
    showSuggestions = true,
    debounceMs = 300,
    clearable = true,
    size = 'md',
    placeholder = 'Search...',
    value: controlledValue,
    defaultValue,
    ...props
  }, ref) => {
    const [internalValue, setInternalValue] = useState(defaultValue || '');
    const [showSuggestionsList, setShowSuggestionsList] = useState(false);
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
    
    const inputRef = useRef<HTMLInputElement>(null);
    const suggestionsRef = useRef<HTMLUListElement>(null);
    const debounceRef = useRef<NodeJS.Timeout>();
    
    // Use controlled or uncontrolled value
    const value = controlledValue !== undefined ? controlledValue : internalValue;
    const hasValue = value && String(value).length > 0;
    
    // Combine refs
    React.useImperativeHandle(ref, () => inputRef.current!);
    
    // Debounced search
    useEffect(() => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      
      if (onChange || onSearch) {
        debounceRef.current = setTimeout(() => {
          onChange?.(value as string);
          if (onSearch && value) {
            onSearch(value as string);
          }
        }, debounceMs);
      }
      
      return () => {
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }
      };
    }, [value, onChange, onSearch, debounceMs]);
    
    // Handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      
      if (controlledValue === undefined) {
        setInternalValue(newValue);
      }
      
      setActiveSuggestionIndex(-1);
      setShowSuggestionsList(newValue.length > 0 && suggestions.length > 0);
    };
    
    // Handle clear
    const handleClear = () => {
      const newValue = '';
      
      if (controlledValue === undefined) {
        setInternalValue(newValue);
      }
      
      setShowSuggestionsList(false);
      setActiveSuggestionIndex(-1);
      onClear?.();
      inputRef.current?.focus();
    };
    
    // Handle suggestion selection
    const handleSuggestionSelect = (suggestion: string) => {
      if (controlledValue === undefined) {
        setInternalValue(suggestion);
      }
      
      setShowSuggestionsList(false);
      setActiveSuggestionIndex(-1);
      onSuggestionSelect?.(suggestion);
      inputRef.current?.focus();
    };
    
    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!showSuggestionsList || suggestions.length === 0) {
        if (e.key === 'Enter' && onSearch && value) {
          onSearch(value as string);
        }
        return;
      }
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveSuggestionIndex(prev => 
            prev < suggestions.length - 1 ? prev + 1 : 0
          );
          break;
          
        case 'ArrowUp':
          e.preventDefault();
          setActiveSuggestionIndex(prev => 
            prev > 0 ? prev - 1 : suggestions.length - 1
          );
          break;
          
        case 'Enter':
          e.preventDefault();
          if (activeSuggestionIndex >= 0 && suggestions[activeSuggestionIndex]) {
            handleSuggestionSelect(suggestions[activeSuggestionIndex]);
          } else if (onSearch && value) {
            onSearch(value as string);
            setShowSuggestionsList(false);
          }
          break;
          
        case 'Escape':
          setShowSuggestionsList(false);
          setActiveSuggestionIndex(-1);
          inputRef.current?.blur();
          break;
      }
    };
    
    // Handle click outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          inputRef.current &&
          !inputRef.current.contains(event.target as Node) &&
          suggestionsRef.current &&
          !suggestionsRef.current.contains(event.target as Node)
        ) {
          setShowSuggestionsList(false);
          setActiveSuggestionIndex(-1);
        }
      };
      
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    return (
      <div className="relative">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {loading ? (
              <svg
                className="animate-spin h-4 w-4 text-neutral-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <svg
                className="h-4 w-4 text-neutral-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            )}
          </div>
          
          <input
            ref={inputRef}
            type="text"
            className={cn(
              // Base styles
              'block w-full pl-10 border border-default rounded-lg bg-surface text-primary placeholder-tertiary transition-default',
              'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500',
              'dark:focus:ring-brand-400 dark:focus:border-brand-400',
              // Size styles
              searchSizes[size],
              // Clear button spacing
              clearable && hasValue && 'pr-10',
              // Custom className
              className
            )}
            placeholder={placeholder}
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (value && suggestions.length > 0 && showSuggestions) {
                setShowSuggestionsList(true);
              }
            }}
            aria-expanded={showSuggestionsList}
            aria-haspopup="listbox"
            aria-autocomplete="list"
            role="combobox"
            {...props}
          />
          
          {clearable && hasValue && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <button
                type="button"
                onClick={handleClear}
                className="text-neutral-400 hover:text-neutral-600 focus:outline-none focus:text-neutral-600 transition-colors"
                aria-label="Clear search"
              >
                <svg
                  className="h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
        
        {/* Suggestions dropdown */}
        {showSuggestionsList && showSuggestions && suggestions.length > 0 && (
          <ul
            ref={suggestionsRef}
            className="absolute z-50 w-full mt-1 bg-surface border border-default rounded-lg shadow-lg max-h-60 overflow-auto"
            role="listbox"
          >
            {suggestions.map((suggestion, index) => (
              <li
                key={suggestion}
                className={cn(
                  'px-4 py-2 cursor-pointer transition-colors',
                  'hover:bg-background-secondary',
                  index === activeSuggestionIndex && 'bg-background-secondary',
                  index === 0 && 'rounded-t-lg',
                  index === suggestions.length - 1 && 'rounded-b-lg'
                )}
                onClick={() => handleSuggestionSelect(suggestion)}
                role="option"
                aria-selected={index === activeSuggestionIndex}
              >
                <span className="block text-primary">{suggestion}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }
);

Search.displayName = 'Search';