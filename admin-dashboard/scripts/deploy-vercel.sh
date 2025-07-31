#!/bin/bash

# Vercel Deployment Script for Admin Dashboard
# This script handles deployment to Vercel with proper environment configuration

set -e

echo "🚀 Starting Vercel deployment for Admin Dashboard..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Set deployment environment
ENVIRONMENT=${1:-production}
echo "📦 Deploying to environment: $ENVIRONMENT"

# Validate environment
if [[ "$ENVIRONMENT" != "production" && "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "preview" ]]; then
    echo "❌ Invalid environment. Use: production, staging, or preview"
    exit 1
fi

# Build the application
echo "🔨 Building application..."
if [[ "$ENVIRONMENT" == "production" ]]; then
    npm run build:prod
elif [[ "$ENVIRONMENT" == "staging" ]]; then
    npm run build:staging
else
    npm run build:dev
fi

# Run size check
echo "📏 Checking bundle sizes..."
npm run size-check || echo "⚠️  Size check warnings detected"

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
if [[ "$ENVIRONMENT" == "production" ]]; then
    vercel --prod --yes
elif [[ "$ENVIRONMENT" == "staging" ]]; then
    vercel --target staging --yes
else
    vercel --yes
fi

echo "✅ Deployment completed successfully!"
echo "🌐 Your admin dashboard is now live!"

# Optional: Open the deployed URL
if command -v open &> /dev/null; then
    echo "🔗 Opening deployed application..."
    vercel --url | xargs open
fi