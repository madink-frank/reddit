#!/bin/bash

# Reddit Content Platform - Staging Deployment Script

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log "Starting staging deployment..."

# Deploy backend to Railway staging
log "Deploying backend to Railway staging environment..."
railway up --environment staging

# Deploy admin dashboard to Vercel preview
log "Deploying admin dashboard to Vercel preview..."
cd admin-dashboard
vercel --yes
cd ..

# Deploy public blog to Vercel preview
log "Deploying public blog to Vercel preview..."
cd public-blog
vercel --yes
cd ..

success "Staging deployment completed!"
warning "Please test the staging environment before promoting to production"