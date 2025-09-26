#!/bin/bash

# Deploy script for Fi.V App
# Usage: ./scripts/deploy.sh [environment] [version]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT=${1:-production}
VERSION=${2:-latest}
PROJECT_NAME="fivapp"

# Log function
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
    exit 1
}

# Validate environment
validate_environment() {
    case $ENVIRONMENT in
        development|staging|production)
            log "Deploying to $ENVIRONMENT environment"
            ;;
        *)
            error "Invalid environment: $ENVIRONMENT. Use: development, staging, or production"
            ;;
    esac
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed"
    fi
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        error "npm is not installed"
    fi
    
    # Check if PM2 is installed
    if ! command -v pm2 &> /dev/null; then
        error "PM2 is not installed. Install with: npm install -g pm2"
    fi
    
    # Check if Docker is installed (for Evolution API)
    if ! command -v docker &> /dev/null; then
        warning "Docker is not installed. Evolution API will not be available"
    fi
    
    success "Prerequisites check passed"
}

# Install dependencies
install_dependencies() {
    log "Installing dependencies..."
    
    if [ "$ENVIRONMENT" = "production" ]; then
        npm ci --production --silent
    else
        npm ci --silent
    fi
    
    success "Dependencies installed"
}

# Run tests
run_tests() {
    if [ "$ENVIRONMENT" != "production" ]; then
        log "Running tests..."
        
        # Run unit tests
        npm run test --silent
        
        # Run linting
        npm run lint:check --silent
        
        # Run type checking
        npm run check --silent
        
        success "Tests passed"
    else
        log "Skipping tests for production deployment"
    fi
}

# Build application
build_application() {
    log "Building application..."
    
    # Clean previous build
    rm -rf dist/
    
    # Build backend
    npm run build
    
    # Build frontend
    cd client
    npm ci --silent
    npm run build
    cd ..
    
    success "Application built successfully"
}

# Setup environment
setup_environment() {
    log "Setting up environment..."
    
    # Copy environment file
    if [ -f "env.$ENVIRONMENT" ]; then
        cp "env.$ENVIRONMENT" .env
        success "Environment file copied"
    else
        warning "Environment file env.$ENVIRONMENT not found"
    fi
    
    # Create necessary directories
    mkdir -p logs uploads sessions
    
    success "Environment setup completed"
}

# Database migration
run_migrations() {
    log "Running database migrations..."
    
    # Check if database is accessible
    if npm run db:push --silent; then
        success "Database migrations completed"
    else
        error "Database migration failed"
    fi
}

# Deploy with PM2
deploy_pm2() {
    log "Deploying with PM2..."
    
    # Stop existing processes
    pm2 stop $PROJECT_NAME-$ENVIRONMENT 2>/dev/null || true
    pm2 delete $PROJECT_NAME-$ENVIRONMENT 2>/dev/null || true
    
    # Start new process
    pm2 start ecosystem.config.js --env $ENVIRONMENT
    
    # Save PM2 configuration
    pm2 save
    
    # Setup PM2 startup
    pm2 startup
    
    success "Application deployed with PM2"
}

# Health check
health_check() {
    log "Performing health check..."
    
    # Wait for application to start
    sleep 10
    
    # Check if application is responding
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        success "Health check passed"
    else
        error "Health check failed"
    fi
}

# Setup Evolution API
setup_evolution() {
    if command -v docker &> /dev/null; then
        log "Setting up Evolution API..."
        
        # Stop existing containers
        docker-compose -f docker-compose.yml down 2>/dev/null || true
        
        # Start Evolution API
        docker-compose -f docker-compose.yml up -d evolution
        
        success "Evolution API started"
    else
        warning "Docker not available. Skipping Evolution API setup"
    fi
}

# Cleanup
cleanup() {
    log "Cleaning up..."
    
    # Remove old builds
    rm -rf dist.old
    
    # Clear npm cache
    npm cache clean --force
    
    success "Cleanup completed"
}

# Main deployment function
deploy() {
    log "Starting deployment to $ENVIRONMENT environment..."
    
    validate_environment
    check_prerequisites
    install_dependencies
    run_tests
    build_application
    setup_environment
    run_migrations
    deploy_pm2
    setup_evolution
    health_check
    cleanup
    
    success "Deployment completed successfully!"
    log "Application is running at: http://localhost:3000"
    log "PM2 status: pm2 status"
    log "PM2 logs: pm2 logs $PROJECT_NAME-$ENVIRONMENT"
}

# Rollback function
rollback() {
    log "Rolling back deployment..."
    
    # Stop current process
    pm2 stop $PROJECT_NAME-$ENVIRONMENT
    
    # Restore previous version (if available)
    if [ -d "dist.old" ]; then
        mv dist dist.new
        mv dist.old dist
        pm2 start ecosystem.config.js --env $ENVIRONMENT
        success "Rollback completed"
    else
        error "No previous version available for rollback"
    fi
}

# Show usage
usage() {
    echo "Usage: $0 [environment] [version]"
    echo ""
    echo "Environments:"
    echo "  development  - Deploy to development environment"
    echo "  staging      - Deploy to staging environment"
    echo "  production   - Deploy to production environment"
    echo ""
    echo "Examples:"
    echo "  $0 development"
    echo "  $0 staging v1.2.3"
    echo "  $0 production"
    echo ""
    echo "Other commands:"
    echo "  $0 rollback  - Rollback to previous version"
}

# Main script
case "${1:-deploy}" in
    deploy)
        deploy
        ;;
    rollback)
        rollback
        ;;
    help|--help|-h)
        usage
        ;;
    *)
        error "Unknown command: $1"
        ;;
esac
