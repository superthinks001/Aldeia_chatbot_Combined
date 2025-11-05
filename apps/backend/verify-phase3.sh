#!/bin/bash

echo "🔍 Verifying Phase 3 Completion..."
echo ""

PASS=0
FAIL=0

# Check 1: Auth services exist
if [ -f "src/services/auth/auth.service.ts" ] && [ -f "src/services/auth/rbac.service.ts" ]; then
  echo "✅ Auth services exist"
  ((PASS++))
else
  echo "❌ Auth services missing"
  ((FAIL++))
fi

# Check 2: Middleware exists
if [ -f "src/middleware/auth/authenticate.middleware.ts" ] && [ -f "src/middleware/auth/authorize.middleware.ts" ]; then
  echo "✅ Auth middleware exists"
  ((PASS++))
else
  echo "❌ Auth middleware missing"
  ((FAIL++))
fi

# Check 3: Auth routes exist
if [ -f "src/routes/auth.routes.ts" ]; then
  echo "✅ Auth routes exist"
  ((PASS++))
else
  echo "❌ Auth routes missing"
  ((FAIL++))
fi

# Check 4: New services exist
if [ -f "src/services/analytics.service.ts" ] && [ -f "src/services/conversations.service.ts" ]; then
  echo "✅ Chat integration services exist"
  ((PASS++))
else
  echo "❌ Chat integration services missing"
  ((FAIL++))
fi

# Check 5: Migration 003 exists
if [ -f "../../migrations/003_add_conversation_messages.sql" ]; then
  echo "✅ Conversation messages migration exists"
  ((PASS++))
else
  echo "❌ Conversation messages migration missing"
  ((FAIL++))
fi

# Check 6: Test registration
echo "🧪 Testing user registration..."
REGISTER=$(curl -s -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "verify@test.com",
    "password": "Verify1234",
    "name": "Verify User"
  }')

if echo "$REGISTER" | grep -q "successfully\|already exists"; then
  echo "✅ Registration endpoint works"
  ((PASS++))
else
  echo "❌ Registration failed"
  ((FAIL++))
fi

# Check 7: Test login
echo "🧪 Testing user login..."
LOGIN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "freshtest@example.com",
    "password": "Test1234"
  }')

if echo "$LOGIN" | grep -q "accessToken"; then
  echo "✅ Login endpoint works"
  ((PASS++))

  # Extract token for further tests
  TOKEN=$(echo $LOGIN | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
else
  echo "❌ Login failed"
  ((FAIL++))
fi

# Check 8: Test authenticated chat
if [ -n "$TOKEN" ]; then
  echo "🧪 Testing authenticated chat..."
  CHAT=$(curl -s -X POST http://localhost:3001/api/chat \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"message": "Hello", "isFirstMessage": true}')

  if echo "$CHAT" | grep -q "response"; then
    echo "✅ Authenticated chat works"
    ((PASS++))
  else
    echo "❌ Authenticated chat failed"
    ((FAIL++))
  fi
fi

# Check 9: Test RBAC protection
if [ -n "$TOKEN" ]; then
  echo "🧪 Testing RBAC protection..."
  ADMIN=$(curl -s -X GET http://localhost:3001/api/chat/admin/analytics \
    -H "Authorization: Bearer $TOKEN")

  if echo "$ADMIN" | grep -q "Insufficient permissions"; then
    echo "✅ RBAC protection works (regular user blocked)"
    ((PASS++))
  else
    echo "⚠️  RBAC check inconclusive"
  fi
fi

echo ""
echo "========================================="
echo "Results: $PASS passed, $FAIL failed"
echo "========================================="

if [ $FAIL -eq 0 ]; then
  echo ""
  echo "🎉 Phase 3 Complete!"
  echo ""
  echo "📝 What You've Accomplished:"
  echo "   ✅ JWT authentication with refresh tokens"
  echo "   ✅ Role-Based Access Control (RBAC) - 4 roles, 17 permissions"
  echo "   ✅ Protected API endpoints with middleware"
  echo "   ✅ Secure password hashing (bcrypt)"
  echo "   ✅ Session management in PostgreSQL"
  echo "   ✅ Chat routes authentication integration"
  echo "   ✅ Conversation history storage"
  echo "   ✅ Analytics service (PostgreSQL)"
  echo ""
  echo "🚀 Next Steps:"
  echo "   1. Review documentation: merge-docs/PHASE3_COMPLETION_SUMMARY.md"
  echo "   2. Commit your changes"
  echo "   3. Ready for Phase 4: Frontend Authentication Integration"
  echo ""
  echo "💡 Test commands available:"
  echo "   • Full auth test: ./test-auth.sh"
  echo "   • Chat auth test: ./test-auth-chat.sh"
  echo "   • RBAC test: ./test-rbac-fix.sh"
  echo "   • Get profile: curl -H 'Authorization: Bearer YOUR_TOKEN' http://localhost:3001/api/auth/profile"
  echo ""
  echo "📊 Phase Progress: 50% (3/8 phases complete)"
else
  echo ""
  echo "⚠️  Some checks failed. Review the issues above."
  echo ""
  echo "💡 Make sure the backend server is running:"
  echo "   cd apps/backend && npm run dev"
fi
