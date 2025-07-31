import React, { useState, useEffect } from 'react';
import { AccessibilityTester, ColorContrast } from '@/utils/accessibility';

interface AccessibilityIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  element?: HTMLElement;
  suggestion?: string;
}

const AccessibilityPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [issues, setIssues] = useState<AccessibilityIssue[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [colorContrastResults, setColorContrastResults] = useState<Array<{
    element: string;
    foreground: string;
    background: string;
    ratio: number;
    passes: boolean;
  }>>([]);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const runAccessibilityCheck = async () => {
    setIsScanning(true);
    const foundIssues: AccessibilityIssue[] = [];

    try {
      // Run basic accessibility checks
      const basicIssues = AccessibilityTester.runBasicChecks();
      basicIssues.forEach(issue => {
        foundIssues.push({
          type: 'error',
          message: issue,
          suggestion: getSuggestionForIssue(issue)
        });
      });

      // Check for heading hierarchy
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      let previousLevel = 0;
      headings.forEach((heading, index) => {
        const level = parseInt(heading.tagName.charAt(1));
        if (index === 0 && level !== 1) {
          foundIssues.push({
            type: 'warning',
            message: 'Page should start with an h1 heading',
            element: heading as HTMLElement,
            suggestion: 'Use h1 for the main page title'
          });
        } else if (level > previousLevel + 1) {
          foundIssues.push({
            type: 'warning',
            message: `Heading level jumps from h${previousLevel} to h${level}`,
            element: heading as HTMLElement,
            suggestion: 'Use sequential heading levels for proper hierarchy'
          });
        }
        previousLevel = level;
      });

      // Check for color contrast
      await checkColorContrast();

      // Check for keyboard navigation
      const focusableElements = document.querySelectorAll(
        'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      focusableElements.forEach(element => {
        const computedStyle = window.getComputedStyle(element as HTMLElement);
        if (computedStyle.outline === 'none' && !element.classList.contains('focus:outline-none')) {
          foundIssues.push({
            type: 'warning',
            message: 'Interactive element may not have visible focus indicator',
            element: element as HTMLElement,
            suggestion: 'Ensure focus indicators are visible for keyboard navigation'
          });
        }
      });

      // Check for ARIA labels on form inputs
      const inputs = document.querySelectorAll('input:not([type="hidden"]), select, textarea');
      inputs.forEach(input => {
        const hasLabel = input.getAttribute('aria-label') || 
                        input.getAttribute('aria-labelledby') ||
                        document.querySelector(`label[for="${input.id}"]`);
        
        if (!hasLabel) {
          foundIssues.push({
            type: 'error',
            message: 'Form input missing accessible label',
            element: input as HTMLElement,
            suggestion: 'Add aria-label, aria-labelledby, or associate with a label element'
          });
        }
      });

      // Check for alt text on images
      const images = document.querySelectorAll('img');
      images.forEach(img => {
        if (!img.hasAttribute('alt')) {
          foundIssues.push({
            type: 'error',
            message: 'Image missing alt attribute',
            element: img,
            suggestion: 'Add descriptive alt text or empty alt="" for decorative images'
          });
        } else if (img.alt === img.src || img.alt.includes('image') || img.alt.includes('photo')) {
          foundIssues.push({
            type: 'warning',
            message: 'Image alt text may not be descriptive enough',
            element: img,
            suggestion: 'Use descriptive alt text that explains the image content'
          });
        }
      });

      // Check for proper list structure
      const listItems = document.querySelectorAll('li');
      listItems.forEach(li => {
        const parent = li.parentElement;
        if (parent && !['UL', 'OL', 'MENU'].includes(parent.tagName)) {
          foundIssues.push({
            type: 'error',
            message: 'List item not contained in proper list element',
            element: li,
            suggestion: 'Wrap list items in ul, ol, or menu elements'
          });
        }
      });

      setIssues(foundIssues);
    } catch (error) {
      console.error('Error running accessibility check:', error);
      foundIssues.push({
        type: 'error',
        message: 'Error occurred during accessibility scan',
        suggestion: 'Check console for details'
      });
    } finally {
      setIsScanning(false);
    }
  };

  const checkColorContrast = async () => {
    const results: typeof colorContrastResults = [];
    
    // Check common text elements
    const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, a, button, span, div');
    
    textElements.forEach(element => {
      const computedStyle = window.getComputedStyle(element as HTMLElement);
      const color = computedStyle.color;
      const backgroundColor = computedStyle.backgroundColor;
      
      if (color && backgroundColor && backgroundColor !== 'rgba(0, 0, 0, 0)') {
        try {
          const ratio = ColorContrast.getContrastRatio(color, backgroundColor);
          const passes = ColorContrast.meetsWCAGAA(color, backgroundColor);
          
          results.push({
            element: element.tagName.toLowerCase(),
            foreground: color,
            background: backgroundColor,
            ratio: Math.round(ratio * 100) / 100,
            passes
          });
        } catch (error) {
          // Skip elements with invalid colors
        }
      }
    });
    
    setColorContrastResults(results.slice(0, 10)); // Limit to first 10 results
  };

  const getSuggestionForIssue = (issue: string): string => {
    if (issue.includes('images missing alt text')) {
      return 'Add descriptive alt attributes to images, or use alt="" for decorative images';
    }
    if (issue.includes('form inputs without labels')) {
      return 'Associate form inputs with labels using for/id attributes or aria-label';
    }
    if (issue.includes('buttons without accessible names')) {
      return 'Add text content or aria-label to buttons';
    }
    if (issue.includes('Page missing title')) {
      return 'Add a descriptive title element to the page';
    }
    if (issue.includes('Page missing main landmark')) {
      return 'Add a main element or role="main" to identify the main content area';
    }
    return 'Review accessibility guidelines for this issue';
  };

  const highlightElement = (element?: HTMLElement) => {
    if (!element) return;
    
    // Remove previous highlights
    document.querySelectorAll('.accessibility-highlight').forEach(el => {
      el.classList.remove('accessibility-highlight');
    });
    
    // Add highlight to current element
    element.classList.add('accessibility-highlight');
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Remove highlight after 3 seconds
    setTimeout(() => {
      element.classList.remove('accessibility-highlight');
    }, 3000);
  };

  useEffect(() => {
    // Add CSS for highlighting
    const style = document.createElement('style');
    style.textContent = `
      .accessibility-highlight {
        outline: 3px solid #ff6b6b !important;
        outline-offset: 2px !important;
        background-color: rgba(255, 107, 107, 0.1) !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 transition-colors"
        title="Accessibility Panel"
        aria-label="Toggle accessibility testing panel"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 7.5V9M15 10.5V19L13.5 17.5V10.5M10.5 12V19L9 17.5V12M4.5 10.5L9 12L10.5 10.5L6 9M15 7.5L9 12L15 10.5V7.5Z"/>
        </svg>
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-40 bg-white border border-gray-300 rounded-lg shadow-xl w-96 max-h-96 overflow-hidden">
          <div className="bg-purple-600 text-white p-3 flex justify-between items-center">
            <h3 className="font-semibold">Accessibility Testing</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200"
              aria-label="Close panel"
            >
              ×
            </button>
          </div>
          
          <div className="p-4 overflow-y-auto max-h-80">
            <div className="mb-4">
              <button
                onClick={runAccessibilityCheck}
                disabled={isScanning}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isScanning ? 'Scanning...' : 'Run Accessibility Check'}
              </button>
            </div>

            {issues.length > 0 && (
              <div className="mb-4">
                <h4 className="font-semibold mb-2 text-gray-800">
                  Issues Found ({issues.length})
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {issues.map((issue, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded text-sm cursor-pointer hover:bg-gray-50 ${
                        issue.type === 'error' ? 'border-l-4 border-red-500 bg-red-50' :
                        issue.type === 'warning' ? 'border-l-4 border-yellow-500 bg-yellow-50' :
                        'border-l-4 border-blue-500 bg-blue-50'
                      }`}
                      onClick={() => highlightElement(issue.element)}
                    >
                      <div className="font-medium">{issue.message}</div>
                      {issue.suggestion && (
                        <div className="text-gray-600 mt-1">{issue.suggestion}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {colorContrastResults.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 text-gray-800">
                  Color Contrast Results
                </h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {colorContrastResults.map((result, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded text-xs ${
                        result.passes ? 'bg-green-50 border-l-4 border-green-500' : 'bg-red-50 border-l-4 border-red-500'
                      }`}
                    >
                      <div className="font-medium">
                        {result.element}: {result.ratio}:1 {result.passes ? '✓' : '✗'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!isScanning && issues.length === 0 && (
              <div className="text-center text-gray-500 py-4">
                Click "Run Accessibility Check" to scan the page
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default AccessibilityPanel;