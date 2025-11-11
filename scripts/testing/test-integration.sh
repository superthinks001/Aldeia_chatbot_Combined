#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="http://localhost:3001"
TEST_EMAIL="integration-test-$(date +%s)@test.com"
TEST_PASSWORD="Test1234!@#"
TEST_NAME="Integration Test User"
TEST_COUNTY="Los Angeles"

echo -e "${BLUE}🧪 Aldeia Chatbot - Integration Test Suite${NC}"
echo -e "${BLUE}============================================${NC}\n"

# Test counter
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to log test results
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

# Function to extract JSON value
extract_json() {
    echo "$1" | grep -o "\"$2\":\"[^\"]*\"" | grep -o "\"[^\"]*\"$" | sed 's/"//g'
}

echo -e "${YELLOW}Phase 1: Backend Health Check${NC}"
echo "================================"

# Test 1: Health check endpoint
echo -n "Testing health endpoint... "
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "$BACKEND_URL/api/health" 2>&1)
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$HEALTH_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    log_test 0 "Health check endpoint"
    echo "  Response: $RESPONSE_BODY"
else
    log_test 1 "Health check endpoint" "HTTP $HTTP_CODE"
fi

echo ""
echo -e "${YELLOW}Phase 2: User Authentication${NC}"
echo "================================"

# Test 2: User registration
echo -n "Testing user registration... "
REGISTER_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BACKEND_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"name\":\"$TEST_NAME\",\"county\":\"$TEST_COUNTY\"}" 2>&1)

HTTP_CODE=$(echo "$REGISTER_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$REGISTER_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "201" ]; then
    log_test 0 "User registration"
    echo "  Email: $TEST_EMAIL"
    echo "  Response: $RESPONSE_BODY"
else
    log_test 1 "User registration" "HTTP $HTTP_CODE - $RESPONSE_BODY"
    echo -e "${RED}Cannot continue without successful registration${NC}"
    exit 1
fi

# Test 3: User login
echo ""
echo -n "Testing user login... "
LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BACKEND_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" 2>&1)

HTTP_CODE=$(echo "$LOGIN_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$LOGIN_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    log_test 0 "User login"

    # Extract tokens (using grep/sed since jq might not be installed)
    ACCESS_TOKEN=$(extract_json "$RESPONSE_BODY" "accessToken")
    REFRESH_TOKEN=$(extract_json "$RESPONSE_BODY" "refreshToken")

    if [ -n "$ACCESS_TOKEN" ]; then
        echo "  Access token received (${#ACCESS_TOKEN} chars)"
    else
        echo -e "${RED}  Warning: No access token in response${NC}"
        log_test 1 "Token extraction" "Access token not found"
        exit 1
    fi
else
    log_test 1 "User login" "HTTP $HTTP_CODE - $RESPONSE_BODY"
    exit 1
fi

# Test 4: Token verification
echo ""
echo -n "Testing token verification... "
VERIFY_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BACKEND_URL/api/auth/verify" \
  -H "Authorization: Bearer $ACCESS_TOKEN" 2>&1)

HTTP_CODE=$(echo "$VERIFY_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$VERIFY_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    log_test 0 "Token verification"
    echo "  Response: $RESPONSE_BODY"
else
    log_test 1 "Token verification" "HTTP $HTTP_CODE"
fi

echo ""
echo -e "${YELLOW}Phase 3: Protected Chat Endpoints${NC}"
echo "================================"

# Test 5: Send chat message (authenticated)
echo -n "Testing chat endpoint (authenticated)... "
CHAT_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BACKEND_URL/api/chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"message":"How can I apply for debris removal in California?","context":{"pageUrl":"http://localhost:3000"}}' 2>&1)

HTTP_CODE=$(echo "$CHAT_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$CHAT_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    log_test 0 "Chat endpoint (authenticated)"
    echo "  Response preview: $(echo "$RESPONSE_BODY" | head -c 100)..."
else
    log_test 1 "Chat endpoint (authenticated)" "HTTP $HTTP_CODE"
fi

# Test 6: Chat endpoint without authentication (should fail)
echo ""
echo -n "Testing chat endpoint (no auth - should fail)... "
UNAUTH_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BACKEND_URL/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"This should fail"}' 2>&1)

HTTP_CODE=$(echo "$UNAUTH_RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "401" ]; then
    log_test 0 "Chat endpoint (no auth protection)"
    echo "  Correctly rejected unauthorized request"
else
    log_test 1 "Chat endpoint (no auth protection)" "Should return 401, got HTTP $HTTP_CODE"
fi

echo ""
echo -e "${YELLOW}Phase 4: Billing Endpoints${NC}"
echo "================================"

# Test 7: Get subscription plans
echo -n "Testing billing plans endpoint... "
PLANS_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BACKEND_URL/api/billing/plans" 2>&1)

HTTP_CODE=$(echo "$PLANS_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$PLANS_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    log_test 0 "Billing plans endpoint"
    echo "  Plans available: $(echo "$RESPONSE_BODY" | grep -o "free\|pro\|enterprise" | wc -l)"
else
    log_test 1 "Billing plans endpoint" "HTTP $HTTP_CODE"
fi

# Test 8: Get user subscription (authenticated)
echo ""
echo -n "Testing user subscription endpoint... "
SUBSCRIPTION_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BACKEND_URL/api/billing/subscription" \
  -H "Authorization: Bearer $ACCESS_TOKEN" 2>&1)

HTTP_CODE=$(echo "$SUBSCRIPTION_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$SUBSCRIPTION_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    log_test 0 "User subscription endpoint"
    echo "  Response: $RESPONSE_BODY"
else
    log_test 1 "User subscription endpoint" "HTTP $HTTP_CODE"
fi

echo ""
echo -e "${YELLOW}Phase 5: User Profile Endpoints${NC}"
echo "================================"

# Test 9: Get user profile
echo -n "Testing user profile endpoint... "
PROFILE_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BACKEND_URL/api/auth/profile" \
  -H "Authorization: Bearer $ACCESS_TOKEN" 2>&1)

HTTP_CODE=$(echo "$PROFILE_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$PROFILE_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    log_test 0 "User profile endpoint"
    echo "  Response: $RESPONSE_BODY"
else
    log_test 1 "User profile endpoint" "HTTP $HTTP_CODE"
fi

echo ""
echo -e "${YELLOW}Phase 6: Token Refresh${NC}"
echo "================================"

# Test 10: Refresh token
echo -n "Testing token refresh... "
REFRESH_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BACKEND_URL/api/auth/refresh" \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}" 2>&1)

HTTP_CODE=$(echo "$REFRESH_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$REFRESH_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    log_test 0 "Token refresh"
    NEW_ACCESS_TOKEN=$(extract_json "$RESPONSE_BODY" "accessToken")
    if [ -n "$NEW_ACCESS_TOKEN" ]; then
        echo "  New access token received (${#NEW_ACCESS_TOKEN} chars)"
    fi
else
    log_test 1 "Token refresh" "HTTP $HTTP_CODE"
fi

echo ""
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}Test Summary${NC}"
echo -e "${BLUE}============================================${NC}"
echo -e "Total Tests:  ${TOTAL_TESTS}"
echo -e "${GREEN}Passed:       ${PASSED_TESTS}${NC}"
echo -e "${RED}Failed:       ${FAILED_TESTS}${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✅ All integration tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed!${NC}"
    exit 1
fi
