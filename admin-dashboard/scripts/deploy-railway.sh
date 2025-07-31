#!/bin/bash

# Railway Deployment Script for Admin Dashboard
# This script handles deployment to Railway with proper environment configuration

set -e

echo "🚀 Starting Railway deployment for Admin Dashboard..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Please install it first:"
    echo "   npm install -g @railway/cli"
    echo "   or visit: https://railway.app/cli"
    exit 1
fi

# Set deployment environment
ENVIRONMENT=${1:-production}
echo "📦 Deploying to environment: $ENVIRONMENT"

# Validate environment
if [[ "$ENVIRONMENT" != "production" && "$ENVIRONMENT" != "staging" ]]; then
    echo "❌ Invalid environment. Use: production or staging"
    exit 1
fi

# Login check
echo "🔐 Checking Railway authentication..."
if ! railway whoami &> /dev/null; then
    echo "❌ Not logged in to Railway. Please run: railway login"
    exit 1
fi

# Build the application
echo "🔨 Building application..."
if [[ "$ENVIRONMENT" == "production" ]]; then
    npm run build:prod
else
    npm run build:staging
fi

# Run size check
echo "📏 Checking bundle sizes..."
npm run size-check || echo "⚠️  Size check warnings detected"

# Deploy to Railway
echo "🚀 Deploying to Railway..."
if [[ "$ENVIRONMENT" == "production" ]]; then
    railway up --environment production
else
    railway up --environment staging
fi

echo "✅ Deployment completed successfully!"
echo "🌐 Your admin dashboard is now live on Railway!"

# Get deployment URL
echo "🔗 Getting deployment URL..."
railway status