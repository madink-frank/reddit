#!/usr/bin/env node

/**
 * Visual Regression Test Runner Script
 * 
 * This script orchestrates the execution of visual regression tests for the Input component
 * with icons, providing a comprehensive testing workflow.
 * 
 * Requirements covered:
 * - 2.4: Focus ring appearance with icons
 * - 3.1: Icon positioning in different browser environments
 * - 3.2: Icon scaling with different input sizes
 * - 3.3: Icon behavior with error/success states
 */

const { execSync, spawn } = require('child_process');
const { existsSync, mkdirSync } = require('fs');
const path = require('path');

class VisualRegressionTestRunner {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.testResultsDir = path.join(this.projectRoot, 'test-results');
    this.screenshotsDir = path.join(this.testResultsDir, 'screenshots');
    
    // Ensure directories exist
    this.ensureDirectories();
  }

  ensureDirectories() {
    const dirs = [this.testResultsDir, this.screenshotsDir];
    dirs.forEach(dir => {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    });
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '📋',
      success: '✅',
      error: '❌',
      warning: '⚠️'
    }[type] || '📋';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async runCommand(command, options = {}) {
    return new Promise((resolve, reject) => {
      this.log(`Running: ${command}`);
      
      const child = spawn('sh', ['-c', command], {
        cwd: this.projectRoot,
        stdio: 'inherit',
        ...options
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command failed with exit code ${code}`));
        }
      });

      child.on('error', reject);
    });
  }

  async checkPrerequisites() {
    this.log('Checking prerequisites...');
    
    try {
      // Check if Node.js dependencies are installed
      if (!existsSync(path.join(this.projectRoot, 'node_modules'))) {
        this.log('Installing Node.js dependencies...', 'warning');
        await this.runCommand('npm install');
      }
      
      // Check if Playwright browsers are installed
      try {
        execSync('npx playwright --version', { cwd: this.projectRoot, stdio: 'pipe' });
      } catch {
        this.log('Installing Playwright browsers...', 'warning');
        await this.runCommand('npx playwright install');
      }
      
      this.log('Prerequisites check completed', 'success');
    } catch (error) {
      this.log(`Prerequisites check failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async runJestVisualTests() {
    this.log('Running Jest-based visual regression tests...');
    
    try {
      await this.runCommand(
        'npm test -- --testPathPattern=input-icon-visual-regression.test.tsx --verbose --coverage=false'
      );
      this.log('Jest visual tests completed', 'success');
    } catch (error) {
      this.log(`Jest visual tests failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async runPlaywrightVisualTests() {
    this.log('Running Playwright-based visual regression tests...');
    
    try {
      // Start development server in background
      this.log('Starting development server...');
      const devServer = spawn('npm', ['run', 'dev'], {
        cwd: this.projectRoot,
        stdio: 'pipe'
      });

      // Wait for server to start
      await new Promise((resolve) => {
        setTimeout(resolve, 5000);
      });

      try {
        // Run Playwright tests
        await this.runCommand(
          'npx playwright test e2e/input-icon-visual-regression.spec.ts --reporter=html,json'
        );
        this.log('Playwright visual tests completed', 'success');
      } finally {
        // Clean up development server
        devServer.kill();
        this.log('Development server stopped');
      }
    } catch (error) {
      this.log(`Playwright visual tests failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async generateReport() {
    this.log('Generating comprehensive test report...');
    
    try {
      // Run the visual regression runner to generate report
      await this.runCommand(
        'npx ts-node src/test/visual-regression-runner.ts run'
      );
      this.log('Test report generated', 'success');
    } catch (error) {
      this.log(`Report generation failed: ${error.message}`, 'warning');
      // Don't throw here as this is not critical
    }
  }

  async runAllTests() {
    const startTime = Date.now();
    
    try {
      this.log('🎨 Starting Input Icon Visual Regression Tests');
      this.log('='.repeat(60));
      
      // Check prerequisites
      await this.checkPrerequisites();
      
      // Run Jest tests
      await this.runJestVisualTests();
      
      // Run Playwright tests
      await this.runPlaywrightVisualTests();
      
      // Generate comprehensive report
      await this.generateReport();
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      this.log('='.repeat(60));
      this.log(`🎉 All visual regression tests completed in ${duration}s`, 'success');
      
      // Show results location
      this.log(`📄 Test results available at: ${this.testResultsDir}`);
      this.log(`📸 Screenshots available at: ${this.screenshotsDir}`);
      
    } catch (error) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      this.log('='.repeat(60));
      this.log(`❌ Visual regression tests failed after ${duration}s`, 'error');
      this.log(`Error: ${error.message}`, 'error');
      process.exit(1);
    }
  }

  async updateBaselines() {
    this.log('📸 Updating baseline images...');
    
    try {
      await this.runCommand(
        'npx ts-node src/test/visual-regression-runner.ts update-baselines'
      );
      this.log('Baseline images updated', 'success');
    } catch (error) {
      this.log(`Baseline update failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async cleanup() {
    this.log('🧹 Cleaning up test artifacts...');
    
    try {
      await this.runCommand(
        'npx ts-node src/test/visual-regression-runner.ts cleanup'
      );
      this.log('Cleanup completed', 'success');
    } catch (error) {
      this.log(`Cleanup failed: ${error.message}`, 'error');
      throw error;
    }
  }
}

// CLI interface
async function main() {
  const runner = new VisualRegressionTestRunner();
  const command = process.argv[2] || 'run';
  
  switch (command) {
    case 'run':
      await runner.runAllTests();
      break;
      
    case 'jest':
      await runner.checkPrerequisites();
      await runner.runJestVisualTests();
      break;
      
    case 'playwright':
      await runner.checkPrerequisites();
      await runner.runPlaywrightVisualTests();
      break;
      
    case 'update-baselines':
      await runner.updateBaselines();
      break;
      
    case 'cleanup':
      await runner.cleanup();
      break;
      
    case 'help':
      console.log(`
🎨 Input Icon Visual Regression Test Runner

Usage: node scripts/run-visual-regression-tests.js [command]

Commands:
  run              Run all visual regression tests (default)
  jest             Run only Jest-based visual tests
  playwright       Run only Playwright-based visual tests
  update-baselines Update baseline images from current test run
  cleanup          Clean up test artifacts
  help             Show this help message

Examples:
  node scripts/run-visual-regression-tests.js
  node scripts/run-visual-regression-tests.js playwright
  node scripts/run-visual-regression-tests.js update-baselines
      `);
      break;
      
    default:
      console.error(`Unknown command: ${command}`);
      console.error('Run "node scripts/run-visual-regression-tests.js help" for usage information');
      process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  });
}

module.exports = { VisualRegressionTestRunner };