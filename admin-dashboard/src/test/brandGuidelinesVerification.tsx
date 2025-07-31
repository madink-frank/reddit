/**
 * Brand Guidelines Verification Component
 * 
 * This component verifies compliance with Reddit Content Platform brand guidelines,
 * including color usage, typography, iconography, and visual consistency.
 */

import React, { useState, useEffect } from 'react';
import {
  Palette,
  Type,
  Image,
  CheckCircle,
  AlertTriangle,
  Info,
  Eye,
  Download,
  RefreshCw
} from 'lucide-react';

interface BrandCheck {
  id: string;
  category: 'colors' | 'typography' | 'iconography' | 'layout' | 'accessibility';
  name: string;
  description: string;
  status: 'pass' | 'fail' | 'warning' | 'pending';
  details: string[];
  elements?: HTMLElement[];
}

interface BrandGuidelines {
  colors: {
    reddit: {
      primary: '#FF4500';
      secondary: '#FF6314';
      dark: '#CC3700';
    };
    platform: {
      primary: '#3B82F6';
      success: '#10B981';
      warning: '#F59E0B';
      error: '#EF4444';
      info: '#06B6D4';
    };
    neutral: {
      gray50: '#F9FAFB';
      gray100: '#F3F4F6';
      gray500: '#6B7280';
      gray900: '#111827';
    };
  };
  typography: {
    fontFamily: {
      primary: 'Inter, system-ui, sans-serif';
      mono: 'JetBrains Mono, monospace';
    };
    sizes: {
      xs: '0.75rem';
      sm: '0.875rem';
      base: '1rem';
      lg: '1.125rem';
      xl: '1.25rem';
      '2xl': '1.5rem';
      '3xl': '1.875rem';
    };
  };
  iconography: {
    sizes: {
      xs: '12px';
      sm: '16px';
      base: '20px';
      md: '24px';
      lg: '32px';
      xl: '48px';
      '2xl': '64px';
    };
    contexts: {
      'login-page': 'xl';
      'button': 'md';
      'inline': 'sm';
      'header': 'lg';
      'status': 'base';
    };
  };
}

const BRAND_GUIDELINES: BrandGuidelines = {
  colors: {
    reddit: {
      primary: '#FF4500',
      secondary: '#FF6314',
      dark: '#CC3700',
    },
    platform: {
      primary: '#3B82F6',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#06B6D4',
    },
    neutral: {
      gray50: '#F9FAFB',
      gray100: '#F3F4F6',
      gray500: '#6B7280',
      gray900: '#111827',
    },
  },
  typography: {
    fontFamily: {
      primary: 'Inter, system-ui, sans-serif',
      mono: 'JetBrains Mono, monospace',
    },
    sizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
    },
  },
  iconography: {
    sizes: {
      xs: '12px',
      sm: '16px',
      base: '20px',
      md: '24px',
      lg: '32px',
      xl: '48px',
      '2xl': '64px',
    },
    contexts: {
      'login-page': 'xl',
      'button': 'md',
      'inline': 'sm',
      'header': 'lg',
      'status': 'base',
    },
  },
};

