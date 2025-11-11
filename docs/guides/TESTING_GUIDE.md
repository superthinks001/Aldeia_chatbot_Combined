# Aldeia Chatbot - Complete Testing Guide

**Version**: 1.0.0
**Last Updated**: January 7, 2025
**Purpose**: Comprehensive guide to start all services and test the entire application

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Starting Services](#starting-services)
3. [Service Health Verification](#service-health-verification)
4. [Test Cases](#test-cases)
5. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- [ ] **Node.js** v18+ installed
  ```bash
  node -v  # Should show v18.0.0 or higher
  ```

- [ ] **npm** v9+ installed
  ```bash
  npm -v  # Should show v9.0.0 or higher
  ```

- [ ] **Docker** and **Docker Compose** installed
  ```bash
  docker --version
  docker-compose --version
  ```

- [ ] **PostgreSQL/Supabase** credentials configured
- [ ] **Redis** available (or will start with Docker)
- [ ] **ChromaDB** available (or will start with Docker)

### Environment Configuration

Ensure `.env` or `.env.merge` exists with all required variables:

```bash
# Check environment file exists
ls -la .env.merge

# Verify no placeholder values remain
grep -E "REPLACE|TODO|CHANGEME" .env.merge && echo "⚠️ Update placeholders!" || echo "✅ Config ready"
```

---

## Starting Services

### Option 1: Start Everything with Docker (Recommended)

This starts all services together using Docker Compose.

#### Step 1: Start Docker Services

```bash
# Navigate to project root
cd /Users/gverma/Desktop/SuperThinks/Aldeia_chatbot_Combined

# Start all services in detached mode
docker-compose up -d

# Or use production config
docker-compose -f docker-compose.production.yml up -d
```

**Expected Output**:
```
Creating network "aldeia_chatbot_combined_aldeia-network" ... done
Creating aldeia-redis     ... done
Creating aldeia-chromadb  ... done
Creating aldeia-backend   ... done
Creating aldeia-chatbot-frontend ... done
Creating aldeia-nginx     ... done
```

#### Step 2: View Service Status

```bash
# Check service status
docker-compose ps

# Or for production
docker-compose -f docker-compose.production.yml ps
```

**Expected Output**:
```
NAME                       STATUS              PORTS
aldeia-backend            Up (healthy)        3001/tcp
aldeia-chatbot-frontend   Up (healthy)        3002/tcp
aldeia-chromadb           Up (healthy)        8000/tcp
aldeia-nginx              Up                  80/tcp, 443/tcp
aldeia-redis              Up (healthy)        6379/tcp
```

#### Step 3: View Logs

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f chatbot-frontend
docker-compose logs -f redis
docker-compose logs -f chromadb
```

#### Step 4: Stop Services (When Done Testing)

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (full cleanup)
docker-compose down -v
```

---

### Option 2: Start Services Individually (Development)

This is useful for development when you want to see logs directly and make code changes.

#### Step 1: Start Supporting Services (Docker)

Start Redis and ChromaDB with Docker:

```bash
# Start only Redis and ChromaDB
docker-compose up -d redis chromadb

# Verify they're running
docker-compose ps redis chromadb
```

#### Step 2: Start Backend

```bash
# Open a new terminal window/tab
cd /Users/gverma/Desktop/SuperThinks/Aldeia_chatbot_Combined

# Install dependencies (first time only)
npm install

# Navigate to backend
cd apps/backend

# Install backend dependencies (first time only)
npm install

# Start backend in development mode
npm run dev
```

**Expected Output**:
```
[INFO] Starting Aldeia Chatbot Backend...
[INFO] Environment: development
[INFO] Connecting to PostgreSQL database...
[INFO] Database connected successfully
[INFO] Connecting to Redis...
[INFO] Redis connected successfully
[INFO] Server listening on port 3001
[INFO] Health check available at: http://localhost:3001/api/health
```

**Keep this terminal open** to see backend logs.

#### Step 3: Start Frontend

```bash
# Open ANOTHER new terminal window/tab
cd /Users/gverma/Desktop/SuperThinks/Aldeia_chatbot_Combined

# Navigate to frontend
cd apps/chatbot-frontend

# Install frontend dependencies (first time only)
npm install

# Start frontend in development mode
npm start
```

**Expected Output**:
```
Compiled successfully!

You can now view chatbot-frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.1.100:3000

Note that the development build is not optimized.
To create a production build, use npm run build.

webpack compiled successfully
```

**Keep this terminal open** to see frontend logs.

Frontend will automatically open in your browser at `http://localhost:3000`.

#### Step 4: Verify All Services Running

You should now have **4 terminal windows** open:

1. **Terminal 1**: Docker services (Redis, ChromaDB)
2. **Terminal 2**: Backend server (port 3001)
3. **Terminal 3**: Frontend dev server (port 3000)
4. **Terminal 4**: For running tests (commands below)

---

### Option 3: Mixed Approach (Backend + Frontend Native, Others Docker)

This is the **recommended approach for development** as it provides the best debugging experience.

```bash
# Terminal 1: Start Docker services
docker-compose up redis chromadb

# Terminal 2: Start backend
cd apps/backend && npm run dev

# Terminal 3: Start frontend
cd apps/chatbot-frontend && npm start

# Terminal 4: Available for testing commands
```

---

## Service Health Verification

Before running tests, verify all services are healthy.

### Quick Health Check

```bash
# Backend health
curl http://localhost:3001/api/health

# Expected: {"status":"ok","timestamp":"2025-01-07T..."}

# ChromaDB health
curl http://localhost:8000/api/v1/heartbeat

# Expected: {"nanosecond heartbeat": ...}

# Redis health
docker exec -it aldeia-redis redis-cli ping
# Or if Redis is in Docker Compose
docker-compose exec redis redis-cli ping

# Expected: PONG

# Frontend (should show HTML)
curl http://localhost:3000/

# Expected: HTML content with <!DOCTYPE html>
```

### Comprehensive Health Check Script

```bash
# Run the comprehensive health check
./health-check.sh

# If script doesn't exist, create it:
cat > health-check.sh << 'EOF'
#!/bin/bash

echo "🔍 Checking Service Health..."
echo ""

# Backend
echo -n "Backend (3001): "
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo "✅ Healthy"
else
    echo "❌ Not responding"
fi

# Frontend
echo -n "Frontend (3000): "
if curl -s http://localhost:3000/ > /dev/null; then
    echo "✅ Healthy"
else
    echo "❌ Not responding"
fi

# Redis
echo -n "Redis (6379): "
if docker exec aldeia-redis redis-cli ping 2>/dev/null | grep -q PONG; then
    echo "✅ Healthy"
elif redis-cli ping 2>/dev/null | grep -q PONG; then
    echo "✅ Healthy"
else
    echo "❌ Not responding"
fi

# ChromaDB
echo -n "ChromaDB (8000): "
if curl -s http://localhost:8000/api/v1/heartbeat > /dev/null; then
    echo "✅ Healthy"
else
    echo "⚠️  Not responding (optional)"
fi

echo ""
echo "Health check complete!"
EOF

chmod +x health-check.sh
./health-check.sh
```

---

## Test Cases

### Test Suite 1: Backend API Endpoints

#### Test 1.1: Health Check

```bash
# Test backend health endpoint
curl -X GET http://localhost:3001/api/health

# Expected Response:
# {
#   "status": "ok",
#   "timestamp": "2025-01-07T10:00:00.000Z"
# }
```

**✅ Pass Criteria**: Returns HTTP 200 with status "ok"

---

#### Test 1.2: User Registration

```bash
# Register a new user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "SecurePass123!",
    "name": "Test User",
    "county": "LA County"
  }'

# Expected Response (HTTP 201):
# {
#   "success": true,
#   "data": {
#     "user": {
#       "id": "...",
#       "email": "testuser@example.com",
#       "name": "Test User",
#       "role": "user"
#     },
#     "tokens": {
#       "accessToken": "eyJhbGc...",
#       "refreshToken": "eyJhbGc..."
#     }
#   },
#   "message": "User registered successfully"
# }
```

**✅ Pass Criteria**:
- Returns HTTP 201
- Returns user object with id, email, name, role
- Returns both accessToken and refreshToken
- Email matches input

**📝 Note**: Save the `accessToken` for subsequent tests!

```bash
# Save token for later use
export ACCESS_TOKEN="<paste-access-token-here>"
```

---

#### Test 1.3: User Login

```bash
# Login with credentials
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "SecurePass123!"
  }'

# Expected Response (HTTP 200):
# {
#   "success": true,
#   "data": {
#     "user": { ... },
#     "tokens": {
#       "accessToken": "...",
#       "refreshToken": "..."
#     }
#   },
#   "message": "Login successful"
# }
```

**✅ Pass Criteria**:
- Returns HTTP 200
- Returns valid tokens
- User object matches registered user

---

#### Test 1.4: Get User Profile (Protected)

```bash
# Get user profile with valid token
curl -X GET http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Expected Response (HTTP 200):
# {
#   "success": true,
#   "data": {
#     "id": "...",
#     "email": "testuser@example.com",
#     "name": "Test User",
#     "role": "user"
#   }
# }
```

**✅ Pass Criteria**:
- Returns HTTP 200 with valid token
- Returns user profile data

---

#### Test 1.5: Unauthorized Access

```bash
# Try to access protected endpoint without token
curl -X GET http://localhost:3001/api/auth/profile

# Expected Response (HTTP 401):
# {
#   "success": false,
#   "error": "Access token required"
# }
```

**✅ Pass Criteria**:
- Returns HTTP 401 without token
- Returns error message

---

#### Test 1.6: Token Verification

```bash
# Verify token is valid
curl -X GET http://localhost:3001/api/auth/verify \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Expected Response (HTTP 200):
# {
#   "success": true,
#   "data": {
#     "valid": true,
#     "user": { ... }
#   }
# }
```

**✅ Pass Criteria**: Returns valid: true

---

### Test Suite 2: Chat Functionality

#### Test 2.1: First Message (Greeting)

```bash
# Send first message to chatbot
curl -X POST http://localhost:3001/api/chat \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello",
    "isFirstMessage": true
  }'

# Expected Response (HTTP 200):
# {
#   "response": "Hello! I'm Aldeia Advisor...",
#   "confidence": 1.0,
#   "intent": "greeting",
#   "isGreeting": true
# }
```

**✅ Pass Criteria**:
- Returns greeting response
- Confidence is 1.0
- Intent is "greeting"

---

#### Test 2.2: Knowledge Base Query

```bash
# Ask a question about debris removal
curl -X POST http://localhost:3001/api/chat \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How do I apply for debris removal?",
    "isFirstMessage": false
  }'

# Expected Response (HTTP 200):
# {
#   "response": "To apply for debris removal...\n\nSource: ...",
#   "confidence": 0.85,
#   "grounded": true,
#   "hallucination": false,
#   "source": "LA County Guide",
#   "intent": "process"
# }
```

**✅ Pass Criteria**:
- Returns relevant answer
- Confidence > 0.7
- Grounded = true
- Source attribution included
- Intent classified correctly

---

#### Test 2.3: Conversation History

After sending multiple messages, test conversation persistence:

```bash
# Send multiple messages
curl -X POST http://localhost:3001/api/chat \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What about permits?",
    "isFirstMessage": false,
    "conversationId": "<conversation-id-from-previous-response>"
  }'
```

**✅ Pass Criteria**:
- Maintains conversation context
- Returns conversation history in response
- conversationId persists

---

### Test Suite 3: Billing & Subscriptions

#### Test 3.1: Get Subscription Plans

```bash
# Get available plans (no auth required)
curl -X GET http://localhost:3001/api/billing/plans

# Expected Response (HTTP 200):
# {
#   "plans": [
#     {
#       "tier": "free",
#       "name": "Free Plan",
#       "price": 0,
#       "messagesLimit": 50,
#       "features": [...]
#     },
#     ...
#   ]
# }
```

**✅ Pass Criteria**:
- Returns 4 plans (free, basic, pro, enterprise)
- Each plan has tier, name, price, messagesLimit

---

#### Test 3.2: Get User Subscription

```bash
# Get current user's subscription
curl -X GET http://localhost:3001/api/billing/subscription \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Expected Response (HTTP 200):
# {
#   "subscription": {
#     "tier": "free",
#     "status": "active",
#     "messagesUsed": 5,
#     "messagesLimit": 50
#   }
# }
```

**✅ Pass Criteria**:
- Returns user's current subscription
- Shows messages used and limit

---

#### Test 3.3: Get Usage Statistics

```bash
# Get usage stats
curl -X GET http://localhost:3001/api/billing/usage \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Expected Response (HTTP 200):
# {
#   "usage": {
#     "messagesUsed": 5,
#     "messagesLimit": 50,
#     "usagePercentage": 10,
#     "unlimited": false
#   }
# }
```

**✅ Pass Criteria**:
- Returns usage statistics
- Percentage calculated correctly

---

#### Test 3.4: Check Message Quota

```bash
# Check if user can send message
curl -X GET http://localhost:3001/api/billing/can-send-message \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Expected Response (HTTP 200):
# {
#   "canSend": true,
#   "message": "You can send a message"
# }
```

**✅ Pass Criteria**:
- Returns canSend boolean
- Message explains status

---

### Test Suite 4: Document Management

#### Test 4.1: List Documents

```bash
# Get all documents
curl -X GET http://localhost:3001/api/documents

# Expected Response (HTTP 200):
# {
#   "success": true,
#   "data": {
#     "documents": [
#       {
#         "id": "...",
#         "filename": "...",
#         "created_at": "..."
#       }
#     ],
#     "total": 10,
#     "limit": 50,
#     "offset": 0
#   }
# }
```

**✅ Pass Criteria**:
- Returns list of documents
- Includes pagination info

---

#### Test 4.2: Search Documents

```bash
# Search for documents
curl -X GET "http://localhost:3001/api/documents?search=debris&limit=10"

# Expected Response: Filtered document list
```

**✅ Pass Criteria**:
- Returns only matching documents
- Respects limit parameter

---

#### Test 4.3: Upload Document (Authenticated)

```bash
# Upload a PDF document
curl -X POST http://localhost:3001/api/documents \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -F "document=@/path/to/test.pdf" \
  -F "title=Test Document" \
  -F "description=Test upload"

# Expected Response (HTTP 201):
# {
#   "success": true,
#   "data": {
#     "id": "...",
#     "filename": "Test Document",
#     "metadata": {
#       "originalName": "test.pdf",
#       "size": 12345
#     }
#   },
#   "message": "Document uploaded successfully"
# }
```

**✅ Pass Criteria**:
- Returns HTTP 201
- Document is saved
- Metadata is correct

---

### Test Suite 5: Admin Functionality

**Note**: These tests require an admin user. Create an admin user first:

```bash
# You may need to manually update a user's role in the database:
# UPDATE users SET role = 'admin' WHERE email = 'testuser@example.com';
```

#### Test 5.1: Get All Users (Admin Only)

```bash
# Get user list
curl -X GET http://localhost:3001/api/chat/admin/users \
  -H "Authorization: Bearer $ADMIN_ACCESS_TOKEN"

# Expected Response (HTTP 200):
# {
#   "users": [
#     {
#       "id": 1,
#       "name": "...",
#       "email": "...",
#       "role": "...",
#       "is_active": true
#     }
#   ]
# }
```

**✅ Pass Criteria**:
- Returns user list (admin only)
- Regular users get HTTP 403

---

#### Test 5.2: Get Analytics (Admin Only)

```bash
# Get analytics summary
curl -X GET http://localhost:3001/api/chat/admin/analytics \
  -H "Authorization: Bearer $ADMIN_ACCESS_TOKEN"

# Expected Response (HTTP 200):
# {
#   "summary": {
#     "totalMessages": 150,
#     "totalUsers": 10,
#     "totalConversations": 45,
#     "averageMessagesPerUser": 15
#   }
# }
```

**✅ Pass Criteria**:
- Returns analytics data
- Regular users denied (HTTP 403)

---

### Test Suite 6: Frontend End-to-End Tests

#### Test 6.1: Frontend Load Test

1. **Open browser** to `http://localhost:3000`
2. **Verify homepage** loads
3. **Check for errors** in browser console (F12)

**✅ Pass Criteria**:
- Page loads without errors
- No console errors
- UI elements visible

---

#### Test 6.2: User Registration Flow

1. Navigate to **Register** page
2. Fill in registration form:
   - Email: `e2e-test@example.com`
   - Password: `Test1234!`
   - Name: `E2E Test User`
   - County: `LA County`
3. Click **Register** button
4. Verify redirect to chat/dashboard

**✅ Pass Criteria**:
- Registration successful
- User is logged in
- Redirected to main app
- No errors shown

---

#### Test 6.3: User Login Flow

1. **Logout** (if logged in)
2. Navigate to **Login** page
3. Enter credentials:
   - Email: `e2e-test@example.com`
   - Password: `Test1234!`
4. Click **Login** button
5. Verify redirect to chat

**✅ Pass Criteria**:
- Login successful
- User authenticated
- Tokens stored in localStorage
- Redirected to chat

---

#### Test 6.4: Chat Interaction

1. Ensure you're **logged in**
2. Open **Chat** interface
3. Type message: `Hello`
4. Press **Send** or Enter
5. Verify bot response appears
6. Send another message: `How do I apply for debris removal?`
7. Verify contextual response

**✅ Pass Criteria**:
- Messages send successfully
- Bot responses appear
- Conversation history maintained
- No errors in console

---

#### Test 6.5: Token Refresh (Automatic)

This test verifies automatic token refresh works.

1. **Login** to application
2. **Open browser DevTools** (F12) → Application → Local Storage
3. **Note the accessToken** value
4. **Wait 30 seconds**
5. **Send a chat message**
6. **Check if token changed** (should auto-refresh)

**✅ Pass Criteria**:
- Token refreshes automatically before expiry
- No interruption to user experience
- No "unauthorized" errors

---

### Test Suite 7: Performance & Load Tests

#### Test 7.1: Response Time Test

```bash
# Test response times for various endpoints
for i in {1..10}; do
  time curl -s http://localhost:3001/api/health > /dev/null
done

# Calculate average response time
```

**✅ Pass Criteria**:
- Health check: < 100ms
- Registration: < 500ms
- Login: < 300ms
- Chat response: < 2000ms (depends on ChromaDB)

---

#### Test 7.2: Concurrent Users Test

```bash
# Install Apache Bench if not installed
# brew install httpd (macOS)
# sudo apt-get install apache2-utils (Ubuntu)

# Test 100 requests with 10 concurrent connections
ab -n 100 -c 10 http://localhost:3001/api/health

# Expected: 95%+ success rate
```

**✅ Pass Criteria**:
- 95%+ requests succeed
- No server crashes
- Average response time acceptable

---

#### Test 7.3: Database Connection Pool Test

```bash
# Test concurrent database queries
for i in {1..20}; do
  curl -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"testuser@example.com","password":"SecurePass123!"}' &
done

wait
echo "All requests completed"
```

**✅ Pass Criteria**:
- All requests complete successfully
- No connection pool errors
- No timeouts

---

### Test Suite 8: Security Tests

#### Test 8.1: SQL Injection Test

```bash
# Attempt SQL injection in login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com\" OR \"1\"=\"1",
    "password": "anything"
  }'

# Expected Response (HTTP 401):
# Should return "Invalid email or password" - NOT logged in
```

**✅ Pass Criteria**:
- Login fails (not authenticated)
- No SQL errors exposed
- Application remains stable

---

#### Test 8.2: XSS (Cross-Site Scripting) Test

```bash
# Attempt XSS in registration
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "xss@example.com",
    "password": "Test1234!",
    "name": "<script>alert(\"XSS\")</script>",
    "county": "LA"
  }'

# Then retrieve and check if script is sanitized
curl -X GET http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**✅ Pass Criteria**:
- Script tags are sanitized/escaped
- Name doesn't execute as JavaScript
- Response is safe

---

#### Test 8.3: Rate Limiting Test

```bash
# Send 200 requests rapidly (exceeds 100 req/15min limit)
for i in {1..200}; do
  curl -X GET http://localhost:3001/api/health
done

# After ~100 requests, should start getting 429 errors
```

**✅ Pass Criteria**:
- After limit, returns HTTP 429 (Too Many Requests)
- Rate limiting is enforced
- Legitimate requests resume after cooldown

---

#### Test 8.4: CORS Test

```bash
# Test CORS from disallowed origin
curl -X GET http://localhost:3001/api/health \
  -H "Origin: http://malicious-site.com"

# Expected: No CORS headers in response or explicit block
```

**✅ Pass Criteria**:
- Unauthorized origins are blocked
- Only configured origins allowed

---

### Test Suite 9: Error Handling

#### Test 9.1: Invalid Email Format

```bash
# Test with invalid email
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "not-an-email",
    "password": "Test1234!",
    "name": "Test"
  }'

# Expected Response (HTTP 400):
# {
#   "success": false,
#   "error": "Invalid email format"
# }
```

**✅ Pass Criteria**:
- Returns HTTP 400
- Error message is clear

---

#### Test 9.2: Weak Password

```bash
# Test with short password
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "123",
    "name": "Test"
  }'

# Expected Response (HTTP 400):
# {
#   "success": false,
#   "error": "Password must be at least 8 characters long"
# }
```

**✅ Pass Criteria**:
- Returns HTTP 400
- Password requirement enforced

---

#### Test 9.3: Missing Required Fields

```bash
# Test with missing fields
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'

# Expected Response (HTTP 400):
# {
#   "success": false,
#   "error": "Name, email, and password are required"
# }
```

**✅ Pass Criteria**:
- Returns HTTP 400
- Error indicates missing fields

---

### Test Suite 10: Database Tests

#### Test 10.1: Database Connection

```bash
# Test database connection
npm run test:db

# Or manually with psql
psql $DATABASE_URL -c "SELECT NOW();"
```

**✅ Pass Criteria**:
- Connection successful
- Query returns current timestamp

---

#### Test 10.2: Data Persistence

```bash
# Register user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "persistence-test@example.com",
    "password": "Test1234!",
    "name": "Persistence Test"
  }'

