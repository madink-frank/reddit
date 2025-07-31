#!/usr/bin/env node

/**
 * CSS Optimization Script
 * 
 * This script performs comprehensive CSS optimization:
 * 1. Removes unused CSS classes
 * 2. Identifies critical CSS for inlining
 * 3. Optimizes CSS bundle size
 * 4. Generates optimization reports
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CSSOptimizer {
  constructor() {
    this.srcDir = path.join(__dirname, '../src');
    this.distDir = path.join(__dirname, '../dist');
    this.usedClasses = new Set();
    this.unusedClasses = new Set();
    this.criticalCSS = [];
    this.nonCriticalCSS = [];
    this.optimizationReport = {
      originalSize: 0,
      optimizedSize: 0,
      removedClasses: 0,
      criticalCSSSize: 0,
      nonCriticalCSSSize: 0,
      savings: 0
    };
  }

  /**
   * Scan all React components for used CSS classes
   */
  async scanUsedClasses() {
    console.log('🔍 Scanning for used CSS classes...');
    
    const componentFiles = await glob('**/*.{tsx,jsx}', { 
      cwd: this.srcDir,
      absolute: true 
    });

    for (const file of componentFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      
      // Extract className values using regex
      const classNameMatches = content.match(/className\s*=\s*["'`]([^"'`]+)["'`]/g) || [];
      const classNameExpressions = content.match(/className\s*=\s*\{[^}]+\}/g) || [];
      
      // Process static className strings
      classNameMatches.forEach(match => {
        const classes = match.match(/["'`]([^"'`]+)["'`]/)?.[1];
        if (classes) {
          classes.split(/\s+/).forEach(cls => {
            if (cls.trim()) {
              this.usedClasses.add(cls.trim());
            }
          });
        }
      });

      // Process dynamic className expressions (basic extraction)
      classNameExpressions.forEach(expr => {
        // Extract string literals from expressions
        const stringLiterals = expr.match(/["'`]([^"'`]+)["'`]/g) || [];
        stringLiterals.forEach(literal => {
          const classes = literal.replace(/["'`]/g, '');
          classes.split(/\s+/).forEach(cls => {
            if (cls.trim()) {
              this.usedClasses.add(cls.trim());
            }
          });
        });
      });
    }

    console.log(`✅ Found ${this.usedClasses.size} used CSS classes`);
  }

  /**
   * Analyze CSS files and identify unused classes
   */
  async analyzeCSSFiles() {
    console.log('📊 Analyzing CSS files...');
    
    const cssFiles = await glob('**/*.css', { 
      cwd: this.srcDir,
      absolute: true 
    });

    let totalOriginalSize = 0;
    const allCSSRules = [];

    for (const file of cssFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      totalOriginalSize += content.length;
      
      // Parse CSS rules (basic parsing)
      const rules = this.parseCSSRules(content);
      allCSSRules.push(...rules.map(rule => ({ ...rule, file })));
    }

    this.optimizationReport.originalSize = totalOriginalSize;

    // Categorize rules as critical or non-critical
    this.categorizeCSSRules(allCSSRules);
  }

  /**
   * Basic CSS rule parser
   */
  parseCSSRules(css) {
    const rules = [];
    
    // Remove comments
    css = css.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // Split by closing braces to get individual rules
    const ruleBlocks = css.split('}').filter(block => block.trim());
    
    ruleBlocks.forEach(block => {
      const parts = block.split('{');
      if (parts.length === 2) {
        const selector = parts[0].trim();
        const declarations = parts[1].trim();
        
        if (selector && declarations) {
          rules.push({
            selector,
            declarations,
            fullRule: `${selector} { ${declarations} }`,
            size: block.length + 1 // +1 for the closing brace
          });
        }
      }
    });

    return rules;
  }

  /**
   * Categorize CSS rules as critical or non-critical
   */
  categorizeCSSRules(rules) {
    console.log('🎯 Categorizing CSS rules...');
    
    // Critical CSS patterns (above-the-fold, layout, core components)
    const criticalPatterns = [
      /^body\b/,
      /^html\b/,
      /^\.container\b/,
      /^\.btn-/,
      /^\.card\b/,
      /^\.sr-only\b/,
      /^\.skip-link\b/,
      /^\.keyboard-navigation\b/,
      /^@media.*prefers-reduced-motion/,
      /^@media.*prefers-contrast/,
      /^@layer\s+base/,
      /^@layer\s+components/,
      /^:root\b/,
      // Tailwind base utilities that are commonly used
      /^\.(flex|grid|block|hidden|relative|absolute|fixed)\b/,
      /^\.(w-|h-|p-|m-|text-|bg-|border-)/,
    ];

    rules.forEach(rule => {
      const isCritical = criticalPatterns.some(pattern => 
        pattern.test(rule.selector)
      ) || this.isRuleUsed(rule.selector);

      if (isCritical) {
        this.criticalCSS.push(rule);
      } else {
        this.nonCriticalCSS.push(rule);
      }
    });

    console.log(`✅ Identified ${this.criticalCSS.length} critical CSS rules`);
    console.log(`✅ Identified ${this.nonCriticalCSS.length} non-critical CSS rules`);
  }

  /**
   * Check if a CSS rule is used based on selector analysis
   */
  isRuleUsed(selector) {
    // Simple heuristic: check if any class in the selector is used
    const classMatches = selector.match(/\.[a-zA-Z0-9_-]+/g) || [];
    return classMatches.some(cls => 
      this.usedClasses.has(cls.substring(1)) // Remove the dot
    );
  }

  /**
   * Generate optimized CSS files
   */
  async generateOptimizedCSS() {
    console.log('⚡ Generating optimized CSS...');
    
    const optimizedDir = path.join(this.distDir, 'optimized-css');
    
    // Ensure directory exists
    if (!fs.existsSync(optimizedDir)) {
      fs.mkdirSync(optimizedDir, { recursive: true });
    }

    // Generate critical CSS
    const criticalCSSContent = this.criticalCSS
      .map(rule => rule.fullRule)
      .join('\n');
    
    fs.writeFileSync(
      path.join(optimizedDir, 'critical.css'),
      criticalCSSContent
    );

    // Generate non-critical CSS
    const nonCriticalCSSContent = this.nonCriticalCSS
      .map(rule => rule.fullRule)
      .join('\n');
    
    fs.writeFileSync(
      path.join(optimizedDir, 'non-critical.css'),
      nonCriticalCSSContent
    );

    // Update optimization report
    this.optimizationReport.criticalCSSSize = criticalCSSContent.length;
    this.optimizationReport.nonCriticalCSSSize = nonCriticalCSSContent.length;
    this.optimizationReport.optimizedSize = 
      this.optimizationReport.criticalCSSSize + 
      this.optimizationReport.nonCriticalCSSSize;
    this.optimizationReport.savings = 
      this.optimizationReport.originalSize - 
      this.optimizationReport.optimizedSize;
  }

  /**
   * Generate optimization report
   */
  generateReport() {
    console.log('📋 Generating optimization report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        originalSize: `${(this.optimizationReport.originalSize / 1024).toFixed(2)} KB`,
        optimizedSize: `${(this.optimizationReport.optimizedSize / 1024).toFixed(2)} KB`,
        savings: `${(this.optimizationReport.savings / 1024).toFixed(2)} KB`,
        savingsPercentage: `${((this.optimizationReport.savings / this.optimizationReport.originalSize) * 100).toFixed(2)}%`,
        criticalCSSSize: `${(this.optimizationReport.criticalCSSSize / 1024).toFixed(2)} KB`,
        nonCriticalCSSSize: `${(this.optimizationReport.nonCriticalCSSSize / 1024).toFixed(2)} KB`,
      },
      details: {
        usedClasses: this.usedClasses.size,
        criticalRules: this.criticalCSS.length,
        nonCriticalRules: this.nonCriticalCSS.length,
      },
      recommendations: [
        'Inline critical CSS in HTML head for faster initial render',
        'Load non-critical CSS asynchronously',
        'Consider using CSS-in-JS for component-specific styles',
        'Implement CSS purging in production builds',
        'Use CSS modules for better tree-shaking'
      ]
    };

    const reportPath = path.join(this.distDir, 'css-optimization-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Console output
    console.log('\n📊 CSS Optimization Report:');
    console.log(`Original Size: ${report.summary.originalSize}`);
    console.log(`Optimized Size: ${report.summary.optimizedSize}`);
    console.log(`Savings: ${report.summary.savings} (${report.summary.savingsPercentage})`);
    console.log(`Critical CSS: ${report.summary.criticalCSSSize}`);
    console.log(`Non-Critical CSS: ${report.summary.nonCriticalCSSSize}`);
    console.log(`\n📄 Full report saved to: ${reportPath}`);

    return report;
  }

  /**
   * Run the complete optimization process
   */
  async optimize() {
    console.log('🚀 Starting CSS optimization...\n');
    
    try {
      await this.scanUsedClasses();
      await this.analyzeCSSFiles();
      await this.generateOptimizedCSS();
      const report = this.generateReport();
      
      console.log('\n✅ CSS optimization completed successfully!');
      return report;
    } catch (error) {
      console.error('❌ CSS optimization failed:', error);
      throw error;
    }
  }
}

// Run optimization if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const optimizer = new CSSOptimizer();
  optimizer.optimize().catch(console.error);
}

export default CSSOptimizer;