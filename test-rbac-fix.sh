#!/bin/bash

echo "========================================="
echo "🔐 Testing RBAC Fix"
echo "========================================="
echo ""

# Get regular user token
echo "1️⃣  Logging in as regular user..."
LOGIN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"freshtest@example.com","password":"Test1234"}')

TOKEN=$(echo $LOGIN | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
echo "Token: ${TOKEN:0:50}..."
echo ""

# Test admin analytics endpoint (should fail)
echo "2️⃣  Testing /admin/analytics with regular user (should fail)..."
ANALYTICS=$(curl -s -X GET http://localhost:3001/api/chat/admin/analytics \
  -H "Authorization: Bearer $TOKEN")

echo "Response: $ANALYTICS"
if echo "$ANALYTICS" | grep -q "Insufficient permissions"; then
  echo "✅ PASS: Regular user correctly blocked from admin analytics"
else
  echo "❌ FAIL: Regular user should not access admin analytics"
fi
echo ""

# Test admin users endpoint (should fail)
echo "3️⃣  Testing /admin/users with regular user (should fail)..."
USERS=$(curl -s -X GET http://localhost:3001/api/chat/admin/users \
  -H "Authorization: Bearer $TOKEN")

echo "Response: $USERS"
if echo "$USERS" | grep -q "Insufficient permissions"; then
  echo "✅ PASS: Regular user correctly blocked from admin users"
else
  echo "❌ FAIL: Regular user should not access admin users"
fi
echo ""

# Test regular chat endpoint (should work)
echo "4️⃣  Testing regular /chat endpoint (should work)..."
CHAT=$(curl -s -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"message": "Hello", "isFirstMessage": true}')

if echo "$CHAT" | grep -q "response"; then
  echo "✅ PASS: Regular user can chat successfully"
else
  echo "❌ FAIL: Regular user should be able to chat"
fi
echo ""

echo "========================================="
echo "✅ RBAC Testing Complete"
echo "========================================="
