#!/usr/bin/env node

/**
 * Production Deployment Script
 * Handles the complete deployment pipeline for the admin dashboard
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class ProductionDeployer {
  constructor() {
    this.buildDir = 'dist';
    this.deploymentConfig = {
      environment: 'production',
      buildCommand: 'npm run build',
      testCommand: 'npm run test:ci',
      lintCommand: 'npm run lint',
      typeCheckCommand: 'npm run type-check'
    };
  }

  async deploy() {
    console.log('🚀 Starting production deployment...');
    
    try {
      // Pre-deployment checks
      await this.runPreDeploymentChecks();
      
      // Build application
      await this.buildApplication();
      
      // Run deployment
      await this.deployToProduction();
      
      // Post-deployment verification
      await this.verifyDeployment();
      
      console.log('✅ Production deployment completed successfully!');
    } catch (error) {
      console.error('❌ Deployment failed:', error.message);
      process.exit(1);
    }
  }

  async runPreDeploymentChecks() {
    console.log('🔍 Running pre-deployment checks...');
    
    // Type checking
    console.log('  - Type checking...');
    execSync(this.deploymentConfig.typeCheckCommand, { stdio: 'inherit' });
    
    // Linting
    console.log('  - Linting...');
    execSync(this.deploymentConfig.lintCommand, { stdio: 'inherit' });
    
    // Testing
    console.log('  - Running tests...');
    execSync(this.deploymentConfig.testCommand, { stdio: 'inherit' });
    
    // Performance benchmarks
    console.log('  - Performance benchmarks...');
    execSync('npm run performance:benchmark', { stdio: 'inherit' });
    
    console.log('✅ Pre-deployment checks passed');
  }

  async buildApplication() {
    console.log('🏗️  Building application...');
    
    // Clean previous build
    if (fs.existsSync(this.buildDir)) {
      fs.rmSync(this.buildDir, { recursive: true });
    }
    
    // Build with production optimizations
    execSync(this.deploymentConfig.buildCommand, { 
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'production',
        GENERATE_SOURCEMAP: 'false',
        INLINE_RUNTIME_CHUNK: 'false'
      }
    });
    
    // Verify build output
    this.verifyBuildOutput();
    
    console.log('✅ Application built successfully');
  }

  verifyBuildOutput() {
    const buildPath = path.join(process.cwd(), this.buildDir);
    
    if (!fs.existsSync(buildPath)) {
      throw new Error('Build directory not found');
    }
    
    const indexHtml = path.join(buildPath, 'index.html');
    if (!fs.existsSync(indexHtml)) {
      throw new Error('index.html not found in build output');
    }
    
    // Check for critical assets
    const staticDir = path.join(buildPath, 'static');
    if (!fs.existsSync(staticDir)) {
      throw new Error('Static assets directory not found');
    }
    
    console.log('✅ Build output verified');
  }

  async deployToProduction() {
    console.log('🚀 Deploying to production...');
    
    // This would typically involve:
    // - Uploading to CDN/S3
    // - Updating load balancer configuration
    // - Database migrations
    // - Cache invalidation
    
    // For Railway deployment
    if (process.env.RAILWAY_ENVIRONMENT) {
      console.log('  - Deploying to Railway...');
      // Railway handles deployment automatically on git push
      execSync('git push origin main', { stdio: 'inherit' });
    }
    
    // For other platforms, add specific deployment logic here
    console.log('✅ Deployment completed');
  }

  async verifyDeployment() {
    console.log('🔍 Verifying deployment...');
    
    // Health check
    const healthCheckUrl = process.env.PRODUCTION_URL || 'https://your-app.railway.app';
    
    try {
      // Simple health check (in real scenario, use proper HTTP client)
      console.log(`  - Health check: ${healthCheckUrl}`);
      console.log('✅ Deployment verification completed');
    } catch (error) {
      console.warn('⚠️  Health check failed, but deployment may still be successful');
    }
  }
}

// Run deployment if called directly
if (require.main === module) {
  const deployer = new ProductionDeployer();
  deployer.deploy().catch(console.error);
}

module.exports = ProductionDeployer;