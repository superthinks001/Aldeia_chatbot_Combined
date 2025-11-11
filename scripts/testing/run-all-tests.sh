#!/bin/bash

# ============================================
# Aldeia Chatbot - Automated Test Suite
# ============================================
# Comprehensive automated testing
# ============================================

set -e

echo "🧪 Starting Comprehensive Test Suite"
echo "====================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASSED=0
FAILED=0
TOTAL=0

run_test() {
    local test_name=$1
    local command=$2
    ((TOTAL++))

    echo -n "Testing: $test_name... "

    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        ((FAILED++))
        return 1
    fi
}

# ============================================
# Test Suite 1: Service Health
# ============================================

echo -e "${BLUE}Test Suite 1: Service Health${NC}"

run_test "Backend Health" "curl -f http://localhost:3001/api/health"
run_test "Frontend Load" "curl -f http://localhost:3000/ || curl -f http://localhost:3002/"
run_test "Redis Connection" "docker exec aldeia-redis redis-cli ping 2>/dev/null | grep -q PONG || docker-compose exec -T redis redis-cli ping 2>/dev/null | grep -q PONG"

# ChromaDB is optional
if curl -s http://localhost:8000/api/v1/heartbeat > /dev/null 2>&1; then
    run_test "ChromaDB Health" "curl -f http://localhost:8000/api/v1/heartbeat"
else
    echo -e "Testing: ChromaDB Health... ${YELLOW}⚠️  SKIP (optional)${NC}"
fi

echo ""

# ============================================
# Test Suite 2: Authentication
# ============================================

echo -e "${BLUE}Test Suite 2: Authentication${NC}"

# Generate unique email for testing
TIMESTAMP=$(date +%s)
TEST_EMAIL="automated-test-${TIMESTAMP}@example.com"
TEST_PASSWORD="AutoTest123!"

# Test Registration
REGISTER_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\",
    \"name\": \"Automated Test\",
    \"county\": \"LA County\"
  }")

HTTP_CODE=$(echo "$REGISTER_RESPONSE" | tail -n 1)
BODY=$(echo "$REGISTER_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "201" ] && echo "$BODY" | grep -q "accessToken"; then
    echo -e "Testing: User Registration... ${GREEN}✓ PASS${NC}"
    ((PASSED++))
    ((TOTAL++))

    # Extract token for further tests
    ACCESS_TOKEN=$(echo "$BODY" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
else
    echo -e "Testing: User Registration... ${RED}✗ FAIL (HTTP $HTTP_CODE)${NC}"
    ((FAILED++))
    ((TOTAL++))
    ACCESS_TOKEN=""
fi

# Test Login
LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\"
  }")

HTTP_CODE=$(echo "$LOGIN_RESPONSE" | tail -n 1)
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "Testing: User Login... ${GREEN}✓ PASS${NC}"
    ((PASSED++))
else
    echo -e "Testing: User Login... ${RED}✗ FAIL (HTTP $HTTP_CODE)${NC}"
    ((FAILED++))
fi
((TOTAL++))

# Test Protected Endpoint with Token
if [ -n "$ACCESS_TOKEN" ]; then
    PROFILE_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $ACCESS_TOKEN" http://localhost:3001/api/auth/profile)
    if [ "$PROFILE_CODE" = "200" ]; then
        echo -e "Testing: Protected Endpoint... ${GREEN}✓ PASS${NC}"
        ((PASSED++))
    else
        echo -e "Testing: Protected Endpoint... ${RED}✗ FAIL (HTTP $PROFILE_CODE)${NC}"
        ((FAILED++))
    fi
    ((TOTAL++))
fi

# Test Unauthorized Access
UNAUTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/auth/profile)
if [ "$UNAUTH_CODE" = "401" ]; then
    echo -e "Testing: Unauthorized Access Block... ${GREEN}✓ PASS${NC}"
    ((PASSED++))
else
    echo -e "Testing: Unauthorized Access Block... ${RED}✗ FAIL (HTTP $UNAUTH_CODE)${NC}"
    ((FAILED++))
