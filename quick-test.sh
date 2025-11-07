#!/bin/bash

# Quick Test Script
set -e

echo "🧪 Running Quick Tests"
echo "===================="
echo ""

# Generate unique test email
TIMESTAMP=$(date +%s)
TEST_EMAIL="test-${TIMESTAMP}@example.com"
TEST_PASSWORD="Test1234!"

# Test 1: User Registration
echo "Test 1: User Registration"
REGISTER_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"name\":\"Test User\",\"county\":\"LA County\"}")

HTTP_CODE=$(echo "$REGISTER_RESPONSE" | tail -n 1)
BODY=$(echo "$REGISTER_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "201" ]; then
    echo "✅ Registration: PASSED (HTTP $HTTP_CODE)"
    ACCESS_TOKEN=$(echo "$BODY" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
else
    echo "❌ Registration: FAILED (HTTP $HTTP_CODE)"
    echo "$BODY"
    exit 1
fi

echo ""

# Test 2: User Login
echo "Test 2: User Login"
LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

HTTP_CODE=$(echo "$LOGIN_RESPONSE" | tail -n 1)
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Login: PASSED (HTTP $HTTP_CODE)"
else
    echo "❌ Login: FAILED (HTTP $HTTP_CODE)"
fi

echo ""

# Test 3: Get Profile (Protected Endpoint)
echo "Test 3: Get Profile (Protected Endpoint)"
PROFILE_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  http://localhost:3001/api/auth/profile)

if [ "$PROFILE_CODE" = "200" ]; then
    echo "✅ Protected Endpoint: PASSED (HTTP $PROFILE_CODE)"
else
    echo "❌ Protected Endpoint: FAILED (HTTP $PROFILE_CODE)"
fi

echo ""

# Test 4: Unauthorized Access
echo "Test 4: Unauthorized Access Block"
UNAUTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  http://localhost:3001/api/auth/profile)

if [ "$UNAUTH_CODE" = "401" ]; then
    echo "✅ Unauthorized Block: PASSED (HTTP $UNAUTH_CODE)"
else
    echo "❌ Unauthorized Block: FAILED (HTTP $UNAUTH_CODE)"
fi

echo ""

# Test 5: Chat Endpoint
echo "Test 5: Chat Functionality"
CHAT_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3001/api/chat \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello","isFirstMessage":true}')

HTTP_CODE=$(echo "$CHAT_RESPONSE" | tail -n 1)
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Chat: PASSED (HTTP $HTTP_CODE)"
elif [ "$HTTP_CODE" = "503" ]; then
    echo "⚠️  Chat: SKIPPED (ChromaDB not running)"
else
    echo "❌ Chat: FAILED (HTTP $HTTP_CODE)"
fi

echo ""

# Test 6: Billing Plans
echo "Test 6: Get Billing Plans"
PLANS_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  http://localhost:3001/api/billing/plans)

if [ "$PLANS_CODE" = "200" ]; then
    echo "✅ Billing Plans: PASSED (HTTP $PLANS_CODE)"
else
    echo "❌ Billing Plans: FAILED (HTTP $PLANS_CODE)"
fi

echo ""

# Test 7: List Documents
echo "Test 7: List Documents"
DOCS_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  http://localhost:3001/api/documents)

if [ "$DOCS_CODE" = "200" ]; then
    echo "✅ List Documents: PASSED (HTTP $DOCS_CODE)"
else
    echo "❌ List Documents: FAILED (HTTP $DOCS_CODE)"
fi

echo ""
echo "===================="
echo "🎉 Quick Tests Complete!"