# Restart backend server
# (Stop with Ctrl+C and restart with npm run dev)

# Login with same credentials (should work)
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "persistence-test@example.com",
    "password": "Test1234!"
  }'
```

**✅ Pass Criteria**:
- User persists after restart
- Login successful
- Data not lost

---

## Automated Test Script

Create a comprehensive automated test script:

```bash
# Create test script
cat > run-all-tests.sh << 'EOF'
#!/bin/bash

set -e

echo "🧪 Starting Comprehensive Test Suite"
echo "====================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASSED=0
FAILED=0

run_test() {
    local test_name=$1
    local command=$2

    echo -n "Testing: $test_name... "

    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC}"
        ((FAILED++))
    fi
}

# Test 1: Health Check
run_test "Backend Health" "curl -f http://localhost:3001/api/health"

# Test 2: Frontend Load
run_test "Frontend Load" "curl -f http://localhost:3000/"

# Test 3: Redis Connection
run_test "Redis Connection" "docker exec aldeia-redis redis-cli ping | grep -q PONG"

# Test 4: ChromaDB Health
run_test "ChromaDB Health" "curl -f http://localhost:8000/api/v1/heartbeat"

# Test 5: User Registration
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "automated-test-'$(date +%s)'@example.com",
    "password": "AutoTest123!",
    "name": "Automated Test"
  }')

