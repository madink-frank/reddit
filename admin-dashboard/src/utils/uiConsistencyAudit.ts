/**
 * UI Consistency Audit Tool
 * 
 * This tool performs comprehensive audits of UI consistency across the application,
 * checking design system compliance, brand guidelines, and user experience patterns.
 */

import { 
  ICON_CONTEXT_SIZES, 
  DEPRECATED_TAILWIND_SIZES,
  TAILWIND_TO_DESIGN_TOKEN_MAP,
  findNonStandardIconSizes
} from '../constants/icon-standards';

export interface AuditResult {
  category: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  element?: HTMLElement;
  suggestion?: string;
  requirement?: string;
}

export interface AuditReport {
  summary: {
    total: number;
    errors: number;
    warnings: number;
    info: number;
    score: number; // 0-100
  };
  results: AuditResult[];
  recommendations: string[];
}

export class UIConsistencyAuditor {
  private results: AuditResult[] = [];
  private container: HTMLElement;

  constructor(container: HTMLElement = document.body) {
    this.container = container;
  }

  /**
   * Run comprehensive UI consistency audit
   */
  public async audit(): Promise<AuditReport> {
    this.results = [];

    // Run all audit checks
    this.auditDesignSystemCompliance();
    this.auditIconStandardization();
    this.auditColorConsistency();
    this.auditTypographyConsistency();
    this.auditComponentConsistency();
    this.auditBrandGuidelines();
    this.auditAccessibilityConsistency();
    this.auditErrorHandlingPatterns();
    this.auditLoadingStates();
    this.auditInteractionPatterns();

    return this.generateReport();
  }

  /**
   * Audit design system compliance (Requirement 3.1)
   */
  private auditDesignSystemCompliance(): void {
    // Check for CSS custom properties usage
    const elementsWithInlineStyles = this.container.querySelectorAll('[style]');
    elementsWithInlineStyles.forEach((element) => {
      const inlineStyle = (element as HTMLElement).style.cssText;
      if (inlineStyle.includes('color:') || inlineStyle.includes('background:')) {
        this.addResult({
          category: 'Design System',
          severity: 'warning',
          message: 'Element uses inline styles instead of design tokens',
          element: element as HTMLElement,
          suggestion: 'Use CSS custom properties or design token classes',
          requirement: '3.1'
        });
      }
    });

    // Check for hardcoded color values
    const allElements = this.container.querySelectorAll('*');
    allElements.forEach((element) => {
      const classList = Array.from(element.classList);
      
      // Check for hardcoded Tailwind colors that should use design tokens
      const hardcodedColorClasses = classList.filter(cls => 
        cls.match(/^(bg|text|border)-(red|blue|green|yellow|purple|pink|indigo)-\d+$/)
      );
      
      if (hardcodedColorClasses.length > 0) {
        this.addResult({
          category: 'Design System',
          severity: 'warning',
          message: `Element uses hardcoded color classes: ${hardcodedColorClasses.join(', ')}`,
          element: element as HTMLElement,
          suggestion: 'Use semantic color tokens like text-primary, bg-surface-primary',
          requirement: '3.1'
        });
      }
    });

    // Check for consistent spacing usage
    this.auditSpacingConsistency();
  }

  /**
   * Audit icon standardization (Requirement 3.2)
   */
  private auditIconStandardization(): void {
    const nonStandardIcons = findNonStandardIconSizes(this.container);
    
    nonStandardIcons.forEach(({ element, currentClasses, suggestedSize }) => {
      this.addResult({
        category: 'Icon Standards',
        severity: 'error',
        message: `Icon uses deprecated Tailwind classes: ${currentClasses}`,
        element,
        suggestion: `Replace with icon-${suggestedSize}`,
        requirement: '3.2'
      });
    });

    // Check for consistent icon usage in different contexts
    this.auditIconContextUsage();
  }

  /**
   * Audit color consistency
   */
  private auditColorConsistency(): void {
    const colorElements = this.container.querySelectorAll('[class*="text-"], [class*="bg-"], [class*="border-"]');
    
    colorElements.forEach((element) => {
      const classList = Array.from(element.classList);
      
      // Check for semantic color usage
      const colorClasses = classList.filter(cls => 
        cls.startsWith('text-') || cls.startsWith('bg-') || cls.startsWith('border-')
      );
      
      colorClasses.forEach(colorClass => {
        if (!this.isSemanticColorClass(colorClass)) {
          this.addResult({
            category: 'Color Consistency',
            severity: 'warning',
            message: `Non-semantic color class used: ${colorClass}`,
            element: element as HTMLElement,
            suggestion: 'Use semantic color tokens like text-primary, bg-success',
            requirement: '3.1'
          });
        }
      });
    });
  }

