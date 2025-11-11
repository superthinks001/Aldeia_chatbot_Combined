#!/bin/bash

# Simple Phase 6 Integration Test Suite
# Compatible with macOS/Linux

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

BACKEND_URL="http://localhost:3001"
TESTS_PASSED=0
TESTS_FAILED=0

echo -e "${BLUE}🧪 Phase 6: Integration Test Suite${NC}"
echo -e "${BLUE}====================================${NC}\n"

# Test 1: Health Check
echo -e "${YELLOW}Test 1: Health Check${NC}"
HTTP_CODE=$(curl -s -o /tmp/response.json -w "%{http_code}" "$BACKEND_URL/api/health")
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Health endpoint working (HTTP $HTTP_CODE)${NC}"
    cat /tmp/response.json | python3 -m json.tool 2>/dev/null || cat /tmp/response.json
    TESTS_PASSED=$((TESTS_PASSED+1))
else
    echo -e "${RED}✗ Health endpoint failed (HTTP $HTTP_CODE)${NC}"
    TESTS_FAILED=$((TESTS_FAILED+1))
fi

# Test 2: User Registration
echo -e "\n${YELLOW}Test 2: User Registration${NC}"
TEST_EMAIL="phase6-test-$(date +%s)@test.com"
REGISTER_DATA="{\"email\":\"$TEST_EMAIL\",\"password\":\"Test1234!\",\"name\":\"Phase 6 Test\",\"county\":\"LA\"}"

HTTP_CODE=$(curl -s -o /tmp/response.json -w "%{http_code}" \
  -X POST "$BACKEND_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "$REGISTER_DATA")

if [ "$HTTP_CODE" = "201" ]; then
    echo -e "${GREEN}✓ User registration successful (HTTP $HTTP_CODE)${NC}"
    echo "  Email: $TEST_EMAIL"
    TESTS_PASSED=$((TESTS_PASSED+1))
else
    echo -e "${RED}✗ User registration failed (HTTP $HTTP_CODE)${NC}"
    cat /tmp/response.json
    TESTS_FAILED=$((TESTS_FAILED+1))
    exit 1
fi

# Test 3: User Login
echo -e "\n${YELLOW}Test 3: User Login${NC}"
LOGIN_DATA="{\"email\":\"$TEST_EMAIL\",\"password\":\"Test1234!\"}"

HTTP_CODE=$(curl -s -o /tmp/response.json -w "%{http_code}" \
  -X POST "$BACKEND_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "$LOGIN_DATA")

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ User login successful (HTTP $HTTP_CODE)${NC}"
    ACCESS_TOKEN=$(cat /tmp/response.json | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
    echo "  Token length: ${#ACCESS_TOKEN} chars"
    TESTS_PASSED=$((TESTS_PASSED+1))
else
    echo -e "${RED}✗ User login failed (HTTP $HTTP_CODE)${NC}"
    cat /tmp/response.json
    TESTS_FAILED=$((TESTS_FAILED+1))
    exit 1
fi

# Test 4: Protected Chat Endpoint
echo -e "\n${YELLOW}Test 4: Protected Chat Endpoint${NC}"
CHAT_DATA='{"message":"How can I apply for debris removal?","context":{"pageUrl":"http://localhost:3000"}}'

HTTP_CODE=$(curl -s -o /tmp/response.json -w "%{http_code}" \
  -X POST "$BACKEND_URL/api/chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "$CHAT_DATA")

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Chat endpoint working (HTTP $HTTP_CODE)${NC}"
    echo "  Response preview: $(cat /tmp/response.json | head -c 100)..."
    TESTS_PASSED=$((TESTS_PASSED+1))
else
    echo -e "${RED}✗ Chat endpoint failed (HTTP $HTTP_CODE)${NC}"
    cat /tmp/response.json
    TESTS_FAILED=$((TESTS_FAILED+1))
fi

# Test 5: Unauthorized Access
echo -e "\n${YELLOW}Test 5: Unauthorized Access (Should Fail)${NC}"
HTTP_CODE=$(curl -s -o /tmp/response.json -w "%{http_code}" \
  -X POST "$BACKEND_URL/api/chat" \
  -H "Content-Type: application/json" \
  -d "$CHAT_DATA")

if [ "$HTTP_CODE" = "401" ]; then
    echo -e "${GREEN}✓ Unauthorized request correctly rejected (HTTP $HTTP_CODE)${NC}"
    TESTS_PASSED=$((TESTS_PASSED+1))
else
    echo -e "${RED}✗ Should have returned 401, got HTTP $HTTP_CODE${NC}"
    TESTS_FAILED=$((TESTS_FAILED+1))
fi

# Test 6: Token Verification
echo -e "\n${YELLOW}Test 6: Token Verification${NC}"
HTTP_CODE=$(curl -s -o /tmp/response.json -w "%{http_code}" \
  -X GET "$BACKEND_URL/api/auth/verify" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Token verification successful (HTTP $HTTP_CODE)${NC}"
    cat /tmp/response.json | python3 -m json.tool 2>/dev/null || cat /tmp/response.json
    TESTS_PASSED=$((TESTS_PASSED+1))
else
    echo -e "${RED}✗ Token verification failed (HTTP $HTTP_CODE)${NC}"
    TESTS_FAILED=$((TESTS_FAILED+1))
fi

# Test 7: User Profile
echo -e "\n${YELLOW}Test 7: User Profile${NC}"
HTTP_CODE=$(curl -s -o /tmp/response.json -w "%{http_code}" \
  -X GET "$BACKEND_URL/api/auth/profile" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ User profile retrieved (HTTP $HTTP_CODE)${NC}"
    cat /tmp/response.json | python3 -m json.tool 2>/dev/null || cat /tmp/response.json
    TESTS_PASSED=$((TESTS_PASSED+1))
else
    echo -e "${RED}✗ User profile failed (HTTP $HTTP_CODE)${NC}"
    TESTS_FAILED=$((TESTS_FAILED+1))
fi

# Test 8: User Subscription
echo -e "\n${YELLOW}Test 8: User Subscription${NC}"
HTTP_CODE=$(curl -s -o /tmp/response.json -w "%{http_code}" \
  -X GET "$BACKEND_URL/api/billing/subscription" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ User subscription retrieved (HTTP $HTTP_CODE)${NC}"
    cat /tmp/response.json | python3 -m json.tool 2>/dev/null || cat /tmp/response.json
    TESTS_PASSED=$((TESTS_PASSED+1))
else
    echo -e "${RED}✗ User subscription failed (HTTP $HTTP_CODE)${NC}"
    cat /tmp/response.json
    TESTS_FAILED=$((TESTS_FAILED+1))
fi

# Summary
echo -e "\n${BLUE}====================================${NC}"
echo -e "${BLUE}Test Summary${NC}"
echo -e "${BLUE}====================================${NC}"
echo -e "Total Tests: $((TESTS_PASSED + TESTS_FAILED))"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All integration tests passed!${NC}"
    echo -e "${GREEN}✅ Phase 6: Testing & Validation COMPLETE${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
fi