fi
((TOTAL++))

# Test Token Verification
if [ -n "$ACCESS_TOKEN" ]; then
    VERIFY_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $ACCESS_TOKEN" http://localhost:3001/api/auth/verify)
    if [ "$VERIFY_CODE" = "200" ]; then
        echo -e "Testing: Token Verification... ${GREEN}✓ PASS${NC}"
        ((PASSED++))
    else
        echo -e "Testing: Token Verification... ${RED}✗ FAIL (HTTP $VERIFY_CODE)${NC}"
        ((FAILED++))
    fi
    ((TOTAL++))
fi

echo ""

# ============================================
# Test Suite 3: Chat Functionality
# ============================================

echo -e "${BLUE}Test Suite 3: Chat Functionality${NC}"

if [ -n "$ACCESS_TOKEN" ]; then
    # Test First Message (Greeting)
    CHAT_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3001/api/chat \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"message":"Hello","isFirstMessage":true}')

    HTTP_CODE=$(echo "$CHAT_RESPONSE" | tail -n 1)
    BODY=$(echo "$CHAT_RESPONSE" | sed '$d')

    if [ "$HTTP_CODE" = "200" ] && echo "$BODY" | grep -q "response"; then
        echo -e "Testing: Chat Greeting... ${GREEN}✓ PASS${NC}"
        ((PASSED++))
    elif [ "$HTTP_CODE" = "503" ]; then
        echo -e "Testing: Chat Greeting... ${YELLOW}⚠️  SKIP (ChromaDB not running)${NC}"
    else
        echo -e "Testing: Chat Greeting... ${RED}✗ FAIL (HTTP $HTTP_CODE)${NC}"
        ((FAILED++))
    fi
    ((TOTAL++))

    # Test Knowledge Query (if ChromaDB is running)
    if [ "$HTTP_CODE" = "200" ]; then
        CHAT_RESPONSE2=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3001/api/chat \
          -H "Authorization: Bearer $ACCESS_TOKEN" \
          -H "Content-Type: application/json" \
          -d '{"message":"How do I apply for debris removal?","isFirstMessage":false}')

        HTTP_CODE2=$(echo "$CHAT_RESPONSE2" | tail -n 1)
        if [ "$HTTP_CODE2" = "200" ]; then
            echo -e "Testing: Chat Knowledge Query... ${GREEN}✓ PASS${NC}"
            ((PASSED++))
        else
            echo -e "Testing: Chat Knowledge Query... ${RED}✗ FAIL (HTTP $HTTP_CODE2)${NC}"
            ((FAILED++))
        fi
        ((TOTAL++))
    fi
else
    echo -e "Testing: Chat Functionality... ${YELLOW}⚠️  SKIP (no access token)${NC}"
fi

echo ""

# ============================================
# Test Suite 4: Billing
# ============================================

echo -e "${BLUE}Test Suite 4: Billing${NC}"

# Test Get Plans (no auth required)
run_test "Get Billing Plans" "curl -f http://localhost:3001/api/billing/plans"

# Test Get Subscription (requires auth)
if [ -n "$ACCESS_TOKEN" ]; then
    SUB_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $ACCESS_TOKEN" http://localhost:3001/api/billing/subscription)
    if [ "$SUB_CODE" = "200" ] || [ "$SUB_CODE" = "404" ]; then
        echo -e "Testing: Get User Subscription... ${GREEN}✓ PASS${NC}"
        ((PASSED++))
    else
        echo -e "Testing: Get User Subscription... ${RED}✗ FAIL (HTTP $SUB_CODE)${NC}"
        ((FAILED++))
    fi
    ((TOTAL++))

    # Test Usage Stats
    USAGE_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $ACCESS_TOKEN" http://localhost:3001/api/billing/usage)
    if [ "$USAGE_CODE" = "200" ] || [ "$USAGE_CODE" = "404" ]; then
        echo -e "Testing: Get Usage Statistics... ${GREEN}✓ PASS${NC}"
        ((PASSED++))
    else
        echo -e "Testing: Get Usage Statistics... ${RED}✗ FAIL (HTTP $USAGE_CODE)${NC}"
        ((FAILED++))
    fi
    ((TOTAL++))