  /**
   * Audit typography consistency
   */
  private auditTypographyConsistency(): void {
    const textElements = this.container.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div');
    
    textElements.forEach((element) => {
      const classList = Array.from(element.classList);
      const tagName = element.tagName.toLowerCase();
      
      // Check heading elements use proper heading classes
      if (tagName.match(/^h[1-6]$/)) {
        const hasHeadingClass = classList.some(cls => cls.startsWith('heading-'));
        if (!hasHeadingClass) {
          this.addResult({
            category: 'Typography',
            severity: 'warning',
            message: `${tagName.toUpperCase()} element missing heading class`,
            element: element as HTMLElement,
            suggestion: `Add heading-${tagName.slice(1)} class`,
            requirement: '3.1'
          });
        }
      }

      // Check for consistent text size usage
      const textSizeClasses = classList.filter(cls => cls.match(/^text-(xs|sm|base|lg|xl|\dxl)$/));
      if (textSizeClasses.length > 1) {
        this.addResult({
          category: 'Typography',
          severity: 'error',
          message: `Multiple text size classes: ${textSizeClasses.join(', ')}`,
          element: element as HTMLElement,
          suggestion: 'Use only one text size class per element',
          requirement: '3.1'
        });
      }
    });
  }

  /**
   * Audit component consistency (Requirement 3.3)
   */
  private auditComponentConsistency(): void {
    // Audit button consistency
    this.auditButtonConsistency();
    
    // Audit form component consistency
    this.auditFormConsistency();
    
    // Audit card consistency
    this.auditCardConsistency();
  }

  /**
   * Audit button consistency
   */
  private auditButtonConsistency(): void {
    const buttons = this.container.querySelectorAll('button, [role="button"]');
    
    buttons.forEach((button) => {
      const classList = Array.from(button.classList);
      
      // Check for btn base class
      if (!classList.includes('btn') && !classList.some(cls => cls.startsWith('btn-'))) {
        this.addResult({
          category: 'Button Consistency',
          severity: 'error',
          message: 'Button missing btn base class or variant',
          element: button as HTMLElement,
          suggestion: 'Add btn class and appropriate variant (btn-primary, btn-secondary, etc.)',
          requirement: '3.3'
        });
      }

      // Check for consistent hover states
      const hasHoverClass = classList.some(cls => cls.includes('hover:'));
      if (!hasHoverClass) {
        this.addResult({
          category: 'Button Consistency',
          severity: 'warning',
          message: 'Button missing hover state styling',
          element: button as HTMLElement,
          suggestion: 'Add hover state classes for better user feedback',
          requirement: '3.3'
        });
      }

      // Check for proper disabled state
      if (button.hasAttribute('disabled')) {
        const hasDisabledStyling = classList.some(cls => 
          cls.includes('disabled:') || cls.includes('opacity-')
        );
        if (!hasDisabledStyling) {
          this.addResult({
            category: 'Button Consistency',
            severity: 'warning',
            message: 'Disabled button missing visual disabled state',
            element: button as HTMLElement,
            suggestion: 'Add disabled state styling',
            requirement: '3.3'
          });
        }
      }
    });
  }

  /**
   * Audit form consistency
   */
  private auditFormConsistency(): void {
    const formElements = this.container.querySelectorAll('input, select, textarea');
    
    formElements.forEach((element) => {
      const classList = Array.from(element.classList);
      
      // Check for form base class
      if (!classList.some(cls => cls.startsWith('form-'))) {
        this.addResult({
          category: 'Form Consistency',
          severity: 'error',
          message: 'Form element missing form styling class',
          element: element as HTMLElement,
          suggestion: 'Add form-default or appropriate form variant class',
          requirement: '3.3'
        });
      }

      // Check for focus states
      const hasFocusClass = classList.some(cls => cls.includes('focus:'));
      if (!hasFocusClass) {
        this.addResult({
          category: 'Form Consistency',
          severity: 'warning',
          message: 'Form element missing focus state styling',
          element: element as HTMLElement,
          suggestion: 'Add focus state classes for better accessibility',
          requirement: '3.3'
        });
      }
    });
  }

