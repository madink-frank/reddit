/**
 * UI Consistency Verification Script
 * 
 * This script performs comprehensive verification of UI consistency
 * across the Reddit Content Platform admin dashboard.
 */

import { auditUIConsistency, logAuditReport } from '../utils/uiConsistencyAudit';

interface VerificationResult {
  category: string;
  passed: boolean;
  score: number;
  issues: string[];
  recommendations: string[];
}

class UIConsistencyVerifier {
  private results: VerificationResult[] = [];

  async runVerification(): Promise<void> {
    console.log('🔍 Starting UI Consistency Verification...\n');

    // Run comprehensive audit
    const auditReport = await auditUIConsistency();
    
    // Log detailed report
    logAuditReport(auditReport);

    // Verify specific requirements
    await this.verifyRequirement31(auditReport);
    await this.verifyRequirement32(auditReport);
    await this.verifyRequirement33(auditReport);
    await this.verifyRequirement34(auditReport);
    await this.verifyBrandGuidelines();
    await this.verifyUserFlows();

    // Generate final report
    this.generateFinalReport();
  }

  private async verifyRequirement31(_auditReport: any): Promise<void> {
    console.log('📋 Verifying Requirement 3.1: Design System Application');
    

    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check color consistency
    const colorElements = document.querySelectorAll('[class*="text-"], [class*="bg-"], [class*="border-"]');
    let semanticColorUsage = 0;
    let totalColorUsage = 0;

    colorElements.forEach((element) => {
      const classList = Array.from(element.classList);
      const colorClasses = classList.filter(cls => 
        cls.startsWith('text-') || cls.startsWith('bg-') || cls.startsWith('border-')
      );

      colorClasses.forEach(colorClass => {
        totalColorUsage++;
        if (colorClass.match(/(primary|secondary|tertiary|success|warning|error|info|surface)/)) {
          semanticColorUsage++;
        } else if (colorClass.match(/(red|blue|green|yellow|purple|pink|indigo)-\d+/)) {
          issues.push(`Non-semantic color class found: ${colorClass}`);
        }
      });
    });

    const semanticRatio = totalColorUsage > 0 ? semanticColorUsage / totalColorUsage : 1;
    
    if (semanticRatio < 0.8) {
      issues.push(`Only ${Math.round(semanticRatio * 100)}% semantic color usage (target: 80%+)`);
      recommendations.push('Migrate hardcoded color classes to semantic design tokens');
    }

    // Check typography consistency
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let headingsWithClasses = 0;

    headings.forEach((heading) => {
      const classList = Array.from(heading.classList);
      const hasHeadingClass = classList.some(cls => cls.startsWith('heading-'));
      if (hasHeadingClass) {
        headingsWithClasses++;
      } else {
        issues.push(`${heading.tagName} missing heading class`);
      }
    });

    const headingRatio = headings.length > 0 ? headingsWithClasses / headings.length : 1;
    if (headingRatio < 0.9) {
      issues.push(`Only ${Math.round(headingRatio * 100)}% of headings use design system classes`);
      recommendations.push('Add heading-* classes to all heading elements');
    }

    const score = Math.max(0, 100 - (issues.length * 10));
    const passed = score >= 80;

    this.results.push({
      category: 'Requirement 3.1: Design System Application',
      passed,
      score,
      issues,
      recommendations
    });

    console.log(`${passed ? '✅' : '❌'} Score: ${score}/100`);
    if (issues.length > 0) {
      console.log(`   Issues: ${issues.length}`);
    }
    console.log('');
  }

