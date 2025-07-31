#!/usr/bin/env node

/**
 * Bundle Size Analysis Tool
 * Analyzes and tracks bundle size changes over time
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class BundleSizeAnalyzer {
  constructor() {
    this.thresholds = {
      javascript: 1024 * 1024, // 1MB
      css: 256 * 1024, // 256KB
      total: 2 * 1024 * 1024, // 2MB
      individual: 500 * 1024 // 500KB per file
    };
    
    this.historyFile = path.join(__dirname, '../bundle-size-history.json');
  }

  async analyze() {
    console.log('📊 Analyzing bundle size...');
    
    // Ensure build exists
    const distPath = path.join(__dirname, '../dist');
    if (!fs.existsSync(distPath)) {
      console.log('🔨 Building project first...');
      execSync('npm run build', { stdio: 'inherit' });
    }

    const analysis = this.analyzeBundleContents(distPath);
    const recommendations = this.generateRecommendations(analysis);
    
    // Save to history
    this.saveToHistory(analysis);
    
    // Generate report
    this.generateSizeReport(analysis, recommendations);
    
    return { analysis, recommendations };
  }

  analyzeBundleContents(distPath) {
    const files = [];
    let totalSize = 0;

    const scanDirectory = (currentPath, relativePath = '') => {
      const items = fs.readdirSync(currentPath);
      
      items.forEach(item => {
        const itemPath = path.join(currentPath, item);
        const stat = fs.statSync(itemPath);
        const relativeItemPath = path.join(relativePath, item);
        
        if (stat.isDirectory()) {
          scanDirectory(itemPath, relativeItemPath);
        } else {
          const fileInfo = {
            name: relativeItemPath,
            size: stat.size,
            type: this.getFileType(item),
            gzipSize: this.estimateGzipSize(stat.size)
          };
          
          files.push(fileInfo);
          totalSize += stat.size;
        }
      });
    };

    scanDirectory(distPath);

    // Categorize files
    const categories = this.categorizeFiles(files);
    
    return {
      timestamp: new Date().toISOString(),
      totalSize,
      totalGzipSize: files.reduce((sum, file) => sum + file.gzipSize, 0),
      fileCount: files.length,
      files: files.sort((a, b) => b.size - a.size),
      categories
    };
  }

  getFileType(filename) {
    const ext = path.extname(filename).toLowerCase();
    
    if (['.js', '.mjs', '.jsx'].includes(ext)) return 'javascript';
    if (['.css', '.scss'].includes(ext)) return 'css';
    if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico'].includes(ext)) return 'image';
    if (['.woff', '.woff2', '.ttf', '.otf'].includes(ext)) return 'font';
    if (['.html'].includes(ext)) return 'html';
    if (['.json', '.xml'].includes(ext)) return 'data';
    
    return 'other';
  }

  categorizeFiles(files) {
    const categories = {};
    
    files.forEach(file => {
      if (!categories[file.type]) {
        categories[file.type] = {
          files: [],
          totalSize: 0,
          totalGzipSize: 0,
          count: 0
        };
      }
      
      categories[file.type].files.push(file);
      categories[file.type].totalSize += file.size;
      categories[file.type].totalGzipSize += file.gzipSize;
      categories[file.type].count++;
    });

    return categories;
  }

  estimateGzipSize(originalSize) {
    // Rough estimation: gzip typically reduces size by 60-80%
    return Math.floor(originalSize * 0.3);
  }

  generateRecommendations(analysis) {
    const recommendations = [];

    // Check total bundle size
    if (analysis.totalSize > this.thresholds.total) {
      recommendations.push({
        type: 'critical',
        category: 'bundle-size',
        message: `Total bundle size (${this.formatBytes(analysis.totalSize)}) exceeds threshold (${this.formatBytes(this.thresholds.total)})`,
        suggestions: [
          'Implement code splitting',
          'Use dynamic imports for non-critical code',
          'Remove unused dependencies',
          'Optimize images and assets'
        ]
      });
    }

    // Check individual large files
    const largeFiles = analysis.files.filter(file => file.size > this.thresholds.individual);
    if (largeFiles.length > 0) {
      recommendations.push({
        type: 'warning',
        category: 'large-files',
        message: `Found ${largeFiles.length} files larger than ${this.formatBytes(this.thresholds.individual)}`,
        files: largeFiles.slice(0, 5).map(f => ({ name: f.name, size: f.size })),
        suggestions: [
          'Split large JavaScript files',
          'Optimize or compress large assets',
          'Consider lazy loading for large components'
        ]
      });
    }

    // Check JavaScript bundle size
    const jsCategory = analysis.categories.javascript;
    if (jsCategory && jsCategory.totalSize > this.thresholds.javascript) {
      recommendations.push({
        type: 'warning',
        category: 'javascript',
        message: `JavaScript bundle size (${this.formatBytes(jsCategory.totalSize)}) is large`,
        suggestions: [
          'Implement tree shaking',
          'Use smaller alternative libraries',
          'Remove dead code',
          'Split vendor and app bundles'
        ]
      });
    }

    // Check for duplicate dependencies
    const duplicates = this.findPotentialDuplicates(analysis.files);
    if (duplicates.length > 0) {
      recommendations.push({
        type: 'info',
        category: 'duplicates',
        message: `Potential duplicate files detected`,
        files: duplicates,
        suggestions: [
          'Check for duplicate dependencies',
          'Optimize build configuration',
          'Use bundle analyzer for detailed analysis'
        ]
      });
    }

    return recommendations;
  }

  findPotentialDuplicates(files) {
    const duplicates = [];
    const sizeGroups = {};

    files.forEach(file => {
      if (!sizeGroups[file.size]) {
        sizeGroups[file.size] = [];
      }
      sizeGroups[file.size].push(file);
    });

    Object.values(sizeGroups).forEach(group => {
      if (group.length > 1 && group[0].size > 10 * 1024) { // Only check files > 10KB
        duplicates.push({
          size: group[0].size,
          files: group.map(f => f.name)
        });
      }
    });

    return duplicates.slice(0, 5); // Limit to top 5
  }

  saveToHistory(analysis) {
    let history = [];
    
    if (fs.existsSync(this.historyFile)) {
      try {
        history = JSON.parse(fs.readFileSync(this.historyFile, 'utf8'));
      } catch (error) {
        console.warn('Could not read history file, starting fresh');
      }
    }

    // Keep only last 30 entries
    history.push({
      timestamp: analysis.timestamp,
      totalSize: analysis.totalSize,
      totalGzipSize: analysis.totalGzipSize,
      fileCount: analysis.fileCount,
      categories: Object.keys(analysis.categories).reduce((acc, key) => {
        acc[key] = {
          totalSize: analysis.categories[key].totalSize,
          count: analysis.categories[key].count
        };
        return acc;
      }, {})
    });

    history = history.slice(-30);
    
    fs.writeFileSync(this.historyFile, JSON.stringify(history, null, 2));
  }

  generateSizeReport(analysis, recommendations) {
    const reportPath = path.join(__dirname, '../BUNDLE_SIZE_REPORT.md');
    
    const report = `# Bundle Size Analysis Report

Generated: ${analysis.timestamp}

## Summary

- **Total Bundle Size:** ${this.formatBytes(analysis.totalSize)}
- **Estimated Gzipped:** ${this.formatBytes(analysis.totalGzipSize)}
- **Total Files:** ${analysis.fileCount}
- **Compression Ratio:** ${((1 - analysis.totalGzipSize / analysis.totalSize) * 100).toFixed(1)}%

## Size by Category

${Object.entries(analysis.categories)
  .sort(([,a], [,b]) => b.totalSize - a.totalSize)
  .map(([type, data]) => `- **${type.toUpperCase()}:** ${this.formatBytes(data.totalSize)} (${data.count} files, ~${this.formatBytes(data.totalGzipSize)} gzipped)`)
  .join('\n')}

## Largest Files

${analysis.files.slice(0, 15)
  .map((file, index) => `${index + 1}. **${file.name}** - ${this.formatBytes(file.size)} (~${this.formatBytes(file.gzipSize)} gzipped)`)
  .join('\n')}

## Recommendations

${recommendations.length === 0 ? '✅ No issues found! Bundle size is within acceptable limits.' : ''}

${recommendations.map(rec => `### ${rec.type.toUpperCase()}: ${rec.category}

**Issue:** ${rec.message}

**Suggestions:**
${rec.suggestions.map(s => `- ${s}`).join('\n')}

${rec.files ? `**Affected Files:**\n${rec.files.map(f => `- ${f.name}: ${this.formatBytes(f.size)}`).join('\n')}` : ''}
`).join('\n')}

## Size Thresholds

- **Total Bundle:** ${this.formatBytes(this.thresholds.total)}
- **JavaScript:** ${this.formatBytes(this.thresholds.javascript)}
- **CSS:** ${this.formatBytes(this.thresholds.css)}
- **Individual Files:** ${this.formatBytes(this.thresholds.individual)}

## Optimization Tips

1. **Code Splitting:** Split your bundle into smaller chunks that load on demand
2. **Tree Shaking:** Remove unused code from your bundles
3. **Compression:** Enable gzip/brotli compression on your server
4. **Image Optimization:** Use WebP format and appropriate sizing
5. **Dependency Analysis:** Regularly audit and remove unused dependencies

---
*Generated by Bundle Size Analyzer*
`;

    fs.writeFileSync(reportPath, report);
    console.log(`📄 Bundle size report saved to: ${reportPath}`);
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async run() {
    try {
      const result = await this.analyze();
      
      console.log('\n📊 Bundle Size Analysis Complete!');
      console.log(`Total Size: ${this.formatBytes(result.analysis.totalSize)}`);
      console.log(`Gzipped: ${this.formatBytes(result.analysis.totalGzipSize)}`);
      console.log(`Files: ${result.analysis.fileCount}`);
      
      if (result.recommendations.length > 0) {
        console.log(`\n⚠️  ${result.recommendations.length} recommendations found`);
        result.recommendations.forEach(rec => {
          console.log(`- ${rec.type.toUpperCase()}: ${rec.message}`);
        });
      } else {
        console.log('\n✅ Bundle size looks good!');
      }
      
      return result;
    } catch (error) {
      console.error('❌ Bundle analysis failed:', error);
      throw error;
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const analyzer = new BundleSizeAnalyzer();
  analyzer.run().catch(console.error);
}

export default BundleSizeAnalyzer;