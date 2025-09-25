#!/bin/bash

# =============================================================================
# Aldeia Combined Platform Deployment Script
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
ENVIRONMENT="${1:-staging}"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check if docker-compose is installed
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if .env file exists
    if [ ! -f "$ROOT_DIR/.env" ]; then
        log_error ".env file not found. Please create one from .env.example"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

validate_environment() {
    if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
        log_error "Invalid environment: $ENVIRONMENT"
        log_info "Usage: $0 [development|staging|production]"
        exit 1
    fi
    
    log_info "Deploying to: $ENVIRONMENT"
}

backup_database() {
    if [ "$ENVIRONMENT" = "production" ]; then
        log_info "Creating database backup..."
        
        # Create backups directory if it doesn't exist
        mkdir -p "$ROOT_DIR/backups"
        
        # Backup database
        BACKUP_FILE="$ROOT_DIR/backups/aldeia_backup_$(date +%Y%m%d_%H%M%S).db"
        if [ -f "$ROOT_DIR/data/aldeia.db" ]; then
            cp "$ROOT_DIR/data/aldeia.db" "$BACKUP_FILE"
            log_success "Database backup created: $BACKUP_FILE"
        else
            log_warning "Database file not found, skipping backup"
        fi
    fi
}

build_and_deploy() {
    log_info "Building and deploying $ENVIRONMENT environment..."
    
    cd "$ROOT_DIR"
    
    case $ENVIRONMENT in
        development)
            docker-compose -f docker-compose.yml up -d --build
            ;;
        staging)
            docker-compose -f docker-compose.staging.yml up -d --build
            ;;
        production)
            docker-compose -f docker-compose.production.yml up -d --build
            ;;
    esac
    
    log_success "Deployment completed"
}

run_health_checks() {
    log_info "Running health checks..."
    
    # Wait for services to start
    sleep 30
    
    # Check backend health
    if curl -f http://localhost:3001/api/health &> /dev/null; then
        log_success "Backend service is healthy"
    else
        log_error "Backend service health check failed"
        return 1
    fi
    
    # Check if containers are running
    RUNNING_CONTAINERS=$(docker-compose ps --services --filter "status=running" | wc -l)
    TOTAL_CONTAINERS=$(docker-compose ps --services | wc -l)
    
    if [ "$RUNNING_CONTAINERS" -eq "$TOTAL_CONTAINERS" ]; then
        log_success "All containers are running ($RUNNING_CONTAINERS/$TOTAL_CONTAINERS)"
    else
        log_error "Some containers are not running ($RUNNING_CONTAINERS/$TOTAL_CONTAINERS)"
        docker-compose ps
        return 1
    fi
}

cleanup_old_images() {
    log_info "Cleaning up old Docker images..."
    
    # Remove unused images
    docker image prune -f
    
    # Remove dangling images
    docker images -f "dangling=true" -q | xargs -r docker rmi
    
    log_success "Cleanup completed"
}

rollback() {
    log_error "Deployment failed. Starting rollback..."
    
    # Stop current containers
    docker-compose down
    
    # If production and backup exists, restore database
    if [ "$ENVIRONMENT" = "production" ]; then
        LATEST_BACKUP=$(ls -t "$ROOT_DIR/backups"/*.db 2>/dev/null | head -n1)
        if [ -n "$LATEST_BACKUP" ]; then
            log_info "Restoring database from: $LATEST_BACKUP"
            cp "$LATEST_BACKUP" "$ROOT_DIR/data/aldeia.db"
        fi
    fi
    
    log_info "Please check logs and fix issues before retrying deployment"
    exit 1
}

show_status() {
    log_info "Current deployment status:"
    echo
    docker-compose ps
    echo
    log_info "Service URLs:"
    echo "  • Backend API: http://localhost:3001"
    echo "  • Chatbot Frontend: http://localhost:3002"
    echo "  • Rebuild Platform: http://localhost:3000"
    echo
    log_info "Logs can be viewed with: docker-compose logs -f [service]"
}

main() {
    echo "============================================================================="
    echo "🚀 Aldeia Combined Platform Deployment"
    echo "============================================================================="
    echo
    
    validate_environment
    check_prerequisites
    backup_database
    
    # Set trap for rollback on error
    trap rollback ERR
    
    build_and_deploy
    run_health_checks
    cleanup_old_images
    
    # Disable trap
    trap - ERR
    
    echo
    log_success "🎉 Deployment to $ENVIRONMENT completed successfully!"
    echo
    show_status
}

# Handle script arguments
case "${1:-}" in
    -h|--help)
        echo "Usage: $0 [environment]"
        echo
        echo "Environments:"
        echo "  development  - Local development environment"
        echo "  staging      - Staging environment"
        echo "  production   - Production environment"
        echo
        echo "Examples:"
        echo "  $0 staging"
        echo "  $0 production"
        echo
        exit 0
        ;;
    status)
        show_status
        exit 0
        ;;
    *)
        main
        ;;
esac