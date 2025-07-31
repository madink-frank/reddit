#!/bin/bash

# Vercel Deployment Script for Public Blog
set -e

echo "🚀 Starting Vercel deployment for Public Blog..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Set environment variables for production
export NODE_ENV=production

# Run pre-deployment checks
echo "🔍 Running pre-deployment checks..."

# Lint check
echo "📝 Running linter..."
npm run lint

# Type check
echo "🔧 Running TypeScript check..."
npx tsc --noEmit

# Run tests
echo "🧪 Running tests..."
npm run test

# Build the project
echo "🏗️  Building project..."
npm run build:production

# Check build size
echo "📊 Analyzing build size..."
du -sh dist/

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
if [ "$1" = "preview" ]; then
    echo "📋 Deploying preview version..."
    vercel
else
    echo "🌟 Deploying to production..."
    vercel --prod
fi

echo "✅ Deployment completed successfully!"
echo "🌐 Your blog is now live!"