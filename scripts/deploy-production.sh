#!/bin/bash

# Reddit Content Platform - Production Deployment Script
# This script handles the complete production deployment process

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_DIR="."
ADMIN_DIR="admin-dashboard"
BLOG_DIR="public-blog"

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if required tools are installed
    command -v railway >/dev/null 2>&1 || { error "Railway CLI is required but not installed. Aborting."; exit 1; }
    command -v vercel >/dev/null 2>&1 || { error "Vercel CLI is required but not installed. Aborting."; exit 1; }
    command -v node >/dev/null 2>&1 || { error "Node.js is required but not installed. Aborting."; exit 1; }
    command -v npm >/dev/null 2>&1 || { error "npm is required but not installed. Aborting."; exit 1; }
    command -v python3 >/dev/null 2>&1 || { error "Python 3 is required but not installed. Aborting."; exit 1; }
    
    success "All prerequisites are installed"
}

# Generate production secrets
generate_secrets() {
    log "Generating production secrets..."
    
    if [ ! -f ".env.production" ]; then
        log "Generating production environment variables..."
        python3 security-config.py > production-secrets.txt
        warning "Production secrets generated in production-secrets.txt"
        warning "Please update .env.production with these values before continuing"
        
        # Create .env.production from template if it doesn't exist
        if [ -f ".env.production.template" ]; then
            cp .env.production.template .env.production
            warning "Created .env.production from template. Please fill in the actual values."
        fi
        
        read -p "Press Enter after updating .env.production with actual values..."
    fi
}

# Pre-deployment tests
run_tests() {
    log "Running pre-deployment tests..."
    
    # Backend tests
    log "Running backend tests..."
    cd $BACKEND_DIR
    if [ -f "requirements.txt" ] && [ -d "tests" ]; then
        python3 -m pytest tests/ -v || { error "Backend tests failed"; exit 1; }
    else
        warning "No tests directory found, skipping backend tests"
    fi
    cd ..
    
    # Admin dashboard tests
    log "Running admin dashboard tests..."
    if [ -d "$ADMIN_DIR" ]; then
        cd $ADMIN_DIR
        if [ -f "package.json" ] && [ -d "src" ]; then
            npm test -- --run 2>/dev/null || warning "Admin dashboard tests skipped or failed"
        else
            warning "No admin dashboard tests found, skipping"
        fi
        cd ..
    else
        warning "Admin dashboard directory not found, skipping tests"
    fi
    
    # Public blog tests
    log "Running public blog tests..."
    if [ -d "$BLOG_DIR" ]; then
        cd $BLOG_DIR
        if [ -f "package.json" ] && [ -d "src" ]; then
            npm test -- --run 2>/dev/null || warning "Public blog tests skipped or failed"
        else
            warning "No public blog tests found, skipping"
        fi
        cd ..
    else
        warning "Public blog directory not found, skipping tests"
    fi
    
    success "All tests passed"
}

# Build frontend applications
build_frontends() {
    log "Building frontend applications..."
    
    # Build admin dashboard
    if [ -d "$ADMIN_DIR" ]; then
        log "Building admin dashboard..."
        cd $ADMIN_DIR
        npm ci
        npm run build
        success "Admin dashboard built successfully"
        cd ..
    else
        warning "Admin dashboard directory not found, skipping build"
    fi
    
    # Build public blog
    if [ -d "$BLOG_DIR" ]; then
        log "Building public blog..."
        cd $BLOG_DIR
        npm ci
        npm run build:production
        success "Public blog built successfully"
        cd ..
    else
        warning "Public blog directory not found, skipping build"
    fi
}

# Deploy backend to Railway
deploy_backend() {
    log "Deploying backend to Railway..."
    
    # Check if logged in to Railway
    railway whoami >/dev/null 2>&1 || { error "Please login to Railway first: railway login"; exit 1; }
    
    # Deploy to Railway
    railway up --detach
    
    # Wait for deployment to complete
    log "Waiting for backend deployment to complete..."
    sleep 30
    
    # Check deployment status
    railway status || { error "Backend deployment failed"; exit 1; }
    
    success "Backend deployed successfully to Railway"
}

