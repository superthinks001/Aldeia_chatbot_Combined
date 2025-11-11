#!/bin/bash

# ============================================
# Aldeia Chatbot - Post-Deployment Validation Script
# ============================================
# This script validates the production deployment
# Run after deploying to verify everything works
# ============================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.production.yml"
BACKEND_URL="http://localhost:3001"
FRONTEND_URL="http://localhost:3002"
REBUILD_URL="http://localhost:3000"

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
WARNINGS=0

# ============================================
# Helper Functions
# ============================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
    ((PASSED_TESTS++))
    ((TOTAL_TESTS++))
}

log_failure() {
    echo -e "${RED}[✗]${NC} $1"
    ((FAILED_TESTS++))
    ((TOTAL_TESTS++))
}

log_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
    ((WARNINGS++))
}

run_test() {
    local test_name=$1
    local command=$2
    local expected_output=$3

    log_info "Testing: $test_name"

    if eval "$command" > /dev/null 2>&1; then
        log_success "$test_name"
        return 0
    else
        log_failure "$test_name"
        return 1
    fi
}

# ============================================
# Deployment Validation
# ============================================

echo "============================================"
echo "🚀 Aldeia Chatbot - Deployment Validation"
echo "============================================"
echo ""
log_info "Starting validation at $(date)"
echo ""

# ============================================
# Test 1: Docker Services Status
# ============================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Docker Services Status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

log_info "Checking Docker services..."

# Check if docker-compose file exists
if [ ! -f "$COMPOSE_FILE" ]; then
    log_failure "docker-compose.production.yml not found"
    exit 1
fi

# Get service status
SERVICES=$(docker-compose -f "$COMPOSE_FILE" ps --services)

for service in $SERVICES; do
    if docker-compose -f "$COMPOSE_FILE" ps "$service" | grep -q "Up"; then
        STATUS=$(docker-compose -f "$COMPOSE_FILE" ps "$service" | tail -n 1)
        if echo "$STATUS" | grep -q "healthy\|Up"; then
            log_success "Service '$service' is running"
        elif echo "$STATUS" | grep -q "unhealthy"; then
            log_failure "Service '$service' is unhealthy"
        else
            log_warning "Service '$service' status unclear"
        fi
    else
        log_failure "Service '$service' is not running"
    fi
done

echo ""

# ============================================
# Test 2: Health Endpoints
# ============================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. Health Endpoints"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Backend health check
if curl -f -s "$BACKEND_URL/api/health" > /dev/null 2>&1; then
    HEALTH_RESPONSE=$(curl -s "$BACKEND_URL/api/health")
    log_success "Backend health endpoint: $BACKEND_URL/api/health"
    echo "     Response: $HEALTH_RESPONSE"
else
    log_failure "Backend health endpoint not responding"
fi

# Frontend health check
if curl -f -s "$FRONTEND_URL/" > /dev/null 2>&1; then
    log_success "Frontend responding: $FRONTEND_URL/"
else
    log_warning "Frontend not responding (may be configured differently)"
fi

# Rebuild platform (optional)
if curl -f -s "$REBUILD_URL/" > /dev/null 2>&1; then
    log_success "Rebuild platform responding: $REBUILD_URL/"
else
    log_warning "Rebuild platform not responding (optional service)"
fi

echo ""

# ============================================
# Test 3: Database Connectivity
# ============================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. Database Connectivity"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

log_info "Testing PostgreSQL connection..."

DB_TEST=$(docker-compose -f "$COMPOSE_FILE" exec -T backend node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error');
    process.exit(1);
  } else {
    console.log('Success');
    process.exit(0);
  }
  pool.end();
});
" 2>&1)

if echo "$DB_TEST" | grep -q "Success"; then
    log_success "PostgreSQL database connection successful"
else
    log_failure "PostgreSQL database connection failed"
    echo "     Error: $DB_TEST"
fi