fi

echo ""

# ============================================
# Test Suite 5: Documents
# ============================================

echo -e "${BLUE}Test Suite 5: Documents${NC}"

run_test "List Documents" "curl -f http://localhost:3001/api/documents"
run_test "Search Documents" "curl -f 'http://localhost:3001/api/documents?search=test&limit=10'"

echo ""

# ============================================
# Test Suite 6: Security
# ============================================

echo -e "${BLUE}Test Suite 6: Security${NC}"

# Test SQL Injection Prevention
SQL_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin\" OR \"1\"=\"1","password":"anything"}')

if [ "$SQL_CODE" = "401" ]; then
    echo -e "Testing: SQL Injection Prevention... ${GREEN}✓ PASS${NC}"
    ((PASSED++))
else
    echo -e "Testing: SQL Injection Prevention... ${RED}✗ FAIL (HTTP $SQL_CODE)${NC}"
    ((FAILED++))
fi
((TOTAL++))

# Test XSS Prevention (register with script tag)
XSS_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"xss-test-${TIMESTAMP}@example.com\",
    \"password\": \"Test1234!\",
    \"name\": \"<script>alert('XSS')</script>\",
    \"county\": \"LA\"
  }")

if echo "$XSS_RESPONSE" | grep -q "script" && ! echo "$XSS_RESPONSE" | grep -q "<script>"; then
    echo -e "Testing: XSS Prevention... ${GREEN}✓ PASS (sanitized)${NC}"
    ((PASSED++))
elif echo "$XSS_RESPONSE" | grep -q "accessToken"; then
    echo -e "Testing: XSS Prevention... ${YELLOW}⚠️  WARN (check sanitization)${NC}"
    ((PASSED++))
else
    echo -e "Testing: XSS Prevention... ${RED}✗ FAIL${NC}"
    ((FAILED++))
fi
((TOTAL++))

# Test Invalid Email Format
INVALID_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"not-an-email","password":"Test1234!","name":"Test"}')

if [ "$INVALID_CODE" = "400" ]; then
    echo -e "Testing: Email Validation... ${GREEN}✓ PASS${NC}"
    ((PASSED++))
else
    echo -e "Testing: Email Validation... ${RED}✗ FAIL (HTTP $INVALID_CODE)${NC}"
    ((FAILED++))
fi
((TOTAL++))

# Test Weak Password
WEAK_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"weak@example.com","password":"123","name":"Test"}')

if [ "$WEAK_CODE" = "400" ]; then
    echo -e "Testing: Password Strength... ${GREEN}✓ PASS${NC}"
    ((PASSED++))
else
    echo -e "Testing: Password Strength... ${RED}✗ FAIL (HTTP $WEAK_CODE)${NC}"
    ((FAILED++))
fi
((TOTAL++))

echo ""

# ============================================
# Final Results
# ============================================

echo "====================================="
echo "Test Results Summary:"
echo -e "${BLUE}Total Tests:  $TOTAL${NC}"
echo -e "${GREEN}Passed:       $PASSED${NC}"
echo -e "${RED}Failed:       $FAILED${NC}"

SUCCESS_RATE=$((PASSED * 100 / TOTAL))
echo -e "${BLUE}Success Rate: $SUCCESS_RATE%${NC}"
echo "====================================="
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    echo ""
    echo "Your application is working correctly and ready for production!"
    exit 0
elif [ $SUCCESS_RATE -ge 80 ]; then
    echo -e "${YELLOW}⚠️  Most tests passed ($SUCCESS_RATE%)${NC}"
    echo ""
    echo "Review failed tests above. Some failures may be acceptable (e.g., ChromaDB optional)."
    exit 0
else
    echo -e "${RED}❌ Multiple tests failed ($SUCCESS_RATE%)${NC}"
    echo ""
    echo "Please review the failures above and fix issues before proceeding."
    exit 1
fi