  /**
   * Audit card consistency
   */
  private auditCardConsistency(): void {
    const cards = this.container.querySelectorAll('.card, .dashboard-card, [class*="card"]');
    
    cards.forEach((card) => {
      const classList = Array.from(card.classList);
      
      // Check for consistent card styling
      const hasCardClass = classList.includes('card') || classList.includes('dashboard-card');
      if (!hasCardClass) {
        this.addResult({
          category: 'Card Consistency',
          severity: 'warning',
          message: 'Card-like element missing standard card class',
          element: card as HTMLElement,
          suggestion: 'Add card or dashboard-card class for consistency',
          requirement: '3.3'
        });
      }

      // Check for consistent background
      const hasBgClass = classList.some(cls => cls.startsWith('bg-'));
      if (!hasBgClass) {
        this.addResult({
          category: 'Card Consistency',
          severity: 'info',
          message: 'Card missing explicit background class',
          element: card as HTMLElement,
          suggestion: 'Add bg-surface-primary or appropriate background class',
          requirement: '3.3'
        });
      }
    });
  }

  /**
   * Audit brand guidelines compliance
   */
  private auditBrandGuidelines(): void {
    // Check for Reddit brand color usage
    const redditElements = this.container.querySelectorAll('[class*="reddit"], [class*="orange-6"]');
    
    redditElements.forEach((element) => {
      const classList = Array.from(element.classList);
      const hasCorrectRedditColor = classList.some(cls => 
        cls.includes('orange-600') || cls.includes('orange-700')
      );
      
      if (!hasCorrectRedditColor) {
        this.addResult({
          category: 'Brand Guidelines',
          severity: 'warning',
          message: 'Reddit-related element not using official brand colors',
          element: element as HTMLElement,
          suggestion: 'Use bg-orange-600 or bg-orange-700 for Reddit branding',
          requirement: 'Brand Compliance'
        });
      }
    });

    // Check for consistent logo usage
    const logos = this.container.querySelectorAll('[alt*="logo"], [aria-label*="logo"]');
    logos.forEach((logo) => {
      const classList = Array.from(logo.classList);
      const hasStandardSize = classList.some(cls => cls.startsWith('icon-'));
      
      if (!hasStandardSize) {
        this.addResult({
          category: 'Brand Guidelines',
          severity: 'info',
          message: 'Logo not using standardized icon size',
          element: logo as HTMLElement,
          suggestion: 'Use icon-lg or icon-xl for logo sizing',
          requirement: 'Brand Compliance'
        });
      }
    });
  }

  /**
   * Audit accessibility consistency
   */
  private auditAccessibilityConsistency(): void {
    // Check for consistent ARIA labeling
    const interactiveElements = this.container.querySelectorAll('button, a, input, select, textarea');
    
    interactiveElements.forEach((element) => {
      const hasAriaLabel = element.hasAttribute('aria-label') || 
                          element.hasAttribute('aria-labelledby') ||
                          element.textContent?.trim();
      
      if (!hasAriaLabel) {
        this.addResult({
          category: 'Accessibility',
          severity: 'error',
          message: 'Interactive element missing accessible name',
          element: element as HTMLElement,
          suggestion: 'Add aria-label, aria-labelledby, or visible text content',
          requirement: '4.2'
        });
      }
    });

    // Check for consistent focus indicators
    const focusableElements = this.container.querySelectorAll('[tabindex], button, a, input, select, textarea');
    
    focusableElements.forEach((element) => {
      const classList = Array.from(element.classList);
      const hasFocusIndicator = classList.some(cls => 
        cls.includes('focus:') || cls.includes('focus-visible:')
      );
      
      if (!hasFocusIndicator) {
        this.addResult({
          category: 'Accessibility',
          severity: 'warning',
          message: 'Focusable element missing focus indicator',
          element: element as HTMLElement,
          suggestion: 'Add focus:outline-none focus:ring-2 classes',
          requirement: '4.1'
        });
      }
    });
  }

  /**
   * Audit error handling patterns (Requirement 3.4)
   */
  private auditErrorHandlingPatterns(): void {
    const errorElements = this.container.querySelectorAll('[role="alert"], .alert-error, .text-error');
    
    errorElements.forEach((element) => {
      const classList = Array.from(element.classList);
      
      // Check for consistent error styling
      const hasErrorClass = classList.some(cls => 
        cls.includes('error') || cls.includes('alert')
      );
      
      if (!hasErrorClass) {
        this.addResult({
          category: 'Error Handling',
          severity: 'warning',
          message: 'Error element missing consistent error styling',
          element: element as HTMLElement,
          suggestion: 'Add alert-error or text-error class',
          requirement: '3.4'
        });
      }

      // Check for proper ARIA attributes
      if (element.getAttribute('role') !== 'alert') {
        this.addResult({
          category: 'Error Handling',
          severity: 'error',
          message: 'Error message missing role="alert"',
          element: element as HTMLElement,
          suggestion: 'Add role="alert" for screen reader announcement',
          requirement: '3.4'
        });
      }
    });
  }

