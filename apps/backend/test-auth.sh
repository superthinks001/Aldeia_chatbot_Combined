#!/bin/bash

API_URL="http://localhost:3001/api"
echo "🧪 Testing Authentication System"
echo "================================"
echo ""

# Test 1: Health check (public)
echo "Test 1: Health Check (Public)"
HEALTH=$(curl -s $API_URL/health)
echo "Response: $HEALTH"
echo ""

# Test 2: Register new user
echo "Test 2: Register New User"
REGISTER=$(curl -s -X POST $API_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@aldeia.com",
    "password": "Test1234!",
    "name": "Test User",
    "county": "LA"
  }')
echo "Response: $REGISTER"
echo ""

# Test 3: Login
echo "Test 3: Login"
LOGIN=$(curl -s -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@aldeia.com",
    "password": "Test1234!"
  }')
echo "Response: $LOGIN"

# Extract access token
ACCESS_TOKEN=$(echo $LOGIN | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
REFRESH_TOKEN=$(echo $LOGIN | grep -o '"refreshToken":"[^"]*' | cut -d'"' -f4)
echo ""
echo "Access Token: ${ACCESS_TOKEN:0:50}..."
echo "Refresh Token: ${REFRESH_TOKEN:0:50}..."
echo ""

# Test 4: Get current user (protected)
echo "Test 4: Get Current User (Protected)"
ME=$(curl -s $API_URL/auth/profile \
  -H "Authorization: Bearer $ACCESS_TOKEN")
echo "Response: $ME"
echo ""

# Test 5: Try to access protected route without token
echo "Test 5: Access Protected Route Without Token (Should Fail)"
NO_AUTH=$(curl -s -X POST $API_URL/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}')
echo "Response: $NO_AUTH"
echo ""

# Test 6: Access protected route with token
echo "Test 6: Access Protected Route With Token (Should Work)"
WITH_AUTH=$(curl -s -X POST $API_URL/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"message": "Hello"}')
echo "Response: $WITH_AUTH"
echo ""

# Test 7: Refresh token
echo "Test 7: Refresh Access Token"
REFRESH=$(curl -s -X POST $API_URL/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\": \"$REFRESH_TOKEN\"}")
echo "Response: $REFRESH"
echo ""

# Test 8: Logout
echo "Test 8: Logout"
LOGOUT=$(curl -s -X POST $API_URL/auth/logout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{\"refreshToken\": \"$REFRESH_TOKEN\"}")
echo "Response: $LOGOUT"
echo ""

# Test 9: Try to use refresh token after logout (should fail)
echo "Test 9: Try Refresh After Logout (Should Fail)"
AFTER_LOGOUT=$(curl -s -X POST $API_URL/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\": \"$REFRESH_TOKEN\"}")
echo "Response: $AFTER_LOGOUT"
echo ""

echo "✅ Authentication tests complete!"
