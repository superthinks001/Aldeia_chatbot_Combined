#!/bin/bash

# ============================================
# Aldeia Chatbot - Production Deployment Script
# ============================================
# This script automates the deployment process
# Run this on your production server
# ============================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/opt/aldeia"
REPO_URL="https://github.com/superthinks001/Aldeia_Chatbot_Combined.git"
BRANCH="main"  # or integration/project-knowledge-merge-v2
COMPOSE_FILE="docker-compose.production.yml"

# ============================================
# Helper Functions
# ============================================

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

check_command() {
    if ! command -v $1 &> /dev/null; then
        log_error "$1 is not installed. Please install it first."
        exit 1
    fi
}

# ============================================
# Pre-Deployment Checks
# ============================================

log_info "Starting pre-deployment checks..."

# Check required commands
log_info "Checking required dependencies..."
check_command "docker"
check_command "docker-compose"
check_command "git"
check_command "curl"

# Check Docker daemon
if ! docker info > /dev/null 2>&1; then
    log_error "Docker daemon is not running"
    exit 1
fi
log_success "Docker daemon is running"

# Check disk space
DISK_AVAILABLE=$(df -h / | awk 'NR==2 {print $4}' | sed 's/G//')
if (( $(echo "$DISK_AVAILABLE < 10" | bc -l) )); then
    log_warning "Low disk space: ${DISK_AVAILABLE}G available"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi
log_success "Sufficient disk space available: ${DISK_AVAILABLE}G"

# ============================================
# Repository Setup
# ============================================

log_info "Setting up repository..."

# Clone or update repository
if [ -d "$PROJECT_DIR" ]; then
    log_info "Repository exists, pulling latest changes..."
    cd "$PROJECT_DIR"

    # Stash local changes if any
    if ! git diff-index --quiet HEAD --; then
        log_warning "Local changes detected, stashing..."
        git stash
    fi

    git fetch origin
    git checkout "$BRANCH"
    git pull origin "$BRANCH"
    log_success "Repository updated"
else
    log_info "Cloning repository..."
    mkdir -p $(dirname "$PROJECT_DIR")
    git clone "$REPO_URL" "$PROJECT_DIR"
    cd "$PROJECT_DIR"
    git checkout "$BRANCH"
    log_success "Repository cloned"
fi

# ============================================
# Environment Configuration
# ============================================

log_info "Checking environment configuration..."

if [ ! -f ".env" ]; then
    if [ -f ".env.production" ]; then
        log_warning ".env not found, copying from .env.production template"
        cp .env.production .env
        log_error "Please edit .env with your production credentials, then run this script again"
        log_info "Edit .env: nano .env"
        exit 1
    else
        log_error ".env.production template not found"
        exit 1
    fi
fi

# Check for placeholder values
if grep -q "REPLACE" .env; then
    log_error "Found placeholder values in .env file"
    log_info "Please replace all REPLACE_WITH_* placeholders with actual values"
    log_info "Edit .env: nano .env"
    exit 1
fi

log_success "Environment configuration validated"

# ============================================
# SSL Certificate Check
# ============================================

log_info "Checking SSL certificates..."

if [ ! -f "nginx/ssl/cert.pem" ] || [ ! -f "nginx/ssl/key.pem" ]; then
    log_warning "SSL certificates not found"
    echo "Options:"
    echo "  1. Generate Let's Encrypt certificates (production)"
    echo "  2. Generate self-signed certificates (testing only)"
    echo "  3. Skip (certificates exist elsewhere)"
    read -p "Choose option (1/2/3): " -n 1 -r
    echo

    case $REPLY in
        1)
            log_info "Generating Let's Encrypt certificates..."
            read -p "Enter your email: " EMAIL
            read -p "Enter domain (e.g., api.aldeia.com): " DOMAIN

            mkdir -p nginx/ssl
            docker-compose -f "$COMPOSE_FILE" up -d nginx

            docker run --rm \
              -v $(pwd)/nginx/ssl:/etc/letsencrypt \
              -v $(pwd)/nginx/certbot-webroot:/var/www/certbot \
              certbot/certbot certonly \
              --webroot \
              --webroot-path=/var/www/certbot \
              --email "$EMAIL" \
              --agree-tos \
              --no-eff-email \
              -d "$DOMAIN"

            cp "nginx/ssl/live/$DOMAIN/fullchain.pem" nginx/ssl/cert.pem
            cp "nginx/ssl/live/$DOMAIN/privkey.pem" nginx/ssl/key.pem
            log_success "Let's Encrypt certificates generated"
            ;;
        2)
            log_info "Generating self-signed certificates..."
            mkdir -p nginx/ssl
            openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
              -keyout nginx/ssl/key.pem \
              -out nginx/ssl/cert.pem \
              -subj "/C=US/ST=State/L=City/O=Organization/CN=aldeia.com"
            log_warning "Self-signed certificate generated (browsers will show warnings)"
            ;;
        3)
            log_info "Skipping SSL certificate generation"
            ;;
        *)
            log_error "Invalid option"
            exit 1
            ;;
    esac