  /**
   * Audit loading states consistency
   */
  private auditLoadingStates(): void {
    const loadingElements = this.container.querySelectorAll('.loading, [aria-busy="true"], .animate-pulse');
    
    loadingElements.forEach((element) => {
      const classList = Array.from(element.classList);
      
      // Check for consistent loading animation
      const hasLoadingAnimation = classList.some(cls => 
        cls.includes('animate-') || cls.includes('loading')
      );
      
      if (!hasLoadingAnimation) {
        this.addResult({
          category: 'Loading States',
          severity: 'warning',
          message: 'Loading element missing animation class',
          element: element as HTMLElement,
          suggestion: 'Add animate-pulse or animate-spin class',
          requirement: '5.3'
        });
      }

      // Check for proper ARIA attributes
      if (!element.hasAttribute('aria-busy') && !element.hasAttribute('aria-live')) {
        this.addResult({
          category: 'Loading States',
          severity: 'info',
          message: 'Loading element missing ARIA attributes',
          element: element as HTMLElement,
          suggestion: 'Add aria-busy="true" or aria-live="polite"',
          requirement: '5.3'
        });
      }
    });
  }

  /**
   * Audit interaction patterns
   */
  private auditInteractionPatterns(): void {
    // Check for consistent hover effects
    const hoverableElements = this.container.querySelectorAll('button, a, .hover\\:');
    
    hoverableElements.forEach((element) => {
      const classList = Array.from(element.classList);
      const hasHoverEffect = classList.some(cls => cls.includes('hover:'));
      
      if (!hasHoverEffect && element.tagName.toLowerCase() !== 'a') {
        this.addResult({
          category: 'Interaction Patterns',
          severity: 'info',
          message: 'Interactive element missing hover effect',
          element: element as HTMLElement,
          suggestion: 'Add hover state for better user feedback',
          requirement: '3.3'
        });
      }
    });
  }

  /**
   * Audit spacing consistency
   */
  private auditSpacingConsistency(): void {
    const spacingElements = this.container.querySelectorAll('[class*="p-"], [class*="m-"], [class*="gap-"]');
    
    spacingElements.forEach((element) => {
      const classList = Array.from(element.classList);
      
      // Check for arbitrary spacing values
      const spacingClasses = classList.filter(cls => 
        cls.match(/^(p|m|gap)-\[.*\]$/)
      );
      
      if (spacingClasses.length > 0) {
        this.addResult({
          category: 'Spacing Consistency',
          severity: 'warning',
          message: `Arbitrary spacing values used: ${spacingClasses.join(', ')}`,
          element: element as HTMLElement,
          suggestion: 'Use design system spacing tokens (space-xs, space-sm, etc.)',
          requirement: '3.1'
        });
      }
    });
  }

  /**
   * Audit icon context usage
   */
  private auditIconContextUsage(): void {
    const iconElements = this.container.querySelectorAll('[class*="icon-"], .lucide');
    
    iconElements.forEach((element) => {
      const classList = Array.from(element.classList);
      const parent = element.parentElement;
      
      if (parent) {
        const parentClasses = Array.from(parent.classList);
        const context = this.determineIconContext(parent, parentClasses);
        const currentSize = this.getCurrentIconSize(classList);
        const recommendedSize = ICON_CONTEXT_SIZES[context];
        
        if (recommendedSize && currentSize !== recommendedSize) {
          this.addResult({
            category: 'Icon Context',
            severity: 'info',
            message: `Icon size ${currentSize} may not be optimal for ${context} context`,
            element: element as HTMLElement,
            suggestion: `Consider using icon-${recommendedSize} for ${context} context`,
            requirement: '3.2'
          });
        }
      }
    });
  }

  /**
   * Helper methods
   */
  private addResult(result: AuditResult): void {
    this.results.push(result);
  }

  private isSemanticColorClass(className: string): boolean {
    const semanticColors = [
      'text-primary', 'text-secondary', 'text-tertiary', 'text-disabled',
      'text-success', 'text-warning', 'text-error', 'text-info',
      'bg-primary', 'bg-secondary', 'bg-surface-primary', 'bg-surface-secondary',
      'border-primary', 'border-secondary', 'border-focus', 'border-error'
    ];
    
    return semanticColors.some(semantic => className.includes(semantic));
  }

