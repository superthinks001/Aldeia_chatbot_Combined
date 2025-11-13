#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BACKEND_URL="http://localhost:3001"

echo -e "${BLUE}🧪 Phase 5 Features Test Suite${NC}"
echo -e "${BLUE}================================${NC}\n"

TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

log_test() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if [ $1 -eq 0 ]; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        echo -e "${GREEN}✓ $2${NC}"
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        echo -e "${RED}✗ $2${NC}"
        echo -e "${RED}  Error: $3${NC}"
    fi
}

echo -e "${YELLOW}Testing Phase 5 Feature: Translation Service${NC}"
echo "==============================================="
echo "Testing if translation service module exists..."
if [ -f "apps/backend/src/services/translation.service.ts" ]; then
    log_test 0 "Translation service file exists"
else
    log_test 1 "Translation service file exists" "File not found"
fi

echo ""
echo -e "${YELLOW}Testing Phase 5 Feature: WebSocket Real-time${NC}"
echo "==============================================="
echo "Testing if WebSocket server module exists..."
if [ -f "apps/backend/src/websocket/socket.server.ts" ]; then
    log_test 0 "WebSocket server file exists"
else
    log_test 1 "WebSocket server file exists" "File not found"
fi

# Check if Socket.IO is integrated in index.ts
if grep -q "initializeWebSocket" "apps/backend/src/index.ts"; then
    log_test 0 "WebSocket integrated in main server"
else
    log_test 1 "WebSocket integrated in main server" "Not found in index.ts"
fi

echo ""
echo -e "${YELLOW}Testing Phase 5 Feature: Stripe Billing${NC}"
echo "==============================================="
echo "Testing if Stripe service module exists..."
if [ -f "apps/backend/src/services/billing/stripe.service.ts" ]; then
    log_test 0 "Stripe service file exists"
else
    log_test 1 "Stripe service file exists" "File not found"
fi

if [ -f "apps/backend/src/routes/billing.ts" ]; then
    log_test 0 "Billing routes file exists"
else
    log_test 1 "Billing routes file exists" "File not found"
fi

# Test billing plans endpoint (public)
echo -n "Testing billing plans API endpoint... "
PLANS_RESPONSE=$(curl -s -w "\n%{http_code}" "$BACKEND_URL/api/billing/plans" 2>&1)
HTTP_CODE=$(echo "$PLANS_RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "200" ]; then
    log_test 0 "Billing plans API endpoint responds"
else
    log_test 1 "Billing plans API endpoint responds" "HTTP $HTTP_CODE"
fi

echo ""
echo -e "${YELLOW}Testing Phase 5 Feature: Multi-tenant Architecture${NC}"
echo "==============================================="
echo "Testing if tenant middleware module exists..."
if [ -f "apps/backend/src/middleware/tenant.middleware.ts" ]; then
    log_test 0 "Tenant middleware file exists"
else
    log_test 1 "Tenant middleware file exists" "File not found"
fi

# Check if tenant middleware is integrated
if grep -q "tenantMiddleware" "apps/backend/src/index.ts"; then
    log_test 0 "Tenant middleware integrated in server"
else
    log_test 1 "Tenant middleware integrated in server" "Not found in index.ts"
fi

echo ""
echo -e "${YELLOW}Testing Phase 5 Feature: Voice Input/Output${NC}"
echo "==============================================="
echo "Testing if voice components exist..."
if [ -f "apps/chatbot-frontend/src/components/voice/VoiceInput.tsx" ]; then
    log_test 0 "VoiceInput component exists"
else
    log_test 1 "VoiceInput component exists" "File not found"
fi

if [ -f "apps/chatbot-frontend/src/components/voice/VoiceOutput.tsx" ]; then
    log_test 0 "VoiceOutput component exists"
else
    log_test 1 "VoiceOutput component exists" "File not found"
fi

echo ""
echo -e "${YELLOW}Testing Phase 5 Feature: WebSocket Client${NC}"
echo "==============================================="
echo "Testing if Socket.IO client service exists..."
if [ -f "apps/chatbot-frontend/src/services/socket.service.ts" ]; then
    log_test 0 "Socket.IO client service exists"
else
    log_test 1 "Socket.IO client service exists" "File not found"
fi

echo ""
echo -e "${YELLOW}Testing Database Migrations for Phase 5${NC}"
echo "==============================================="
echo "Testing if Phase 5 migration file exists..."
if [ -f "migrations/004_add_billing_and_tenancy.sql" ]; then
    log_test 0 "Phase 5 migration file exists"

    # Check for key tables in migration
    if grep -q "CREATE TABLE.*organizations" "migrations/004_add_billing_and_tenancy.sql"; then
        log_test 0 "Organizations table in migration"
    else
        log_test 1 "Organizations table in migration" "Not found"
    fi

    if grep -q "CREATE TABLE.*subscriptions" "migrations/004_add_billing_and_tenancy.sql"; then
        log_test 0 "Subscriptions table in migration"
    else
        log_test 1 "Subscriptions table in migration" "Not found"
    fi

    if grep -q "CREATE TABLE.*usage_quotas" "migrations/004_add_billing_and_tenancy.sql"; then
        log_test 0 "Usage quotas table in migration"
    else
        log_test 1 "Usage quotas table in migration" "Not found"
    fi
else
    log_test 1 "Phase 5 migration file exists" "File not found"
fi

echo ""
echo -e "${YELLOW}Testing Dependencies Installation${NC}"
echo "==============================================="

# Check backend package.json for Phase 5 dependencies
echo "Checking backend dependencies..."
if grep -q "socket.io" "apps/backend/package.json"; then
    log_test 0 "socket.io dependency installed"
else
    log_test 1 "socket.io dependency installed" "Not found in package.json"
fi

if grep -q "stripe" "apps/backend/package.json"; then
    log_test 0 "stripe dependency installed"
else
    log_test 1 "stripe dependency installed" "Not found in package.json"
fi

if grep -q "google-translate-api-x" "apps/backend/package.json"; then
    log_test 0 "google-translate-api-x dependency installed"
else
    log_test 1 "google-translate-api-x dependency installed" "Not found in package.json"
fi

# Check frontend package.json for Phase 5 dependencies
echo ""
echo "Checking frontend dependencies..."
if grep -q "socket.io-client" "apps/chatbot-frontend/package.json"; then
    log_test 0 "socket.io-client dependency installed"
else
    log_test 1 "socket.io-client dependency installed" "Not found in package.json"
fi

if grep -q "react-i18next" "apps/chatbot-frontend/package.json"; then
    log_test 0 "react-i18next dependency installed"
else
    log_test 1 "react-i18next dependency installed" "Not found in package.json"
fi

if grep -q "@stripe/stripe-js" "apps/chatbot-frontend/package.json"; then
    log_test 0 "@stripe/stripe-js dependency installed"
else
    log_test 1 "@stripe/stripe-js dependency installed" "Not found in package.json"
fi

echo ""
echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}Phase 5 Test Summary${NC}"
echo -e "${BLUE}================================${NC}"
echo -e "Total Tests:  ${TOTAL_TESTS}"
echo -e "${GREEN}Passed:       ${PASSED_TESTS}${NC}"
echo -e "${RED}Failed:       ${FAILED_TESTS}${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✅ All Phase 5 feature tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some Phase 5 tests failed!${NC}"
    exit 1
fi