if echo "$REGISTER_RESPONSE" | grep -q "accessToken"; then
    echo -e "Testing: User Registration... ${GREEN}✓ PASS${NC}"
    ((PASSED++))

    # Extract token for further tests
    ACCESS_TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
else
    echo -e "Testing: User Registration... ${RED}✗ FAIL${NC}"
    ((FAILED++))
fi

# Test 6: Protected Endpoint with Token
if [ -n "$ACCESS_TOKEN" ]; then
    run_test "Protected Endpoint" "curl -f -H 'Authorization: Bearer $ACCESS_TOKEN' http://localhost:3001/api/auth/profile"
fi

# Test 7: Unauthorized Access
UNAUTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/auth/profile)
if [ "$UNAUTH_CODE" = "401" ]; then
    echo -e "Testing: Unauthorized Access Block... ${GREEN}✓ PASS${NC}"
    ((PASSED++))
else
    echo -e "Testing: Unauthorized Access Block... ${RED}✗ FAIL${NC}"
    ((FAILED++))
fi

# Test 8: Chat Endpoint (if token available)
if [ -n "$ACCESS_TOKEN" ]; then
    CHAT_RESPONSE=$(curl -s -X POST http://localhost:3001/api/chat \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"message":"Hello","isFirstMessage":true}')

    if echo "$CHAT_RESPONSE" | grep -q "response"; then
        echo -e "Testing: Chat Functionality... ${GREEN}✓ PASS${NC}"
        ((PASSED++))
    else
        echo -e "Testing: Chat Functionality... ${RED}✗ FAIL${NC}"
        ((FAILED++))
    fi
fi

# Test 9: Billing Plans
run_test "Billing Plans" "curl -f http://localhost:3001/api/billing/plans"

# Test 10: Document Listing
run_test "Document Listing" "curl -f http://localhost:3001/api/documents"

echo ""
echo "====================================="
echo "Test Results:"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo "====================================="

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
fi
EOF

chmod +x run-all-tests.sh
./run-all-tests.sh
```

---

## Troubleshooting

### Issue: Backend won't start

**Symptoms**: Backend crashes or won't start

**Solutions**:
1. Check if port 3001 is already in use:
   ```bash
   lsof -i :3001
   # Kill process if found
   kill -9 <PID>
   ```

2. Check database connection:
   ```bash
   psql $DATABASE_URL -c "SELECT 1;"
   ```

3. Check environment variables:
   ```bash
   cat .env.merge | grep DATABASE_URL
   ```

4. Check logs for specific error:
   ```bash
   cd apps/backend && npm run dev
   # Read error message carefully
   ```

---

### Issue: Frontend won't connect to backend

**Symptoms**: Frontend loads but API calls fail

**Solutions**:
1. Check CORS configuration in backend
2. Verify backend is running on port 3001
3. Check browser console for errors (F12)
4. Verify API base URL in frontend code:
   ```bash
   grep -r "localhost:3001" apps/chatbot-frontend/src/
   ```

---

### Issue: ChromaDB not responding

**Symptoms**: Chat endpoint returns 503

**Solutions**:
1. ChromaDB is optional - the app should work without it
2. Start ChromaDB with Docker:
   ```bash
   docker-compose up -d chromadb
   ```
3. Check ChromaDB logs:
   ```bash
   docker-compose logs chromadb
   ```

---

### Issue: Redis connection failed

**Symptoms**: Caching or rate limiting doesn't work

**Solutions**:
1. Start Redis with Docker:
   ```bash
   docker-compose up -d redis
   ```
2. Test Redis connection:
   ```bash
   docker exec -it aldeia-redis redis-cli ping
   ```
3. Check Redis password in .env

---

### Issue: Tests fail with 401 errors

**Symptoms**: All protected endpoints return 401

**Solutions**:
1. Ensure you're using a valid access token
2. Check token hasn't expired (24-hour limit)
3. Register a new user and get fresh token:
   ```bash
   # Register new user and extract token
   curl -X POST http://localhost:3001/api/auth/register ... | jq -r '.data.tokens.accessToken'
   ```

---

## Test Results Template

Use this template to document your test results:

```markdown
# Test Execution Report

**Date**: January 7, 2025
**Tester**: [Your Name]
**Environment**: Development

## Test Results Summary

| Test Suite | Total | Passed | Failed | Pass Rate |
|------------|-------|--------|--------|-----------|
| Backend API | 10 | 10 | 0 | 100% |
| Chat | 3 | 3 | 0 | 100% |
| Billing | 4 | 4 | 0 | 100% |
| Documents | 3 | 3 | 0 | 100% |
| Admin | 2 | 2 | 0 | 100% |
| Frontend E2E | 5 | 5 | 0 | 100% |
| Performance | 3 | 3 | 0 | 100% |
| Security | 4 | 4 | 0 | 100% |
| Error Handling | 3 | 3 | 0 | 100% |
| Database | 2 | 2 | 0 | 100% |
| **TOTAL** | **39** | **39** | **0** | **100%** |

## Issues Found

None - All tests passed!

## Notes

- All services started successfully
- Performance is within acceptable limits
- Security tests confirm protection mechanisms work
- Ready for production deployment

## Recommendations

1. ✅ Proceed with production deployment
2. Monitor logs for first 24 hours
3. Set up automated tests in CI/CD
4. Configure monitoring alerts
```

---

## Next Steps After Testing

Once all tests pass:

1. ✅ **Review test results**
2. ✅ **Fix any failed tests**
3. ✅ **Run code quality check**:
   ```bash
   ./code-quality-check.sh
   ```
4. ✅ **Create production build**:
   ```bash
   npm run build
   ```
5. ✅ **Deploy to production**:
   ```bash
   ./deploy-production.sh
   ```
6. ✅ **Run post-deployment validation**:
   ```bash
   ./validate-deployment.sh
   ```

---

**Testing Complete!** 🎉

Your Aldeia Chatbot application is now thoroughly tested and ready for production deployment.
