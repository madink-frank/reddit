import { execSync } from 'child_process';
import { existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

/**
 * Visual Regression Test Runner
 * 
 * This utility manages the execution of visual regression tests for the Input component
 * with icons, including baseline image management and test result reporting.
 * 
 * Requirements covered:
 * - 2.4: Focus ring appearance with icons
 * - 3.1: Icon positioning in different browser environments
 * - 3.2: Icon scaling with different input sizes  
 * - 3.3: Icon behavior with error/success states
 */

interface TestResult {
  testName: string;
  status: 'passed' | 'failed' | 'new';
  screenshotPath?: string;
  baselinePath?: string;
  diffPath?: string;
  error?: string;
}

interface TestSuite {
  name: string;
  results: TestResult[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  newTests: number;
}

class VisualRegressionRunner {
  private readonly testDir: string;
  private readonly baselineDir: string;
  private readonly outputDir: string;
  private readonly diffDir: string;

  constructor() {
    this.testDir = join(process.cwd(), 'admin-dashboard');
    this.baselineDir = join(this.testDir, 'test-results', 'baseline');
    this.outputDir = join(this.testDir, 'test-results', 'current');
    this.diffDir = join(this.testDir, 'test-results', 'diff');
    
    // Ensure directories exist
    this.ensureDirectories();
  }

  private ensureDirectories(): void {
    const dirs = [this.baselineDir, this.outputDir, this.diffDir];
    dirs.forEach(dir => {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Run all visual regression tests for Input component with icons
   */
  async runAllTests(): Promise<TestSuite[]> {
    console.log('🎨 Starting Visual Regression Tests for Input Icons...\n');
    
    const testSuites: TestSuite[] = [];
    
    try {
      // Run Jest-based visual regression tests
      const jestResults = await this.runJestVisualTests();
      testSuites.push(jestResults);
      
      // Run Playwright-based visual regression tests
      const playwrightResults = await this.runPlaywrightVisualTests();
      testSuites.push(playwrightResults);
      
      // Generate comprehensive report
      this.generateReport(testSuites);
      
      return testSuites;
    } catch (error) {
      console.error('❌ Error running visual regression tests:', error);
      throw error;
    }
  }

  /**
   * Run Jest-based visual regression tests
   */
  private async runJestVisualTests(): Promise<TestSuite> {
    console.log('📋 Running Jest Visual Regression Tests...');
    
    const testSuite: TestSuite = {
      name: 'Jest Visual Regression Tests',
      results: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      newTests: 0
    };

    try {
      // Run the Jest test file
      const command = 'npm test -- --testPathPattern=input-icon-visual-regression.test.tsx --verbose';
      const output = execSync(command, { 
        cwd: this.testDir,
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      // Parse Jest output to extract test results
      const testResults = this.parseJestOutput(output);
      testSuite.results = testResults;
      testSuite.totalTests = testResults.length;
      testSuite.passedTests = testResults.filter(r => r.status === 'passed').length;
      testSuite.failedTests = testResults.filter(r => r.status === 'failed').length;
      testSuite.newTests = testResults.filter(r => r.status === 'new').length;
      
      console.log(`✅ Jest tests completed: ${testSuite.passedTests}/${testSuite.totalTests} passed`);
    } catch (error) {
      console.error('❌ Jest visual tests failed:', error);
      testSuite.results.push({
        testName: 'Jest Test Suite',
        status: 'failed',
        error: error instanceof Error ? error.message : String(error)
      });
      testSuite.totalTests = 1;
      testSuite.failedTests = 1;
    }

    return testSuite;
  }

  /**
   * Run Playwright-based visual regression tests
   */
  private async runPlaywrightVisualTests(): Promise<TestSuite> {
    console.log('🎭 Running Playwright Visual Regression Tests...');
    
    const testSuite: TestSuite = {
      name: 'Playwright Visual Regression Tests',
      results: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      newTests: 0
    };

    try {
      // Check if Playwright is installed
      if (!this.isPlaywrightInstalled()) {
        console.log('📦 Installing Playwright...');
        execSync('npx playwright install', { cwd: this.testDir });
      }
      
      // Run Playwright tests
      const command = 'npx playwright test e2e/input-icon-visual-regression.spec.ts --reporter=json';
      const output = execSync(command, { 
        cwd: this.testDir,
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      // Parse Playwright output
      const testResults = this.parsePlaywrightOutput(output);
      testSuite.results = testResults;
      testSuite.totalTests = testResults.length;
      testSuite.passedTests = testResults.filter(r => r.status === 'passed').length;
      testSuite.failedTests = testResults.filter(r => r.status === 'failed').length;
      testSuite.newTests = testResults.filter(r => r.status === 'new').length;
      
      console.log(`✅ Playwright tests completed: ${testSuite.passedTests}/${testSuite.totalTests} passed`);
    } catch (error) {
      console.error('❌ Playwright visual tests failed:', error);
      testSuite.results.push({
        testName: 'Playwright Test Suite',
        status: 'failed',
        error: error instanceof Error ? error.message : String(error)
      });
      testSuite.totalTests = 1;
      testSuite.failedTests = 1;
    }

    return testSuite;
  }

  /**
   * Check if Playwright is installed
   */
  private isPlaywrightInstalled(): boolean {
    try {
      execSync('npx playwright --version', { cwd: this.testDir, stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Parse Jest test output to extract results
   */
  private parseJestOutput(output: string): TestResult[] {
    const results: TestResult[] = [];
    const lines = output.split('\n');
    
    for (const line of lines) {
      if (line.includes('✓') || line.includes('✗')) {
        const testName = line.replace(/^\s*[✓✗]\s*/, '').trim();
        const status = line.includes('✓') ? 'passed' : 'failed';
        
        results.push({
          testName,
          status: status as 'passed' | 'failed'
        });
      }
    }
    
    return results;
  }

  /**
   * Parse Playwright test output to extract results
   */
  private parsePlaywrightOutput(output: string): TestResult[] {
    const results: TestResult[] = [];
    
    try {
      const jsonOutput = JSON.parse(output);
      
      if (jsonOutput.suites) {
        for (const suite of jsonOutput.suites) {
          for (const spec of suite.specs || []) {
            for (const test of spec.tests || []) {
              results.push({
                testName: test.title,
                status: test.outcome === 'expected' ? 'passed' : 'failed',
                screenshotPath: this.findScreenshotPath(test.title),
                error: test.outcome !== 'expected' ? 'Visual regression detected' : undefined
              });
            }
          }
        }
      }
    } catch (error) {
      console.warn('Could not parse Playwright JSON output, using fallback parsing');
      // Fallback to simple text parsing
      const lines = output.split('\n');
      for (const line of lines) {
        if (line.includes('✓') || line.includes('✗')) {
          const testName = line.replace(/^\s*[✓✗]\s*/, '').trim();
          const status = line.includes('✓') ? 'passed' : 'failed';
          
          results.push({
            testName,
            status: status as 'passed' | 'failed'
          });
        }
      }
    }
    
    return results;
  }

  /**
   * Find screenshot path for a test
   */
  private findScreenshotPath(testName: string): string | undefined {
    const screenshotName = testName.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '') + '.png';
    
    const possiblePaths = [
      join(this.outputDir, screenshotName),
      join(this.testDir, 'test-results', screenshotName),
      join(this.testDir, 'screenshots', screenshotName)
    ];
    
    return possiblePaths.find(path => existsSync(path));
  }

  /**
   * Generate comprehensive test report
   */
  private generateReport(testSuites: TestSuite[]): void {
    console.log('\n📊 Visual Regression Test Report');
    console.log('='.repeat(50));
    
    let totalTests = 0;
    let totalPassed = 0;
    let totalFailed = 0;
    let totalNew = 0;
    
    for (const suite of testSuites) {
      console.log(`\n📋 ${suite.name}`);
      console.log(`   Total: ${suite.totalTests}`);
      console.log(`   ✅ Passed: ${suite.passedTests}`);
      console.log(`   ❌ Failed: ${suite.failedTests}`);
      console.log(`   🆕 New: ${suite.newTests}`);
      
      totalTests += suite.totalTests;
      totalPassed += suite.passedTests;
      totalFailed += suite.failedTests;
      totalNew += suite.newTests;
      
      // Show failed tests
      const failedTests = suite.results.filter(r => r.status === 'failed');
      if (failedTests.length > 0) {
        console.log('\n   Failed Tests:');
        failedTests.forEach(test => {
          console.log(`   - ${test.testName}`);
          if (test.error) {
            console.log(`     Error: ${test.error}`);
          }
        });
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log(`📊 Overall Results:`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   ✅ Passed: ${totalPassed} (${((totalPassed / totalTests) * 100).toFixed(1)}%)`);
    console.log(`   ❌ Failed: ${totalFailed} (${((totalFailed / totalTests) * 100).toFixed(1)}%)`);
    console.log(`   🆕 New: ${totalNew} (${((totalNew / totalTests) * 100).toFixed(1)}%)`);
    
    if (totalFailed === 0) {
      console.log('\n🎉 All visual regression tests passed!');
    } else {
      console.log(`\n⚠️  ${totalFailed} visual regression test(s) failed. Please review the differences.`);
    }
    
    // Generate HTML report
    this.generateHtmlReport(testSuites);
  }

  /**
   * Generate HTML report for visual regression tests
   */
  private generateHtmlReport(testSuites: TestSuite[]): void {
    const reportPath = join(this.testDir, 'test-results', 'visual-regression-report.html');
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Input Icon Visual Regression Test Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; border-bottom: 3px solid #007acc; padding-bottom: 10px; }
        h2 { color: #555; margin-top: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .stat-card { background: #f8f9fa; padding: 20px; border-radius: 6px; text-align: center; border-left: 4px solid #007acc; }
        .stat-number { font-size: 2em; font-weight: bold; color: #007acc; }
        .stat-label { color: #666; margin-top: 5px; }
        .test-suite { margin: 30px 0; padding: 20px; border: 1px solid #ddd; border-radius: 6px; }
        .test-result { margin: 10px 0; padding: 15px; border-radius: 4px; }
        .test-passed { background: #d4edda; border-left: 4px solid #28a745; }
        .test-failed { background: #f8d7da; border-left: 4px solid #dc3545; }
        .test-new { background: #d1ecf1; border-left: 4px solid #17a2b8; }
        .test-name { font-weight: bold; margin-bottom: 5px; }
        .test-error { color: #721c24; font-size: 0.9em; margin-top: 5px; }
        .screenshot { max-width: 300px; border: 1px solid #ddd; border-radius: 4px; margin: 10px 0; }
        .timestamp { color: #666; font-size: 0.9em; text-align: right; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎨 Input Icon Visual Regression Test Report</h1>
        
        <div class="summary">
            <div class="stat-card">
                <div class="stat-number">${testSuites.reduce((sum, suite) => sum + suite.totalTests, 0)}</div>
                <div class="stat-label">Total Tests</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${testSuites.reduce((sum, suite) => sum + suite.passedTests, 0)}</div>
                <div class="stat-label">Passed</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${testSuites.reduce((sum, suite) => sum + suite.failedTests, 0)}</div>
                <div class="stat-label">Failed</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${testSuites.reduce((sum, suite) => sum + suite.newTests, 0)}</div>
                <div class="stat-label">New</div>
            </div>
        </div>
        
        ${testSuites.map(suite => `
            <div class="test-suite">
                <h2>${suite.name}</h2>
                <p>Total: ${suite.totalTests} | Passed: ${suite.passedTests} | Failed: ${suite.failedTests} | New: ${suite.newTests}</p>
                
                ${suite.results.map(result => `
                    <div class="test-result test-${result.status}">
                        <div class="test-name">${result.testName}</div>
                        ${result.error ? `<div class="test-error">Error: ${result.error}</div>` : ''}
                        ${result.screenshotPath ? `<img src="${result.screenshotPath}" alt="Screenshot" class="screenshot">` : ''}
                    </div>
                `).join('')}
            </div>
        `).join('')}
        
        <div class="timestamp">
            Report generated on ${new Date().toLocaleString()}
        </div>
    </div>
</body>
</html>`;
    
    require('fs').writeFileSync(reportPath, html);
    console.log(`\n📄 HTML report generated: ${reportPath}`);
  }

  /**
   * Update baseline images from current test run
   */
  async updateBaselines(): Promise<void> {
    console.log('📸 Updating baseline images...');
    
    try {
      // Copy current screenshots to baseline directory
      if (existsSync(this.outputDir)) {
        const files = readdirSync(this.outputDir);
        for (const file of files) {
          if (file.endsWith('.png')) {
            const sourcePath = join(this.outputDir, file);
            const targetPath = join(this.baselineDir, file);
            require('fs').copyFileSync(sourcePath, targetPath);
            console.log(`✅ Updated baseline: ${file}`);
          }
        }
      }
      
      console.log('🎉 Baseline images updated successfully!');
    } catch (error) {
      console.error('❌ Error updating baselines:', error);
      throw error;
    }
  }

  /**
   * Clean up test artifacts
   */
  cleanup(): void {
    console.log('🧹 Cleaning up test artifacts...');
    
    const dirsToClean = [this.outputDir, this.diffDir];
    
    for (const dir of dirsToClean) {
      if (existsSync(dir)) {
        const files = readdirSync(dir);
        for (const file of files) {
          const filePath = join(dir, file);
          if (statSync(filePath).isFile()) {
            require('fs').unlinkSync(filePath);
          }
        }
      }
    }
    
    console.log('✅ Cleanup completed');
  }
}

// Export for use in other modules
export { VisualRegressionRunner, TestResult, TestSuite };

// CLI usage
if (require.main === module) {
  const runner = new VisualRegressionRunner();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'run':
      runner.runAllTests()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;
      
    case 'update-baselines':
      runner.updateBaselines()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;
      
    case 'cleanup':
      runner.cleanup();
      process.exit(0);
      break;
      
    default:
      console.log('Usage: ts-node visual-regression-runner.ts [run|update-baselines|cleanup]');
      process.exit(1);
  }
}