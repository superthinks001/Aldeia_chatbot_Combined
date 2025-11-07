# Aldeia Chatbot - Quick Start Guide

**Get up and running in 5 minutes!**

---

## 🚀 Fastest Way to Start Testing

### Option 1: Docker (Everything Together) - RECOMMENDED

```bash
# 1. Start all services
docker-compose up -d

# 2. Wait 30 seconds for services to initialize

# 3. Check health
./health-check.sh

# 4. Run automated tests
./run-all-tests.sh

# 5. Open frontend in browser
open http://localhost:3000
```

**That's it!** All services are running.

---

### Option 2: Individual Services (Development)

```bash
# Terminal 1: Start Docker support services
docker-compose up redis chromadb

# Terminal 2: Start backend
cd apps/backend && npm run dev

# Terminal 3: Start frontend
cd apps/chatbot-frontend && npm start

# Terminal 4: Run health check
./health-check.sh
```

---

## ✅ Quick Health Verification

```bash
# One-line health check
curl http://localhost:3001/api/health && echo "✅ Backend OK"

# Or use the script
./health-check.sh
```

**Expected Output**:
```
🔍 Checking Service Health...

Backend (port 3001): ✅ Healthy
Frontend (port 3000): ✅ Healthy
Redis (port 6379): ✅ Healthy
ChromaDB (port 8000): ✅ Healthy

Health check complete!
```

---

## 🧪 Quick Test

### Test 1: Register a User

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234!",
    "name": "Test User",
    "county": "LA County"
  }'
```

**✅ Should return**: User object with `accessToken` and `refreshToken`

---

### Test 2: Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234!"
  }'
```

**✅ Should return**: User object with tokens

---

### Test 3: Send Chat Message

```bash
# Save your access token first
export TOKEN="<your-access-token-from-login>"

# Send message
curl -X POST http://localhost:3001/api/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello","isFirstMessage":true}'
```

**✅ Should return**: Greeting response from chatbot

---

## 🎯 Run All Automated Tests

```bash
# Run comprehensive test suite
./run-all-tests.sh
```

**Expected**: 80-100% pass rate (ChromaDB is optional)

---

## 🌐 Access URLs

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | http://localhost:3000 | User interface |
| **Backend API** | http://localhost:3001 | API endpoints |
| **Health Check** | http://localhost:3001/api/health | Server status |
| **API Docs** | See API_DOCUMENTATION.md | API reference |
| **Redis** | localhost:6379 | Cache (internal) |
| **ChromaDB** | http://localhost:8000 | Vector DB (internal) |

---

## 📝 Quick Test in Browser

1. Open http://localhost:3000
2. Click **Register** or **Sign Up**
3. Create account:
   - Email: `yourname@example.com`
   - Password: `YourPass123!`
   - Name: `Your Name`
4. You should be logged in automatically
5. Try sending a message: `Hello`
6. Try another: `How do I apply for debris removal?`

**✅ Pass**: Both messages get responses

---

## 🛑 Stop Services

```bash
# Stop Docker services
docker-compose down

# Stop individual services: Ctrl+C in each terminal
```

---

## 🔧 Troubleshooting

### Backend won't start

```bash
# Check if port 3001 is in use
lsof -i :3001

# Kill process if needed
kill -9 <PID>
```

### Database connection error

```bash
# Check DATABASE_URL is set
cat .env.merge | grep DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1;"
```

### Frontend can't connect

```bash
# Check backend is running
curl http://localhost:3001/api/health

# Check browser console (F12) for errors
```

---

## 📚 Full Documentation

- **Complete Testing Guide**: [TESTING_GUIDE.md](TESTING_GUIDE.md)
- **API Documentation**: [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
- **Deployment Guide**: [DEPLOYMENT.md](DEPLOYMENT.md)
- **Troubleshooting**: [DEPLOYMENT.md#troubleshooting](DEPLOYMENT.md#troubleshooting)

---

## ⚡ Pro Tips

1. **Use Docker** for quickest start
2. **Run health check** before testing
3. **Save access token** for subsequent API calls
4. **Check logs** if something fails:
   ```bash
   # Docker logs
   docker-compose logs -f backend

   # Or direct logs
   cd apps/backend && npm run dev
   ```
5. **Use automated tests** (`./run-all-tests.sh`) to verify everything

---

## 🎉 Next Steps

Once all tests pass:

1. ✅ Review [TESTING_GUIDE.md](TESTING_GUIDE.md) for comprehensive tests
2. ✅ Run code quality checks: `./code-quality-check.sh`
3. ✅ Review [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment
4. ✅ Run deployment validation: `./validate-deployment.sh`

---

**You're ready to go!** 🚀

Start testing with: `./run-all-tests.sh`