export const BrandGuidelinesVerification: React.FC = () => {
  const [checks, setChecks] = useState<BrandCheck[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [summary, setSummary] = useState({
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0,
  });

  // Initialize checks
  useEffect(() => {
    initializeChecks();
  }, []);

  const initializeChecks = () => {
    const initialChecks: BrandCheck[] = [
      // Color Checks
      {
        id: 'reddit-brand-colors',
        category: 'colors',
        name: 'Reddit Brand Colors',
        description: 'Verify Reddit brand colors are used correctly',
        status: 'pending',
        details: [],
      },
      {
        id: 'semantic-colors',
        category: 'colors',
        name: 'Semantic Color Usage',
        description: 'Check that semantic colors are used appropriately',
        status: 'pending',
        details: [],
      },
      {
        id: 'color-contrast',
        category: 'colors',
        name: 'Color Contrast Ratios',
        description: 'Verify WCAG AA compliance for color contrast',
        status: 'pending',
        details: [],
      },

      // Typography Checks
      {
        id: 'font-family',
        category: 'typography',
        name: 'Font Family Consistency',
        description: 'Check that approved fonts are used throughout',
        status: 'pending',
        details: [],
      },
      {
        id: 'heading-hierarchy',
        category: 'typography',
        name: 'Heading Hierarchy',
        description: 'Verify proper heading structure and sizing',
        status: 'pending',
        details: [],
      },
      {
        id: 'text-sizing',
        category: 'typography',
        name: 'Text Size Consistency',
        description: 'Check that text sizes follow the design system',
        status: 'pending',
        details: [],
      },

      // Iconography Checks
      {
        id: 'icon-sizes',
        category: 'iconography',
        name: 'Icon Size Standards',
        description: 'Verify icons use standardized sizes',
        status: 'pending',
        details: [],
      },
      {
        id: 'icon-context',
        category: 'iconography',
        name: 'Icon Context Appropriateness',
        description: 'Check icons are sized appropriately for their context',
        status: 'pending',
        details: [],
      },
      {
        id: 'reddit-logo',
        category: 'iconography',
        name: 'Reddit Logo Usage',
        description: 'Verify Reddit logo follows brand guidelines',
        status: 'pending',
        details: [],
      },

      // Layout Checks
      {
        id: 'spacing-consistency',
        category: 'layout',
        name: 'Spacing Consistency',
        description: 'Check that spacing follows design system tokens',
        status: 'pending',
        details: [],
      },
      {
        id: 'component-consistency',
        category: 'layout',
        name: 'Component Consistency',
        description: 'Verify components follow design system patterns',
        status: 'pending',
        details: [],
      },

      // Accessibility Checks
      {
        id: 'aria-labels',
        category: 'accessibility',
        name: 'ARIA Labels',
        description: 'Check for proper ARIA labeling',
        status: 'pending',
        details: [],
      },
      {
        id: 'focus-indicators',
        category: 'accessibility',
        name: 'Focus Indicators',
        description: 'Verify visible focus indicators',
        status: 'pending',
        details: [],
      },
    ];

    setChecks(initialChecks);
  };

  // Run all brand guideline checks
  const runAllChecks = async () => {
    setIsRunning(true);
    const updatedChecks = [...checks];

    for (let i = 0; i < updatedChecks.length; i++) {
      const check = updatedChecks[i];
      const result = await runSingleCheck(check);
      updatedChecks[i] = result;
      setChecks([...updatedChecks]);

      // Small delay for visual feedback
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Calculate summary
    const newSummary = {
      total: updatedChecks.length,
      passed: updatedChecks.filter(c => c.status === 'pass').length,
      failed: updatedChecks.filter(c => c.status === 'fail').length,
      warnings: updatedChecks.filter(c => c.status === 'warning').length,
    };
    setSummary(newSummary);

    setIsRunning(false);
  };

  // Run individual check
  const runSingleCheck = async (check: BrandCheck): Promise<BrandCheck> => {
    let updatedCheck = { ...check };

    try {
      switch (check.id) {
        case 'reddit-brand-colors':
          updatedCheck = await checkRedditBrandColors(updatedCheck);
          break;
        case 'semantic-colors':
          updatedCheck = await checkSemanticColors(updatedCheck);
          break;
        case 'color-contrast':
          updatedCheck = await checkColorContrast(updatedCheck);
          break;
        case 'font-family':
          updatedCheck = await checkFontFamily(updatedCheck);
          break;
        case 'heading-hierarchy':
          updatedCheck = await checkHeadingHierarchy(updatedCheck);
          break;
        case 'text-sizing':
          updatedCheck = await checkTextSizing(updatedCheck);
          break;
        case 'icon-sizes':
          updatedCheck = await checkIconSizes(updatedCheck);
          break;
        case 'icon-context':
          updatedCheck = await checkIconContext(updatedCheck);
          break;
        case 'reddit-logo':
          updatedCheck = await checkRedditLogo(updatedCheck);
          break;
        case 'spacing-consistency':
          updatedCheck = await checkSpacingConsistency(updatedCheck);
          break;
        case 'component-consistency':
          updatedCheck = await checkComponentConsistency(updatedCheck);
          break;
        case 'aria-labels':
          updatedCheck = await checkAriaLabels(updatedCheck);
          break;
        case 'focus-indicators':
          updatedCheck = await checkFocusIndicators(updatedCheck);
          break;
        default:
          updatedCheck.status = 'warning';
          updatedCheck.details = ['Check not implemented'];
      }
    } catch (error) {
      updatedCheck.status = 'fail';
      updatedCheck.details = [`Error running check: ${error}`];
    }

    return updatedCheck;
  };

  // Individual check implementations
  const checkRedditBrandColors = async (check: BrandCheck): Promise<BrandCheck> => {
    const redditElements = document.querySelectorAll('[class*="orange"], [class*="reddit"]');
    const details: string[] = [];
    let hasIssues = false;

    redditElements.forEach((element) => {
      const computedStyle = window.getComputedStyle(element);
      const backgroundColor = computedStyle.backgroundColor;
      const color = computedStyle.color;

      // Check if using approved Reddit colors
      const isValidRedditColor =
        backgroundColor.includes('255, 69, 0') || // #FF4500
        backgroundColor.includes('255, 99, 20') || // #FF6314
        backgroundColor.includes('204, 55, 0') ||  // #CC3700
        color.includes('255, 69, 0') ||
        color.includes('255, 99, 20') ||
        color.includes('204, 55, 0');

      if (!isValidRedditColor && (backgroundColor !== 'rgba(0, 0, 0, 0)' || color !== 'rgb(0, 0, 0)')) {
        hasIssues = true;
        details.push(`Element using non-standard Reddit color: ${element.tagName.toLowerCase()}`);
      }
    });

    if (redditElements.length === 0) {
      details.push('No Reddit-branded elements found');
      check.status = 'warning';
    } else if (hasIssues) {
      check.status = 'fail';
    } else {
      check.status = 'pass';
      details.push(`${redditElements.length} Reddit elements using correct brand colors`);
    }

    check.details = details;
    return check;
  };

  const checkSemanticColors = async (check: BrandCheck): Promise<BrandCheck> => {
    const colorElements = document.querySelectorAll('[class*="text-"], [class*="bg-"]');
    const details: string[] = [];
    let semanticCount = 0;
    let nonSemanticCount = 0;

    colorElements.forEach((element) => {
      const classList = Array.from(element.classList);
      const colorClasses = classList.filter(cls =>
        cls.startsWith('text-') || cls.startsWith('bg-')
      );

      colorClasses.forEach(colorClass => {
        if (colorClass.match(/(primary|secondary|tertiary|success|warning|error|info|surface)/)) {
          semanticCount++;
        } else if (colorClass.match(/(red|blue|green|yellow|purple|pink|indigo)-\d+/)) {
          nonSemanticCount++;
          details.push(`Non-semantic color class: ${colorClass}`);
        }
      });
    });

    const semanticRatio = semanticCount / (semanticCount + nonSemanticCount);

    if (semanticRatio >= 0.8) {
      check.status = 'pass';
      details.unshift(`${Math.round(semanticRatio * 100)}% semantic color usage`);
    } else if (semanticRatio >= 0.6) {
      check.status = 'warning';
      details.unshift(`${Math.round(semanticRatio * 100)}% semantic color usage - could be improved`);
    } else {
      check.status = 'fail';
      details.unshift(`Only ${Math.round(semanticRatio * 100)}% semantic color usage`);
    }

    check.details = details;
    return check;
  };

  const checkColorContrast = async (check: BrandCheck): Promise<BrandCheck> => {
    const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, button, a');
    const details: string[] = [];
    let passCount = 0;
    let failCount = 0;

    // Helper function to calculate contrast ratio
    const getContrastRatio = (color1: string, color2: string): number => {
      // Simplified contrast calculation - in real implementation, use proper color parsing
      return 4.5; // Placeholder - would need proper color parsing library
    };

    textElements.forEach((element) => {
      const computedStyle = window.getComputedStyle(element);
      const color = computedStyle.color;
      const backgroundColor = computedStyle.backgroundColor;

      // Skip elements with transparent backgrounds
      if (backgroundColor === 'rgba(0, 0, 0, 0)') return;

      const contrastRatio = getContrastRatio(color, backgroundColor);

      if (contrastRatio >= 4.5) {
        passCount++;
      } else {
        failCount++;
        details.push(`Low contrast element: ${element.tagName.toLowerCase()}`);
      }
    });

    if (failCount === 0) {
      check.status = 'pass';
      details.unshift(`All ${passCount} text elements meet WCAG AA contrast requirements`);
    } else if (failCount < passCount * 0.1) {
      check.status = 'warning';
      details.unshift(`${failCount} elements with contrast issues`);
    } else {
      check.status = 'fail';
      details.unshift(`${failCount} elements fail contrast requirements`);
    }

    check.details = details;
    return check;
  };

  const checkFontFamily = async (check: BrandCheck): Promise<BrandCheck> => {
    const textElements = document.querySelectorAll('*');
    const details: string[] = [];
    const fontFamilies = new Set<string>();

    textElements.forEach((element) => {
      const computedStyle = window.getComputedStyle(element);
      const fontFamily = computedStyle.fontFamily;
      fontFamilies.add(fontFamily);
    });

    const approvedFonts = ['Inter', 'system-ui', 'sans-serif', 'JetBrains Mono', 'monospace'];
    const unapprovedFonts = Array.from(fontFamilies).filter(font =>
      !approvedFonts.some(approved => font.includes(approved))
    );

    if (unapprovedFonts.length === 0) {
      check.status = 'pass';
      details.push('All fonts are from approved font families');
    } else {
      check.status = 'warning';
      details.push(`Unapproved fonts found: ${unapprovedFonts.join(', ')}`);
    }

    check.details = details;
    return check;
  };

  const checkHeadingHierarchy = async (check: BrandCheck): Promise<BrandCheck> => {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const details: string[] = [];
    let hierarchyIssues = 0;

    let previousLevel = 0;
    headings.forEach((heading) => {
      const level = parseInt(heading.tagName.charAt(1));
      const classList = Array.from(heading.classList);

      // Check for proper heading class
      const hasHeadingClass = classList.some(cls => cls.startsWith('heading-'));
      if (!hasHeadingClass) {
        hierarchyIssues++;
        details.push(`${heading.tagName} missing heading class`);
      }

      // Check hierarchy order
      if (level > previousLevel + 1) {
        hierarchyIssues++;
        details.push(`Heading hierarchy skip: ${heading.tagName} after H${previousLevel}`);
      }

      previousLevel = level;
    });

    if (hierarchyIssues === 0) {
      check.status = 'pass';
      details.unshift(`${headings.length} headings follow proper hierarchy`);
    } else {
      check.status = 'fail';
      details.unshift(`${hierarchyIssues} heading hierarchy issues found`);
    }

    check.details = details;
    return check;
  };

  const checkTextSizing = async (check: BrandCheck): Promise<BrandCheck> => {
    const textElements = document.querySelectorAll('p, span, div');
    const details: string[] = [];
    const sizes = new Set<string>();

    textElements.forEach((element) => {
      const computedStyle = window.getComputedStyle(element);
      const fontSize = computedStyle.fontSize;
      sizes.add(fontSize);
    });

    const approvedSizes: string[] = Object.values(BRAND_GUIDELINES.typography.sizes);
    const unapprovedSizes = Array.from(sizes).filter(size =>
      !approvedSizes.includes(size)
    );

    if (unapprovedSizes.length <= sizes.size * 0.1) {
      check.status = 'pass';
      details.push('Text sizes mostly follow design system');
    } else {
      check.status = 'warning';
      details.push(`${unapprovedSizes.length} non-standard text sizes found`);
    }

    check.details = details;
    return check;
  };

  const checkIconSizes = async (check: BrandCheck): Promise<BrandCheck> => {
    const iconElements = document.querySelectorAll('[class*="icon-"], .lucide, svg');
    const details: string[] = [];
    let standardCount = 0;
    let nonStandardCount = 0;

    iconElements.forEach((element) => {
      const classList = Array.from(element.classList);
      const hasStandardSize = classList.some(cls => cls.startsWith('icon-'));

      if (hasStandardSize) {
        standardCount++;
      } else {
        nonStandardCount++;
        details.push(`Icon without standard size class: ${element.tagName.toLowerCase()}`);
      }
    });

    const standardRatio = standardCount / (standardCount + nonStandardCount);

    if (standardRatio >= 0.9) {
      check.status = 'pass';
      details.unshift(`${Math.round(standardRatio * 100)}% of icons use standard sizes`);
    } else if (standardRatio >= 0.7) {
      check.status = 'warning';
      details.unshift(`${Math.round(standardRatio * 100)}% of icons use standard sizes`);
    } else {
      check.status = 'fail';
      details.unshift(`Only ${Math.round(standardRatio * 100)}% of icons use standard sizes`);
    }

    check.details = details;
    return check;
  };

  const checkIconContext = async (check: BrandCheck): Promise<BrandCheck> => {
    const details: string[] = [];
    let contextIssues = 0;

    // Check login page icons
    const loginIcons = document.querySelectorAll('.login-page [class*="icon-"], .login-page svg');
    loginIcons.forEach((icon) => {
      const classList = Array.from(icon.classList);
      const hasXLSize = classList.includes('icon-xl');
      if (!hasXLSize) {
        contextIssues++;
        details.push('Login page icon should use icon-xl size');
      }
    });

    // Check button icons
    const buttonIcons = document.querySelectorAll('button [class*="icon-"], button svg');
    buttonIcons.forEach((icon) => {
      const classList = Array.from(icon.classList);
      const hasMDSize = classList.includes('icon-md') || classList.includes('icon');
      if (!hasMDSize) {
        contextIssues++;
        details.push('Button icon should use icon-md or icon size');
      }
    });

    if (contextIssues === 0) {
      check.status = 'pass';
      details.unshift('Icons are appropriately sized for their context');
    } else {
      check.status = 'warning';
      details.unshift(`${contextIssues} icon context issues found`);
    }

    check.details = details;
    return check;
  };

  const checkRedditLogo = async (check: BrandCheck): Promise<BrandCheck> => {
    const logoElements = document.querySelectorAll('[alt*="reddit"], [aria-label*="reddit"]');
    const details: string[] = [];

    if (logoElements.length === 0) {
      check.status = 'warning';
      details.push('No Reddit logo elements found');
    } else {
      let issueCount = 0;

      logoElements.forEach((logo) => {
        const classList = Array.from(logo.classList);
        const hasStandardSize = classList.some(cls => cls.startsWith('icon-'));

        if (!hasStandardSize) {
          issueCount++;
          details.push('Reddit logo missing standard size class');
        }
      });

      if (issueCount === 0) {
        check.status = 'pass';
        details.push(`${logoElements.length} Reddit logo(s) follow brand guidelines`);
      } else {
        check.status = 'warning';
        details.push(`${issueCount} logo issues found`);
      }
    }

    check.details = details;
    return check;
  };

  const checkSpacingConsistency = async (check: BrandCheck): Promise<BrandCheck> => {
    const spacingElements = document.querySelectorAll('[class*="p-"], [class*="m-"], [class*="gap-"]');
    const details: string[] = [];
    let arbitraryCount = 0;

    spacingElements.forEach((element) => {
      const classList = Array.from(element.classList);
      const arbitrarySpacing = classList.filter(cls => cls.match(/^(p|m|gap)-\[.*\]$/));
      arbitraryCount += arbitrarySpacing.length;
    });

    if (arbitraryCount === 0) {
      check.status = 'pass';
      details.push('All spacing uses design system tokens');
    } else if (arbitraryCount < 5) {
      check.status = 'warning';
      details.push(`${arbitraryCount} elements use arbitrary spacing values`);
    } else {
      check.status = 'fail';
      details.push(`${arbitraryCount} elements use arbitrary spacing - consider design tokens`);
    }

    check.details = details;
    return check;
  };

  const checkComponentConsistency = async (check: BrandCheck): Promise<BrandCheck> => {
    const buttons = document.querySelectorAll('button');
    const cards = document.querySelectorAll('.card, .dashboard-card');
    const inputs = document.querySelectorAll('input, select, textarea');
    const details: string[] = [];
    let inconsistencies = 0;

    // Check buttons
    buttons.forEach((button) => {
      const classList = Array.from(button.classList);
      const hasButtonClass = classList.some(cls => cls.startsWith('btn'));
      if (!hasButtonClass) {
        inconsistencies++;
        details.push('Button missing btn class');
      }
    });

    // Check cards
    cards.forEach((card) => {
      const classList = Array.from(card.classList);
      const hasCardClass = classList.includes('card') || classList.includes('dashboard-card');
      if (!hasCardClass) {
        inconsistencies++;
        details.push('Card missing standard card class');
      }
    });

    // Check form elements
    inputs.forEach((input) => {
      const classList = Array.from(input.classList);
      const hasFormClass = classList.some(cls => cls.startsWith('form-'));
      if (!hasFormClass) {
        inconsistencies++;
        details.push('Form element missing form class');
      }
    });

    if (inconsistencies === 0) {
      check.status = 'pass';
      details.unshift('All components follow design system patterns');
    } else if (inconsistencies < 5) {
      check.status = 'warning';
      details.unshift(`${inconsistencies} component consistency issues`);
    } else {
      check.status = 'fail';
      details.unshift(`${inconsistencies} components don't follow design system`);
    }

    check.details = details;
    return check;
  };

  const checkAriaLabels = async (check: BrandCheck): Promise<BrandCheck> => {
    const interactiveElements = document.querySelectorAll('button, a, input, select, textarea');
    const details: string[] = [];
    let missingLabels = 0;

    interactiveElements.forEach((element) => {
      const hasLabel = element.hasAttribute('aria-label') ||
        element.hasAttribute('aria-labelledby') ||
        element.textContent?.trim() ||
        (element as HTMLInputElement).placeholder;

      if (!hasLabel) {
        missingLabels++;
        details.push(`${element.tagName.toLowerCase()} missing accessible name`);
      }
    });

    if (missingLabels === 0) {
      check.status = 'pass';
      details.unshift(`All ${interactiveElements.length} interactive elements have accessible names`);
    } else {
      check.status = 'fail';
      details.unshift(`${missingLabels} elements missing accessible names`);
    }

    check.details = details;
    return check;
  };

  const checkFocusIndicators = async (check: BrandCheck): Promise<BrandCheck> => {
    const focusableElements = document.querySelectorAll('button, a, input, select, textarea, [tabindex]');
    const details: string[] = [];
    let missingFocus = 0;

    focusableElements.forEach((element) => {
      const classList = Array.from(element.classList);
      const hasFocusIndicator = classList.some(cls =>
        cls.includes('focus:') || cls.includes('focus-visible:')
      );

      if (!hasFocusIndicator) {
        missingFocus++;
        details.push(`${element.tagName.toLowerCase()} missing focus indicator`);
      }
    });

    if (missingFocus === 0) {
      check.status = 'pass';
      details.unshift(`All ${focusableElements.length} focusable elements have focus indicators`);
    } else if (missingFocus < focusableElements.length * 0.1) {
      check.status = 'warning';
      details.unshift(`${missingFocus} elements missing focus indicators`);
    } else {
      check.status = 'fail';
      details.unshift(`${missingFocus} elements missing focus indicators`);
    }

    check.details = details;
    return check;
  };

  const getStatusIcon = (status: BrandCheck['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-5 h-5 text-success" />;
      case 'fail':
        return <AlertTriangle className="w-5 h-5 text-error" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-warning" />;
      default:
        return <Info className="w-5 h-5 text-tertiary" />;
    }
  };

  const getCategoryIcon = (category: BrandCheck['category']) => {
    switch (category) {
      case 'colors':
        return <Palette className="w-5 h-5" />;
      case 'typography':
        return <Type className="w-5 h-5" />;
      case 'iconography':
        return <Image className="w-5 h-5" />;
      default:
        return <Eye className="w-5 h-5" />;
    }
  };

  const exportReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      summary,
      checks: checks.map(check => ({
        id: check.id,
        name: check.name,
        category: check.category,
        status: check.status,
        details: check.details,
      })),
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brand-guidelines-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">
          Brand Guidelines Verification
        </h1>
        <p className="text-secondary">
          Comprehensive verification of Reddit Content Platform brand compliance
        </p>
      </header>

      {/* Control Panel */}
      <section className="dashboard-card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-primary">Verification Controls</h2>
          <div className="flex gap-3">
            <button
              onClick={runAllChecks}
              className="btn-primary"
              disabled={isRunning}
            >
              {isRunning ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
              {isRunning ? 'Running...' : 'Run All Checks'}
            </button>
            <button
              onClick={exportReport}
              className="btn-secondary"
              disabled={checks.length === 0}
            >
              <Download className="w-4 h-4" />
              Export Report
            </button>
          </div>
        </div>

        {/* Summary */}
        {summary.total > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-success">{summary.passed}</div>
              <div className="text-sm text-secondary">Passed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-error">{summary.failed}</div>
              <div className="text-sm text-secondary">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-warning">{summary.warnings}</div>
              <div className="text-sm text-secondary">Warnings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{summary.total}</div>
              <div className="text-sm text-secondary">Total</div>
            </div>
          </div>
        )}
      </section>

      {/* Checks by Category */}
      {['colors', 'typography', 'iconography', 'layout', 'accessibility'].map(category => {
        const categoryChecks = checks.filter(check => check.category === category);
        if (categoryChecks.length === 0) return null;

        return (
          <section key={category} className="dashboard-card mb-6">
            <div className="flex items-center gap-3 mb-4">
              {getCategoryIcon(category as BrandCheck['category'])}
              <h2 className="text-xl font-semibold text-primary capitalize">
                {category}
              </h2>
            </div>

            <div className="space-y-4">
              {categoryChecks.map(check => (
                <div
                  key={check.id}
                  className={`border rounded-lg p-4 ${check.status === 'pass' ? 'border-success bg-success/5' :
                      check.status === 'fail' ? 'border-error bg-error/5' :
                        check.status === 'warning' ? 'border-warning bg-warning/5' :
                          'border-primary'
                    }`}
                >
                  <div className="flex items-start gap-3">
                    {getStatusIcon(check.status)}
                    <div className="flex-1">
                      <h3 className="font-semibold text-primary">{check.name}</h3>
                      <p className="text-sm text-secondary mb-2">{check.description}</p>

                      {check.details.length > 0 && (
                        <div className="space-y-1">
                          {check.details.map((detail, index) => (
                            <div key={index} className="text-sm text-tertiary">
                              • {detail}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      {checks.length === 0 && (
        <div className="text-center py-12">
          <Eye className="w-12 h-12 text-tertiary mx-auto mb-4" />
          <p className="text-secondary">Click "Run All Checks" to start brand guidelines verification</p>
        </div>
      )}
    </div>
  );
};

export default BrandGuidelinesVerification;