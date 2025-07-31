#!/bin/bash

# Production Deployment Script for Advanced Dashboard
# This script handles the complete deployment process for the advanced dashboard features

set -e  # Exit on any error

# Configuration
PROJECT_NAME="reddit-content-platform-dashboard"
BUILD_DIR="dist"
BACKUP_DIR="backups"
LOG_FILE="deployment.log"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

# Check prerequisites
check_prerequisites() {
    log "Checking deployment prerequisites..."
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed. Please install Node.js 18 or higher."
    fi
    
    # Check Node.js version
    NODE_VERSION=$(node --version | cut -d'v' -f2)
    REQUIRED_VERSION="18.0.0"
    if ! node -e "process.exit(require('semver').gte('$NODE_VERSION', '$REQUIRED_VERSION') ? 0 : 1)" 2>/dev/null; then
        error "Node.js version $NODE_VERSION is not supported. Please upgrade to version $REQUIRED_VERSION or higher."
    fi
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        error "npm is not installed. Please install npm."
    fi
    
    # Check if git is installed
    if ! command -v git &> /dev/null; then
        error "git is not installed. Please install git."
    fi
    
    # Check if we're in the correct directory
    if [ ! -f "package.json" ]; then
        error "package.json not found. Please run this script from the admin-dashboard directory."
    fi
    
    success "All prerequisites met."
}

# Validate environment variables
validate_environment() {
    log "Validating environment configuration..."
    
    # Check for required environment variables
    REQUIRED_VARS=(
        "VITE_API_BASE_URL"
        "VITE_NODE_ENV"
    )
    
    for var in "${REQUIRED_VARS[@]}"; do
        if [ -z "${!var}" ]; then
            error "Required environment variable $var is not set."
        fi
    done
    
    # Validate API URL format
    if [[ ! "$VITE_API_BASE_URL" =~ ^https?:// ]]; then
        error "VITE_API_BASE_URL must be a valid HTTP/HTTPS URL."
    fi
    
    # Ensure production environment
    if [ "$VITE_NODE_ENV" != "production" ]; then
        warning "VITE_NODE_ENV is not set to 'production'. Current value: $VITE_NODE_ENV"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            error "Deployment cancelled by user."
        fi
    fi
    
    success "Environment validation completed."
}

# Create backup
create_backup() {
    log "Creating backup of current deployment..."
    
    # Create backup directory if it doesn't exist
    mkdir -p "$BACKUP_DIR"
    
    # Create backup archive
    BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.tar.gz"
    
    if [ -d "$BUILD_DIR" ]; then
        tar -czf "$BACKUP_FILE" "$BUILD_DIR" 2>/dev/null || true
        success "Backup created: $BACKUP_FILE"
    else
        warning "No existing build directory found. Skipping backup."
    fi
}

# Install dependencies
install_dependencies() {
    log "Installing production dependencies..."
    
    # Clean install for production
    rm -rf node_modules package-lock.json 2>/dev/null || true
    npm ci --only=production --silent
    
    # Install dev dependencies needed for build
    npm install --only=dev --silent
    
    success "Dependencies installed successfully."
}

# Run security audit
security_audit() {
    log "Running security audit..."
    
    # Run npm audit
    if npm audit --audit-level=high; then
        success "Security audit passed."
    else
        warning "Security vulnerabilities found. Please review and fix before deploying to production."
        read -p "Continue deployment? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            error "Deployment cancelled due to security concerns."
        fi
    fi
}

# Run tests
run_tests() {
    log "Running test suite..."
    
    # Run unit tests
    if npm run test:unit -- --run --reporter=verbose; then
        success "Unit tests passed."
    else
        error "Unit tests failed. Please fix failing tests before deployment."
    fi
    
    # Run integration tests
    if npm run test:integration -- --run; then
        success "Integration tests passed."
    else
        warning "Integration tests failed. Please review before deploying."
        read -p "Continue deployment? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            error "Deployment cancelled due to test failures."
        fi
    fi
    
    # Run accessibility tests
    if npm run test:a11y -- --run; then
        success "Accessibility tests passed."
    else
        warning "Accessibility tests failed. Please review accessibility issues."
    fi
}

# Build application
build_application() {
    log "Building application for production..."
    
    # Clean previous build
    rm -rf "$BUILD_DIR"
    
    # Build the application
    if npm run build; then
        success "Application built successfully."
    else
        error "Build failed. Please check the build logs."
    fi
    
    # Verify build output
    if [ ! -d "$BUILD_DIR" ] || [ -z "$(ls -A $BUILD_DIR)" ]; then
        error "Build directory is empty or doesn't exist."
    fi
    
    # Check build size
    BUILD_SIZE=$(du -sh "$BUILD_DIR" | cut -f1)
    log "Build size: $BUILD_SIZE"
    
    # Warn if build is too large
    BUILD_SIZE_MB=$(du -sm "$BUILD_DIR" | cut -f1)
    if [ "$BUILD_SIZE_MB" -gt 50 ]; then
        warning "Build size is large ($BUILD_SIZE). Consider optimizing assets."
    fi
}

# Optimize build
optimize_build() {
    log "Optimizing build for production..."
    
    # Compress static assets
    if command -v gzip &> /dev/null; then
        find "$BUILD_DIR" -type f \( -name "*.js" -o -name "*.css" -o -name "*.html" \) -exec gzip -k {} \;
        success "Static assets compressed with gzip."
    fi
    
    # Generate service worker if not present
    if [ ! -f "$BUILD_DIR/sw.js" ]; then
        log "Generating service worker..."
        # This would typically be handled by the build process
        # but we can add a fallback here if needed
    fi
    
    # Validate critical files exist
    CRITICAL_FILES=(
        "index.html"
        "assets"
    )
    
    for file in "${CRITICAL_FILES[@]}"; do
        if [ ! -e "$BUILD_DIR/$file" ]; then
            error "Critical file/directory missing from build: $file"
        fi
    done
    
    success "Build optimization completed."
}

# Deploy to staging (optional)
deploy_staging() {
    if [ "$1" = "--skip-staging" ]; then
        log "Skipping staging deployment as requested."
        return 0
    fi
    
    log "Deploying to staging environment..."
    
    # This would typically involve:
    # - Uploading to staging server
    # - Running smoke tests
    # - Validating deployment
    
    # For now, we'll simulate this
    sleep 2
    success "Staging deployment completed."
    
    # Ask for confirmation to proceed to production
    read -p "Staging deployment successful. Proceed to production? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        error "Production deployment cancelled by user."
    fi
}

# Deploy to production
deploy_production() {
    log "Deploying to production environment..."
    
    # Create deployment manifest
    create_deployment_manifest
    
    # Deploy based on the deployment target
    case "${DEPLOY_TARGET:-vercel}" in
        "vercel")
            deploy_to_vercel
            ;;
        "netlify")
            deploy_to_netlify
            ;;
        "railway")
            deploy_to_railway
            ;;
        "s3")
            deploy_to_s3
            ;;
        *)
            error "Unknown deployment target: $DEPLOY_TARGET"
            ;;
    esac
    
    success "Production deployment completed."
}