else
    log_success "SSL certificates found"
fi

# ============================================
# Build Docker Images
# ============================================

log_info "Building Docker images..."

# Pull base images
log_info "Pulling base images..."
docker-compose -f "$COMPOSE_FILE" pull

# Build application images
log_info "Building application images (this may take a few minutes)..."
docker-compose -f "$COMPOSE_FILE" build --no-cache

log_success "Docker images built successfully"

# ============================================
# Stop Existing Services
# ============================================

if docker-compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
    log_info "Stopping existing services..."
    docker-compose -f "$COMPOSE_FILE" down
    log_success "Existing services stopped"
fi

# ============================================
# Start Services
# ============================================

log_info "Starting services..."
docker-compose -f "$COMPOSE_FILE" up -d

# Wait for services to be healthy
log_info "Waiting for services to be healthy (max 120 seconds)..."
sleep 10

for i in {1..12}; do
    if docker-compose -f "$COMPOSE_FILE" ps | grep -q "unhealthy\|starting"; then
        log_info "Services still starting... ($((i*10))s)"
        sleep 10
    else
        break
    fi
done

# ============================================
# Database Migrations
# ============================================

log_info "Running database migrations..."

# Check if migrations exist
if [ -d "migrations" ] && [ "$(ls -A migrations/*.sql 2>/dev/null)" ]; then
    log_info "Applying database migrations..."

    # Option 1: If npm script exists
    if docker-compose -f "$COMPOSE_FILE" exec -T backend npm run migrate 2>/dev/null; then
        log_success "Migrations applied via npm script"
    else
        # Option 2: Manual migration via psql
        log_info "No npm migrate script found, checking for manual migration..."
        if [ -f "apply-migrations.js" ]; then
            docker-compose -f "$COMPOSE_FILE" exec -T backend node apply-migrations.js
            log_success "Migrations applied manually"
        else
            log_warning "No migration method found, skipping..."
        fi
    fi
else
    log_info "No migrations to apply"
fi

# ============================================
# Health Checks
# ============================================

log_info "Performing health checks..."

# Check backend
if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    log_success "Backend health check passed"
else
    log_error "Backend health check failed"
    log_info "Checking backend logs..."
    docker-compose -f "$COMPOSE_FILE" logs --tail=50 backend
    exit 1
fi

# Check frontend
if curl -f http://localhost:3002/ > /dev/null 2>&1; then
    log_success "Frontend health check passed"
else
    log_warning "Frontend health check failed (may be expected if not configured)"
fi

# Check Redis
if docker-compose -f "$COMPOSE_FILE" exec -T redis redis-cli ping > /dev/null 2>&1; then
    log_success "Redis health check passed"
else
    log_warning "Redis health check failed"
fi

# Check ChromaDB
if curl -f http://localhost:8000/api/v1/heartbeat > /dev/null 2>&1; then
    log_success "ChromaDB health check passed"
else
    log_warning "ChromaDB health check failed (may be expected if not required)"
fi

# ============================================
# Deployment Summary
# ============================================

echo ""
echo "============================================"
log_success "🎉 Deployment completed successfully!"
echo "============================================"
echo ""
log_info "Services running:"
docker-compose -f "$COMPOSE_FILE" ps
echo ""
log_info "Next steps:"
echo "  1. Monitor logs: docker-compose -f $COMPOSE_FILE logs -f"
echo "  2. Check status: docker-compose -f $COMPOSE_FILE ps"
echo "  3. Run validation: ./validate-deployment.sh"
echo "  4. Check health: curl http://localhost:3001/api/health"
echo ""
log_info "Useful commands:"
echo "  - View logs: docker-compose -f $COMPOSE_FILE logs -f [service]"
echo "  - Restart service: docker-compose -f $COMPOSE_FILE restart [service]"
echo "  - Stop all: docker-compose -f $COMPOSE_FILE down"
echo "  - Check resources: docker stats"
echo ""
log_warning "Don't forget to:"
echo "  - Configure firewall rules (ports 80, 443)"
echo "  - Set up automated backups"
echo "  - Configure monitoring alerts"
echo "  - Test from external network"
echo ""

# Save deployment timestamp
date > .last-deployment
log_info "Deployment timestamp saved to .last-deployment"

log_success "Deployment script completed!"