# Check tables exist
log_info "Verifying database tables..."
TABLES=$(docker-compose -f "$COMPOSE_FILE" exec -T backend node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '\''public'\''', (err, res) => {
  if (err) {
    console.error('0');
  } else {
    console.log(res.rows[0].count);
  }
  pool.end();
});
" 2>&1 | tail -1)

if [ "$TABLES" -gt 5 ]; then
    log_success "Database has $TABLES tables (schema migrated)"
else
    log_warning "Database has only $TABLES tables (migrations may be needed)"
fi

echo ""

# ============================================
# Test 4: Redis Connectivity
# ============================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. Redis Connectivity"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

log_info "Testing Redis connection..."

if docker-compose -f "$COMPOSE_FILE" exec -T redis redis-cli ping 2>&1 | grep -q "PONG"; then
    log_success "Redis is responding"

    # Check Redis info
    REDIS_KEYS=$(docker-compose -f "$COMPOSE_FILE" exec -T redis redis-cli DBSIZE 2>&1 | grep -o '[0-9]*')
    log_info "Redis has $REDIS_KEYS keys"
else
    log_failure "Redis is not responding"
fi

echo ""

# ============================================
# Test 5: ChromaDB Connectivity
# ============================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5. ChromaDB Connectivity"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

log_info "Testing ChromaDB connection..."

if curl -f -s http://localhost:8000/api/v1/heartbeat > /dev/null 2>&1; then
    log_success "ChromaDB is responding"
else
    log_warning "ChromaDB not responding (optional for initial deployment)"
fi

echo ""

# ============================================
# Test 6: Authentication Flow
# ============================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6. Authentication Flow"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

log_info "Testing user registration..."

# Generate unique test email
TEST_EMAIL="validation-test-$(date +%s)@example.com"
TEST_PASSWORD="ValidTest123!"

REGISTER_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BACKEND_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"name\":\"Validation Test\",\"county\":\"LA\"}")