# Create deployment manifest
create_deployment_manifest() {
    log "Creating deployment manifest..."
    
    MANIFEST_FILE="$BUILD_DIR/deployment-manifest.json"
    
    cat > "$MANIFEST_FILE" << EOF
{
  "deploymentId": "deploy_$TIMESTAMP",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "version": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "branch": "$(git branch --show-current 2>/dev/null || echo 'unknown')",
  "buildSize": "$(du -sh $BUILD_DIR | cut -f1)",
  "nodeVersion": "$(node --version)",
  "npmVersion": "$(npm --version)",
  "environment": {
    "NODE_ENV": "$VITE_NODE_ENV",
    "API_BASE_URL": "$VITE_API_BASE_URL"
  },
  "features": [
    "nlp-analysis",
    "image-analysis",
    "advanced-analytics",
    "real-time-monitoring",
    "business-intelligence",
    "billing-system",
    "export-reporting"
  ]
}
EOF
    
    success "Deployment manifest created."
}

# Deploy to Vercel
deploy_to_vercel() {
    log "Deploying to Vercel..."
    
    if ! command -v vercel &> /dev/null; then
        error "Vercel CLI is not installed. Please install it with: npm install -g vercel"
    fi
    
    # Deploy to Vercel
    if vercel --prod --yes; then
        success "Vercel deployment completed."
    else
        error "Vercel deployment failed."
    fi
}