  private async verifyRequirement32(_auditReport: any): Promise<void> {
    console.log('📋 Verifying Requirement 3.2: Icon Standardization');
    
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check icon standardization
    const iconElements = document.querySelectorAll('[class*="icon-"], .lucide, svg');
    let standardIconCount = 0;
    let totalIconCount = iconElements.length;

    iconElements.forEach((element) => {
      const classList = Array.from(element.classList);
      const hasStandardSize = classList.some(cls => cls.startsWith('icon-'));
      
      if (hasStandardSize) {
        standardIconCount++;
      } else {
        // Check for deprecated Tailwind sizes
        const deprecatedSizes = ['h-3 w-3', 'h-4 w-4', 'h-5 w-5', 'h-6 w-6', 'h-8 w-8', 'h-12 w-12', 'h-16 w-16'];
        const hasDeprecatedSize = deprecatedSizes.some(size => {
          const [height, width] = size.split(' ');
          return classList.includes(height) && classList.includes(width);
        });
        
        if (hasDeprecatedSize) {
          issues.push('Icon using deprecated Tailwind size classes');
        } else {
          issues.push('Icon missing standardized size class');
        }
      }
    });

    const standardRatio = totalIconCount > 0 ? standardIconCount / totalIconCount : 1;
    
    if (standardRatio < 0.9) {
      issues.push(`Only ${Math.round(standardRatio * 100)}% of icons use standard sizes (target: 90%+)`);
      recommendations.push('Migrate all icons to use icon-* size classes');
    }

    // Check login page icon specifically
    const loginIcons = document.querySelectorAll('.login-page [class*="icon-"], .login-page svg');
    if (loginIcons.length > 0) {
      let loginIconsCorrect = 0;
      loginIcons.forEach((icon) => {
        const classList = Array.from(icon.classList);
        if (classList.includes('icon-xl')) {
          loginIconsCorrect++;
        } else {
          issues.push('Login page icon should use icon-xl size');
        }
      });
    }

    const score = Math.max(0, 100 - (issues.length * 8));
    const passed = score >= 80;

    this.results.push({
      category: 'Requirement 3.2: Icon Standardization',
      passed,
      score,
      issues,
      recommendations
    });

    console.log(`${passed ? '✅' : '❌'} Score: ${score}/100`);
    if (issues.length > 0) {
      console.log(`   Issues: ${issues.length}`);
    }
    console.log('');
  }

  private async verifyRequirement33(_auditReport: any): Promise<void> {
    console.log('📋 Verifying Requirement 3.3: Component Consistency');
    
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check button consistency
    const buttons = document.querySelectorAll('button, [role="button"]');
    let buttonsWithClasses = 0;

    buttons.forEach((button) => {
      const classList = Array.from(button.classList);
      const hasButtonClass = classList.some(cls => cls.startsWith('btn'));
      
      if (hasButtonClass) {
        buttonsWithClasses++;
      } else {
        issues.push('Button missing btn class');
      }

      // Check for hover states
      const hasHoverClass = classList.some(cls => cls.includes('hover:'));
      if (!hasHoverClass) {
        issues.push('Button missing hover state');
      }
    });

    // Check form consistency
    const formElements = document.querySelectorAll('input, select, textarea');
    let formElementsWithClasses = 0;

    formElements.forEach((element) => {
      const classList = Array.from(element.classList);
      const hasFormClass = classList.some(cls => cls.startsWith('form-'));
      
      if (hasFormClass) {
        formElementsWithClasses++;
      } else {
        issues.push('Form element missing form class');
      }
    });

    // Check card consistency
    const cards = document.querySelectorAll('.card, .dashboard-card, [class*="card"]');
    let cardsWithStandardClasses = 0;

    cards.forEach((card) => {
      const classList = Array.from(card.classList);
      const hasCardClass = classList.includes('card') || classList.includes('dashboard-card');
      
      if (hasCardClass) {
        cardsWithStandardClasses++;
      } else {
        issues.push('Card-like element missing standard card class');
      }
    });

    const buttonRatio = buttons.length > 0 ? buttonsWithClasses / buttons.length : 1;
    const formRatio = formElements.length > 0 ? formElementsWithClasses / formElements.length : 1;
    const cardRatio = cards.length > 0 ? cardsWithStandardClasses / cards.length : 1;

    if (buttonRatio < 0.9) {
      recommendations.push('Ensure all buttons use btn classes');
    }
    if (formRatio < 0.9) {
      recommendations.push('Ensure all form elements use form classes');
    }
    if (cardRatio < 0.9) {
      recommendations.push('Ensure all cards use standard card classes');
    }

    const score = Math.max(0, 100 - (issues.length * 5));
    const passed = score >= 80;

    this.results.push({
      category: 'Requirement 3.3: Component Consistency',
      passed,
      score,
      issues,
      recommendations
    });

    console.log(`${passed ? '✅' : '❌'} Score: ${score}/100`);
    if (issues.length > 0) {
      console.log(`   Issues: ${issues.length}`);
    }
    console.log('');
  }

