/**
 * Critical CSS Utilities
 * 
 * Utilities for managing critical CSS inlining and optimization
 */

// Critical CSS that should be inlined in the HTML head
export const CRITICAL_CSS = `
/* Critical CSS - Inlined for performance */

/* CSS Reset and Base Styles */
*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  font-family: 'Inter', system-ui, sans-serif;
  line-height: 1.5;
  -webkit-text-size-adjust: 100%;
  -moz-tab-size: 4;
  tab-size: 4;
}

body {
  margin: 0;
  font-family: inherit;
  line-height: inherit;
  background-color: #f9fafb;
  color: #111827;
  font-feature-settings: 'kern' 1;
  font-kerning: normal;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Critical Layout Utilities */
.container {
  width: 100%;
  margin-left: auto;
  margin-right: auto;
  padding-left: 1rem;
  padding-right: 1rem;
}

.flex { display: flex; }
.grid { display: grid; }
.block { display: block; }
.hidden { display: none; }
.relative { position: relative; }
.absolute { position: absolute; }
.fixed { position: fixed; }

/* Critical Spacing */
.p-4 { padding: 1rem; }
.p-6 { padding: 1.5rem; }
.m-0 { margin: 0; }
.mx-auto { margin-left: auto; margin-right: auto; }

/* Critical Typography */
.text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
.text-lg { font-size: 1.125rem; line-height: 1.75rem; }
.text-sm { font-size: 0.875rem; line-height: 1.25rem; }
.font-bold { font-weight: 700; }
.font-semibold { font-weight: 600; }
.font-medium { font-weight: 500; }

/* Critical Colors */
.text-gray-900 { color: #111827; }
.text-gray-600 { color: #4b5563; }
.bg-white { background-color: #ffffff; }
.bg-blue-600 { background-color: #2563eb; }

/* Critical Button Styles */
.btn-primary {
  background-color: #2563eb;
  color: white;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-primary:hover {
  background-color: #1d4ed8;
}

.btn-secondary {
  background-color: #e5e7eb;
  color: #111827;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-secondary:hover {
  background-color: #d1d5db;
}

/* Critical Card Styles */
.card {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
  padding: 1.5rem;
}

/* Critical Accessibility Styles */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.skip-link {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.skip-link:focus {
  position: absolute;
  top: 1rem;
  left: 1rem;
  background-color: #2563eb;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  z-index: 50;
  width: auto;
  height: auto;
  clip: auto;
  white-space: normal;
}

/* Critical Focus Styles */
.keyboard-navigation *:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Critical Loading States */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Critical Media Queries */
@media (min-width: 640px) {
  .container { max-width: 640px; }
}

@media (min-width: 768px) {
  .container { max-width: 768px; }
}

@media (min-width: 1024px) {
  .container { max-width: 1024px; }
}

/* Critical Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  
  .animate-pulse {
    animation: none;
  }
}

/* Critical High Contrast */
@media (prefers-contrast: high) {
  .card {
    border: 2px solid #111827;
  }
  
  .btn-primary {
    border: 2px solid white;
  }
  
  .btn-secondary {
    border: 2px solid #111827;
  }
}
`;

/**
 * Get critical CSS for inlining
 */
export function getCriticalCSS(): string {
  return CRITICAL_CSS.trim();
}

/**
 * Check if a CSS class should be considered critical
 */
export function isCriticalClass(className: string): boolean {
  const criticalPatterns = [
    // Layout
    /^(container|flex|grid|block|hidden|relative|absolute|fixed)$/,
    // Spacing (commonly used)
    /^[pm][xy]?-[0-9]+$/,
    // Typography (headers, common sizes)
    /^text-(3xl|2xl|xl|lg|base|sm)$/,
    /^font-(bold|semibold|medium)$/,
    // Colors (primary, common grays)
    /^(text|bg)-(gray|blue|white)(-50|-100|-600|-900)?$/,
    // Buttons
    /^btn-(primary|secondary)$/,
    // Cards
    /^card$/,
    // Accessibility
    /^(sr-only|skip-link|keyboard-navigation)$/,
    // Loading states
    /^animate-pulse$/,
  ];

  return criticalPatterns.some(pattern => pattern.test(className));
}

/**
 * Extract critical CSS from a full CSS string
 */
export function extractCriticalCSS(fullCSS: string): { critical: string; nonCritical: string } {
  const lines = fullCSS.split('\n');
  const criticalLines: string[] = [];
  const nonCriticalLines: string[] = [];
  
  let inCriticalRule = false;
  let braceCount = 0;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Check if this is a critical selector
    if (trimmedLine.includes('{')) {
      const selector = trimmedLine.split('{')[0].trim();
      inCriticalRule = isCriticalSelector(selector);
      braceCount = (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
    } else if (trimmedLine.includes('}')) {
      braceCount -= (line.match(/}/g) || []).length;
      if (braceCount <= 0) {
        inCriticalRule = false;
      }
    }
    
    if (inCriticalRule || isCriticalLine(trimmedLine)) {
      criticalLines.push(line);
    } else {
      nonCriticalLines.push(line);
    }
  }
  
  return {
    critical: criticalLines.join('\n'),
    nonCritical: nonCriticalLines.join('\n')
  };
}

/**
 * Check if a CSS selector should be considered critical
 */
function isCriticalSelector(selector: string): boolean {
  const criticalSelectors = [
    /^body\b/,
    /^html\b/,
    /^:root\b/,
    /^\*\b/,
    /^\.container\b/,
    /^\.btn-/,
    /^\.card\b/,
    /^\.sr-only\b/,
    /^\.skip-link\b/,
    /^@media.*prefers-reduced-motion/,
    /^@media.*prefers-contrast/,
    /^@keyframes\s+(pulse|spin)/,
  ];

  return criticalSelectors.some(pattern => pattern.test(selector));
}

/**
 * Check if a CSS line should be considered critical
 */
function isCriticalLine(line: string): boolean {
  const criticalPatterns = [
    /^@import/,
    /^@charset/,
    /^\/\*.*Critical.*\*\//,
    /^@media.*max-width:\s*639px/,
    /^@media.*min-width:\s*(640|768|1024)px/,
  ];

  return criticalPatterns.some(pattern => pattern.test(line));
}

/**
 * Generate inline critical CSS for HTML head
 */
export function generateInlineCriticalCSS(): string {
  return `<style id="critical-css">${getCriticalCSS()}</style>`;
}

/**
 * CSS optimization configuration
 */
export const CSS_OPTIMIZATION_CONFIG = {
  // Maximum size for critical CSS (in bytes)
  maxCriticalSize: 14 * 1024, // 14KB
  
  // Classes that should always be considered critical
  alwaysCritical: [
    'container',
    'flex',
    'grid',
    'block',
    'hidden',
    'sr-only',
    'skip-link',
    'btn-primary',
    'btn-secondary',
    'card',
    'animate-pulse'
  ],
  
  // Classes that should never be considered critical
  neverCritical: [
    'animate-spin',
    'animate-bounce',
    'print:hidden',
    'print:block',
    'dark:',
    'hover:',
    'focus:',
    'active:'
  ],
  
  // Media queries that should be in critical CSS
  criticalMediaQueries: [
    'prefers-reduced-motion',
    'prefers-contrast',
    'max-width: 639px',
    'min-width: 640px',
    'min-width: 768px',
    'min-width: 1024px'
  ]
};

export default {
  getCriticalCSS,
  isCriticalClass,
  extractCriticalCSS,
  generateInlineCriticalCSS,
  CSS_OPTIMIZATION_CONFIG
};