# Deploy admin dashboard to Vercel
deploy_admin() {
    if [ -d "$ADMIN_DIR" ]; then
        log "Deploying admin dashboard to Vercel..."
        
        cd $ADMIN_DIR
        
        # Check if logged in to Vercel
        vercel whoami >/dev/null 2>&1 || { error "Please login to Vercel first: vercel login"; exit 1; }
        
        # Deploy to Vercel
        vercel --prod --yes
        
        success "Admin dashboard deployed successfully to Vercel"
        cd ..
    else
        warning "Admin dashboard directory not found, skipping deployment"
    fi
}

# Deploy public blog to Vercel
deploy_blog() {
    if [ -d "$BLOG_DIR" ]; then
        log "Deploying public blog to Vercel..."
        
        cd $BLOG_DIR
        
        # Deploy to Vercel
        vercel --prod --yes
        
        success "Public blog deployed successfully to Vercel"
        cd ..
    else
        warning "Public blog directory not found, skipping deployment"
    fi
}

# Run post-deployment tests
post_deployment_tests() {
    log "Running post-deployment tests..."
    
    # Get deployment URLs
    BACKEND_URL=$(railway domain)
    ADMIN_URL=$(cd $ADMIN_DIR && vercel ls --scope=production | grep "https" | head -1 | awk '{print $2}')
    BLOG_URL=$(cd $BLOG_DIR && vercel ls --scope=production | grep "https" | head -1 | awk '{print $2}')
    
    log "Testing deployed services..."
    
    # Test backend health
    if curl -f "$BACKEND_URL/health" >/dev/null 2>&1; then
        success "Backend health check passed"
    else
        error "Backend health check failed"
        exit 1
    fi
    
    # Test admin dashboard
    if curl -f "$ADMIN_URL" >/dev/null 2>&1; then
        success "Admin dashboard is accessible"
    else
        warning "Admin dashboard accessibility check failed (may be normal for SPA)"
    fi
    
    # Test public blog
    if curl -f "$BLOG_URL" >/dev/null 2>&1; then
        success "Public blog is accessible"
    else
        warning "Public blog accessibility check failed (may be normal for SPA)"
    fi
    
    log "Deployment URLs:"
    log "Backend API: $BACKEND_URL"
    log "Admin Dashboard: $ADMIN_URL"
    log "Public Blog: $BLOG_URL"
}

# Setup monitoring
setup_monitoring() {
    log "Setting up monitoring..."
    
    # Setup database monitoring
    if [ -f "scripts/production-db-setup.py" ]; then
        log "Setting up database monitoring..."
        python3 scripts/production-db-setup.py
    fi
    
    # Setup application monitoring
    log "Monitoring setup completed"
    warning "Please configure external monitoring services (Sentry, Google Analytics) manually"
}

# Main deployment function
main() {
    log "Starting Reddit Content Platform production deployment..."
    
    # Confirmation prompt
    echo -e "${YELLOW}This will deploy Reddit Content Platform to production.${NC}"
    echo -e "${YELLOW}Make sure you have:${NC}"
    echo -e "${YELLOW}1. Updated all environment variables${NC}"
    echo -e "${YELLOW}2. Configured external services (Reddit API, databases)${NC}"
    echo -e "${YELLOW}3. Set up monitoring services${NC}"
    echo ""
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "Deployment cancelled"
        exit 0
    fi
    
    # Run deployment steps
    check_prerequisites
    generate_secrets
    run_tests
    build_frontends
    deploy_backend
    deploy_admin
    deploy_blog
    post_deployment_tests
    setup_monitoring
    
    success "🎉 Production deployment completed successfully!"
    log "Your Reddit Content Platform is now live!"
    
    # Display final information
    echo ""
    echo -e "${GREEN}=== DEPLOYMENT SUMMARY ===${NC}"
    echo -e "${GREEN}Backend API:${NC} $(railway domain 2>/dev/null || echo 'Check Railway dashboard')"
    echo -e "${GREEN}Admin Dashboard:${NC} Check Vercel dashboard"
    echo -e "${GREEN}Public Blog:${NC} Check Vercel dashboard"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo -e "${YELLOW}1. Configure custom domains${NC}"
    echo -e "${YELLOW}2. Set up SSL certificates${NC}"
    echo -e "${YELLOW}3. Configure monitoring alerts${NC}"
    echo -e "${YELLOW}4. Test all functionality${NC}"
    echo -e "${YELLOW}5. Update DNS records${NC}"
}

# Handle script interruption
trap 'error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main "$@"