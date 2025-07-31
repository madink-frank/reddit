#!/usr/bin/env node

/**
 * CSS Purging Utility
 * 
 * This script removes unused CSS classes from the final build
 * to reduce bundle size and improve performance.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CSSPurger {
  constructor() {
    this.srcDir = path.join(__dirname, '../src');
    this.distDir = path.join(__dirname, '../dist');
    this.usedClasses = new Set();
    this.usedIds = new Set();
    this.usedTags = new Set();
    this.purgeStats = {
      originalRules: 0,
      purgedRules: 0,
      keptRules: 0,
      originalSize: 0,
      purgedSize: 0,
      savings: 0
    };
  }

  /**
   * Scan all source files for used CSS selectors
   */
  async scanUsedSelectors() {
    console.log('🔍 Scanning for used CSS selectors...');
    
    // Scan React components
    const componentFiles = await glob('**/*.{tsx,jsx,ts,js}', { 
      cwd: this.srcDir,
      absolute: true 
    });

    // Scan HTML files
    const htmlFiles = await glob('**/*.html', { 
      cwd: path.join(__dirname, '..'),
      absolute: true 
    });

    const allFiles = [...componentFiles, ...htmlFiles];

    for (const file of allFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      this.extractSelectorsFromContent(content);
    }

    console.log(`✅ Found ${this.usedClasses.size} used classes`);
    console.log(`✅ Found ${this.usedIds.size} used IDs`);
    console.log(`✅ Found ${this.usedTags.size} used tags`);
  }

  /**
   * Extract CSS selectors from file content
   */
  extractSelectorsFromContent(content) {
    // Extract className values
    const classNameMatches = content.match(/className\s*=\s*["'`]([^"'`]+)["'`]/g) || [];
    const classNameExpressions = content.match(/className\s*=\s*\{[^}]+\}/g) || [];
    
    // Extract class attributes from HTML
    const htmlClassMatches = content.match(/class\s*=\s*["']([^"']+)["']/g) || [];
    
    // Extract id attributes
    const idMatches = content.match(/id\s*=\s*["']([^"']+)["']/g) || [];
    
    // Extract HTML tags
    const tagMatches = content.match(/<(\w+)[\s>]/g) || [];

    // Process className strings
    [...classNameMatches, ...htmlClassMatches].forEach(match => {
      const classes = match.match(/["']([^"']+)["']/)?.[1];
      if (classes) {
        classes.split(/\s+/).forEach(cls => {
          if (cls.trim()) {
            this.usedClasses.add(cls.trim());
          }
        });
      }
    });

    // Process className expressions (basic extraction)
    classNameExpressions.forEach(expr => {
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

    // Process IDs
    idMatches.forEach(match => {
      const id = match.match(/["']([^"']+)["']/)?.[1];
      if (id && id.trim()) {
        this.usedIds.add(id.trim());
      }
    });

    // Process HTML tags
    tagMatches.forEach(match => {
      const tag = match.match(/<(\w+)/)?.[1];
      if (tag) {
        this.usedTags.add(tag.toLowerCase());
      }
    });

    // Add common HTML tags that might not be in components
    const commonTags = ['html', 'body', 'head', 'title', 'meta', 'link', 'script', 'style'];
    commonTags.forEach(tag => this.usedTags.add(tag));
  }

  /**
   * Parse CSS and identify rules to keep or purge
   */
  async purgeCSS() {
    console.log('🧹 Purging unused CSS...');
    
    const cssFiles = await glob('**/*.css', { 
      cwd: this.srcDir,
      absolute: true 
    });

    let totalOriginalSize = 0;
    let totalPurgedSize = 0;
    const purgedCSS = [];

    for (const file of cssFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      totalOriginalSize += content.length;
      
      const { purged, stats } = this.purgeFileCSS(content, file);
      purgedCSS.push({ file, content: purged, stats });
      totalPurgedSize += purged.length;
    }

    this.purgeStats.originalSize = totalOriginalSize;
    this.purgeStats.purgedSize = totalPurgedSize;
    this.purgeStats.savings = totalOriginalSize - totalPurgedSize;

    return purgedCSS;
  }

  /**
   * Purge CSS from a single file
   */
  purgeFileCSS(css, filename) {
    const rules = this.parseCSSRules(css);
    const keptRules = [];
    const purgedRules = [];

    rules.forEach(rule => {
      if (this.shouldKeepRule(rule)) {
        keptRules.push(rule);
      } else {
        purgedRules.push(rule);
      }
    });

    const purgedCSS = keptRules.map(rule => rule.fullRule).join('\n');
    
    return {
      purged: purgedCSS,
      stats: {
        originalRules: rules.length,
        keptRules: keptRules.length,
        purgedRules: purgedRules.length,
        originalSize: css.length,
        purgedSize: purgedCSS.length
      }
    };
  }

  /**
   * Parse CSS into individual rules
   */
  parseCSSRules(css) {
    const rules = [];
    
    // Remove comments
    css = css.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // Handle @import, @charset, etc.
    const atRules = css.match(/@[^{;]+;/g) || [];
    atRules.forEach(rule => {
      rules.push({
        type: 'at-rule',
        selector: rule.trim(),
        declarations: '',
        fullRule: rule.trim(),
        size: rule.length
      });
    });

    // Handle @media, @keyframes, etc.
    const blockAtRules = css.match(/@[^{]+\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g) || [];
    blockAtRules.forEach(rule => {
      rules.push({
        type: 'at-block',
        selector: rule.match(/@[^{]+/)?.[0] || '',
        declarations: rule.match(/\{([\s\S]*)\}$/)?.[1] || '',
        fullRule: rule.trim(),
        size: rule.length
      });
    });

    // Handle regular CSS rules
    const regularCSS = css.replace(/@[^{;]+;/g, '').replace(/@[^{]+\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g, '');
    const ruleBlocks = regularCSS.split('}').filter(block => block.trim());
    
    ruleBlocks.forEach(block => {
      const parts = block.split('{');
      if (parts.length === 2) {
        const selector = parts[0].trim();
        const declarations = parts[1].trim();
        
        if (selector && declarations) {
          rules.push({
            type: 'rule',
            selector,
            declarations,
            fullRule: `${selector} { ${declarations} }`,
            size: block.length + 1
          });
        }
      }
    });

    return rules;
  }

  /**
   * Determine if a CSS rule should be kept
   */
  shouldKeepRule(rule) {
    // Always keep at-rules like @import, @charset
    if (rule.type === 'at-rule') {
      return true;
    }

    // Always keep @media, @keyframes, etc.
    if (rule.type === 'at-block') {
      return this.shouldKeepAtBlock(rule.selector);
    }

    // Check regular CSS rules
    return this.shouldKeepSelector(rule.selector);
  }

  /**
   * Check if an at-block should be kept
   */
  shouldKeepAtBlock(selector) {
    // Keep media queries
    if (selector.includes('@media')) {
      return true;
    }

    // Keep keyframes that are used
    if (selector.includes('@keyframes')) {
      const animationName = selector.match(/@keyframes\s+([^\s{]+)/)?.[1];
      if (animationName) {
        // Check if animation is used in any CSS or component
        return this.isAnimationUsed(animationName);
      }
    }

    // Keep other at-blocks by default
    return true;
  }

  /**
   * Check if a CSS selector should be kept
   */
  shouldKeepSelector(selector) {
    // Always keep universal selectors and pseudo-elements
    if (selector.includes('*') || selector.includes('::')) {
      return true;
    }

    // Always keep :root and html/body
    if (selector.includes(':root') || selector.match(/^(html|body)\b/)) {
      return true;
    }

    // Keep selectors with pseudo-classes that might be dynamic
    const dynamicPseudoClasses = [':hover', ':focus', ':active', ':visited', ':disabled', ':checked'];
    if (dynamicPseudoClasses.some(pseudo => selector.includes(pseudo))) {
      return this.shouldKeepBaseSelector(selector.replace(/:[a-z-]+/g, ''));
    }

    // Check the base selector
    return this.shouldKeepBaseSelector(selector);
  }

  /**
   * Check if a base selector (without pseudo-classes) should be kept
   */
  shouldKeepBaseSelector(selector) {
    // Split complex selectors
    const parts = selector.split(/[,\s>+~]/).filter(part => part.trim());
    
    return parts.some(part => {
      const trimmedPart = part.trim();
      
      // Check class selectors
      if (trimmedPart.startsWith('.')) {
        const className = trimmedPart.substring(1);
        return this.usedClasses.has(className) || this.isUtilityClass(className);
      }
      
      // Check ID selectors
      if (trimmedPart.startsWith('#')) {
        const id = trimmedPart.substring(1);
        return this.usedIds.has(id);
      }
      
      // Check tag selectors
      if (/^[a-zA-Z][a-zA-Z0-9]*$/.test(trimmedPart)) {
        return this.usedTags.has(trimmedPart.toLowerCase());
      }
      
      // Keep attribute selectors and other complex selectors
      if (trimmedPart.includes('[') || trimmedPart.includes(':')) {
        return true;
      }
      
      return false;
    });
  }

  /**
   * Check if a class is a utility class that should be kept
   */
  isUtilityClass(className) {
    // Tailwind utility patterns
    const utilityPatterns = [
      /^(sr-only|not-sr-only)$/,
      /^(container)$/,
      /^(flex|grid|block|inline|hidden)$/,
      /^(relative|absolute|fixed|sticky)$/,
      /^[pm][xy]?-\d+$/,
      /^text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl)$/,
      /^font-(thin|light|normal|medium|semibold|bold|extrabold|black)$/,
      /^(bg|text|border)-(white|black|gray|red|blue|green|yellow|purple|pink|indigo)-\d+$/,
      /^w-(auto|full|screen|\d+)$/,
      /^h-(auto|full|screen|\d+)$/,
      /^rounded(-none|-sm|-md|-lg|-xl|-2xl|-3xl|-full)?$/,
      /^shadow(-none|-sm|-md|-lg|-xl|-2xl|-inner)?$/,
      /^opacity-\d+$/,
      /^z-\d+$/,
      /^animate-(spin|ping|pulse|bounce)$/,
      /^transition(-none|-all|-colors|-opacity|-shadow|-transform)?$/,
      /^duration-\d+$/,
      /^ease-(linear|in|out|in-out)$/,
    ];

    return utilityPatterns.some(pattern => pattern.test(className));
  }

  /**
   * Check if an animation is used
   */
  isAnimationUsed(animationName) {
    // Common animations that should be kept
    const commonAnimations = ['spin', 'pulse', 'bounce', 'ping', 'fadeIn', 'fadeOut', 'slideIn', 'slideOut'];
    if (commonAnimations.includes(animationName)) {
      return true;
    }

    // Check if animation is referenced in CSS or components
    return this.usedClasses.has(`animate-${animationName}`);
  }

  /**
   * Write purged CSS files
   */
  async writePurgedCSS(purgedCSS) {
    console.log('💾 Writing purged CSS files...');
    
    const outputDir = path.join(this.distDir, 'purged-css');
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    for (const { file, content, stats } of purgedCSS) {
      const relativePath = path.relative(this.srcDir, file);
      const outputPath = path.join(outputDir, relativePath);
      const outputDirPath = path.dirname(outputPath);
      
      if (!fs.existsSync(outputDirPath)) {
        fs.mkdirSync(outputDirPath, { recursive: true });
      }
      
      fs.writeFileSync(outputPath, content);
      
      this.purgeStats.originalRules += stats.originalRules;
      this.purgeStats.keptRules += stats.keptRules;
      this.purgeStats.purgedRules += stats.purgedRules;
    }
  }

  /**
   * Generate purge report
   */
  generateReport() {
    console.log('📋 Generating purge report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        originalSize: `${(this.purgeStats.originalSize / 1024).toFixed(2)} KB`,
        purgedSize: `${(this.purgeStats.purgedSize / 1024).toFixed(2)} KB`,
        savings: `${(this.purgeStats.savings / 1024).toFixed(2)} KB`,
        savingsPercentage: `${((this.purgeStats.savings / this.purgeStats.originalSize) * 100).toFixed(2)}%`,
        originalRules: this.purgeStats.originalRules,
        keptRules: this.purgeStats.keptRules,
        purgedRules: this.purgeStats.purgedRules,
        purgePercentage: `${((this.purgeStats.purgedRules / this.purgeStats.originalRules) * 100).toFixed(2)}%`
      },
      details: {
        usedClasses: this.usedClasses.size,
        usedIds: this.usedIds.size,
        usedTags: this.usedTags.size,
      },
      recommendations: [
        'Consider using CSS-in-JS for component-specific styles',
        'Implement tree-shaking for JavaScript modules',
        'Use PostCSS plugins for further optimization',
        'Consider critical CSS inlining for above-the-fold content',
        'Implement lazy loading for non-critical CSS'
      ]
    };

    const reportPath = path.join(this.distDir, 'css-purge-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Console output
    console.log('\n📊 CSS Purge Report:');
    console.log(`Original Size: ${report.summary.originalSize}`);
    console.log(`Purged Size: ${report.summary.purgedSize}`);
    console.log(`Savings: ${report.summary.savings} (${report.summary.savingsPercentage})`);
    console.log(`Rules Purged: ${report.summary.purgedRules}/${report.summary.originalRules} (${report.summary.purgePercentage})`);
    console.log(`\n📄 Full report saved to: ${reportPath}`);

    return report;
  }

  /**
   * Run the complete purging process
   */
  async purge() {
    console.log('🚀 Starting CSS purging...\n');
    
    try {
      await this.scanUsedSelectors();
      const purgedCSS = await this.purgeCSS();
      await this.writePurgedCSS(purgedCSS);
      const report = this.generateReport();
      
      console.log('\n✅ CSS purging completed successfully!');
      return report;
    } catch (error) {
      console.error('❌ CSS purging failed:', error);
      throw error;
    }
  }
}

// Run purging if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const purger = new CSSPurger();
  purger.purge().catch(console.error);
}

export default CSSPurger;