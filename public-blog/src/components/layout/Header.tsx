import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { IconButton } from '../ui/Button';
import { Search } from '../ui/Search';
import { useTheme } from '../../hooks/useTheme';

export interface HeaderProps {
  className?: string;
  onSearch?: ((query: string) => void) | undefined;
  searchPlaceholder?: string;
  showSearch?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  className,
  onSearch,
  searchPlaceholder = 'Search articles...',
  showSearch = true,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Blog', href: '/blog' },
    { name: 'Categories', href: '/categories' },
    { name: 'About', href: '/about' },
  ];

  return (
    <header className={cn('bg-surface border-b border-default sticky top-0 z-40', className)}>
      <div className="container-blog">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link
              to="/"
              className="flex items-center space-x-2 text-xl font-bold text-primary hover:text-brand-primary transition-colors focus-ring rounded-md"
            >
              <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">R</span>
              </div>
              <span>Reddit Insights</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="text-secondary hover:text-primary transition-colors font-medium focus-ring rounded-md px-2 py-1"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Search Bar (Desktop) */}
          {showSearch && (
            <div className="hidden md:block flex-1 max-w-md mx-8">
              <Search
                placeholder={searchPlaceholder}
                {...(onSearch && { onSearch })}
                size="sm"
              />
            </div>
          )}

          {/* Right Side Actions */}
          <div className="flex items-center space-x-2">
            {/* Theme Toggle */}
            <IconButton
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
              icon={
                theme === 'dark' ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                  </svg>
                )
              }
            />

            {/* Mobile Menu Button */}
            <IconButton
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle mobile menu"
              aria-expanded={isMobileMenuOpen}
              icon={
                isMobileMenuOpen ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )
              }
            />
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-default">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {/* Mobile Search */}
              {showSearch && (
                <div className="px-3 py-2">
                  <Search
                    placeholder={searchPlaceholder}
                    {...(onSearch && { onSearch })}
                    size="sm"
                  />
                </div>
              )}

              {/* Mobile Navigation */}
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="block px-3 py-2 text-base font-medium text-secondary hover:text-primary hover:bg-background-secondary rounded-md transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

// Skip Link for accessibility
export const SkipLink: React.FC = () => {
  return (
    <a
      href="#main-content"
      className="skip-link"
    >
      Skip to main content
    </a>
  );
};