  private determineIconContext(parent: Element, parentClasses: string[]): string {
    if (parentClasses.some(cls => cls.includes('btn'))) return 'button-medium';
    if (parent.tagName.toLowerCase().match(/^h[1-6]$/)) return 'section-header';
    if (parentClasses.some(cls => cls.includes('nav'))) return 'nav-item';
    if (parentClasses.some(cls => cls.includes('status'))) return 'status-indicator';
    if (parentClasses.some(cls => cls.includes('alert'))) return 'alert-icon';
    return 'inline-text';
  }

  private getCurrentIconSize(classList: string[]): string {
    const iconSizeClass = classList.find(cls => cls.startsWith('icon-'));
    if (iconSizeClass) {
      return iconSizeClass.replace('icon-', '') || 'base';
    }
    
    // Check for Tailwind size classes
    const tailwindSize = classList.find(cls => 
      DEPRECATED_TAILWIND_SIZES.some(deprecated => cls.includes(deprecated.split(' ')[0]))
    );
    
    if (tailwindSize) {
      const fullSize = DEPRECATED_TAILWIND_SIZES.find(size => 
        size.split(' ').every(part => classList.includes(part))
      );
      return fullSize ? TAILWIND_TO_DESIGN_TOKEN_MAP[fullSize] : 'base';
    }
    
    return 'base';
  }

  private generateReport(): AuditReport {
    const errors = this.results.filter(r => r.severity === 'error').length;
    const warnings = this.results.filter(r => r.severity === 'warning').length;
    const info = this.results.filter(r => r.severity === 'info').length;
    const total = this.results.length;
    
    // Calculate score (100 - penalty points)
    const errorPenalty = errors * 10;
    const warningPenalty = warnings * 5;
    const infoPenalty = info * 1;
    const score = Math.max(0, 100 - errorPenalty - warningPenalty - infoPenalty);
    
    const recommendations = this.generateRecommendations();
    
    return {
      summary: {
        total,
        errors,
        warnings,
        info,
        score
      },
      results: this.results,
      recommendations
    };
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    const categories = [...new Set(this.results.map(r => r.category))];
    
    categories.forEach(category => {
      const categoryResults = this.results.filter(r => r.category === category);
      const errorCount = categoryResults.filter(r => r.severity === 'error').length;
      const warningCount = categoryResults.filter(r => r.severity === 'warning').length;
      
      if (errorCount > 0) {
        recommendations.push(`${category}: Fix ${errorCount} critical issues`);
      }
      if (warningCount > 0) {
        recommendations.push(`${category}: Address ${warningCount} improvement opportunities`);
      }
    });
    
    // Add general recommendations based on common issues
    if (this.results.some(r => r.message.includes('design token'))) {
      recommendations.push('Consider migrating to design tokens for better consistency');
    }
    
    if (this.results.some(r => r.message.includes('accessibility'))) {
      recommendations.push('Review accessibility guidelines and implement missing ARIA attributes');
    }
    
    return recommendations;
  }
}

/**
 * Convenience function to run UI consistency audit
 */
export async function auditUIConsistency(container?: HTMLElement): Promise<AuditReport> {
  const auditor = new UIConsistencyAuditor(container);
  return await auditor.audit();
}

/**
 * Generate a detailed console report
 */
export function logAuditReport(report: AuditReport): void {
  console.group('🔍 UI Consistency Audit Report');
  
  // Summary
  console.log(`📊 Score: ${report.summary.score}/100`);
  console.log(`📈 Total Issues: ${report.summary.total}`);
  console.log(`❌ Errors: ${report.summary.errors}`);
  console.log(`⚠️  Warnings: ${report.summary.warnings}`);
  console.log(`ℹ️  Info: ${report.summary.info}`);
  
  // Results by category
  const categories = [...new Set(report.results.map(r => r.category))];
  categories.forEach(category => {
    const categoryResults = report.results.filter(r => r.category === category);
    console.group(`📂 ${category} (${categoryResults.length} issues)`);
    
    categoryResults.forEach(result => {
      const icon = result.severity === 'error' ? '❌' : 
                   result.severity === 'warning' ? '⚠️' : 'ℹ️';
      console.log(`${icon} ${result.message}`);
      if (result.suggestion) {
        console.log(`   💡 ${result.suggestion}`);
      }
      if (result.requirement) {
        console.log(`   📋 Requirement: ${result.requirement}`);
      }
    });
    
    console.groupEnd();
  });
  
  // Recommendations
  if (report.recommendations.length > 0) {
    console.group('🎯 Recommendations');
    report.recommendations.forEach(rec => console.log(`• ${rec}`));
    console.groupEnd();
  }
  
  console.groupEnd();
}