  private async verifyRequirement34(_auditReport: any): Promise<void> {
    console.log('📋 Verifying Requirement 3.4: Error Handling Consistency');
    
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check error message patterns
    const errorElements = document.querySelectorAll('[role="alert"], .alert-error, .text-error');
    let properErrorElements = 0;

    errorElements.forEach((element) => {
      const hasRole = element.getAttribute('role') === 'alert';
      const classList = Array.from(element.classList);
      const hasErrorClass = classList.some(cls => cls.includes('error') || cls.includes('alert'));
      
      if (hasRole && hasErrorClass) {
        properErrorElements++;
      } else {
        if (!hasRole) {
          issues.push('Error element missing role="alert"');
        }
        if (!hasErrorClass) {
          issues.push('Error element missing error styling class');
        }
      }
    });

    // Check for retry mechanisms
    const retryButtons = document.querySelectorAll('button[aria-label*="retry"], button[aria-label*="Retry"], button:contains("Retry")');
    
    if (errorElements.length > 0 && retryButtons.length === 0) {
      issues.push('Error states present but no retry mechanisms found');
      recommendations.push('Add retry buttons for error recovery');
    }

    const score = Math.max(0, 100 - (issues.length * 15));
    const passed = score >= 80;

    this.results.push({
      category: 'Requirement 3.4: Error Handling Consistency',
      passed,
      score,
      issues,
      recommendations
    });

    console.log(`${passed ? '✅' : '❌'} Score: ${score}/100`);
    if (issues.length > 0) {
      console.log(`   Issues: ${issues.length}`);
    }
    console.log('');
  }

  private async verifyBrandGuidelines(): Promise<void> {
    console.log('📋 Verifying Brand Guidelines Compliance');
    
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check Reddit brand colors
    const redditElements = document.querySelectorAll('[class*="orange"], button[class*="reddit"]');
    let correctRedditColors = 0;

    redditElements.forEach((element) => {
      const classList = Array.from(element.classList);
      const hasCorrectColor = classList.some(cls => 
        cls.includes('orange-600') || cls.includes('orange-700')
      );
      
      if (hasCorrectColor) {
        correctRedditColors++;
      } else {
        issues.push('Reddit element not using official brand colors');
      }
    });

    // Check logo usage
    const logos = document.querySelectorAll('[alt*="logo"], [aria-label*="logo"], [aria-label*="reddit"]');
    logos.forEach((logo) => {
      const classList = Array.from(logo.classList);
      const hasStandardSize = classList.some(cls => cls.startsWith('icon-'));
      
      if (!hasStandardSize) {
        issues.push('Logo not using standardized icon size');
      }
    });

    const score = Math.max(0, 100 - (issues.length * 10));
    const passed = score >= 80;

    this.results.push({
      category: 'Brand Guidelines Compliance',
      passed,
      score,
      issues,
      recommendations
    });

    console.log(`${passed ? '✅' : '❌'} Score: ${score}/100`);
    if (issues.length > 0) {
      console.log(`   Issues: ${issues.length}`);
    }
    console.log('');
  }