HTTP_CODE=$(echo "$REGISTER_RESPONSE" | tail -n 1)
BODY=$(echo "$REGISTER_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "201" ]; then
    log_success "User registration successful (HTTP $HTTP_CODE)"
else
    log_failure "User registration failed (HTTP $HTTP_CODE)"
    echo "     Response: $BODY"
fi

log_info "Testing user login..."

LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BACKEND_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

HTTP_CODE=$(echo "$LOGIN_RESPONSE" | tail -n 1)
BODY=$(echo "$LOGIN_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    log_success "User login successful (HTTP $HTTP_CODE)"

    # Extract access token
    ACCESS_TOKEN=$(echo "$BODY" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

    if [ -n "$ACCESS_TOKEN" ]; then
        log_success "Access token received"

        # Test protected endpoint
        log_info "Testing protected endpoint..."

        PROFILE_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BACKEND_URL/api/auth/profile" \
          -H "Authorization: Bearer $ACCESS_TOKEN")

        HTTP_CODE=$(echo "$PROFILE_RESPONSE" | tail -n 1)

        if [ "$HTTP_CODE" = "200" ]; then
            log_success "Protected endpoint accessible with valid token (HTTP $HTTP_CODE)"
        else
            log_failure "Protected endpoint failed with valid token (HTTP $HTTP_CODE)"
        fi

        # Test unauthorized access
        log_info "Testing unauthorized access protection..."

        UNAUTH_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BACKEND_URL/api/auth/profile")
        HTTP_CODE=$(echo "$UNAUTH_RESPONSE" | tail -n 1)

        if [ "$HTTP_CODE" = "401" ]; then
            log_success "Unauthorized access properly rejected (HTTP $HTTP_CODE)"
        else
            log_failure "Unauthorized access not properly rejected (HTTP $HTTP_CODE)"
        fi
    else
        log_failure "No access token in login response"
    fi
else
    log_failure "User login failed (HTTP $HTTP_CODE)"
    echo "     Response: $BODY"
fi

echo ""

# ============================================
# Test 7: Resource Usage
# ============================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "7. Resource Usage"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

log_info "Checking container resource usage..."

docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" | grep aldeia

echo ""

# Check disk space
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 80 ]; then
    log_success "Disk usage: ${DISK_USAGE}% (healthy)"
else
    log_warning "Disk usage: ${DISK_USAGE}% (consider cleanup)"
fi

echo ""

# ============================================
# Test 8: SSL Configuration (if accessible)
# ============================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "8. SSL Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "nginx/ssl/cert.pem" ]; then
    log_info "Checking SSL certificate..."

    CERT_EXPIRY=$(openssl x509 -in nginx/ssl/cert.pem -noout -enddate | cut -d= -f2)
    log_success "SSL certificate found, expires: $CERT_EXPIRY"

    # Check if certificate is about to expire (< 30 days)
    EXPIRY_EPOCH=$(date -d "$CERT_EXPIRY" +%s 2>/dev/null || date -j -f "%b %d %T %Y %Z" "$CERT_EXPIRY" +%s)
    NOW_EPOCH=$(date +%s)
    DAYS_LEFT=$(( ($EXPIRY_EPOCH - $NOW_EPOCH) / 86400 ))

    if [ "$DAYS_LEFT" -lt 30 ]; then
        log_warning "SSL certificate expires in $DAYS_LEFT days (renewal needed)"
    else
        log_success "SSL certificate valid for $DAYS_LEFT days"
    fi
else
    log_warning "SSL certificate not found at nginx/ssl/cert.pem"
fi

echo ""

# ============================================
# Test 9: Log File Accessibility
# ============================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "9. Log File Accessibility"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

log_info "Checking log files..."

# Check backend logs
if docker-compose -f "$COMPOSE_FILE" logs backend --tail=5 > /dev/null 2>&1; then
    log_success "Backend logs accessible"
else
    log_failure "Backend logs not accessible"
fi

# Check nginx logs (if directory exists)
if [ -d "nginx/logs" ]; then
    log_success "Nginx log directory exists"
else
    log_warning "Nginx log directory not found"
fi

echo ""

# ============================================
# Validation Summary
# ============================================

echo "============================================"
echo "📊 Validation Summary"
echo "============================================"
echo ""
echo "Total Tests:   $TOTAL_TESTS"
echo -e "${GREEN}Passed:        $PASSED_TESTS${NC}"
echo -e "${RED}Failed:        $FAILED_TESTS${NC}"
echo -e "${YELLOW}Warnings:      $WARNINGS${NC}"
echo ""

SUCCESS_RATE=$(( (PASSED_TESTS * 100) / TOTAL_TESTS ))

if [ "$FAILED_TESTS" -eq 0 ]; then
    echo -e "${GREEN}✓ All critical tests passed! ($SUCCESS_RATE%)${NC}"
    echo ""
    echo "🎉 Deployment validation successful!"
    echo ""
    echo "Next steps:"
    echo "  1. Test from external network (if accessible)"
    echo "  2. Monitor logs for 24 hours"
    echo "  3. Configure monitoring alerts"
    echo "  4. Set up automated backups"
    echo "  5. Document any issues in deployment log"
    EXIT_CODE=0
elif [ "$FAILED_TESTS" -lt 3 ]; then
    echo -e "${YELLOW}⚠ Some tests failed ($SUCCESS_RATE% passed)${NC}"
    echo ""
    echo "Review the failed tests above and address issues."
    echo "Non-critical failures (ChromaDB, Rebuild platform) can be addressed later."
    EXIT_CODE=1
else
    echo -e "${RED}✗ Multiple critical tests failed ($SUCCESS_RATE% passed)${NC}"
    echo ""
    echo "Deployment may not be functional. Review logs:"
    echo "  docker-compose -f $COMPOSE_FILE logs -f"
    EXIT_CODE=2
fi

echo ""
echo "Validation completed at $(date)"
echo "============================================"

exit $EXIT_CODE
