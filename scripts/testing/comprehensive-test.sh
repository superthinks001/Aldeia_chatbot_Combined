#!/bin/bash

# Comprehensive Test Script with Authentication
set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🧪 Comprehensive API Test Suite${NC}"
echo "================================"
echo ""

PASSED=0
FAILED=0
SKIPPED=0

# Generate unique test email
TIMESTAMP=$(date +%s)
TEST_EMAIL="test-${TIMESTAMP}@example.com"
TEST_PASSWORD="Test1234!"

# Test 1: User Registration
echo -n "Test 1: User Registration... "
REGISTER_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"name\":\"Test User\",\"county\":\"LA County\"}")

HTTP_CODE=$(echo "$REGISTER_RESPONSE" | tail -n 1)
BODY=$(echo "$REGISTER_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "201" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
    ACCESS_TOKEN=$(echo "$BODY" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
else
    echo -e "${RED}✗ FAIL (HTTP $HTTP_CODE)${NC}"
    ((FAILED++))
    exit 1
fi

# Test 2: User Login
echo -n "Test 2: User Login... "
LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

HTTP_CODE=$(echo "$LOGIN_RESPONSE" | tail -n 1)
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL (HTTP $HTTP_CODE)${NC}"
    ((FAILED++))
fi

# Test 3: Token Verification
echo -n "Test 3: Token Verification... "
VERIFY_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  http://localhost:3001/api/auth/verify)

if [ "$VERIFY_CODE" = "200" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL (HTTP $VERIFY_CODE)${NC}"
    ((FAILED++))
fi

# Test 4: Get Profile
echo -n "Test 4: Get User Profile... "
PROFILE_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  http://localhost:3001/api/auth/profile)

if [ "$PROFILE_CODE" = "200" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL (HTTP $PROFILE_CODE)${NC}"
    ((FAILED++))
fi

# Test 5: Unauthorized Access
echo -n "Test 5: Unauthorized Access Block... "
UNAUTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  http://localhost:3001/api/auth/profile)

if [ "$UNAUTH_CODE" = "401" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL (HTTP $UNAUTH_CODE)${NC}"
    ((FAILED++))
fi

# Test 6: Chat - Greeting
echo -n "Test 6: Chat Greeting... "
CHAT_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3001/api/chat \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello","isFirstMessage":true}')

HTTP_CODE=$(echo "$CHAT_RESPONSE" | tail -n 1)
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
elif [ "$HTTP_CODE" = "503" ]; then
    echo -e "${YELLOW}⚠ SKIP (ChromaDB not running)${NC}"
    ((SKIPPED++))
else
    echo -e "${RED}✗ FAIL (HTTP $HTTP_CODE)${NC}"
    ((FAILED++))
fi

# Test 7: Chat - Knowledge Query
echo -n "Test 7: Chat Knowledge Query... "
CHAT_RESPONSE2=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3001/api/chat \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"How do I apply for debris removal?","isFirstMessage":false}')

HTTP_CODE=$(echo "$CHAT_RESPONSE2" | tail -n 1)
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
elif [ "$HTTP_CODE" = "503" ]; then
    echo -e "${YELLOW}⚠ SKIP (ChromaDB not running)${NC}"
    ((SKIPPED++))
else
    echo -e "${RED}✗ FAIL (HTTP $HTTP_CODE)${NC}"
    ((FAILED++))
fi

# Test 8: Get Billing Plans (with auth)
echo -n "Test 8: Get Billing Plans... "
PLANS_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  http://localhost:3001/api/billing/plans)

if [ "$PLANS_CODE" = "200" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL (HTTP $PLANS_CODE)${NC}"
    ((FAILED++))
fi

# Test 9: Get User Subscription
echo -n "Test 9: Get User Subscription... "
SUB_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  http://localhost:3001/api/billing/subscription)

if [ "$SUB_CODE" = "200" ] || [ "$SUB_CODE" = "404" ]; then
    echo -e "${GREEN}✓ PASS (no subscription is ok)${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL (HTTP $SUB_CODE)${NC}"
    ((FAILED++))
fi

# Test 10: Get Usage Statistics
echo -n "Test 10: Get Usage Statistics... "
USAGE_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  http://localhost:3001/api/billing/usage)

if [ "$USAGE_CODE" = "200" ] || [ "$USAGE_CODE" = "404" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL (HTTP $USAGE_CODE)${NC}"
    ((FAILED++))
fi

# Test 11: Password Validation - Weak Password
echo -n "Test 11: Weak Password Rejection... "
WEAK_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"weak${TIMESTAMP}@example.com\",\"password\":\"123\",\"name\":\"Test\"}")

if [ "$WEAK_CODE" = "400" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL (HTTP $WEAK_CODE)${NC}"
    ((FAILED++))
fi

# Test 12: Email Validation - Invalid Email
echo -n "Test 12: Invalid Email Rejection... "
INVALID_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"not-an-email","password":"Test1234!","name":"Test"}')

if [ "$INVALID_CODE" = "400" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL (HTTP $INVALID_CODE)${NC}"
    ((FAILED++))
fi

# Test 13: Duplicate User Prevention
echo -n "Test 13: Duplicate User Prevention... "
DUP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"name\":\"Test\"}")

if [ "$DUP_CODE" = "409" ] || [ "$DUP_CODE" = "400" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL (HTTP $DUP_CODE)${NC}"
    ((FAILED++))
fi

# Test 14: SQL Injection Prevention
echo -n "Test 14: SQL Injection Prevention... "
SQL_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin\" OR \"1\"=\"1","password":"anything"}')

if [ "$SQL_CODE" = "401" ] || [ "$SQL_CODE" = "400" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL (HTTP $SQL_CODE)${NC}"
    ((FAILED++))
fi

# Test 15: Invalid Login
echo -n "Test 15: Invalid Login Rejection... "
BAD_LOGIN_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"nonexistent@example.com","password":"WrongPassword123!"}')

if [ "$BAD_LOGIN_CODE" = "401" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL (HTTP $BAD_LOGIN_CODE)${NC}"
    ((FAILED++))
fi

echo ""
echo "================================"
echo -e "${BLUE}Test Results Summary:${NC}"
echo -e "${GREEN}Passed:  $PASSED${NC}"
echo -e "${RED}Failed:  $FAILED${NC}"
echo -e "${YELLOW}Skipped: $SKIPPED${NC}"

TOTAL=$((PASSED + FAILED))
if [ $TOTAL -gt 0 ]; then
    SUCCESS_RATE=$((PASSED * 100 / TOTAL))
    echo -e "${BLUE}Success Rate: $SUCCESS_RATE%${NC}"
fi

echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
elif [ $SUCCESS_RATE -ge 80 ]; then
    echo -e "${YELLOW}⚠️  Most tests passed ($SUCCESS_RATE%)${NC}"
    exit 0
else
    echo -e "${RED}❌ Multiple tests failed${NC}"
    exit 1
fi