  private async verifyUserFlows(): Promise<void> {
    console.log('📋 Verifying User Flow Consistency');
    
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check navigation consistency
    const navElements = document.querySelectorAll('nav, [role="navigation"]');
    if (navElements.length === 0) {
      issues.push('No navigation elements found');
    }

    // Check loading states
    const loadingElements = document.querySelectorAll('.loading, .animate-pulse, [aria-busy="true"]');
    let properLoadingElements = 0;

    loadingElements.forEach((element) => {
      const classList = Array.from(element.classList);
      const hasAnimation = classList.some(cls => cls.includes('animate-'));
      const hasAria = element.hasAttribute('aria-busy') || element.hasAttribute('aria-live');
      
      if (hasAnimation || hasAria) {
        properLoadingElements++;
      } else {
        issues.push('Loading element missing proper animation or ARIA attributes');
      }
    });

    // Check interactive feedback
    const interactiveElements = document.querySelectorAll('button, a, [role="button"]');
    let elementsWithFeedback = 0;

    interactiveElements.forEach((element) => {
      const classList = Array.from(element.classList);
      const hasHoverEffect = classList.some(cls => cls.includes('hover:'));
      const hasFocusEffect = classList.some(cls => cls.includes('focus:'));
      
      if (hasHoverEffect || hasFocusEffect) {
        elementsWithFeedback++;
      } else {
        issues.push('Interactive element missing hover/focus feedback');
      }
    });

    const score = Math.max(0, 100 - (issues.length * 8));
    const passed = score >= 80;

    this.results.push({
      category: 'User Flow Consistency',
      passed,
      score,
      issues,
      recommendations
    });

    console.log(`${passed ? '✅' : '❌'} Score: ${score}/100`);
    if (issues.length > 0) {
      console.log(`   Issues: ${issues.length}`);
    }
    console.log('');
  }

  private generateFinalReport(): void {
    console.log('📊 Final UI Consistency Verification Report');
    console.log('='.repeat(50));

    const totalScore = this.results.reduce((sum, result) => sum + result.score, 0) / this.results.length;
    const passedCount = this.results.filter(r => r.passed).length;
    const totalCount = this.results.length;

    console.log(`\n🎯 Overall Score: ${Math.round(totalScore)}/100`);
    console.log(`✅ Passed: ${passedCount}/${totalCount} categories`);

    if (totalScore >= 90) {
      console.log('🌟 Excellent! UI consistency is outstanding.');
    } else if (totalScore >= 80) {
      console.log('👍 Good! Minor improvements needed.');
    } else if (totalScore >= 70) {
      console.log('⚠️  Needs improvement. Several issues to address.');
    } else {
      console.log('🚨 Critical issues found. Immediate attention required.');
    }

    console.log('\n📋 Category Breakdown:');
    this.results.forEach(result => {
      console.log(`\n${result.passed ? '✅' : '❌'} ${result.category}`);
      console.log(`   Score: ${result.score}/100`);
      
      if (result.issues.length > 0) {
        console.log(`   Issues (${result.issues.length}):`);
        result.issues.slice(0, 3).forEach(issue => {
          console.log(`     • ${issue}`);
        });
        if (result.issues.length > 3) {
          console.log(`     ... and ${result.issues.length - 3} more`);
        }
      }

      if (result.recommendations.length > 0) {
        console.log(`   Recommendations:`);
        result.recommendations.forEach(rec => {
          console.log(`     💡 ${rec}`);
        });
      }
    });

    console.log('\n🎯 Next Steps:');
    const failedCategories = this.results.filter(r => !r.passed);
    if (failedCategories.length === 0) {
      console.log('   • All categories passed! Consider running periodic checks.');
      console.log('   • Monitor for regressions during development.');
    } else {
      console.log(`   • Address issues in ${failedCategories.length} failing categories`);
      console.log('   • Focus on categories with lowest scores first');
      console.log('   • Re-run verification after fixes');
    }

    console.log('\n✨ Verification Complete!');
  }
}

// Export for use in other contexts
export { UIConsistencyVerifier };

// Run verification if called directly
if (typeof window !== 'undefined') {
  const verifier = new UIConsistencyVerifier();
  verifier.runVerification().catch(console.error);
}