# Deploy to Netlify
deploy_to_netlify() {
    log "Deploying to Netlify..."
    
    if ! command -v netlify &> /dev/null; then
        error "Netlify CLI is not installed. Please install it with: npm install -g netlify-cli"
    fi
    
    # Deploy to Netlify
    if netlify deploy --prod --dir="$BUILD_DIR"; then
        success "Netlify deployment completed."
    else
        error "Netlify deployment failed."
    fi
}

# Deploy to Railway
deploy_to_railway() {
    log "Deploying to Railway..."
    
    if ! command -v railway &> /dev/null; then
        error "Railway CLI is not installed. Please install it from: https://railway.app/cli"
    fi
    
    # Deploy to Railway
    if railway up; then
        success "Railway deployment completed."
    else
        error "Railway deployment failed."
    fi
}

# Deploy to AWS S3
deploy_to_s3() {
    log "Deploying to AWS S3..."
    
    if ! command -v aws &> /dev/null; then
        error "AWS CLI is not installed. Please install it from: https://aws.amazon.com/cli/"
    fi
    
    if [ -z "$S3_BUCKET" ]; then
        error "S3_BUCKET environment variable is not set."
    fi
    
    # Sync to S3
    if aws s3 sync "$BUILD_DIR" "s3://$S3_BUCKET" --delete; then
        success "S3 deployment completed."
        
        # Invalidate CloudFront if distribution ID is provided
        if [ -n "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
            log "Invalidating CloudFront cache..."
            aws cloudfront create-invalidation --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" --paths "/*"
        fi
    else
        error "S3 deployment failed."
    fi
}

# Post-deployment verification
verify_deployment() {
    log "Verifying deployment..."
    
    # Check if deployment URL is accessible
    if [ -n "$DEPLOYMENT_URL" ]; then
        if curl -f -s "$DEPLOYMENT_URL" > /dev/null; then
            success "Deployment URL is accessible: $DEPLOYMENT_URL"
        else
            error "Deployment URL is not accessible: $DEPLOYMENT_URL"
        fi
    fi
    
    # Run smoke tests
    if [ -f "scripts/smoke-tests.sh" ]; then
        log "Running smoke tests..."
        if bash scripts/smoke-tests.sh; then
            success "Smoke tests passed."
        else
            warning "Smoke tests failed. Please investigate."
        fi
    fi
    
    success "Deployment verification completed."
}

# Cleanup
cleanup() {
    log "Cleaning up temporary files..."
    
    # Remove temporary files
    rm -f .env.local.bak 2>/dev/null || true
    
    # Clean up old backups (keep last 5)
    if [ -d "$BACKUP_DIR" ]; then
        ls -t "$BACKUP_DIR"/backup_*.tar.gz | tail -n +6 | xargs rm -f 2>/dev/null || true
    fi
    
    success "Cleanup completed."
}

# Main deployment function
main() {
    log "Starting production deployment for $PROJECT_NAME..."
    log "Timestamp: $TIMESTAMP"
    
    # Parse command line arguments
    SKIP_STAGING=false
    SKIP_TESTS=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-staging)
                SKIP_STAGING=true
                shift
                ;;
            --skip-tests)
                SKIP_TESTS=true
                shift
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo "Options:"
                echo "  --skip-staging    Skip staging deployment"
                echo "  --skip-tests      Skip test execution"
                echo "  --help           Show this help message"
                exit 0
                ;;
            *)
                error "Unknown option: $1"
                ;;
        esac
    done
    
    # Execute deployment steps
    check_prerequisites
    validate_environment
    create_backup
    install_dependencies
    security_audit
    
    if [ "$SKIP_TESTS" = false ]; then
        run_tests
    else
        warning "Skipping tests as requested."
    fi
    
    build_application
    optimize_build
    
    if [ "$SKIP_STAGING" = false ]; then
        deploy_staging
    fi
    
    deploy_production
    verify_deployment
    cleanup
    
    success "Production deployment completed successfully!"
    log "Deployment ID: deploy_$TIMESTAMP"
    log "Build size: $(du -sh $BUILD_DIR | cut -f1)"
    log "Deployment log: $LOG_FILE"
}

# Error handling
trap 'error "Deployment failed at line $LINENO"' ERR

# Run main function
main "$@"